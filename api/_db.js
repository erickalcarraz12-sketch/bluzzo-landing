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
exports.vendidos = async (n) => {
  const rows = await exports.q('bluzzo_pedidos?select=cantidad&estado=neq.cancelado' + (n ? '&drop_n=eq.' + n : ''));
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

// Drop vigente: los valores guardados desde el panel (tabla bluzzo_config, clave "drop") mandan sobre config.json
let _d = null, _dt = 0;
const pos = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
exports.drop = async () => {
  if (_d && Date.now() - _dt < 8000) return _d;
  let o = {};
  try { if (key()) { const r = await exports.q('bluzzo_config?select=valor&clave=eq.drop'); if (r && r[0]) o = JSON.parse(r[0].valor) || {}; } } catch (e) { /* usa config.json */ }
  const precio = pos(o.precio) || cfg.precio;
  _d = { n: parseInt(o.n, 10) || 1, cupos: pos(o.cupos) || cfg.cuposTotal, precio, precioNormal: pos(o.precioNormal) || cfg.precioNormal || precio,
    precioPar: pos(o.precioPar) || cfg.precioPar || precio * 2, entrega: o.entrega || cfg.entrega, maxPorPedido: pos(o.maxPorPedido) || cfg.maxPorPedido, pausado: !!o.pausado };
  _dt = Date.now();
  return _d;
};
exports.guardarDrop = async (o) => {
  await exports.q('bluzzo_config?on_conflict=clave', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { clave: 'drop', valor: JSON.stringify(o) } });
  _d = null;
};
exports.subtotalD = (d, qty) => Math.floor(qty / 2) * d.precioPar + (qty % 2) * d.precio;

// Supabase Storage (bucket público "comunidad")
exports.subirObjeto = async (bucket, ruta, buf, tipo) => {
  const r = await fetch(cfg.supabaseUrl + '/storage/v1/object/' + bucket + '/' + ruta, { method: 'POST', headers: { apikey: key(), Authorization: 'Bearer ' + key(), 'Content-Type': tipo, 'x-upsert': 'true' }, body: buf });
  if (!r.ok) throw new Error('storage');
  return cfg.supabaseUrl + '/storage/v1/object/public/' + bucket + '/' + ruta;
};
exports.borrarObjeto = async (bucket, ruta) => { try { await fetch(cfg.supabaseUrl + '/storage/v1/object/' + bucket + '/' + ruta, { method: 'DELETE', headers: { apikey: key(), Authorization: 'Bearer ' + key() } }); } catch (e) { /* ignorar */ } };
