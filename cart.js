(function(){
  var CFG={producto:'Bluzzo Blueprint Notebook A5',precio:79,maxPorPedido:5,
    envio:{lima:{nombre:'Lima Metropolitana',costo:10},provincia:{nombre:'Provincias (agencia)',costo:18}},
    entrega:'mediados de enero de 2027',whatsapp:'51926410751'};
  var KEY='bluzzo_cart_v1',qty=0,zona='lima',busy=false;
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{}');qty=Math.max(0,Math.min(CFG.maxPorPedido,parseInt(d.qty,10)||0));if(CFG.envio[d.zona])zona=d.zona}catch(e){}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({qty:qty,zona:zona}))}catch(e){}}
  function money(n){return 'S/ '+n}
  var picker=1;
  function fillStatic(){
    $$('[data-price]').forEach(function(e){e.textContent=money(CFG.precio)});
    $$('[data-entrega]').forEach(function(e){e.textContent=CFG.entrega});
    $$('[data-envio-lima]').forEach(function(e){e.textContent=money(CFG.envio.lima.costo)});
    $$('[data-envio-prov]').forEach(function(e){e.textContent=money(CFG.envio.provincia.costo)});
  }
  function shipCost(){return CFG.envio[zona].costo}
  function render(){
    var cb=$('.cartbtn');if(cb){cb.classList.toggle('has',qty>0);$('.cnt',cb).textContent=qty}
    var pq=$('#pq');if(pq){pq.textContent=picker;$('#pqm').disabled=picker<=1;$('#pqp').disabled=picker>=CFG.maxPorPedido}
    var body=$('#cartBody'),foot=$('#cartFoot');if(!body)return;
    if(!qty){body.innerHTML='<div class="empty"><div class="cond" style="font-size:28px;color:#0038FF;font-weight:700">Tu carrito está vacío</div><p>Agrega tu Bluzzo y recibe un bolígrafo blanco de regalo.</p><a href="#reserva" class="btn" style="background:#0038FF;color:#fff" data-cart-close>Ver el notebook</a></div>';foot.style.display='none';return}
    foot.style.display='flex';
    var z='';Object.keys(CFG.envio).forEach(function(k){var e=CFG.envio[k];z+='<label class="zn'+(k===zona?' on':'')+'"><span><input type="radio" name="zona" value="'+k+'"'+(k===zona?' checked':'')+'>'+e.nombre+'</span><b>'+money(e.costo)+'</b></label>'});
    var keep={};$$('#cartForm [name]').forEach(function(i){if(i.type!=='radio')keep[i.name]=i.value});
    body.innerHTML=
      '<div class="ln"><div class="th"></div><div class="in"><b>'+CFG.producto+'</b><small>Tapa dura azul · hojas lisas azul real</small><div style="margin-top:8px;display:flex;width:max-content" class="stp"><button type="button" data-q="-1" aria-label="Menos">−</button><span>'+qty+'</span><button type="button" data-q="1" aria-label="Más"'+(qty>=CFG.maxPorPedido?' disabled':'')+'>+</button></div><button class="lnr" type="button" data-q="-99">Quitar</button></div><div class="pr">'+money(CFG.precio*qty)+'</div></div>'+
      '<div class="ln" style="background:#EEF2FF;border-color:#EEF2FF"><div class="in"><b>Bolígrafo de gel blanco × '+qty+'</b><small>De regalo con tu notebook</small></div><div class="pr" style="color:#0038FF">Gratis</div></div>'+
      '<form id="cartForm" novalidate><fieldset><legend>Envío</legend>'+z+'</fieldset>'+
      '<fieldset style="margin-top:18px"><legend>Tus datos</legend>'+
      '<label class="f">Nombre completo<input type="text" name="nombre" autocomplete="name" required></label>'+
      '<div class="g2"><label class="f">Celular / WhatsApp<input type="tel" name="celular" autocomplete="tel" inputmode="tel" required></label><label class="f">Correo (opcional)<input type="email" name="email" autocomplete="email"></label></div>'+
      '<label class="f">Dirección de entrega<input type="text" name="direccion" autocomplete="street-address" required></label>'+
      '<label class="f">Distrito y ciudad<input type="text" name="ciudad" autocomplete="address-level2"></label>'+
      '<label class="f">Notas (opcional)<textarea name="notas" rows="2"></textarea></label></fieldset></form>';
    Object.keys(keep).forEach(function(n){var i=$('#cartForm [name="'+n+'"]');if(i)i.value=keep[n]});
    $('#tSub').textContent=money(CFG.precio*qty);$('#tEnv').textContent=money(shipCost());$('#tTot').textContent=money(CFG.precio*qty+shipCost());
  }
  function setQty(n){qty=Math.max(0,Math.min(CFG.maxPorPedido,n));save();render()}
  function open(){document.body.classList.add('cart-open');render()}
  function close(){document.body.classList.remove('cart-open')}
  function msg(t,ok){var m=$('#cartMsg');m.textContent=t||'';m.className='msg'+(ok?' ok':'')}
  function data(){var f={};$$('#cartForm [name]').forEach(function(i){if(i.type!=='radio')f[i.name]=i.value.trim()});return f}
  function valid(f){if(!f.nombre)return 'Escribe tu nombre.';if((f.celular||'').replace(/\D/g,'').length<9)return 'Escribe un celular válido (9 dígitos).';if(!f.direccion)return 'Escribe tu dirección de entrega.';return ''}
  function waText(f){var t=CFG.envio[zona],tot=CFG.precio*qty+t.costo;
    return 'Hola, quiero separar mi Bluzzo.\n\n• '+qty+' × '+CFG.producto+' (bolígrafo blanco de regalo)\n• Envío: '+t.nombre+' ('+money(t.costo)+')\n• Total: '+money(tot)+'\n\nNombre: '+(f.nombre||'')+'\nCelular: '+(f.celular||'')+'\nDirección: '+(f.direccion||'')+(f.ciudad?', '+f.ciudad:'')+(f.notas?'\nNotas: '+f.notas:'')}
  function toWA(f){window.open('https://wa.me/'+CFG.whatsapp+'?text='+encodeURIComponent(waText(f||data())),'_blank','noopener')}
  function pay(){
    if(busy||!qty)return;var f=data(),e=valid(f);if(e){msg(e);return}
    busy=true;var b=$('#cartPay');b.disabled=true;b.textContent='Procesando…';msg('');
    fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qty:qty,zona:zona,cliente:f})})
    .then(function(r){return r.json().catch(function(){return{}}).then(function(d){return{ok:r.ok,d:d}})})
    .then(function(x){
      if(x.ok&&x.d.url){location.href=x.d.url;return}
      busy=false;b.disabled=false;b.textContent='Pagar y reservar';
      if(x.d&&x.d.error==='datos_incompletos'||x.d&&x.d.error==='pedido_invalido'){msg('Revisa tus datos e inténtalo de nuevo.');return}
      msg('El pago en línea todavía no está activo. Te abrimos WhatsApp con tu pedido para coordinar el pago.',true);toWA(f)})
    .catch(function(){busy=false;b.disabled=false;b.textContent='Pagar y reservar';msg('No pudimos conectar con el pago. Te abrimos WhatsApp con tu pedido.',true);toWA(f)});
  }
  function thanks(){
    var p=new URLSearchParams(location.search),s=p.get('pago');if(!s)return;
    var t={ok:'<b>¡Pago recibido!</b> Tu notebook Bluzzo quedó reservado. Te escribimos por WhatsApp para coordinar la entrega.',pendiente:'<b>Pago pendiente.</b> Apenas se confirme, tu reserva queda lista y te avisamos.',error:'<b>No se completó el pago.</b> Puedes intentarlo de nuevo desde el carrito.'}[s];
    if(!t)return;if(s==='ok'){qty=0;save()}
    var d=document.createElement('div');d.className='thx';d.innerHTML=t+'<button type="button">Cerrar</button>';document.body.appendChild(d);
    d.querySelector('button').onclick=function(){d.remove()};try{history.replaceState(null,'',location.pathname)}catch(e){}
  }
  document.addEventListener('click',function(ev){
    var t=ev.target.closest('[data-cart-open],[data-cart-close],[data-q],[data-pq],[data-add],#cartPay,#cartWA');if(!t)return;
    if(t.hasAttribute('data-cart-open')){ev.preventDefault();open()}
    else if(t.hasAttribute('data-cart-close')){close()}
    else if(t.hasAttribute('data-q')){setQty(qty+parseInt(t.getAttribute('data-q'),10))}
    else if(t.hasAttribute('data-pq')){picker=Math.max(1,Math.min(CFG.maxPorPedido,picker+parseInt(t.getAttribute('data-pq'),10)));render()}
    else if(t.hasAttribute('data-add')){var n=t.getAttribute('data-add')==='picker'?picker:1;setQty(Math.min(CFG.maxPorPedido,qty+n));open()}
    else if(t.id==='cartPay'){pay()}
    else if(t.id==='cartWA'){var f=data();toWA(f)}
  });
  document.addEventListener('change',function(ev){if(ev.target.name==='zona'){zona=ev.target.value;save();render()}});
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape')close()});
  document.addEventListener('submit',function(ev){ev.preventDefault();pay()});
  fetch('/config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){CFG=c}).catch(function(){}).then(function(){load();fillStatic();render();thanks()});
  load();fillStatic();render();
})();
