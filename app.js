
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

    var ok = true;
    show('e-name', name.length >= 2 ? false : (ok=false, true));
    show('e-phone', validPhone(phone) ? false : (ok=false, true));
    show('e-email', validEmail(email) ? false : (ok=false, true));
    if(serviceEl) show('e-service', service ? false : (ok=false, true));
    if(payEl) show('e-pay', pay ? false : (ok=false, true));
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
    if(pay) data.append('payment_method', pay);
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
        btn.disabled = false; btn.textContent = 'Send Query';
      });
  });
})();

const menu=document.getElementById('menu-toggle'), nav=document.getElementById('primary-nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);nav.classList.toggle('open',open);menu.textContent=open?'Close':'Menu';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}});
(function(){
  var serviceSel = document.getElementById('f-service');
  var paySel = document.getElementById('f-pay');
  var msg = document.getElementById('f-msg');
  if(!serviceSel && !paySel) return;

  var rates = {
    'Bed-ridden Patient Care':'\u20b940,000 / month',
    'Tracheostomy Care':'\u20b935,000 / month',
    'Colostomy Bag Change':'\u20b91,000 / visit',
    'Basic Patient Care':'\u20b922,000 / month or \u20b91,000 / day'
  };

  function showPanel(name){
    ['upi','crypto','later'].forEach(function(k){
      var p = document.getElementById('pay-panel-' + k);
      if(p) p.hidden = (k !== name);
    });
  }

  if(paySel){
    paySel.addEventListener('change', function(){
      var v = paySel.value;
      if(v === 'UPI') showPanel('upi');
      else if(v === 'Crypto') showPanel('crypto');
      else if(v === 'Pay later') showPanel('later');
      else showPanel('');
      var ep = document.getElementById('e-pay'); if(ep) ep.style.display='none';
    });
  }

  if(serviceSel){
    serviceSel.addEventListener('change', function(){
      var v = serviceSel.value;
      var es = document.getElementById('e-service'); if(es) es.style.display='none';
      if(v && msg && (msg.value.trim()==='' || msg.value.indexOf('I would like to enquire about')===0)){
        msg.value = 'I would like to avail ' + v + (rates[v] ? ' (' + rates[v] + ')' : '') + '. ';
      }
    });
    var wanted = new URLSearchParams(location.search).get('service');
    if(wanted){
      for(var i=0;i<serviceSel.options.length;i++){
        if(serviceSel.options[i].value.toLowerCase() === wanted.toLowerCase()){
          serviceSel.selectedIndex = i;
          serviceSel.dispatchEvent(new Event('change'));
          break;
        }
      }
      if(serviceSel.value==='' && msg && msg.value.trim()==='') msg.value='I would like to enquire about '+wanted+'. ';
    }
  }
})();
