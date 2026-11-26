(function(){
  var d=document,b=d.body,reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s,r){return (r||d).querySelector(s)}function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
  // secuencia de entrada del hero (una sola, al cargar)
  function ready(){requestAnimationFrame(function(){requestAnimationFrame(function(){b.classList.add('ready')})})}
  if(d.fonts&&d.fonts.ready){var t=setTimeout(ready,900);d.fonts.ready.then(function(){clearTimeout(t);ready()})}else ready();
  // nav sólida al bajar
  var nav=$('.nav');function onScroll(){nav.classList.toggle('solid',window.scrollY>40||b.classList.contains('menu-open'))}
  var mb=$('#menuBtn');if(mb){mb.addEventListener('click',function(){var o=b.classList.toggle('menu-open');mb.setAttribute('aria-expanded',o);onScroll()});$$('#mPanel a').forEach(function(a){a.addEventListener('click',function(){b.classList.remove('menu-open')})})}
  onScroll();addEventListener('scroll',onScroll,{passive:true});
  // revelados (solo fotos, garabato, pasos)
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.18});
    $$('[data-reveal]').forEach(function(el){io.observe(el)});
    // detalle activo según el scroll
    var items=$$('.det li');
    if(items.length){
      var on=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('on',e.isIntersecting)})},{rootMargin:'-42% 0px -42% 0px'});
      items.forEach(function(li){on.observe(li)});
    }
    // barra inferior: visible fuera del hero y de la zona de compra
    var bar=$('.bar'),hero=$('.hero'),res=$('#reserva'),vis={hero:!!hero,res:false};
    function upd(){if(bar){var scrolled=hero?true:window.scrollY>500;bar.classList.toggle('on',!vis.hero&&!vis.res&&scrolled)}}
    if(hero)new IntersectionObserver(function(es){vis.hero=es[0].isIntersecting;upd()}).observe(hero);
    if(res)new IntersectionObserver(function(es){vis.res=es[0].isIntersecting;upd()},{threshold:.25}).observe(res);
    if(!hero)addEventListener('scroll',upd,{passive:true});
  }else{$$('[data-reveal]').forEach(function(e){e.classList.add('in')});$$('.det li').forEach(function(e){e.classList.add('on')});var br=$('.bar');if(br)br.classList.add('on')}
  // FAQ con apertura suave
  $$('.faq details').forEach(function(dt){
    var sm=$('summary',dt),rs=$('.resp',dt);
    sm.addEventListener('click',function(ev){
      ev.preventDefault();
      if(reduce){dt.open=!dt.open;return}
      if(dt.open){
        var a=rs.animate({height:[rs.offsetHeight+'px','0px']},{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});
        a.onfinish=function(){dt.open=false}
      }else{
        dt.open=true;
        rs.animate({height:['0px',rs.scrollHeight+'px']},{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});
      }
    });
  });

  // nota de la historia: trazos con longitud normalizada
  $$('.nota svg path').forEach(function(p){p.setAttribute('pathLength','1')});
  // cupos del primer drop (sin cifras exactas)
  var cp=$('#cupos');
  if(cp){fetch('/api/cupos',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
    var DN=d.drop>1?'drop '+d.drop:'primer drop',DC=DN[0].toUpperCase()+DN.slice(1);var T={abierto:DC+' abierto',llenando:'Se están llenando los cupos',ultimos:'Últimos cupos del '+DN,agotado:DC+' agotado',pronto:'Nuevo drop pronto'};var AG=d.nivel==='agotado'||d.nivel==='pronto',PR=d.nivel==='pronto';
    $('#cupTxt').textContent=T[d.nivel]||T.abierto;cp.hidden=false;
    cp.classList.toggle('ult',d.nivel==='ultimos');cp.classList.toggle('ago',d.nivel==='agotado');cp.classList.toggle('pro',PR);
    requestAnimationFrame(function(){$('#cupBar').style.width=(AG?100:d.barra)+'%'});
    if(AG){var pr=$('#prow');if(pr)pr.style.display='none';$$('[data-add]').forEach(function(b){b.style.display='none'});
      b.classList.add('agotado');
      var h=$('.reserva h2');if(h)h.textContent=PR?'Nuevo drop pronto.':DC+' agotado.';
      var ld=$('.reserva p.lead');if(ld)ld.textContent=PR?'Estamos preparando el siguiente drop. Déjanos tu correo y te avisamos primero cuando abra.':'Gracias por llegar hasta aquí. Déjanos tu correo y te avisamos primero cuando abramos el próximo drop.';
      var l=$('#espL');if(l)l.textContent='Tu correo para avisarte del próximo drop';
      var ei=$('#espIn');if(ei){ei.placeholder='tucorreo@ejemplo.com';ei.type='email'}
      var bs=$('.bar');if(bs)bs.style.display='none'}
  }).catch(function(){})}
  // botón flotante de WhatsApp (dudas antes de comprar)
  if(!/^\/(resena|admin)/.test(location.pathname)){fetch('/config.json').then(function(r){return r.json()}).then(function(c){if(!c.whatsapp)return;var a=d.createElement('a');a.className='wafab';a.target='_blank';a.rel='noopener';
    a.href='https://wa.me/'+c.whatsapp+'?text='+encodeURIComponent('Hola, tengo una duda sobre Bluzzo.');a.setAttribute('aria-label','Escríbenos por WhatsApp');
    a.innerHTML='<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="#fff" d="M5 5h22a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H15l-7 6v-6H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><circle cx="10.500" cy="14" r="1.800" fill="#25D366"/><circle cx="16" cy="14" r="1.800" fill="#25D366"/><circle cx="21.500" cy="14" r="1.800" fill="#25D366"/></svg>';
    d.body.appendChild(a)}).catch(function(){})}
  // reseñas aprobadas desde el panel
  var rv=$('#resenas');
  if(rv){fetch('/api/resena?tipo=resenas').then(function(r){return r.json()}).then(function(L){if(!L||!L.length)return;var g=$('#rgrid');
    L.forEach(function(x){var c=d.createElement('div');c.className='rev';var s=d.createElement('div');s.className='st';s.textContent=new Array(x.estrellas+1).join('★')+new Array(6-x.estrellas).join('☆');c.appendChild(s);
      var p=d.createElement('p');p.textContent=x.texto;c.appendChild(p);if(x.foto){var im=d.createElement('img');im.src=x.foto;im.loading='lazy';im.alt='Foto de '+x.nombre;c.appendChild(im)}
      var n=d.createElement('b');n.textContent=x.nombre;c.appendChild(n);g.appendChild(c)});rv.hidden=false}).catch(function(){})}
  // comunidad: fotos subidas desde el panel (si no hay ninguna, la sección no se muestra)
  var cm=$('#comunidad');
  if(cm){fetch('/api/resena?tipo=comunidad').then(function(r){return r.json()}).then(function(L){if(!L||!L.length)return;var g=$('#cgal');
    L.forEach(function(x){var f=document.createElement('figure');var im=document.createElement('img');im.src=x.url;im.loading='lazy';im.alt='Bluzzo de '+(x.usuario?'@'+x.usuario:'la comunidad');f.appendChild(im);
      if(x.usuario||x.texto){var c=document.createElement('figcaption');if(x.texto){var t=document.createElement('span');t.textContent=x.texto;c.appendChild(t)}if(x.usuario){var a=document.createElement('a');a.href='https://www.instagram.com/'+encodeURIComponent(x.usuario)+'/';a.target='_blank';a.rel='noopener';a.textContent='@'+x.usuario;c.appendChild(a)}f.appendChild(c)}
      g.appendChild(f)});cm.hidden=false}).catch(function(){})}
  // prueba social: solo testimonios reales, cargados desde /testimonios.json (si está vacío, la sección no se muestra)
  var pr=$('#prueba');
  if(pr){fetch('/testimonios.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(a){
    if(!Array.isArray(a)||!a.length)return;var g=$('#tgrid');
    a.slice(0,6).forEach(function(t){if(!t||!t.texto)return;var f=d.createElement('figure');f.className='tcard';
      var q=d.createElement('blockquote');q.textContent=t.texto;f.appendChild(q);
      var c=d.createElement('figcaption');c.textContent=(t.nombre||'')+(t.detalle?' · '+t.detalle:'');f.appendChild(c);g.appendChild(f)});
    if(g.children.length)pr.hidden=false;
  }).catch(function(){})}
  // lista de espera
  var ef=$('#espera');
  if(ef){ef.addEventListener('submit',function(e){e.preventDefault();var i=$('#espIn'),m=$('#espMsg'),v=i.value.trim();if(!v){m.className='';m.textContent='Escribe tu correo o tu WhatsApp.';return}
    var b=ef.querySelector('button');b.disabled=true;
    fetch('/api/espera',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contacto:v})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})}).then(function(x){
      b.disabled=false;if(x.ok&&x.d.ok){m.className='ok';m.textContent='¡Listo! Te avisaremos del próximo drop.';i.value=''}else{m.className='';m.textContent=(x.d&&x.d.mensaje)||'No pudimos guardarlo. Escríbenos por WhatsApp.'}
    }).catch(function(){b.disabled=false;m.className='';m.textContent='No pudimos guardarlo. Inténtalo otra vez.'})})}

  // suscripción al boletín (pie de página)
  var sf=$('#subForm');
  if(sf){sf.addEventListener('submit',function(e){e.preventDefault();var i=$('#subIn'),m=$('#subMsg'),b=sf.querySelector('button'),v=(i.value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)){m.textContent='Escribe un correo válido.';return}
    b.disabled=true;m.textContent='Guardando…';
    fetch('/api/suscribir',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo:v,origen:location.pathname.slice(0,40)})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})}).then(function(x){
      b.disabled=false;if(x.ok){m.textContent='¡Listo! Ya estás en la lista.';i.value='';if(window.bzTrack)bzTrack('Lead',{})}else m.textContent=(x.d&&x.d.mensaje)||'No pudimos guardarlo. Inténtalo otra vez.'
    }).catch(function(){b.disabled=false;m.textContent='No pudimos guardarlo. Inténtalo otra vez.'})})}
  // el carrito "responde" al agregar
  var cb=$('.cartbtn');
  if(cb){new MutationObserver(function(){cb.classList.remove('bump');void cb.offsetWidth;cb.classList.add('bump')}).observe($('.cnt',cb),{childList:true,characterData:true,subtree:true})}
})();
