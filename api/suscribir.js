// Suscripción al boletín (correo)
const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!db.ok()) return res.status(501).json({ error: 'no_configurado' });
  const b = db.body(req);
  const c = db.txt(b.correo, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) return res.status(400).json({ error: 'correo_invalido', mensaje: 'Escribe un correo válido.' });
  try {
    await db.q('bluzzo_suscriptores?on_conflict=correo', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: { correo: c, origen: db.txt(b.origen, 40) || null } });
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'db' }); }
};
