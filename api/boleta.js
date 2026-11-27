// Comprobante de reserva en PDF (enlace firmado: /api/boleta?ref=...&t=...)
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const db = require('./_db');
const mail = require('./_mail');
const cfg = require('../config.json');

const AZUL = '#0038FF', MARINO = '#031447', GRIS = '#51608F', CLARO = '#EEF2FF', LINEA = '#D5DEFA';
const s = (n) => 'S/ ' + Number(n).toFixed(2);
const fecha = (d) => new Date(d).toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const firmaBoleta = (ref) => mail.firma('boleta:' + ref);

function pdf(p) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: 'Comprobante de reserva ' + p.ref, Author: 'Bluzzo' } });
    const bufs = []; doc.on('data', (b) => bufs.push(b)); doc.on('end', () => resolve(Buffer.concat(bufs)));
    const W = doc.page.width, M = 48;

    // Cabecera azul con cuadrícula tipo plano
    doc.rect(0, 0, W, 150).fill(AZUL);
    doc.save().strokeColor('#ffffff').opacity(0.1).lineWidth(0.6);
    for (let x = 0; x <= W; x += 24) doc.moveTo(x, 0).lineTo(x, 150).stroke();
    for (let y = 0; y <= 150; y += 24) doc.moveTo(0, y).lineTo(W, y).stroke();
    doc.restore();
    try { doc.image(path.join(__dirname, '..', 'img', 'logo.png'), M, 40, { width: 150 }); } catch (e) { doc.fillColor('#fff').font('Helvetica-Bold').fontSize(30).text('BLUZZO', M, 44); }
    doc.fillColor('#ffffff');
    doc.font('Helvetica-Bold').fontSize(11).text('COMPROBANTE DE RESERVA', W - M - 220, 44, { width: 220, align: 'right' });
    doc.font('Helvetica-Bold').fontSize(20).text(p.ref, W - M - 220, 62, { width: 220, align: 'right' });
    doc.font('Helvetica').fontSize(9.5).opacity(0.9).text(fecha(p.created_at), W - M - 220, 92, { width: 220, align: 'right' }).opacity(1);

    // Etiqueta de pagado
    doc.roundedRect(W - M - 84, 112, 84, 22, 11).fill('#ffffff');
    doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(10).text('PAGADO', W - M - 84, 119, { width: 84, align: 'center' });

    // Datos
    let y = 180;
    const col = (x, w, tit, lines) => {
      doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(8.5).text(tit.toUpperCase(), x, y, { width: w, characterSpacing: 1 });
      doc.fillColor(MARINO).font('Helvetica-Bold').fontSize(11).text(lines[0], x, y + 14, { width: w });
      doc.fillColor(GRIS).font('Helvetica').fontSize(10);
      let yy = doc.y + 2; lines.slice(1).forEach((l) => { doc.text(l, x, yy, { width: w }); yy = doc.y + 1; });
      return yy;
    };
    const half = (W - 2 * M - 24) / 2;
    const e1 = col(M, half, 'Cliente', [p.nombre, p.email, 'Cel. ' + p.celular]);
    const e2 = col(M + half + 24, half, 'Entrega', [p.zona, (p.direccion || '') + (p.ciudad ? ', ' + p.ciudad : ''), 'Estimada: ' + (p.entrega || cfg.entrega)]);
    y = Math.max(e1, e2) + 22;

    // Tabla
    doc.roundedRect(M, y, W - 2 * M, 28, 8).fill(CLARO);
    doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(8.5);
    doc.text('DESCRIPCIÓN', M + 14, y + 10, { characterSpacing: 1 });
    doc.text('CANT.', W - M - 190, y + 10, { width: 50, align: 'center', characterSpacing: 1 });
    doc.text('IMPORTE', W - M - 110, y + 10, { width: 96, align: 'right', characterSpacing: 1 });
    y += 40;
    const com = Number(p.comision) || 0;
    const sub = Number(p.total) - Number(p.envio) + Number(p.descuento) - com;
    const fila = (a, b, c, d) => {
      doc.fillColor(MARINO).font('Helvetica-Bold').fontSize(11).text(a, M + 14, y, { width: W - 2 * M - 220 });
      const hh = doc.y;
      if (d) { doc.fillColor(GRIS).font('Helvetica').fontSize(9).text(d, M + 14, hh + 1, { width: W - 2 * M - 220 }); }
      const fin = doc.y;
      doc.fillColor(MARINO).font('Helvetica').fontSize(11).text(b, W - M - 190, y, { width: 50, align: 'center' }).text(c, W - M - 110, y, { width: 96, align: 'right' });
      y = fin + 12; doc.moveTo(M, y - 5).lineTo(W - M, y - 5).strokeColor(LINEA).lineWidth(0.6).stroke();
    };
    fila('Bluzzo Blueprint Notebook A5', String(p.cantidad), s(sub), 'Tapa dura azul · hojas lisas azul real · Drop ' + (p.drop_n || 1));
    fila('Bolígrafo de gel blanco', String(p.cantidad), 'Gratis', 'Regalo con tu notebook');
    if (Number(p.descuento) > 0) fila('Descuento' + (p.codigo ? ' (' + p.codigo + ')' : ''), '', '- ' + s(p.descuento));
    fila('Envío', '', s(p.envio), p.zona);
    if (com > 0) fila('Cargo por pago en línea', '', s(com), 'Comisión de la pasarela de pagos');

    // Total
    y += 6;
    doc.roundedRect(W - M - 230, y, 230, 52, 12).fill(AZUL);
    doc.fillColor('#ffffff').font('Helvetica').fontSize(10).text('TOTAL PAGADO', W - M - 214, y + 10);
    doc.font('Helvetica-Bold').fontSize(22).text(s(p.total), W - M - 214, y + 24, { width: 198, align: 'right' });
    doc.fillColor(GRIS).font('Helvetica').fontSize(9).text('Pago con tarjeta o Yape (Culqi)', M, y + 12).text('Operación: ' + (p.culqi_id || '—'), M, y + 26);
    y += 86;

    // Mensaje
    doc.roundedRect(M, y, W - 2 * M, 70, 12).fill(CLARO);
    doc.fillColor(MARINO).font('Helvetica-Bold').fontSize(12).text('Gracias por reservar tu Bluzzo.', M + 18, y + 14);
    doc.fillColor(GRIS).font('Helvetica').fontSize(10).text('Te escribiremos por WhatsApp para confirmar tu dirección y avisarte cuando tu pedido esté en camino. Sigue a @bluzzo.pe y sube una historia con tu Bluzzo para participar en el sorteo mensual.', M + 18, y + 32, { width: W - 2 * M - 36 });

    // Pie
    const pr = cfg.proveedor || {};
    doc.moveTo(M, 770).lineTo(W - M, 770).strokeColor(LINEA).lineWidth(0.6).stroke();
    doc.fillColor(GRIS).font('Helvetica').fontSize(8.5)
      .text((pr.nombre || 'Bluzzo') + (pr.ruc ? ' · RUC ' + pr.ruc : '') + ' · ' + (pr.direccion || 'Lima, Perú') + ' · @bluzzo.pe', M, 780, { width: W - 2 * M, align: 'center' })
      .text('Este documento es un comprobante de tu reserva y de tu pago. No reemplaza a la boleta de venta electrónica.', M, 794, { width: W - 2 * M, align: 'center' });
    doc.end();
  });
}

module.exports = async (req, res) => {
  const ref = String((req.query && req.query.ref) || '').toUpperCase().slice(0, 40), t = String((req.query && req.query.t) || '');
  if (!/^BLZ-[A-Z0-9]+$/.test(ref) || t !== firmaBoleta(ref)) { res.status(400).setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.send('Enlace no válido.'); }
  try {
    const r = await db.q('bluzzo_pedidos?select=*&ref=eq.' + encodeURIComponent(ref) + '&limit=1');
    if (!r || !r[0]) { res.status(404).setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.send('No encontramos este pedido.'); }
    const dr = await db.drop().catch(() => null);
    const buf = await pdf(Object.assign({ entrega: dr && dr.entrega }, r[0]));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Bluzzo-' + ref + '.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).send(buf);
  } catch (e) { res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8'); res.send('No pudimos generar el comprobante.'); }
};
module.exports.firmaBoleta = firmaBoleta;
