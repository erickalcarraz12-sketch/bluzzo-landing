// Crea el pago en Mercado Pago. El precio SIEMPRE se calcula aquí (no se confía en el navegador).
// Variables de entorno en Vercel: MP_ACCESS_TOKEN (obligatoria para cobrar), SITE_URL (opcional).
const cfg = require('../config.json');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(501).json({ error: 'pago_no_configurado' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const qty = parseInt(b.qty, 10);
  const zona = cfg.envio[b.zona];
  const c = b.cliente || {};
  const txt = (v, n) => String(v || '').trim().slice(0, n);
  if (!(qty >= 1 && qty <= cfg.maxPorPedido) || !zona) return res.status(400).json({ error: 'pedido_invalido' });
  const nombre = txt(c.nombre, 80), cel = txt(c.celular, 20), dir = txt(c.direccion, 160);
  if (!nombre || cel.replace(/\D/g, '').length < 9 || !dir) return res.status(400).json({ error: 'datos_incompletos' });

  const site = (process.env.SITE_URL || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host))).replace(/\/$/, '');
  const ref = 'BLZ-' + Date.now().toString(36).toUpperCase();
  const pref = {
    items: [
      { id: 'bluzzo-a5', title: cfg.producto + ' (incluye bolígrafo blanco de regalo)', quantity: qty, unit_price: cfg.precio, currency_id: 'PEN' },
      { id: 'envio', title: 'Envío · ' + zona.nombre, quantity: 1, unit_price: zona.costo, currency_id: 'PEN' }
    ],
    payer: { name: nombre, email: txt(c.email, 120) || undefined, phone: { number: cel.replace(/\D/g, '') } },
    external_reference: ref,
    statement_descriptor: 'BLUZZO',
    metadata: { direccion: dir, ciudad: txt(c.ciudad, 80), notas: txt(c.notas, 200), zona: b.zona, qty },
    back_urls: { success: site + '/?pago=ok&ref=' + ref, pending: site + '/?pago=pendiente&ref=' + ref, failure: site + '/?pago=error' },
    auto_return: 'approved'
  };
  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(pref)
    });
    const d = await r.json();
    if (!r.ok || !d.init_point) return res.status(502).json({ error: 'pasarela', detalle: d.message || null });
    return res.status(200).json({ url: d.init_point, ref });
  } catch (e) {
    return res.status(502).json({ error: 'pasarela' });
  }
};
