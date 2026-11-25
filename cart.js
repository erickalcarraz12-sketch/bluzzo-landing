(function(){
  var CFG={producto:'Bluzzo Blueprint Notebook A5',precio:79,maxPorPedido:5,
    envio:{lima:{nombre:'Lima Metropolitana',costo:10},provincia:{nombre:'Provincias (agencia)',costo:18}},
    entrega:'mediados de enero de 2027',whatsapp:'51926410751',culqiPublicKey:''};
  var KEY='bluzzo_cart_v1',qty=0,zona='lima',busy=false,cod=null;
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{}');qty=Math.max(0,Math.min(CFG.maxPorPedido,parseInt(d.qty,10)||0));if(CFG.envio[d.zona])zona=d.zona}catch(e){}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({qty:qty,zona:zona}))}catch(e){}}
  function money(n){return 'S/ '+(n%1?n.toFixed(2):n)}
  var picker=1;
  function fillStatic(){
    $$('[data-price]').forEach(function(e){e.textContent=money(CFG.precio)});
    $$('[data-entrega]').forEach(function(e){e.textContent=CFG.entrega});
    $$('[data-envio-lima]').forEach(function(e){e.textContent=money(CFG.envio.lima.costo)});
    $$('[data-envio-prov]').forEach(function(e){e.textContent=money(CFG.envio.provincia.costo)});
  }
  function shipCost(){return CFG.envio[zona].costo}
  function disc(){if(!cod)return 0;var st=CFG.precio*qty,d=cod.tipo==='porcentaje'?st*cod.valor/100:cod.valor;return Math.min(Math.round(d*100)/100,st)}
  function total(){return Math.round((CFG.precio*qty-disc()+shipCost())*100)/100}
  function render(){
    var cb=$('.cartbtn');if(cb){cb.classList.toggle('has',qty>0);$('.cnt',cb).textContent=qty}
    var pq=$('#pq');if(pq){pq.textContent=picker;$('#pqm').disabled=picker<=1;$('#pqp').disabled=picker>=CFG.maxPorPedido}
    var body=$('#cartBody'),foot=$('#cartFoot');if(!body)return;
    if(!qty){body.innerHTML='<div class="empty"><div class="disp" style="font-size:28px;color:#0038FF;font-weight:700">Tu carrito está vacío</div><p>Agrega tu Bluzzo y recibe un bolígrafo blanco de regalo.</p><a href="#reserva" class="btn" style="background:#0038FF;color:#fff" data-cart-close>Ver el notebook</a></div>';foot.style.display='none';return}
    foot.style.display='flex';
    var z='';Object.keys(CFG.envio).forEach(function(k){var e=CFG.envio[k];z+='<label class="zn'+(k===zona?' on':'')+'"><span><input type="radio" name="zona" value="'+k+'"'+(k===zona?' checked':'')+'>'+e.nombre+'</span><b>'+money(e.costo)+'</b></label>'});
    var keep={};$$('#cartForm [name]').forEach(function(i){if(i.type!=='radio')keep[i.name]=i.value});
    body.innerHTML=
      '<div class="ln"><div class="th"></div><div class="in"><b>'+CFG.producto+'</b><small>Tapa dura azul · hojas lisas azul real</small><div style="margin-top:8px;display:flex;width:max-content" class="stp"><button type="button" data-q="-1" aria-label="Menos">−</button><span>'+qty+'</span><button type="button" data-q="1" aria-label="Más"'+(qty>=CFG.maxPorPedido?' disabled':'')+'>+</button></div><button class="lnr" type="button" data-q="-99">Quitar</button></div><div class="pr">'+money(CFG.precio*qty)+'</div></div>'+
      '<div class="ln" style="background:#EEF2FF;border-color:#EEF2FF"><div class="in"><b>Bolígrafo de gel blanco × '+qty+'</b><small>De regalo con tu notebook</small></div><div class="pr" style="color:#0038FF">Gratis</div></div>'+
      '<form id="cartForm" novalidate><fieldset><legend>Envío</legend>'+z+'</fieldset>'+
      '<fieldset style="margin-top:18px"><legend>Tus datos</legend>'+
      '<label class="f">Nombre completo<input type="text" name="nombre" autocomplete="name" required></label>'+
      '<div class="g2"><label class="f">Celular / WhatsApp<input type="tel" name="celular" autocomplete="tel" inputmode="tel" required></label><label class="f">Correo<input type="email" name="email" autocomplete="email" required></label></div>'+
      '<label class="f">Dirección de entrega<input type="text" name="direccion" autocomplete="street-address" required></label>'+
      '<label class="f">Distrito y ciudad<input type="text" name="ciudad" autocomplete="address-level2"></label>'+
      '<label class="f">Notas (opcional)<textarea name="notas" rows="2"></textarea></label></fieldset></form>';
    Object.keys(keep).forEach(function(n){var i=$('#cartForm [name="'+n+'"]');if(i)i.value=keep[n]});
    $('#tSub').textContent=money(CFG.precio*qty);$('#tEnv').textContent=money(shipCost());$('#tTot').textContent=money(total());
    var dr=$('#tDescRow');if(dr){dr.style.display=cod?'flex':'none';if(cod){$('#tDescL').textContent='Descuento ('+cod.codigo+')';$('#tDesc').textContent='− '+money(disc())}}
    var ci=$('#codeIn');if(ci&&cod){ci.value=cod.codigo}
  }
  function setQty(n){qty=Math.max(0,Math.min(CFG.maxPorPedido,n));save();render()}
  function applyCode(){var i=$('#codeIn'),m=$('#codeMsg'),v=(i.value||'').trim();if(!v){cod=null;render();m.textContent='';return}
    m.textContent='Validando…';m.className='cm';
    fetch('/api/codigo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({codigo:v,qty:qty})}).then(function(r){return r.json()}).then(function(d){
      if(d&&d.ok&&d.codigo){cod={codigo:d.codigo,tipo:d.tipo,valor:d.valor};m.textContent='¡Código aplicado!';m.className='cm ok'}else{cod=null;m.textContent=(d&&d.mensaje)||'Ese código no es válido.';m.className='cm'}render()}).catch(function(){m.textContent='No pudimos validar el código.';m.className='cm'})}
  function open(){document.body.classList.add('cart-open');render()}
  function close(){document.body.classList.remove('cart-open')}
  function msg(t,ok){var m=$('#cartMsg');m.textContent=t||'';m.className='msg'+(ok?' ok':'')}
  function data(){var f={};$$('#cartForm [name]').forEach(function(i){if(i.type!=='radio')f[i.name]=i.value.trim()});return f}
  function valid(f){if(!f.nombre)return 'Escribe tu nombre.';if((f.celular||'').replace(/\D/g,'').length<9)return 'Escribe un celular válido (9 dígitos).';if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email||''))return 'Escribe un correo válido para tu comprobante.';if(!f.direccion)return 'Escribe tu dirección de entrega.';return ''}
  function waText(f){var t=CFG.envio[zona],tot=total();
    return 'Hola, quiero separar mi Bluzzo.\n\n• '+qty+' × '+CFG.producto+' (bolígrafo blanco de regalo)\n• Envío: '+t.nombre+' ('+money(t.costo)+')\n• '+(cod?'Código '+cod.codigo+' (− '+money(disc())+')\n• ':'')+'Total: '+money(tot)+'\n\nNombre: '+(f.nombre||'')+'\nCelular: '+(f.celular||'')+'\nDirección: '+(f.direccion||'')+(f.ciudad?', '+f.ciudad:'')+(f.notas?'\nNotas: '+f.notas:'')}
  function toWA(f){window.open('https://wa.me/'+CFG.whatsapp+'?text='+encodeURIComponent(waText(f||data())),'_blank','noopener')}
  var culqiReady=false;
  function loadCulqi(cb){
    if(window.Culqi){cb();return}
    var sc=document.createElement('script');sc.src='https://checkout.culqi.com/js/v4';sc.onload=function(){cb()};
    sc.onerror=function(){cb(new Error('load'))};document.head.appendChild(sc);
  }
  function resetBtn(){busy=false;var b=$('#cartPay');if(b){b.disabled=false;b.textContent='Pagar y reservar'}}
  function fallback(f,t){resetBtn();msg(t||'El pago en línea todavía no está activo. Te abrimos WhatsApp con tu pedido para coordinar el pago.',true);toWA(f)}
  var pending=null;
  window.culqi=function(){
    if(!window.Culqi)return;
    if(Culqi.token){
      var tk=Culqi.token,f=pending||data();
      msg('Confirmando tu pago…',true);try{Culqi.close()}catch(e){}
      fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tk.id,email:tk.email||f.email,qty:qty,zona:zona,codigo:cod?cod.codigo:'',cliente:f})})
      .then(function(r){return r.json().catch(function(){return{}}).then(function(d){return{ok:r.ok,d:d}})})
      .then(function(x){
        if(x.ok&&x.d.ok){var r=x.d;qty=0;cod=null;save();render();close();location.href='/gracias?ref='+encodeURIComponent(r.ref)+'&n='+r.cantidad+'&t='+encodeURIComponent(r.total);return}
        resetBtn();
        if(x.d&&x.d.error==='pago_no_configurado'){fallback(f);return}
        msg((x.d&&x.d.mensaje)||'No pudimos procesar el pago. Revisa tus datos o escríbenos por WhatsApp.')})
      .catch(function(){resetBtn();msg('No pudimos confirmar el pago. Si te cobraron, escríbenos por WhatsApp.')});
    }else if(Culqi.error){
      resetBtn();msg(Culqi.error.user_message||'No se pudo procesar la tarjeta.');
    }
  };
  function pay(){
    if(busy||!qty)return;var f=data(),e=valid(f);if(e){msg(e);return}
    if(!CFG.culqiPublicKey){fallback(f);return}
    busy=true;var b=$('#cartPay');b.disabled=true;b.textContent='Abriendo pago…';msg('');pending=f;
    loadCulqi(function(err){
      if(err||!window.Culqi){resetBtn();msg('No se pudo cargar la ventana de pago de Culqi. Si usas Brave u otro bloqueador, desactívalo para este sitio y vuelve a intentar, o usa «Prefiero coordinar por WhatsApp».');return}
      Culqi.publicKey=CFG.culqiPublicKey;
      Culqi.settings({title:'Bluzzo',currency:'PEN',amount:Math.round(total()*100),description:qty+' × '+CFG.producto});
      Culqi.options({lang:'es',modal:true,installments:false,paymentMethods:{tarjeta:true,yape:true,bancaMovil:false,agente:false,billetera:false,cuotealo:false}});
      try{Culqi.open()}catch(e){msg('No se pudo abrir el pago ('+(e&&e.message||'error')+'). Prueba de nuevo o coordina por WhatsApp.')}resetBtn();
    });
  }
  function showThanks(s){
    var t={ok:'<b>¡Pago recibido!</b> Tu notebook Bluzzo quedó reservado. Te escribimos por WhatsApp para coordinar la entrega.'}[s];if(!t)return;
    var d=document.createElement('div');d.className='thx';d.innerHTML=t+'<button type="button">Cerrar</button>';document.body.appendChild(d);
    d.querySelector('button').onclick=function(){d.remove()};
  }
  document.addEventListener('click',function(ev){
    var t=ev.target.closest('[data-cart-open],[data-cart-close],[data-q],[data-pq],[data-add],#cartPay,#cartWA,#codeBtn');if(!t)return;
    if(t.hasAttribute('data-cart-open')){ev.preventDefault();open()}
    else if(t.hasAttribute('data-cart-close')){close()}
    else if(t.hasAttribute('data-q')){setQty(qty+parseInt(t.getAttribute('data-q'),10))}
    else if(t.hasAttribute('data-pq')){picker=Math.max(1,Math.min(CFG.maxPorPedido,picker+parseInt(t.getAttribute('data-pq'),10)));render()}
    else if(t.hasAttribute('data-add')){var n=t.getAttribute('data-add')==='picker'?picker:1;setQty(Math.min(CFG.maxPorPedido,qty+n));open()}
    else if(t.id==='cartPay'){pay()}
    else if(t.id==='codeBtn'){applyCode()}
    else if(t.id==='cartWA'){var f=data();toWA(f)}
  });
  document.addEventListener('change',function(ev){if(ev.target.name==='zona'){zona=ev.target.value;save();render()}});
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape')close();if(ev.key==='Enter'&&ev.target.id==='codeIn'){ev.preventDefault();applyCode()}});
  document.addEventListener('submit',function(ev){ev.preventDefault();pay()});
  fetch('/config.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(c){CFG=c}).catch(function(){}).then(function(){load();fillStatic();render()});
  load();fillStatic();render();
})();
