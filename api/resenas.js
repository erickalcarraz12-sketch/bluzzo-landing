// Reseñas aprobadas (públicas)
const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  if (!db.ok()) return res.status(200).json([]);
  try { res.status(200).json(await db.q('bluzzo_resenas?select=nombre,estrellas,texto,foto&aprobada=eq.true&order=created_at.desc&limit=12') || []); }
  catch (e) { res.status(200).json([]); }
};
