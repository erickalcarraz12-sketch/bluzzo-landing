(function(){
  var d=document,b=d.body,reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s,r){return (r||d).querySelector(s)}function $$(s,r){return [].slice.call((r||d).querySelectorAll(s))}
  // secuencia de entrada del hero (una sola, al cargar)
  function ready(){requestAnimationFrame(function(){requestAnimationFrame(function(){b.classList.add('ready')})})}
  if(d.fonts&&d.fonts.ready){var t=setTimeout(ready,900);d.fonts.ready.then(function(){clearTimeout(t);ready()})}else ready();
  // nav sólida al bajar
  var nav=$('.nav');function onScroll(){nav.classList.toggle('solid',window.scrollY>40)}
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
    var bar=$('.bar'),hero=$('.hero'),res=$('#reserva'),vis={hero:true,res:false};
    function upd(){bar.classList.toggle('on',!vis.hero&&!vis.res)}
    new IntersectionObserver(function(es){vis.hero=es[0].isIntersecting;upd()}).observe(hero);
    new IntersectionObserver(function(es){vis.res=es[0].isIntersecting;upd()},{threshold:.25}).observe(res);
  }else{$$('[data-reveal]').forEach(function(e){e.classList.add('in')});$$('.det li').forEach(function(e){e.classList.add('on')});$('.bar').classList.add('on')}
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
  // el carrito "responde" al agregar
  var cb=$('.cartbtn');
  if(cb){new MutationObserver(function(){cb.classList.remove('bump');void cb.offsetWidth;cb.classList.add('bump')}).observe($('.cnt',cb),{childList:true,characterData:true,subtree:true})}
})();
