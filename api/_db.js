// Acceso a Supabase desde el servidor. Variable en Vercel: SUPABASE_SERVICE_KEY (clave service_role, NUNCA en el navegador).
const cfg = require('../config.json');
const key = () => process.env.SUPABASE_SERVICE_KEY;
exports.ok = () => !!key();
exports.q = async (path, opt = {}) => {
  if (!key()) throw new Error('db_no_configurada');
  const r = await fetch(cfg.supabaseUrl + '/rest/v1/' + path, {
    method: opt.method || 'GET',
    headers: Object.assign({ apikey: key(), Authorization: 'Bearer ' + key(), 'Content-Type': 'application/json', Prefer: opt.prefer || 'return=representation' }, opt.headers || {}),
    body: opt.body ? JSON.stringify(opt.body) : undefined
  });
  const t = await r.text();
  let d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; }
  if (!r.ok) { const e = new Error('db_error'); e.status = r.status; e.detail = d; throw e; }
  return d;
};
exports.body = (req) => { let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } } return b || {}; };
// Subtotal con promo: cada par cuesta cfg.precioPar, el impar suelto cuesta cfg.precio
exports.subtotal = (qty) => Math.floor(qty / 2) * (cfg.precioPar || cfg.precio * 2) + (qty % 2) * cfg.precio;
exports.txt = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

// Cupos vendidos (sin cancelados)
exports.vendidos = async () => {
  const rows = await exports.q('bluzzo_pedidos?select=cantidad&estado=neq.cancelado');
  return (rows || []).reduce((a, r) => a + (r.cantidad || 0), 0);
};
// Calcula el descuento de un código sobre el subtotal. Devuelve {ok, descuento, codigo, mensaje}
exports.aplicarCodigo = async (codigoRaw, subtotal) => {
  const codigo = exports.txt(codigoRaw, 30).toUpperCase();
  if (!codigo) return { ok: true, descuento: 0, codigo: '' };
  const rows = await exports.q('bluzzo_codigos?select=*&codigo=eq.' + encodeURIComponent(codigo));
  const c = rows && rows[0];
  const mal = (m) => ({ ok: false, descuento: 0, codigo, mensaje: m });
  if (!c || !c.activo) return mal('Ese código no es válido.');
  if (c.vence && new Date(c.vence + 'T23:59:59-05:00') < new Date()) return mal('Ese código ya venció.');
  if (c.max_usos != null && c.usos >= c.max_usos) return mal('Ese código ya se agotó.');
  let d = c.tipo === 'porcentaje' ? subtotal * Number(c.valor) / 100 : Number(c.valor);
  d = Math.min(Math.round(d * 100) / 100, subtotal);
  return { ok: true, descuento: d, codigo, tipo: c.tipo, valor: Number(c.valor) };
};
