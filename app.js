
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
    data.append('from_name', 'KunalWorld Website');
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
      data.append('subject', 'New service request - ' + (service || 'KunalWorld website'));
      data.append('message', msg);
    }
    var payUrl = 'pricing.html?service=' + encodeURIComponent(service) + '&method=' + encodeURIComponent(pay) + '#payment';
    if(payRoute){
      // Never block payment: continue whether or not the email send works.
      var went = false;
      var go = function(ok){ if(went) return; went = true; try{ sessionStorage.setItem('kw-checkout', ok ? 'sent' : 'failed'); }catch(e){} location.href = payUrl; };
      var timer = setTimeout(function(){ go(false); }, 8000);
      fetch('https://api.web3forms.com/submit', { method:'POST', body:data })
        .then(function(r){ return r.json(); })
        .then(function(res){ clearTimeout(timer); go(!!(res && res.success)); })
        .catch(function(){ clearTimeout(timer); go(false); });
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
    var ck = null; try{ ck = sessionStorage.getItem('kw-checkout'); sessionStorage.removeItem('kw-checkout'); }catch(e){}
    if(ck){
      var cn = document.createElement('p');
      cn.className = 'notice';
      cn.setAttribute('role','status');
      cn.textContent = ck === 'sent' ? 'Checkout details received. Please complete your payment below.' : 'We could not save your checkout details just now, but you can still pay below. Please WhatsApp or call us your name and phone number after paying.';
      heading.appendChild(cn);
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
    document.getElementById('route-note').textContent = unsure ? 'Not sure which care is right? Share your needs and we will help you choose. Your enquiry goes to KunalWorld.' : query ? 'Your service details and contact information will be sent to KunalWorld. Payment can be arranged later.' : 'Checkout details: enter your contact details, then continue to payment. Your details are sent to KunalWorld so we can confirm your care plan.';
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
