// Nivel de cupos del primer drop. No expone cifras exactas.
const cfg = require('../config.json'); const db = require('./_db');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=60');
  let pct = 0, dr = { n: 1, cupos: cfg.cuposTotal, pausado: false };
  try { if (db.ok()) { dr = await db.drop(); pct = Math.min(1, (await db.vendidos(dr.n)) / dr.cupos); } } catch (e) {}
  if (dr.pausado) pct = 1;
  const nivel = pct >= 1 ? 'agotado' : pct >= 0.75 ? 'ultimos' : pct >= 0.4 ? 'llenando' : 'abierto';
  // el ancho de la barra es aproximado a propósito (nunca baja de 12%)
  const hay = nivel !== 'agotado';
  const site = cfg.siteUrl || '';
  // Campos pensados para un bot de Instagram: respuesta clara y mensaje listo para decir (sin cifras exactas de cupos)
  const mensaje = !hay
    ? 'El drop ' + dr.n + ' de Bluzzo ya se agotó. Puedes dejar tu correo o WhatsApp en ' + site + ' para que te avisemos del próximo drop.'
    : (nivel === 'ultimos' ? 'Sí, aún hay cupos del drop ' + dr.n + ', pero quedan pocos. ' : 'Sí, aún hay cupos del drop ' + dr.n + '. ')
      + 'Puedes reservar el tuyo en ' + site + (dr.entrega ? ' (entrega estimada: ' + dr.entrega + ')' : '') + '.';
  res.status(200).json({ nivel, drop: dr.n, barra: Math.round(Math.max(0.12, pct) * 100), hay_cupos: hay, mensaje });
};
