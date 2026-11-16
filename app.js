
(function(){
  var form = document.getElementById('query-form');
  var status = document.getElementById('form-status');
  var btn = document.getElementById('send-btn');

  function show(id, on){ document.getElementById(id).style.display = on ? 'block' : 'none'; }

  function validPhone(v){
    var d = v.replace(/\D/g,'');
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d);
  }
  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function wireCopy(btnId, idId){
    var b = document.getElementById(btnId);
    var t = document.getElementById(idId);
    if(!b || !t) return;
    b.addEventListener('click', function(){
    var id = t.textContent.trim();
    function fallback(){ var t=document.createElement('textarea'); t.value=id; document.body.appendChild(t); t.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(t); done(); }
    function done(){ b.textContent='Copied!'; setTimeout(function(){ b.textContent='Copy'; },1800); }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(id).then(done).catch(function(){ fallback(); }); } else { fallback(); }
    });
  }
  wireCopy('copy-upi','upi-id');
  wireCopy('copy-upi-form','upi-id-form');

  if(form) form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('f-name').value.trim();
    var phone = document.getElementById('f-phone').value.trim();
    var email = document.getElementById('f-email').value.trim();
    var msg = document.getElementById('f-msg').value.trim();

    var serviceEl = document.getElementById('f-service');
    var payEl = document.getElementById('f-pay');
    var service = serviceEl ? serviceEl.value : '';
    var pay = payEl ? payEl.value : '';

    // Decide the route before collecting or sending personal details.
    var unsure = service === 'Not sure - help me choose';
    show('e-service', !service);
    show('e-pay', !unsure && !pay);
    if(!service || (!unsure && !pay)) return;
    var payRoute = !unsure && (pay === 'UPI' || pay === 'Crypto');
    var ok = true;
    show('e-name', name.length >= 2 ? false : (ok=false, true));
    show('e-phone', validPhone(phone) ? false : (ok=false, true));
    show('e-email', validEmail(email) ? false : (ok=false, true));
    if(serviceEl) show('e-service', service ? false : (ok=false, true));
    if(payEl) show('e-pay', unsure || pay ? false : (ok=false, true));
    show('e-msg', (payRoute || msg.length >= 5) ? false : (ok=false, true));
    if(!ok){ status.className=''; status.style.display='none'; return; }

    if(form.elements.botcheck.checked) return;
    btn.disabled = true; btn.textContent = payRoute ? 'Saving your details...' : 'Sending...';
    status.className=''; status.style.display='none';

    var data = new FormData();
    data.append('access_key', 'a63c67d4-cf97-4882-9a62-556cdfa590b0');
    data.append('from_name', 'Kunalji Nursing Care Service Website');
    data.append('name', name);
    data.append('phone', phone);
    data.append('email', email);
    if(service) data.append('service_requested', service);
    data.append('payment_method', unsure ? 'Advice requested - payment not selected' : pay);
    data.append('service_details', serviceEl.options[serviceEl.selectedIndex].text);
    if(payRoute){
      data.append('subject', 'New checkout - ' + service + ' (' + pay + ')');
      data.append('message', 'CHECKOUT FORM - customer is proceeding to ' + pay + ' payment for ' + service + '.\nPatient note: ' + (msg || '(none)'));
    } else {
      data.append('subject', 'New service request - ' + (service || 'Kunalji Nursing Care Service website'));
      data.append('message', msg);
    }
    var payUrl = 'pricing.html?service=' + encodeURIComponent(service) + '&method=' + encodeURIComponent(pay) + '#payment';
    if(payRoute){
      // Nothing is emailed yet. Hold the checkout details on this device; the
      // final step on the payment page (after paying) sends them to the team.
      var pending = { name:name, phone:phone, email:email, service:service,
        serviceText: serviceEl.options[serviceEl.selectedIndex].text,
        pay:pay, msg:msg, ts:Date.now() };
      try{ localStorage.setItem('kw-pending-checkout', JSON.stringify(pending)); }catch(e){}
      location.href = payUrl;
      return;
    }

    fetch('https://api.web3forms.com/submit', { method:'POST', body:data })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if(res.success){
          status.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your query has been sent - we will contact you shortly.';
          status.className = 'ok';
          status.style.display = 'block';
          form.reset();
          form.dispatchEvent(new Event('reset-complete'));
          status.scrollIntoView({behavior:'smooth', block:'center'});
        } else {
          throw new Error('failed');
        }
      })
      .catch(function(){
        status.textContent = 'Sorry, something went wrong. Please try again in a moment.';
        status.className = 'bad';
        status.style.display = 'block';
      })
      .finally(function(){
        btn.disabled = false;
        btn.textContent = document.getElementById('f-service').value === 'Not sure - help me choose' || document.getElementById('f-pay').value === 'Pay later' ? 'Send Enquiry' : 'Continue to Payment';
      });
  });
})();

