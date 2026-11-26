// Notificaciones push para el panel (iPhone/Android/PC). Las llaves VAPID se generan solas la primera vez y se guardan en Supabase.
const db = require('./_db');
let wp = null; const lib = () => wp || (wp = require('web-push'));
let _k = null;
async function keys() {
  if (_k) return _k;
  const rd = async () => { const r = await db.q('bluzzo_config?select=valor&clave=eq.vapid'); return r && r[0] ? JSON.parse(r[0].valor) : null; };
  let k = await rd();
  if (!k) {
    const n = lib().generateVAPIDKeys();
    await db.q('bluzzo_config?on_conflict=clave', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: { clave: 'vapid', valor: JSON.stringify(n) } });
    k = (await rd()) || n;
  }
  return (_k = k);
}
exports.publicKey = async () => (await keys()).publicKey;
exports.guardar = async (sub, ua) => {
  await db.q('bluzzo_push?on_conflict=endpoint', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: { endpoint: String(sub.endpoint).slice(0, 600), sub, ua: db.txt(ua, 200) } });
};
exports.cantidad = async () => { const r = await db.q('bluzzo_push?select=id'); return (r || []).length; };
// Envía un aviso a todos los dispositivos del panel. Nunca lanza error: un fallo de aviso no debe afectar una venta.
exports.notificar = async ({ titulo, cuerpo, url, tag }) => {
  try {
    if (!db.ok()) return 0;
    const k = await keys(), w = lib();
    w.setVapidDetails('https://www.instagram.com/bluzzo.pe/', k.publicKey, k.privateKey);
    const subs = (await db.q('bluzzo_push?select=id,sub')) || [];
    let ok = 0;
    await Promise.all(subs.map(async (s) => {
      try { await w.sendNotification(s.sub, JSON.stringify({ titulo, cuerpo, url: url || '/admin', tag }), { TTL: 3600, urgency: 'high' }); ok++; }
      catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) { try { await db.q('bluzzo_push?id=eq.' + s.id, { method: 'DELETE', prefer: 'return=minimal' }); } catch (x) { /* ignorar */ } } }
    }));
    return ok;
  } catch (e) { return 0; }
};
