// Cargo por pago en línea: se traslada al cliente la comisión de Culqi (porcentaje + fijo + IGV) para que el neto sea el precio.
// Parámetros en config.json -> comision { pct, fijo (S/), igv }. Si falta, no se cobra cargo.
const cfg = require('../config.json');
exports.calc = (base) => {
  const c = cfg.comision; if (!c || !(c.pct > 0)) return 0;
  const k = 1 + (c.igv || 0) / 100, r = (c.pct / 100) * k, f = (c.fijo || 0) * k;
  const t = (base + f) / (1 - r);
  return Math.ceil((t - base) * 100 - 1e-9) / 100;
};
