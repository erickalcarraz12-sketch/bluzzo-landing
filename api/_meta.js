// API de Conversiones de Meta: envía la compra desde el servidor (complementa al Pixel del navegador).
// Variables en Vercel: META_CAPI_TOKEN (token de acceso del dataset); opcional META_TEST_CODE (código de "Test events").
const crypto = require('crypto');
const cfg = require('../config.json');
const h = v => { v = String(v || '').trim().toLowerCase(); return v ? crypto.createHash('sha256').update(v).digest('hex') : undefined; };
const limpia = v => h(String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''));

// Solo se llama si la persona aceptó las cookies de medición. Nunca rompe el pago.
async function compra(o) {
  try {
    const token = process.env.META_CAPI_TOKEN, id = cfg.metaPixelId;
    if (!token || !id) return false;
    let cel = String(o.celular || '').replace(/\D/g, ''); if (cel.length === 9) cel = '51' + cel;
    const partes = String(o.nombre || '').trim().toLowerCase().split(/\s+/);
    const ud = { em: [h(o.email)], ph: cel ? [h(cel)] : undefined, fn: [limpia(partes[0])], ln: partes.length > 1 ? [limpia(partes[partes.length - 1])] : undefined, ct: [limpia(o.ciudad)], country: [h('pe')], external_id: [h(o.ref)] };
    Object.keys(ud).forEach(k => { if (!ud[k] || !ud[k][0]) delete ud[k]; });
    if (o.ip) ud.client_ip_address = o.ip;
    if (o.ua) ud.client_user_agent = o.ua;
    if (o.fbp) ud.fbp = String(o.fbp).slice(0, 100);
    if (o.fbc) ud.fbc = String(o.fbc).slice(0, 200);
    const body = { data: [{ event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), event_id: o.ref, action_source: 'website', event_source_url: (cfg.siteUrl || '') + '/gracias', user_data: ud, custom_data: { value: Number(o.total) || 0, currency: 'PEN', num_items: Number(o.qty) || 1 } }] };
    if (process.env.META_TEST_CODE) body.test_event_code = process.env.META_TEST_CODE;
    const r = await fetch('https://graph.facebook.com/v21.0/' + id + '/events?access_token=' + encodeURIComponent(token), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return r.ok;
  } catch (e) { return false; }
}
module.exports = { compra };
