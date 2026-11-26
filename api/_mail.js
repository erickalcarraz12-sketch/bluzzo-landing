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
<p style="margin:0 0 18px">Te escribiremos por WhatsApp para confirmar tu dirección y avisarte cuando tu pedido esté listo para salir.</p>
<a href="https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent('Hola, pagué mi Bluzzo. Referencia: ' + p.ref)}" style="display:inline-block;background:#0038FF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:99px;font-weight:700">Escribir por WhatsApp</a>`);
  return { subject: 'Tu reserva Bluzzo está confirmada · ' + p.ref, html };
};

exports.confirmacionEspera = () => ({
  subject: 'Te anotamos en la lista de espera de Bluzzo',
  html: wrap(`<h2 style="margin:0 0 6px;font-size:24px">¡Listo, estás en la lista!</h2>
<p style="margin:0">Te avisaremos a este correo antes que a nadie cuando abramos el próximo drop del Bluzzo Blueprint Notebook.</p>`)
});
