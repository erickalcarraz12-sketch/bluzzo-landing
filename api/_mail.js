// Correos con Resend (https://resend.com). Variables en Vercel:
//   RESEND_API_KEY  -> clave de API de Resend (si falta, no se envía nada y todo sigue funcionando)
//   MAIL_FROM       -> remitente verificado, p. ej.  Bluzzo <pedidos@tudominio.com>
//   MAIL_BCC        -> (opcional) tu correo, para recibir copia de cada confirmación
const cfg = require('../config.json');
const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => 'S/ ' + (Number(n) % 1 ? Number(n).toFixed(2) : Number(n));

exports.ok = () => !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

exports.send = async ({ to, subject, html, bcc }) => {
  if (!exports.ok() || !to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.RESEND_API_KEY },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], bcc: bcc ? [bcc] : undefined, subject, html })
    });
    return r.ok;
  } catch (e) { return false; }
};

const wrap = (inner) => `<div style="background:#EEF2FF;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#031447">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden">
<div style="background:#0038FF;color:#fff;padding:26px 28px"><div style="font-size:30px;font-weight:700;letter-spacing:.02em">BLUZZO</div><div style="opacity:.85;font-size:13px">Tu idea sobre el blu</div></div>
<div style="padding:26px 28px;font-size:16px;line-height:1.6">${inner}</div></div>
<p style="text-align:center;font-size:12px;color:#51608F">Bluzzo · Lima, Perú · <a href="https://wa.me/${cfg.whatsapp}" style="color:#0038FF">WhatsApp</a></p></div>`;

exports.confirmacionPedido = (p) => {
  const prov = /provincia/i.test(p.zona || '');
  const fila = (a, b) => `<tr><td style="padding:7px 0;color:#51608F">${a}</td><td style="padding:7px 0;text-align:right;font-weight:700">${b}</td></tr>`;
  const html = wrap(`<h2 style="margin:0 0 6px;font-size:24px">¡Pago recibido, ${esc((p.nombre || '').split(' ')[0])}!</h2>
<p style="margin:0 0 18px">Tu notebook Bluzzo quedó reservado en el primer drop. Guarda este correo: tu referencia es <b>${esc(p.ref)}</b>.</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #E3E9FF;border-bottom:1px solid #E3E9FF">
${fila('Notebooks', esc(p.cantidad) + ' × ' + esc(cfg.producto))}${fila('Regalo', 'Bolígrafo de gel blanco por notebook')}${fila('Envío', esc(p.zona))}${p.descuento ? fila('Descuento', '− ' + money(p.descuento)) : ''}${fila('Total pagado', money(p.total))}${fila('Entrega estimada', esc(cfg.entrega))}</table>
<p style="margin:18px 0 6px"><b>Datos de entrega</b></p>
<p style="margin:0 0 18px;color:#2B3A66">${esc(p.nombre)} · ${esc(p.celular)}<br>${esc(p.direccion)}${p.ciudad ? ', ' + esc(p.ciudad) : ''}${prov ? '<br><i>Envío a provincia únicamente por la agencia Shalom.</i>' : ''}</p>
<p style="margin:0 0 18px"><a href="${BASE}/api/boleta?ref=${encodeURIComponent(p.ref)}&t=${exports.firma('boleta:' + p.ref)}" style="color:#0038FF;font-weight:700">Descargar tu comprobante (PDF)</a></p>
<p style="margin:0 0 18px">Te escribiremos por WhatsApp para confirmar tu dirección y avisarte cuando tu pedido esté listo para salir.</p>
<a href="https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent('Hola, pagué mi Bluzzo. Referencia: ' + p.ref)}" style="display:inline-block;background:#0038FF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:99px;font-weight:700">Escribir por WhatsApp</a>`);
  return { subject: 'Tu reserva Bluzzo está confirmada · ' + p.ref, html };
};

exports.confirmacionEspera = () => ({
  subject: 'Te anotamos en la lista de espera de Bluzzo',
  html: wrap(`<h2 style="margin:0 0 6px;font-size:24px">¡Listo, estás en la lista!</h2>
<p style="margin:0">Te avisaremos a este correo antes que a nadie cuando abramos el próximo drop del Bluzzo Blueprint Notebook.</p>`)
});

exports.wrapPublic = (inner) => wrap(inner);

// ---- Boletín: bienvenida y avisos masivos, con enlace de baja ----
const crypto = require('crypto');
const BASE = (cfg.siteUrl || 'https://bluzzo-toketap.vercel.app').replace(/\/$/, '');
const firma = (c) => crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_KEY || 'x').update(String(c).toLowerCase()).digest('hex').slice(0, 32);
exports.firma = firma;
exports.bajaUrl = (c) => BASE + '/api/baja?c=' + encodeURIComponent(c) + '&t=' + firma(c);
const pie = (c) => `<p style="text-align:center;font-size:12px;color:#51608F;margin:6px 0 0">Recibes este correo porque te suscribiste en Bluzzo. <a href="${exports.bajaUrl(c)}" style="color:#51608F">Darme de baja</a></p>`;

exports.bienvenida = (c) => ({
  subject: 'Bienvenido a Bluzzo',
  html: wrap(`<h2 style="margin:0 0 6px;font-size:24px">¡Ya eres parte de Bluzzo!</h2>
<p style="margin:0 0 14px">Gracias por suscribirte. Te escribiremos cuando abramos un nuevo drop, haya novedades o promociones, y para el sorteo mensual de <b>@bluzzo.pe</b>.</p>
<a href="${BASE}/notebook" style="display:inline-block;background:#0038FF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:99px;font-weight:700">Ver el notebook</a>`) + pie(c)
});

exports.novedad = (c, mensaje, cta) => ({
  html: wrap(String(mensaje).split(/\n{2,}/).map((p) => '<p style="margin:0 0 14px">' + esc(p).replace(/\n/g, '<br>') + '</p>').join('') +
    `<a href="${BASE}${cta || '/notebook'}" style="display:inline-block;background:#0038FF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:99px;font-weight:700">Ver el notebook</a>`) + pie(c)
});

// Envío por lotes (Resend /emails/batch, hasta 100 por llamada)
exports.lote = async (items) => {
  if (!exports.ok()) return { enviados: 0, fallidos: items.length, sinConfig: true };
  let ok = 0, mal = 0;
  for (let i = 0; i < items.length; i += 100) {
    const parte = items.slice(i, i + 100);
    try {
      const r = await fetch('https://api.resend.com/emails/batch', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.RESEND_API_KEY }, body: JSON.stringify(parte.map((x) => ({ from: process.env.MAIL_FROM, to: [x.to], subject: x.subject, html: x.html, headers: { 'List-Unsubscribe': '<' + exports.bajaUrl(x.to) + '>' } }))) });
      if (r.ok) ok += parte.length; else mal += parte.length;
    } catch (e) { mal += parte.length; }
  }
  return { enviados: ok, fallidos: mal };
};
