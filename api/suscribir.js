// Suscripción al boletín (correo)
const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return require('./_baja')(req, res); // enlace de baja del boletín
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!db.ok()) return res.status(501).json({ error: 'no_configurado' });
  const b = db.body(req);
  const c = db.txt(b.correo, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) return res.status(400).json({ error: 'correo_invalido', mensaje: 'Escribe un correo válido.' });
  try {
    await db.q('bluzzo_suscriptores?on_conflict=correo', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=representation', body: { correo: c, origen: db.txt(b.origen, 40) || null } }).then(async (nuevo) => {
      await db.q('bluzzo_bajas?correo=eq.' + encodeURIComponent(c), { method: 'DELETE', prefer: 'return=minimal' }).catch(() => {});
      if (nuevo && nuevo.length) { const mail = require('./_mail'); const m = mail.bienvenida(c); await mail.send({ to: c, subject: m.subject, html: m.html }); }
    });
    try { await require('./_push').notificar({ titulo: '✉️ Nuevo suscriptor', cuerpo: c, url: '/admin' }); } catch (x) { /* ignorar */ }
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'db' }); }
};
