// Fotos de la comunidad Bluzzo (solo las marcadas como visibles)
const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  if (!db.ok()) return res.status(200).json([]);
  try {
    const r = await db.q('bluzzo_comunidad?select=url,usuario,texto&visible=eq.true&order=created_at.desc&limit=24');
    res.status(200).json(r || []);
  } catch (e) { res.status(200).json([]); }
};
