// Reseña de un cliente. Enlace firmado por pedido: /resena?ref=...&t=...
const crypto = require('crypto');
const db = require('./_db');
const mail = require('./_mail');
const firmaRes = (ref) => mail.firma('resena:' + ref);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!db.ok()) return res.status(501).json({ error: 'no_configurado' });
  const src = req.method === 'GET' ? (req.query || {}) : db.body(req);
  const ref = String(src.ref || '').toUpperCase().slice(0, 40), t = String(src.t || '');
  if (!/^BLZ-[A-Z0-9]+$/.test(ref) || t !== firmaRes(ref)) return res.status(400).json({ error: 'enlace', mensaje: 'Este enlace no es válido.' });
  try {
    const p = await db.q('bluzzo_pedidos?select=nombre,estado&ref=eq.' + encodeURIComponent(ref) + '&limit=1');
    if (!p || !p[0] || p[0].estado === 'cancelado') return res.status(404).json({ error: 'pedido', mensaje: 'No encontramos este pedido.' });
    const ya = await db.q('bluzzo_resenas?select=id&ref=eq.' + encodeURIComponent(ref) + '&limit=1');
    if (req.method === 'GET') return res.status(200).json({ ok: true, nombre: String(p[0].nombre || '').split(/\s+/)[0], ya: !!(ya && ya.length) });
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    if (ya && ya.length) return res.status(409).json({ error: 'ya', mensaje: 'Ya recibimos tu reseña. ¡Gracias!' });
    const estrellas = parseInt(src.estrellas, 10), texto = db.txt(src.texto, 600), nombre = db.txt(src.nombre, 40) || String(p[0].nombre || '').split(/\s+/)[0];
    if (!(estrellas >= 1 && estrellas <= 5) || texto.length < 10) return res.status(400).json({ error: 'datos', mensaje: 'Elige tus estrellas y cuéntanos un poco más (mínimo 10 letras).' });
    let foto = null, ruta = null;
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(src.foto || ''));
    if (m) {
      const buf = Buffer.from(m[1], 'base64');
      if (buf.length > 3000000) return res.status(400).json({ error: 'foto', mensaje: 'La foto es muy pesada.' });
      if (buf.length > 1000) { ruta = 'resenas/' + crypto.randomUUID() + '.jpg'; foto = await db.subirObjeto('comunidad', ruta, buf, 'image/jpeg'); }
    }
    await db.q('bluzzo_resenas', { method: 'POST', prefer: 'return=minimal', body: { ref, nombre, estrellas, texto, foto, ruta } });
    try { await require('./_push').notificar({ titulo: '⭐ Nueva reseña (' + estrellas + '/5)', cuerpo: nombre + ': ' + texto.slice(0, 80), url: '/admin', tag: 'resena' }); } catch (e) { /* ignorar */ }
    return res.status(200).json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'db', mensaje: 'No pudimos guardar tu reseña. Inténtalo otra vez.' }); }
};