const menu=document.getElementById('menu-toggle'), nav=document.getElementById('primary-nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);nav.classList.toggle('open',open);menu.textContent=open?'Close':'Menu';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}});
(function(){
  var rates = {
    'Bed-ridden Patient Care':'₹40,000 / month',
    'Tracheostomy Care':'₹35,000 / month',
    'Colostomy Bag Change':'₹1,000 / visit',
    'Basic Patient Care':'₹22,000 / month or ₹1,000 / day'
  };
  var usdt = {
    'Bed-ridden Patient Care':'approx 425 USDT / month',
    'Tracheostomy Care':'approx 372 USDT / month',
    'Colostomy Bag Change':'approx 11 USDT / visit',
    'Basic Patient Care':'approx 234 USDT / month or approx 11 USDT / day'
  };
  var params = new URLSearchParams(location.search);
  var paymentSection = document.getElementById('payment');
  var selected = params.get('service'), method = params.get('method');
  if(paymentSection && rates[selected] && (method === 'UPI' || method === 'Crypto')){
    var heading = paymentSection.querySelector('.sec-head');
    heading.querySelector('h2').textContent = method === 'UPI' ? 'Pay by UPI' : 'Pay with Crypto';
    heading.querySelector('p').textContent = method === 'Crypto' ? selected + ' - ' + rates[selected] + ' (' + usdt[selected] + '). Pay only the amount agreed for your care plan. USDT amounts are approximate; 1 USDT is about ₹94.' : selected + ' - ' + rates[selected] + '. Pay only the amount agreed for your care plan.';
    var cards = paymentSection.querySelectorAll('.pay-card');
    cards.forEach(function(card, i){ card.hidden = method === 'UPI' ? i !== 0 : i !== 1; card.style.display = card.hidden ? 'none' : ''; });
    paymentSection.querySelector('.pay-grid').style.gridTemplateColumns = 'minmax(0, 1fr)';
    var back = document.createElement('a');
    back.href = 'contact.html?service=' + encodeURIComponent(selected) + '#query-form';
    back.textContent = 'Change service or payment method';
    heading.appendChild(back);
    var note = document.createElement('p');
    note.className = 'notice';
    note.textContent = 'Opening this page does not confirm a payment or a booking. Keep your payment reference. Service availability and the care plan still need confirmation.';
    paymentSection.querySelector('.wrap').appendChild(note);
    var pending = null;
    try{
      pending = JSON.parse(localStorage.getItem('kw-pending-checkout'));
      if(!pending || !pending.name || !pending.pay || !pending.service || (pending.ts && Date.now() - pending.ts > 24*60*60*1000)) pending = null;
    }catch(e){ pending = null; }
    if(pending && pending.pay !== method) pending = null;
    var pn = document.createElement('p');
    pn.className = 'notice';
    pn.setAttribute('role','status');
    if(pending){
      pn.textContent = 'Your checkout details are saved on this device - nothing has been sent yet. Step 1: complete the payment below. Step 2: submit the confirmation at the bottom of the payment card so our team can verify your payment.';
    } else {
      pn.textContent = 'Paying for a care plan? Please start from the checkout form on the Contact page so we can match your payment to your booking. ';
      var pl = document.createElement('a');
      pl.href = 'contact.html' + (selected ? '?service=' + encodeURIComponent(selected) : '') + '#query-form';
      pl.textContent = 'Open the checkout form';
      pn.appendChild(pl);
    }
    heading.appendChild(pn);

    if(pending){
      var firstName = pending.name.split(' ')[0].replace(/[<>&"']/g, '');
      var step = document.createElement('div');
      step.className = 'confirm-step';
      if(method === 'UPI'){
        step.innerHTML = '<h3>Step 2 - Submit your UTR number after paying</h3>'
          + '<p>After your UPI payment succeeds, your payment app shows a UTR / UPI reference number (usually 12 digits). Enter it here so our team can confirm your payment.</p>'
          + '<label for="utr-input">UTR / UPI reference number <span>*</span></label>'
          + '<input type="text" id="utr-input" inputmode="numeric" autocomplete="off" placeholder="e.g. 612345678901">'
          + '<div class="err" id="e-utr">Please enter the UTR number shown in your payment app (8-22 letters or digits).</div>'
          + '<button type="button" class="btn" id="utr-submit">Submit UTR &amp; complete booking request</button>'
          + '<div class="step-status" id="utr-status" role="status"></div>';
      } else {
        step.innerHTML = '<h3>Step 2 - After paying, submit your details</h3>'
          + '<p>The crypto checkout opens in a new tab. Once your payment is sent, come back to this page and submit below. Our team verifies every payment before confirming your care plan.</p>'
          + '<label for="txid-input">Transaction ID / payment reference (optional)</label>'
          + '<input type="text" id="txid-input" autocomplete="off" placeholder="From your wallet or the payment page">'
          + '<button type="button" class="btn" id="crypto-submit">I have completed my crypto payment - submit details</button>'
          + '<div class="step-status" id="crypto-status" role="status"></div>';
      }
      var activeCard = paymentSection.querySelectorAll('.pay-card')[method === 'UPI' ? 0 : 1];
      activeCard.appendChild(step);

      function sendCheckout(fieldName, fieldValue, note){
        var d = new FormData();
        d.append('access_key', 'a63c67d4-cf97-4882-9a62-556cdfa590b0');
        d.append('from_name', 'Kunalji Nursing Care Service Website');
        d.append('name', pending.name);
        d.append('phone', pending.phone);
        d.append('email', pending.email);
        d.append('service_requested', pending.service);
        d.append('payment_method', pending.pay);
        d.append('service_details', pending.serviceText || pending.service);
        d.append(fieldName, fieldValue);
        d.append('subject', 'New checkout - ' + pending.service + ' (' + pending.pay + ')');
        d.append('message', note + '\nPatient note: ' + (pending.msg || '(none)'));
        return fetch('https://api.web3forms.com/submit', { method:'POST', body:d })
          .then(function(r){ return r.json(); })
          .then(function(res){ return !!(res && res.success); });
      }
      function finishStep(html){
        try{ localStorage.removeItem('kw-pending-checkout'); }catch(e){}
        step.innerHTML = html;
        step.scrollIntoView({behavior:'smooth', block:'center'});
      }

      if(method === 'UPI'){
        var utrBtn = document.getElementById('utr-submit');
        utrBtn.addEventListener('click', function(){
          var utr = document.getElementById('utr-input').value.trim();
          var st = document.getElementById('utr-status');
          var okUtr = /^[0-9A-Za-z]{8,22}$/.test(utr);
          document.getElementById('e-utr').style.display = okUtr ? 'none' : 'block';
          if(!okUtr) return;
          utrBtn.disabled = true; utrBtn.textContent = 'Submitting...';
          st.className = 'step-status'; st.textContent = '';
          sendCheckout('utr_number', utr,
            'CHECKOUT FORM - customer paid by UPI and submitted their UTR number.\nUPI payment PENDING CONFIRMATION - please verify receipt (may take up to 1 hour) before confirming the care plan.\nUTR number: ' + utr)
            .then(function(sent){
              if(!sent) throw new Error('failed');
              finishStep('<h3>Details submitted</h3><p class="step-done">Thank you, ' + firstName + '. Our team is confirming your payment. It will take up to 1 hour. Our team will reach back to you soon.</p>');
            })
            .catch(function(){
              utrBtn.disabled = false; utrBtn.textContent = 'Submit UTR & complete booking request';
              st.className = 'step-status bad';
              st.textContent = 'Sorry, something went wrong. Please try again in a moment - or WhatsApp us your name and UTR number.';
            });
        });
      } else {
        var cxBtn = document.getElementById('crypto-submit');
        cxBtn.addEventListener('click', function(){
          var txid = document.getElementById('txid-input').value.trim();
          var st = document.getElementById('crypto-status');
          cxBtn.disabled = true; cxBtn.textContent = 'Submitting...';
          st.className = 'step-status'; st.textContent = '';
          sendCheckout('payment_reference', txid || '(not provided)',
            'CHECKOUT FORM - customer returned after crypto payment and submitted their details.\nCrypto payment PENDING VERIFICATION - please check NOWPayments before confirming the care plan.\nTransaction reference: ' + (txid || '(not provided)'))
            .then(function(sent){
              if(!sent) throw new Error('failed');
              finishStep('<h3>Details submitted</h3><p class="step-done">Thank you, ' + firstName + '. Our team is verifying your crypto payment and will reach back to you soon to confirm your care plan.</p>');
            })
            .catch(function(){
              cxBtn.disabled = false; cxBtn.textContent = 'I have completed my crypto payment - submit details';
              st.className = 'step-status bad';
              st.textContent = 'Sorry, something went wrong. Please try again in a moment - or WhatsApp us your name and payment reference.';
            });
        });
      }
    }
  }
  var serviceSel = document.getElementById('f-service');
  var paySel = document.getElementById('f-pay');
  var msg = document.getElementById('f-msg');
  var form = document.getElementById('query-form');
  if(!form || !serviceSel || !paySel) return;
  var lastAutoMessage = '';
  function update(){
    var service = serviceSel.value;
    var unsure = service === 'Not sure - help me choose';
    var query = unsure || paySel.value === 'Pay later';
    paySel.closest('.fld').hidden = unsure;
    ['f-name','f-phone','f-email','f-msg'].forEach(function(id){
      document.getElementById(id).closest('.fld').hidden = false;
    });
    var ml = document.querySelector('label[for="f-msg"]');
    ml.innerHTML = query ? 'Message <span>*</span>' : 'Patient note (optional)';
    msg.placeholder = query ? 'Tell us about the patient and the care needed - illness, age, type of care, preferred timings...' : 'Patient name, age, condition, address or any special needs (optional)';
    ['upi','crypto','later'].forEach(function(k){
      var p = document.getElementById('pay-panel-' + k); if(p) p.hidden = true;
    });
    var button = document.getElementById('send-btn');
    button.textContent = query ? 'Send Enquiry' : 'Continue to Payment';
    document.getElementById('route-note').textContent = unsure ? 'Not sure which care is right? Share your needs and we will help you choose. Your enquiry goes to Kunalji Nursing Care Service.' : query ? 'Your service details and contact information will be sent to Kunalji Nursing Care Service. Payment can be arranged later.' : 'Checkout details: enter your contact details, then continue to payment. Nothing is sent yet - after paying, a final confirmation step on the payment page sends your details to Kunalji Nursing Care Service.';
    var auto = !query ? '' : unsure ? 'Please help me choose the right care service. ' : service ? 'I would like to avail ' + service + ' (' + rates[service] + '). ' : '';
    if(!msg.value.trim() || msg.value === lastAutoMessage) { msg.value = auto; lastAutoMessage = auto; }
    document.getElementById('e-service').style.display='none';
    document.getElementById('e-pay').style.display='none';
  }
  serviceSel.addEventListener('change', update);
  paySel.addEventListener('change', update);
  form.addEventListener('reset-complete', update);
  var wanted = params.get('service');
  if(wanted){
    Array.from(serviceSel.options).some(function(option){
      if(option.value.toLowerCase() === wanted.toLowerCase()){serviceSel.value = option.value; return true;} return false;
    });
  }
  update();
})();

/* Homepage quote slideshow - rotates any number of .quote-slide blocks.
   Respects reduced-motion; pauses on hover/focus. */
(function(){
  var rot = document.getElementById('quote-rotator');
  if(!rot) return;
  var slides = rot.querySelectorAll('.quote-slide');
  if(slides.length < 2) return;
  var dotsWrap = document.getElementById('quote-dots');
  var i = 0, timer = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dots = [];
  if(dotsWrap){
    Array.prototype.forEach.call(slides, function(_, n){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show message ' + (n + 1));
      if(n === 0) b.className = 'active';
      b.addEventListener('click', function(){ go(n); restart(); });
      dotsWrap.appendChild(b);
      dots.push(b);
    });
  }
  function go(n){
    slides[i].classList.remove('active');
    if(dots[i]) dots[i].classList.remove('active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('active');
    if(dots[i]) dots[i].classList.add('active');
  }
  function start(){ if(reduce || timer) return; timer = setInterval(function(){ go(i + 1); }, 6000); }
  function stop(){ if(timer){ clearInterval(timer); timer = null; } }
  function restart(){ stop(); start(); }
  rot.addEventListener('mouseenter', stop);
  rot.addEventListener('mouseleave', start);
  rot.addEventListener('focusin', stop);
  rot.addEventListener('focusout', start);
  start();
})();
