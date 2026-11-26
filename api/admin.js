// Panel de pedidos. Variables en Vercel: ADMIN_PASSWORD y SUPABASE_SERVICE_KEY.
const crypto = require('crypto'); const cfg = require('../config.json'); const db = require('./_db');
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !db.ok()) return res.status(501).json({ error: 'no_configurado' });
  if (!igual(req.headers['x-admin-key'] || '', pw)) return res.status(401).json({ error: 'clave' });
  try {
    if (req.method === 'GET') {
      const [pedidos, espera, codigos, subs] = await Promise.all([
        db.q('bluzzo_pedidos?select=*&order=created_at.desc&limit=500'),
        db.q('bluzzo_espera?select=*&order=created_at.desc&limit=500'),
        db.q('bluzzo_codigos?select=*&order=created_at.desc'),
        db.q('bluzzo_suscriptores?select=*&order=created_at.desc&limit=1000').catch(() => [])
      ]);
      const vivos = pedidos.filter(p => p.estado !== 'cancelado');
      return res.status(200).json({
        pedidos, espera, codigos, suscriptores: subs,
        resumen: { pedidos: vivos.length, libros: vivos.reduce((a, p) => a + p.cantidad, 0), total: vivos.reduce((a, p) => a + Number(p.total), 0), cupos: cfg.cuposTotal }
      });
    }
    if (req.method === 'POST') {
      const b = db.body(req);
      if (b.accion === 'estado') {
        if (!['pagado', 'enviado', 'entregado', 'cancelado'].includes(b.estado)) return res.status(400).json({ error: 'estado' });
        await db.q('bluzzo_pedidos?id=eq.' + encodeURIComponent(db.txt(b.id, 50)), { method: 'PATCH', prefer: 'return=minimal', body: { estado: b.estado } });
        return res.status(200).json({ ok: true });
      }
      if (b.accion === 'codigo') {
        const codigo = db.txt(b.codigo, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        const valor = Number(b.valor);
        if (!codigo || !(valor > 0) || !['porcentaje', 'monto'].includes(b.tipo)) return res.status(400).json({ error: 'datos' });
        if (b.tipo === 'porcentaje' && valor > 100) return res.status(400).json({ error: 'datos' });
        await db.q('bluzzo_codigos?on_conflict=codigo', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
          body: { codigo, tipo: b.tipo, valor, activo: true, max_usos: b.max_usos ? parseInt(b.max_usos, 10) : null, vence: b.vence || null } });
        return res.status(200).json({ ok: true });
      }
      if (b.accion === 'codigo_activo') {
        await db.q('bluzzo_codigos?codigo=eq.' + encodeURIComponent(db.txt(b.codigo, 30)), { method: 'PATCH', prefer: 'return=minimal', body: { activo: !!b.activo } });
        return res.status(200).json({ ok: true });
      }
    }
    res.status(400).json({ error: 'accion' });
  } catch (e) { res.status(500).json({ error: 'db' }); }
};
