// Valida un código de descuento (el cobro real lo vuelve a calcular en checkout)
const cfg = require('../config.json'); const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!db.ok()) return res.status(200).json({ ok: false, mensaje: 'Los códigos aún no están disponibles.' });
  const b = db.body(req); const qty = parseInt(b.qty, 10);
  if (!(qty >= 1 && qty <= cfg.maxPorPedido)) return res.status(400).json({ error: 'qty' });
  try { const r = await db.aplicarCodigo(b.codigo, db.subtotal(qty)); res.status(200).json(r); }
  catch (e) { res.status(500).json({ ok: false, mensaje: 'No pudimos validar el código.' }); }
};
