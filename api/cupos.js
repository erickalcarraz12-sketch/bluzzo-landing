// Nivel de cupos del primer drop. No expone cifras exactas.
const cfg = require('../config.json'); const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
  let pct = 0;
  try { if (db.ok()) pct = Math.min(1, (await db.vendidos()) / cfg.cuposTotal); } catch (e) {}
  const nivel = pct >= 1 ? 'agotado' : pct >= 0.75 ? 'ultimos' : pct >= 0.4 ? 'llenando' : 'abierto';
  // el ancho de la barra es aproximado a propósito (nunca baja de 12%)
  res.status(200).json({ nivel, barra: Math.round(Math.max(0.12, pct) * 100) });
};
