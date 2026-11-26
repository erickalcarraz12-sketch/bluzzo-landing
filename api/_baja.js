// Darse de baja del boletín (enlace firmado que va en cada correo)
const db = require('./_db');
const mail = require('./_mail');
const pagina = (t, p) => '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Bluzzo</title><body style="font-family:Arial,sans-serif;background:#EEF2FF;color:#031447;display:grid;place-items:center;min-height:100vh;margin:0"><div style="background:#fff;border-radius:18px;padding:32px;max-width:420px;text-align:center"><h2 style="margin:0 0 10px">' + t + '</h2><p style="margin:0 0 18px">' + p + '</p><a href="/" style="color:#0038FF;font-weight:700">Volver a Bluzzo</a></div></body>';
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const c = String((req.query && req.query.c) || '').toLowerCase().slice(0, 120), t = String((req.query && req.query.t) || '');
  if (!c || t !== mail.firma(c)) return res.status(400).send(pagina('Enlace no válido', 'Escríbenos por WhatsApp y te damos de baja.'));
  try {
    await db.q('bluzzo_bajas?on_conflict=correo', { method: 'POST', prefer: 'resolution=ignore-duplicates,return=minimal', body: { correo: c } });
    res.status(200).send(pagina('Listo, te diste de baja', 'Ya no recibirás novedades ni promociones de Bluzzo.'));
  } catch (e) { res.status(500).send(pagina('No pudimos procesarlo', 'Inténtalo de nuevo en un momento.')); }
};
