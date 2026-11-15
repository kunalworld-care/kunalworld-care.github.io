
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
    if(!unsure && (pay === 'UPI' || pay === 'Crypto')){
      // No Web3Forms request is made on either payment route.
      location.href = 'pricing.html?service=' + encodeURIComponent(service) + '&method=' + encodeURIComponent(pay) + '#payment';
      return;
    }
    var ok = true;
    show('e-name', name.length >= 2 ? false : (ok=false, true));
    show('e-phone', validPhone(phone) ? false : (ok=false, true));
    show('e-email', validEmail(email) ? false : (ok=false, true));
    if(serviceEl) show('e-service', service ? false : (ok=false, true));
    if(payEl) show('e-pay', unsure || pay ? false : (ok=false, true));
    show('e-msg', msg.length >= 5 ? false : (ok=false, true));
    if(!ok){ status.className=''; status.style.display='none'; return; }

    if(form.elements.botcheck.checked) return;
    btn.disabled = true; btn.textContent = 'Sending...';
    status.className=''; status.style.display='none';

    var data = new FormData();
    data.append('access_key', 'a63c67d4-cf97-4882-9a62-556cdfa590b0');
    data.append('from_name', 'KunalWorld Website');
    data.append('name', name);
    data.append('phone', phone);
    data.append('email', email);
    if(service) data.append('service_requested', service);
    data.append('payment_method', unsure ? 'Advice requested - payment not selected' : pay);
    data.append('service_details', serviceEl.options[serviceEl.selectedIndex].text);
    data.append('subject', 'New service request - ' + (service || 'KunalWorld website'));
    data.append('message', msg);

    fetch('https://api.web3forms.com/submit', { method:'POST', body:data })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if(res.success){
          status.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your query has been sent - we will contact you shortly.';
          status.className = 'ok';
          status.style.display = 'block';
          form.reset();
          form.dispatchEvent(new Event('reset-complete'));
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
        btn.disabled = false; btn.textContent = 'Send Enquiry';
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
  var params = new URLSearchParams(location.search);
  var paymentSection = document.getElementById('payment');
  var selected = params.get('service'), method = params.get('method');
  if(paymentSection && rates[selected] && (method === 'UPI' || method === 'Crypto')){
    var heading = paymentSection.querySelector('.sec-head');
    heading.querySelector('h2').textContent = method === 'UPI' ? 'Pay by UPI' : 'Pay with Crypto';
    heading.querySelector('p').textContent = selected + ' - ' + rates[selected] + '. No enquiry has been sent. Pay only the amount agreed for your care plan.';
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
      document.getElementById(id).closest('.fld').hidden = !query;
    });
    ['upi','crypto','later'].forEach(function(k){
      var p = document.getElementById('pay-panel-' + k); if(p) p.hidden = true;
    });
    var button = document.getElementById('send-btn');
    button.textContent = query ? 'Send Enquiry' : 'Continue to Payment';
    document.getElementById('route-note').textContent = unsure ? 'Not sure which care is right? Share your needs and we will help you choose. Your enquiry goes to KunalWorld.' : query ? 'Your service details and contact information will be sent to KunalWorld. Payment can be arranged later.' : 'Ready to pay? Continue to your selected payment page. No enquiry email will be sent.';
    var auto = unsure ? 'Please help me choose the right care service. ' : service ? 'I would like to avail ' + service + ' (' + rates[service] + '). ' : '';
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
