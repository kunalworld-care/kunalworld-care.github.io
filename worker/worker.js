// kunalji-pay - Cloudflare Worker for Kunalji Nursing Care Service
// 1) POST /create-invoice - called by the website; creates a NOWPayments
//    invoice (API key stays server-side) and returns the hosted payment URL.
// 2) POST /ipn - NOWPayments Instant Payment Notification webhook.
//    Verifies the x-nowpayments-sig HMAC-SHA512 signature with the IPN
//    secret, then emails the payment result via Web3Forms.

var NOWPAY_API = 'https://api.nowpayments.io/v1/invoice';

function sortObject(obj) {
  return Object.keys(obj).sort().reduce(function (result, key) {
    var v = obj[key];
    result[key] = (v && typeof v === 'object') ? sortObject(v) : v;
    return result;
  }, {});
}

async function hmacSha512Hex(secret, msg) {
  var enc = new TextEncoder();
  var key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  var sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function siteOrigin(env) {
  return env.SITE_ORIGIN || 'https://kunalworld-care.github.io';
}

function corsHeaders(request, env) {
  var origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': origin === siteOrigin(env) ? siteOrigin(env) : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-KW-Client',
    'Vary': 'Origin'
  };
}

function json(obj, status, headers) {
  var h = { 'Content-Type': 'application/json' };
  if (headers) { for (var k in headers) h[k] = headers[k]; }
  return new Response(JSON.stringify(obj), { status: status, headers: h });
}

async function sendEmail(env, subject, lines) {
  try {
    var res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_KEY,
        from_name: 'Kunalji Nursing Care Service Website',
        subject: subject,
        message: lines.join('\n')
      })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export default {
  async fetch(request, env, ctx) {
    var url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === '/create-invoice' && request.method === 'POST') {
      var cors = corsHeaders(request, env);
      var origin = request.headers.get('Origin') || '';
      if (origin !== siteOrigin(env)) return json({ error: 'forbidden' }, 403, cors);
      if (env.CLIENT_TOKEN && request.headers.get('X-KW-Client') !== env.CLIENT_TOKEN) {
        return json({ error: 'forbidden' }, 403, cors);
      }
      var body;
      try { body = await request.json(); } catch (e) { return json({ error: 'bad_json' }, 400, cors); }
      var orderId = String(body.order_id || '');
      var amount = Number(body.amount_usdt);
      var service = String(body.service || '').slice(0, 120);
      var desc = String(body.description || '').slice(0, 120);
      if (!/^KW-[0-9A-Z-]{6,40}$/.test(orderId)) return json({ error: 'bad_order_id' }, 400, cors);
      if (!isFinite(amount) || amount < 5 || amount > 100000) return json({ error: 'bad_amount' }, 400, cors);
      var orderDesc = (service + (desc ? ' - ' + desc : '')).slice(0, 190);
      var payload = {
        price_amount: amount,
        price_currency: 'usd',
        order_id: orderId,
        order_description: orderDesc,
        ipn_callback_url: 'https://kunalji-pay.dx1qne.workers.dev/ipn',
        success_url: siteOrigin(env) + '/pricing.html?paid=crypto&ref=' + encodeURIComponent(orderId) + '#payment',
        cancel_url: siteOrigin(env) + '/pricing.html?method=Crypto&cancelled=1&ref=' + encodeURIComponent(orderId) + '#payment'
      };
      var r, data;
      try {
        r = await fetch(NOWPAY_API, {
          method: 'POST',
          headers: { 'x-api-key': env.NOWPAYMENTS_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await r.json();
      } catch (e) {
        return json({ error: 'invoice_failed' }, 502, cors);
      }
      if (!r.ok || !data || !data.invoice_url) {
        return json({ error: 'invoice_failed', detail: (data && (data.message || data.code)) || ('http_' + r.status) }, 502, cors);
      }
      return json({ invoice_url: data.invoice_url }, 200, cors);
    }

    if (url.pathname === '/ipn' && request.method === 'POST') {
      var sig = (request.headers.get('x-nowpayments-sig') || '').toLowerCase();
      var params;
      try { params = await request.json(); } catch (e) { return new Response('bad json', { status: 400 }); }
      var expected = await hmacSha512Hex(env.NOWPAYMENTS_IPN_SECRET, JSON.stringify(sortObject(params)));
      if (!sig || sig !== expected) return new Response('bad signature', { status: 401 });

      var st = String(params.payment_status || '').toLowerCase();
      var oid = params.order_id || '(no ref)';
      var amt = String(params.price_amount) + ' USD (USDT-equivalent)';
      var pay = String(params.pay_amount) + ' ' + String(params.pay_currency);
      var odesc = params.order_description || '';
      var subject = null;
      var lines = null;
      if (st === 'finished' || st === 'confirmed') {
        subject = 'Crypto payment CONFIRMED - ref ' + oid + ' (Crypto)';
        lines = [
          'PAYMENT GATEWAY AUTO-CONFIRMATION (NOWPayments, signature-verified).',
          '',
          'Reference: ' + oid,
          'Invoice amount: ' + amt,
          'Paid: ' + pay,
          'Payment ID: ' + (params.payment_id || ''),
          'Status: ' + st,
          odesc ? 'Order: ' + odesc : '',
          '',
          'Match this reference with the checkout email carrying the same reference for the customer\'s name, phone and patient details.',
          'The payment is confirmed by the gateway - the care plan can be finalised with the family.'
        ].filter(function (l) { return l !== ''; });
      } else if (st === 'failed' || st === 'expired' || st === 'partially_paid') {
        subject = 'Crypto payment ' + st.toUpperCase().replace('_', ' ') + ' - ref ' + oid + ' (Crypto)';
        lines = [
          'NOWPayments reports this crypto payment as ' + st.toUpperCase().replace('_', ' ') + ' (signature-verified).',
          '',
          'Reference: ' + oid,
          'Invoice amount: ' + amt,
          'Paid: ' + pay,
          'Payment ID: ' + (params.payment_id || ''),
          odesc ? 'Order: ' + odesc : '',
          '',
          st === 'partially_paid'
            ? 'The customer paid LESS than the invoice amount. Please check NOWPayments and contact the family before starting care.'
            : 'No money was received for this payment. If the family still wants the service, ask them to pay again from the website.'
        ].filter(function (l) { return l !== ''; });
      }
      if (subject) {
        ctx.waitUntil(sendEmail(env, subject, lines));
      }
      return new Response('ok', { status: 200 });
    }

    return new Response('kunalji-pay ok', { status: 200 });
  }
};
