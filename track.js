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
  fetch('/api/config',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r}).catch(function(){return fetch('/config.json',{cache:'no-store'})}).then(function(r){return r.json()}).then(function(c){
    var id=c&&c.metaPixelId;if(!id)return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src='https://connect.facebook.net/en_US/fbevents.js';s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script');
    fbq('init',id);fbq('track','PageView');fbOn=true;
    q.forEach(function(a){if(window.fbq)fbq('track',a[0],a[1]||{},a[2]?{eventID:a[2]}:undefined)});q=[];
  }).catch(function(){});
  // ver el producto
  if(document.getElementById('reserva'))window.bzTrack('ViewContent',{content_name:'Bluzzo Blueprint Notebook A5',currency:'PEN',value:89});
})();
