// Analítica: Vercel Web Analytics + Meta Pixel (se activa al poner "metaPixelId" en config.json).
(function(){
  var q=[],fbOn=false;
  // Vercel Web Analytics (hay que activarlo una vez en el panel de Vercel: proyecto → Analytics → Enable)
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  var s=document.createElement('script');s.defer=true;s.src='/_vercel/insights/script.js';document.head.appendChild(s);
  function fire(ev,data,id){
    if(window.fbq&&fbOn)fbq('track',ev,data||{},id?{eventID:id}:undefined);
    try{window.va('event',{name:ev,data:data||{}})}catch(e){}
  }
  window.bzTrack=function(ev,data,id){if(fbOn)fire(ev,data,id);else{q.push([ev,data,id]);try{window.va('event',{name:ev,data:data||{}})}catch(e){}}};
  function cargar(){
    fetch('/api/config',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r}).catch(function(){return fetch('/config.json',{cache:'no-store'})}).then(function(r){return r.json()}).then(function(c){
      var id=c&&c.metaPixelId;if(!id)return;
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src='https://connect.facebook.net/en_US/fbevents.js';s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script');
      fbq('init',id);fbq('track','PageView');fbOn=true;
      q.forEach(function(a){if(window.fbq)fbq('track',a[0],a[1]||{},a[2]?{eventID:a[2]}:undefined)});q=[];
    }).catch(function(){});
  }
  // Consentimiento: Meta Pixel solo se carga si la persona acepta
  var cs=null;try{cs=localStorage.getItem('bzc')}catch(e){}
  if(cs==='1')cargar();
  else if(cs!=='0'&&!/^\/(admin|resena)/.test(location.pathname)){
    var st=document.createElement('style');st.textContent='.bzck{position:fixed;left:14px;bottom:14px;z-index:9999;max-width:360px;background:#0b1530;color:#fff;border:1px solid rgba(255,255,255,.25);padding:14px 16px;font:13px/1.45 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35)}.bzck a{color:#9db6ff}.bzck div{display:flex;gap:8px;margin-top:10px}.bzck button{flex:1;padding:9px 10px;font:600 13px system-ui,sans-serif;cursor:pointer;border:1px solid #fff;background:transparent;color:#fff}.bzck button.ok{background:#fff;color:#0038FF}@media(max-width:520px){.bzck{left:8px;right:8px;max-width:none;bottom:8px}}';document.head.appendChild(st);
    var bx=document.createElement('div');bx.className='bzck';bx.setAttribute('role','dialog');bx.setAttribute('aria-label','Cookies');
    bx.innerHTML='Usamos cookies de medición (Meta Pixel y analítica) para saber qué anuncios funcionan. Solo se activan si aceptas. <a href="/privacidad">Más info</a><div><button class="no" type="button">Rechazar</button><button class="ok" type="button">Aceptar</button></div>';
    function fin(v){try{localStorage.setItem('bzc',v)}catch(e){}bx.remove();if(v==='1')cargar()}
    bx.querySelector('.ok').onclick=function(){fin('1')};bx.querySelector('.no').onclick=function(){fin('0')};
    document.body?document.body.appendChild(bx):document.addEventListener('DOMContentLoaded',function(){document.body.appendChild(bx)});
  }
  // ver el producto
  if(document.getElementById('reserva'))window.bzTrack('ViewContent',{content_name:'Bluzzo Blueprint Notebook A5',currency:'PEN',value:89});
})();
