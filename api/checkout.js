// Cobra con Culqi. El monto SIEMPRE se calcula aquí (nunca se confía en el navegador).
// Variable de entorno en Vercel: CULQI_SECRET_KEY (sk_test_... para probar, sk_live_... para cobrar de verdad).
const cfg = require('../config.json');
const db = require('./_db');
const mail = require('./_mail');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const sk = process.env.CULQI_SECRET_KEY;
  if (!sk) return res.status(501).json({ error: 'pago_no_configurado' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const txt = (v, n) => String(v || '').trim().slice(0, n);
  const qty = parseInt(b.qty, 10);
  const dr = await db.drop().catch(() => ({ n: 1, cupos: cfg.cuposTotal, precio: cfg.precio, precioPar: cfg.precioPar, maxPorPedido: cfg.maxPorPedido, pausado: false }));
  const zona = cfg.envio[b.zona];
  const c = b.cliente || {};
  const token = txt(b.token, 60);
  const email = txt(b.email || c.email, 100);
  const nombre = txt(c.nombre, 80);
  const cel = txt(c.celular, 20).replace(/\D/g, '');
  const dir = txt(c.direccion, 100);
  if (!token || !email || !(qty >= 1 && qty <= dr.maxPorPedido) || !zona) return res.status(400).json({ error: 'pedido_invalido' });
  if (!nombre || cel.length < 9 || !dir) return res.status(400).json({ error: 'datos_incompletos' });

  const subtotal = db.subtotalD(dr, qty);
  if (dr.pausado) return res.status(409).json({ error: 'agotado', mensaje: 'Las reservas están cerradas por ahora. Únete a la lista de espera.' });
  let descuento = 0, codigo = '', vend = null;
  if (db.ok()) {
    try {
      vend = await db.vendidos(dr.n);
      if (vend + qty > dr.cupos) return res.status(409).json({ error: 'agotado', mensaje: 'Este drop se agotó. Únete a la lista de espera.' });
      const a = await db.aplicarCodigo(b.codigo, subtotal);
      if (!a.ok) return res.status(400).json({ error: 'codigo', mensaje: a.mensaje });
      descuento = a.descuento; codigo = a.codigo;
    } catch (e) { /* si la base falla no bloqueamos la venta */ }
  }
  const total = subtotal - descuento + zona.costo;       // soles
  const ref = 'BLZ-' + Date.now().toString(36).toUpperCase();
  const partes = nombre.split(/\s+/);
  const body = {
    amount: Math.round(total * 100),                      // Culqi pide céntimos
    currency_code: 'PEN',
    email,
    source_id: token,
    description: (qty + ' × ' + cfg.producto + ' + envío').slice(0, 80),
    metadata: {
      ref, cantidad: String(qty), envio: zona.nombre, codigo, descuento: String(descuento),
      nombre, celular: cel, direccion: dir,
      ciudad: txt(c.ciudad, 60), notas: txt(c.notas, 150)
    },
    antifraud_details: {
      first_name: partes[0].slice(0, 50),
      last_name: (partes.slice(1).join(' ') || partes[0]).slice(0, 50),
      address: dir.length >= 5 ? dir : dir + '     ',
      address_city: (txt(c.ciudad, 30) || 'Lima').padEnd(2, ' '),
      country_code: 'PE',
      phone_number: cel.slice(0, 15)
    }
  };
  try {
    const r = await fetch('https://api.culqi.com/v2/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sk },
      body: JSON.stringify(body)
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok && d.object === 'charge' && d.id) {
      if (db.ok()) {
        try {
          await db.q('bluzzo_pedidos', { method: 'POST', prefer: 'return=minimal', body: {
            ref, cantidad: qty, precio_unit: dr.precio, drop_n: dr.n, descuento, envio: zona.costo, total, zona: zona.nombre,
            nombre, celular: cel, email, direccion: dir, ciudad: txt(c.ciudad, 60), notas: txt(c.notas, 150),
            codigo: codigo || null, culqi_id: d.id } });
          if (codigo) { const cu = await db.q('bluzzo_codigos?select=usos&codigo=eq.' + encodeURIComponent(codigo)); if (cu && cu[0]) await db.q('bluzzo_codigos?codigo=eq.' + encodeURIComponent(codigo), { method: 'PATCH', prefer: 'return=minimal', body: { usos: cu[0].usos + 1 } }); }
        } catch (e) { /* el pago ya está hecho: queda registrado en Culqi con la misma referencia */ }
      }
      if (db.ok() && String(c.boletin) === '1') { // suscripción marcada por el cliente en el formulario
        try {
          const nuevo = await db.q('bluzzo_suscriptores?on_conflict=correo', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=representation', body: { correo: email.toLowerCase(), origen: 'compra' } });
          await db.q('bluzzo_bajas?correo=eq.' + encodeURIComponent(email.toLowerCase()), { method: 'DELETE', prefer: 'return=minimal' }).catch(() => {});
          if (nuevo && nuevo.length) { const bv = mail.bienvenida(email.toLowerCase()); await mail.send({ to: email, subject: bv.subject, html: bv.html }); }
        } catch (e) { /* ignorar */ }
      }
      if (b.ck === '1') { // API de Conversiones: solo si aceptó las cookies de medición
        const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
        await require('./_meta').compra({ ref, total, qty, email, nombre, celular: cel, ciudad: txt(c.ciudad, 60), ip, ua: txt(req.headers['user-agent'], 300), fbp: txt(b.fbp, 100), fbc: txt(b.fbc, 200) });
      }
      try { // aviso de poco stock
        if (vend === null) throw new Error('sin dato');
        const antes = dr.cupos - vend, despues = antes - qty, um = Math.ceil(dr.cupos * 0.2);
        if (despues <= 0) await require('./_push').notificar({ titulo: '🔴 Drop ' + dr.n + ' agotado', cuerpo: 'Se vendieron los ' + dr.cupos + ' cupos. Abre el siguiente drop.', url: '/admin', tag: 'stock' });
        else if (antes > um && despues <= um) await require('./_push').notificar({ titulo: '🟠 Quedan ' + despues + ' cupos', cuerpo: 'El drop ' + dr.n + ' está por agotarse.', url: '/admin', tag: 'stock' });
      } catch (e) { /* ignorar */ }
      try { await require('./_push').notificar({ titulo: '🛒 Nuevo pedido · S/ ' + total, cuerpo: nombre + ' · ' + qty + ' notebook' + (qty > 1 ? 's' : '') + ' · ' + zona.nombre, url: '/admin', tag: ref }); } catch (e) { /* ignorar */ }
      // correo de confirmación (si hay RESEND_API_KEY); nunca bloquea la respuesta de un pago ya hecho
      try {
        const m = mail.confirmacionPedido({ ref, nombre, celular: cel, direccion: dir, ciudad: txt(c.ciudad, 60), cantidad: qty, zona: zona.nombre, descuento, total });
        await mail.send({ to: email, subject: m.subject, html: m.html, bcc: process.env.MAIL_BCC });
      } catch (e) { /* ignorar */ }
      return res.status(200).json({ ok: true, ref, id: d.id, total, descuento, cantidad: qty, b: mail.firma('boleta:' + ref) });
    }
    // 3D Secure u otra acción adicional: aún no soportada en esta versión
    if (d && d.action_code) return res.status(402).json({ error: 'requiere_verificacion', mensaje: 'Tu banco pide una verificación adicional. Escríbenos por WhatsApp y te ayudamos.' });
    return res.status(402).json({ error: 'rechazado', mensaje: (d && (d.user_message || d.merchant_message)) || 'No pudimos procesar el pago.' });
  } catch (e) {
    return res.status(502).json({ error: 'pasarela' });
  }
};
