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

  var copyBtn = document.getElementById('copy-upi');
  if(copyBtn){ copyBtn.addEventListener('click', function(){
    var id = document.getElementById('upi-id').textContent.trim();
    function done(){ copyBtn.textContent='Copied!'; setTimeout(function(){ copyBtn.textContent='Copy'; },1800); }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(id).then(done).catch(function(){ fallback(); }); } else { fallback(); }
    function fallback(){ var t=document.createElement('textarea'); t.value=id; document.body.appendChild(t); t.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(t); done(); }
  }); }

  if(form) form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = document.getElementById('f-name').value.trim();
    var phone = document.getElementById('f-phone').value.trim();
    var email = document.getElementById('f-email').value.trim();
    var msg = document.getElementById('f-msg').value.trim();

    var ok = true;
    show('e-name', name.length >= 2 ? false : (ok=false, true));
    show('e-phone', validPhone(phone) ? false : (ok=false, true));
    show('e-email', validEmail(email) ? false : (ok=false, true));
    show('e-msg', msg.length >= 5 ? false : (ok=false, true));
    if(!ok){ status.className=''; status.style.display='none'; return; }

    if(form.elements.botcheck.checked) return;
    btn.disabled = true; btn.textContent = 'Sending...';
    status.className=''; status.style.display='none';

    var data = new FormData();
    data.append('access_key', 'a63c67d4-cf97-4882-9a62-556cdfa590b0');
    data.append('subject', 'New care query - KunalWorld website');
    data.append('from_name', 'KunalWorld Website');
    data.append('name', name);
    data.append('phone', phone);
    data.append('email', email);
    data.append('message', msg);

    fetch('https://api.web3forms.com/submit', { method:'POST', body:data })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if(res.success){
          status.textContent = 'Thank you, ' + name.split(' ')[0] + '. Your query has been sent - we will contact you shortly.';
          status.className = 'ok';
          form.reset();
        } else {
          throw new Error('failed');
        }
      })
      .catch(function(){
        status.textContent = 'Sorry, something went wrong. Please try again in a moment.';
        status.className = 'bad';
      })
      .finally(function(){
        btn.disabled = false; btn.textContent = 'Send Query';
      });
  });
})();

const menu=document.getElementById('menu-toggle'), nav=document.getElementById('primary-nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);nav.classList.toggle('open',open);menu.textContent=open?'Close':'Menu';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}});
const selected=new URLSearchParams(location.search).get('service');
const msg=document.getElementById('f-msg');if(msg&&selected)msg.value='I would like to enquire about '+selected+'. ';
