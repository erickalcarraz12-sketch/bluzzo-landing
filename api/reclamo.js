// Libro de Reclamaciones virtual
const db = require('./_db');
const mail = require('./_mail');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!db.ok()) return res.status(501).json({ error: 'no_configurado', mensaje: 'El libro no está disponible ahora. Escríbenos por WhatsApp.' });
  const b = db.body(req), t = db.txt;
  if (t(b.web, 10)) return res.status(200).json({ ok: true, numero: 0, fecha: new Date().toISOString() }); // trampa para bots
  const r = {
    tipo: b.tipo === 'queja' ? 'queja' : 'reclamo',
    nombre: t(b.nombre, 80), doc_tipo: t(b.doc_tipo, 30), doc_num: t(b.doc_num, 20), direccion: t(b.direccion, 140),
    email: t(b.email, 100).toLowerCase(), celular: t(b.celular, 20), menor: !!b.menor, rep_nombre: b.menor ? t(b.rep_nombre, 80) : null,
    bien: b.bien === 'servicio' ? 'servicio' : 'producto', monto: Number(b.monto) > 0 ? Math.min(Number(b.monto), 99999) : null,
    descripcion: t(b.descripcion, 120), detalle: t(b.detalle, 1500), pedido: t(b.pedido, 600), ref_pedido: t(b.ref_pedido, 30)
  };
  if (!r.nombre || !r.doc_num || !r.direccion || !r.celular || !r.detalle || !r.pedido || (r.menor && !r.rep_nombre)) return res.status(400).json({ error: 'datos', mensaje: 'Completa todos los campos obligatorios.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(r.email)) return res.status(400).json({ error: 'correo', mensaje: 'Escribe un correo válido.' });
  try {
    const out = await db.q('bluzzo_reclamos', { method: 'POST', body: r });
    const h = out && out[0] ? out[0] : {};
    try {
      const num = String(h.numero || 0).padStart(6, '0');
      await mail.send({ to: r.email, subject: 'Tu hoja de reclamación N.° ' + num + ' · Bluzzo', html: mail.wrapPublic('<h2 style="margin:0 0 12px">Recibimos tu ' + r.tipo + '</h2><p>Tu hoja N.° <b>' + num + '</b> quedó registrada. Te responderemos en un máximo de <b>15 días hábiles</b>.</p><p style="font-size:13px;color:#51608F">Esta confirmación expresa únicamente la recepción de tu ' + r.tipo + ', no implica la aceptación de su contenido.</p>') });
    } catch (e) { /* el correo es opcional */ }
    try { await require('./_push').notificar({ titulo: 'Nuevo ' + r.tipo + ' · Libro de Reclamaciones', cuerpo: r.nombre + ': ' + r.detalle.slice(0, 90), url: '/admin#reclamos' }); } catch (e) { /* ignorar */ }
    res.status(200).json({ ok: true, numero: h.numero || 0, fecha: h.created_at || new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: 'db', mensaje: 'No pudimos registrar tu hoja. Inténtalo otra vez o escríbenos por WhatsApp.' }); }
};
