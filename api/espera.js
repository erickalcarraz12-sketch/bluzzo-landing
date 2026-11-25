// Lista de espera por correo o WhatsApp
const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!db.ok()) return res.status(501).json({ error: 'no_configurado' });
  const b = db.body(req);
  let c = db.txt(b.contacto, 120);
  const esMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
  const num = c.replace(/\D/g, '');
  const esWa = !esMail && num.length >= 9 && num.length <= 13;
  if (!esMail && !esWa) return res.status(400).json({ error: 'contacto_invalido', mensaje: 'Escribe un correo o un número de WhatsApp válido.' });
  if (esWa) c = num;
  try {
    await db.q('bluzzo_espera?on_conflict=contacto', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: { contacto: c.toLowerCase(), tipo: esMail ? 'correo' : 'whatsapp' } });
    res.status(200).json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'db' }); }
};
