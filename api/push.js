// Registro de dispositivos para notificaciones del panel (requiere la clave de admin)
const crypto = require('crypto'); const db = require('./_db'); const push = require('./_push');
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !db.ok()) return res.status(501).json({ error: 'no_configurado' });
  if (!igual(req.headers['x-admin-key'] || '', pw)) return res.status(401).json({ error: 'clave' });
  try {
    if (req.method === 'GET') return res.status(200).json({ publicKey: await push.publicKey(), dispositivos: await push.cantidad() });
    const b = db.body(req);
    if (b.accion === 'suscribir' && b.sub && b.sub.endpoint && b.sub.keys) { await push.guardar(b.sub, req.headers['user-agent']); return res.status(200).json({ ok: true }); }
    if (b.accion === 'probar') { const n = await push.notificar({ titulo: 'Bluzzo · prueba', cuerpo: '¡Las notificaciones funcionan! 🎉', url: '/admin', tag: 'prueba' }); return res.status(200).json({ ok: true, enviados: n }); }
    res.status(400).json({ error: 'accion' });
  } catch (e) { res.status(500).json({ error: 'db' }); }
};
