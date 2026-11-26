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
    var T={abierto:'Primer drop abierto',llenando:'Se están llenando los cupos',ultimos:'Últimos cupos del primer drop',agotado:'Primer drop agotado'};
    $('#cupTxt').textContent=T[d.nivel]||T.abierto;cp.hidden=false;
    cp.classList.toggle('ult',d.nivel==='ultimos');cp.classList.toggle('ago',d.nivel==='agotado');
    requestAnimationFrame(function(){$('#cupBar').style.width=(d.nivel==='agotado'?100:d.barra)+'%'});
    if(d.nivel==='agotado'){var pr=$('#prow');if(pr)pr.style.display='none';$$('[data-add]').forEach(function(b){b.style.display='none'});
      b.classList.add('agotado');
      var h=$('.reserva h2');if(h)h.textContent='Primer drop agotado.';
      var ld=$('.reserva p.lead');if(ld)ld.textContent='Gracias por llegar hasta aquí. Déjanos tu correo y te avisamos primero cuando abramos el próximo drop.';
      var l=$('#espL');if(l)l.textContent='Tu correo para avisarte del próximo drop';
      var ei=$('#espIn');if(ei){ei.placeholder='tucorreo@ejemplo.com';ei.type='email'}
      var bs=$('.bar');if(bs)bs.style.display='none'}
  }).catch(function(){})}
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
  // el carrito "responde" al agregar
  var cb=$('.cartbtn');
  if(cb){new MutationObserver(function(){cb.classList.remove('bump');void cb.offsetWidth;cb.classList.add('bump')}).observe($('.cnt',cb),{childList:true,characterData:true,subtree:true})}
})();
