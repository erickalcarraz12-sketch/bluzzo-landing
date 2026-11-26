// Configuración pública del sitio, con los valores del drop vigente
const cfg = require('../config.json'); const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
  let d = null; try { d = await db.drop(); } catch (e) { /* config.json */ }
  const o = Object.assign({}, cfg);
  if (d) Object.assign(o, { precio: d.precio, precioNormal: d.precioNormal, precioPar: d.precioPar, entrega: d.entrega, maxPorPedido: d.maxPorPedido, drop: d.n });
  res.status(200).json(o);
};
