(function(){
  var CFG={producto:'Bluzzo Blueprint Notebook A5',precio:89,precioPar:165,precioPack5:395,precioNormal:110,maxPorPedido:5,
    envio:{lima:{nombre:'Lima Metropolitana',costo:10},provincia:{nombre:'Provincias (agencia Shalom)',costo:18}},
    entrega:'mediados de enero de 2027',whatsapp:'51926410751',culqiPublicKey:''};
  var KEY='bluzzo_cart_v1',qty=0,zona='lima',busy=false,cod=null;
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  function load(){try{var d=JSON.parse(localStorage.getItem(KEY)||'{}');qty=Math.max(0,Math.min(CFG.maxPorPedido,parseInt(d.qty,10)||0));if(CFG.envio[d.zona])zona=d.zona}catch(e){}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify({qty:qty,zona:zona}))}catch(e){}}
  function money(n){return 'S/ '+(n%1?n.toFixed(2):n)}
  var picker=1;
  function sub(q){var t=0,p5=CFG.precioPack5||0;if(p5>0){t+=Math.floor(q/5)*p5;q%=5}return t+Math.floor(q/2)*(CFG.precioPar||CFG.precio*2)+(q%2)*CFG.precio}
  function ahorro(q){return CFG.precio*q-sub(q)}
  function fillStatic(){
    $$('[data-price]').forEach(function(e){e.textContent=money(CFG.precio)});
    $$('[data-normal]').forEach(function(e){if(CFG.precioNormal&&CFG.precioNormal>CFG.precio){e.textContent=money(CFG.precioNormal);e.hidden=false}else{e.hidden=true;var pn=e.closest('.pnormal');if(pn)pn.hidden=true}});
    if(CFG.drop>1&&!/historia/.test(location.pathname)&&!window.__dn){window.__dn=1;var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n,L=[];while(n=w.nextNode()){if(/primer drop/i.test(n.nodeValue)&&!/SCRIPT|STYLE/.test(n.parentNode.nodeName))L.push(n)}L.forEach(function(n){n.nodeValue=n.nodeValue.replace(/Primer drop/g,'Drop '+CFG.drop).replace(/primer drop/g,'drop '+CFG.drop)})}
    $$('[data-par]').forEach(function(e){e.textContent=money(CFG.precioPar)});
    var p5=CFG.precioPack5||0;$$('[data-pack5]').forEach(function(e){e.textContent=money(p5)});$$('[data-ahorro5]').forEach(function(e){e.textContent=money(5*CFG.precio-p5)});$$('.pack5').forEach(function(e){e.hidden=!(p5>0&&p5<5*CFG.precio)});
    $$('[data-ahorro]').forEach(function(e){e.textContent=money(2*CFG.precio-CFG.precioPar)});
    $$('script[type="application/ld+json"]').forEach(function(s){try{var j=JSON.parse(s.textContent);if(j['@type']==='Product'&&j.offers){j.offers.price=String(CFG.precio);s.textContent=JSON.stringify(j)}}catch(e){}});
    $$('[data-entrega]').forEach(function(e){e.textContent=CFG.entrega});
    $$('[data-envio-lima]').forEach(function(e){e.textContent=money(CFG.envio.lima.costo)});
    $$('[data-envio-prov]').forEach(function(e){e.textContent=money(CFG.envio.provincia.costo)});
  }
  function shipCost(){return CFG.envio[zona].costo}
  function disc(){if(!cod)return 0;var st=sub(qty),d=cod.tipo==='porcentaje'?st*cod.valor/100:cod.valor;return Math.min(Math.round(d*100)/100,st)}
  function total(){return Math.round((sub(qty)-disc()+shipCost())*100)/100}
  function render(){
    var cb=$('.cartbtn');if(cb){cb.classList.toggle('has',qty>0);$('.cnt',cb).textContent=qty}
    var pk=$('#packs');if(pk){
      var ops=[1,2];if(CFG.precioPack5>0&&CFG.precioPack5<5*CFG.precio)ops.push(5);ops=ops.filter(function(n){return n<=CFG.maxPorPedido});if(ops.indexOf(picker)<0)picker=1;
      pk.innerHTML=ops.map(function(n){var s=sub(n),a=ahorro(n),on=n===picker;
        return '<button type="button" role="radio" aria-checked="'+on+'" class="pk'+(on?' on':'')+'" data-pack="'+n+'">'+(n===ops[ops.length-1]&&n>=5?'<em class="pkb">MAYOR AHORRO</em>':'')+'<i class="pkr"></i><span class="pkn">'+n+' unidad'+(n>1?'es':'')+'</span>'+(a>0?'<span class="pks">Ahorras '+money(a)+'</span>':'')+'<span class="pkp"><b>'+money(s)+'</b>'+(a>0?'<s>'+money(CFG.precio*n)+'</s>':'<small>Precio unitario</small>')+'</span></button>'}).join('');
      var bb=$('#packBtn');if(bb)bb.textContent='Agregar '+picker+' unidad'+(picker>1?'es':'')+' al carrito · '+money(sub(picker))}
    var body=$('#cartBody'),foot=$('#cartFoot');if(!body)return;
    if(!qty){body.innerHTML='<div class="empty"><div class="disp" style="font-size:28px;color:#0038FF;font-weight:700">Tu carrito está vacío</div><p>Agrega tu Bluzzo y recibe un bolígrafo blanco de regalo.</p><a href="#reserva" class="btn" style="background:#0038FF;color:#fff" data-cart-close>Ver el notebook</a></div>';foot.style.display='none';return}
    foot.style.display='flex';
    var z='';Object.keys(CFG.envio).forEach(function(k){var e=CFG.envio[k];z+='<label class="zn'+(k===zona?' on':'')+'"><span><input type="radio" name="zona" value="'+k+'"'+(k===zona?' checked':'')+'>'+e.nombre+'</span><b>'+money(e.costo)+'</b></label>'});
    if(zona==='provincia')z+='<p class="zn-note">Envío a provincia únicamente por la agencia Shalom. En «Dirección de entrega» escribe la oficina de Shalom donde recogerás tu pedido.</p>';
    var keep={},kb=$('#cartForm [name="boletin"]');kb=kb&&kb.checked;$$('#cartForm [name]').forEach(function(i){if(i.type!=='radio'&&i.type!=='checkbox')keep[i.name]=i.value});
    body.innerHTML=
      '<div class="ln"><div class="th"></div><div class="in"><b>'+CFG.producto+'</b><small>Tapa dura azul · hojas lisas azul real'+(ahorro(qty)>0?'</small><small style="color:#0038FF;font-weight:600">'+(qty>=5&&CFG.precioPack5>0?'Pack de 5 por '+money(CFG.precioPack5):'Promo 2 por '+money(CFG.precioPar))+' · ahorras '+money(ahorro(qty)):'')+'</small><div style="margin-top:8px;display:flex;width:max-content" class="stp"><button type="button" data-q="-1" aria-label="Menos">−</button><span>'+qty+'</span><button type="button" data-q="1" aria-label="Más"'+(qty>=CFG.maxPorPedido?' disabled':'')+'>+</button></div><button class="lnr" type="button" data-q="-99">Quitar</button></div><div class="pr">'+money(sub(qty))+'</div></div>'+
      '<div class="ln" style="background:#EEF2FF;border-color:#EEF2FF"><div class="in"><b>Bolígrafo de gel blanco × '+qty+'</b><small>De regalo con tu notebook</small></div><div class="pr" style="color:#0038FF">Gratis</div></div>'+
      '<form id="cartForm" novalidate><fieldset><legend>Envío</legend>'+z+'</fieldset>'+
      '<fieldset style="margin-top:18px"><legend>Tus datos</legend>'+
      '<label class="f">Nombre completo<input type="text" name="nombre" autocomplete="name" required></label>'+
      '<div class="g2"><label class="f">Celular / WhatsApp<input type="tel" name="celular" autocomplete="tel" inputmode="tel" required></label><label class="f">Correo<input type="email" name="email" autocomplete="email" required></label></div>'+
      '<label class="f">Dirección de entrega<input type="text" name="direccion" autocomplete="street-address" required></label>'+
      '<label class="f">Distrito y ciudad<input type="text" name="ciudad" autocomplete="address-level2"></label>'+
      '<label class="f">Notas (opcional)<textarea name="notas" rows="2"></textarea></label>'+
      '<label class="chk"><input type="checkbox" name="boletin"><span>Quiero recibir novedades, nuevos drops y promociones de Bluzzo por correo. Puedo darme de baja cuando quiera.</span></label></fieldset></form>';
    Object.keys(keep).forEach(function(n){var i=$('#cartForm [name="'+n+'"]');if(i)i.value=keep[n]});var nb=$('#cartForm [name="boletin"]');if(nb)nb.checked=!!kb;
    $('#tSub').textContent=money(sub(qty));$('#tEnv').textContent=money(shipCost());$('#tTot').textContent=money(total());
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
  function data(){var f={};$$('#cartForm [name]').forEach(function(i){if(i.type==='checkbox')f[i.name]=i.checked?'1':'';else if(i.type!=='radio')f[i.name]=i.value.trim()});return f}
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
        if(x.ok&&x.d.ok){var r=x.d;qty=0;cod=null;save();render();close();location.href='/gracias?ref='+encodeURIComponent(r.ref)+'&n='+r.cantidad+'&t='+encodeURIComponent(r.total)+'&b='+encodeURIComponent(r.b||'');return}
        resetBtn();
        if(x.d&&x.d.error==='pago_no_configurado'){fallback(f);return}
        if(x.d&&x.d.error==='agotado'){msg((x.d.mensaje||'Este drop se agotó.')+' Déjanos tu correo y te avisamos del próximo.');setTimeout(function(){close();if($('#espera'))$('#espera').scrollIntoView({behavior:'smooth',block:'center'});else location.href='/notebook#espera'},1400);return}
        msg((x.d&&x.d.mensaje)||'No pudimos procesar el pago. Revisa tus datos o escríbenos por WhatsApp.')})
      .catch(function(){resetBtn();msg('No pudimos confirmar el pago. Si te cobraron, escríbenos por WhatsApp.')});
    }else if(Culqi.error){
      resetBtn();msg(Culqi.error.user_message||'No se pudo procesar la tarjeta.');
    }
  };
  function pay(){
    if(busy||!qty)return;var f=data(),e=valid(f);if(e){msg(e);return}
    if(!CFG.culqiPublicKey){fallback(f);return}
    if(window.bzTrack)bzTrack('InitiateCheckout',{currency:'PEN',value:total(),num_items:qty});busy=true;var b=$('#cartPay');b.disabled=true;b.textContent='Abriendo pago…';msg('');pending=f;
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
    var t=ev.target.closest('[data-cart-open],[data-cart-close],[data-q],[data-pq],[data-pack],[data-add],#cartPay,#codeBtn');if(!t)return;
    if(t.hasAttribute('data-cart-open')){ev.preventDefault();open()}
    else if(t.hasAttribute('data-cart-close')){close()}
    else if(t.hasAttribute('data-q')){setQty(qty+parseInt(t.getAttribute('data-q'),10))}
    else if(t.hasAttribute('data-pack')){picker=parseInt(t.getAttribute('data-pack'),10)||1;render()}
    else if(t.hasAttribute('data-pq')){picker=Math.max(1,Math.min(CFG.maxPorPedido,picker+parseInt(t.getAttribute('data-pq'),10)));render()}
    else if(t.hasAttribute('data-add')){var n=t.getAttribute('data-add')==='picker'?picker:1;setQty(Math.min(CFG.maxPorPedido,qty+n));if(window.bzTrack)bzTrack('AddToCart',{content_name:CFG.producto,currency:'PEN',value:sub(n),num_items:n});open()}
    else if(t.id==='cartPay'){pay()}
    else if(t.id==='codeBtn'){applyCode()}
  });
  document.addEventListener('change',function(ev){if(ev.target.name==='zona'){zona=ev.target.value;save();render()}});
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape')close();if(ev.key==='Enter'&&ev.target.id==='codeIn'){ev.preventDefault();applyCode()}});
  document.addEventListener('submit',function(ev){ev.preventDefault();pay()});
  fetch('/api/config',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r}).catch(function(){return fetch('/config.json',{cache:'no-store'})}).then(function(r){return r.json()}).then(function(c){CFG=c}).catch(function(){}).then(function(){load();fillStatic();render()});
  load();fillStatic();render();
})();
