const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const { withCors } = require('../lib/cors.js');

module.exports.handler = withCors(async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }
  const a = auth.requireAuth(event);
  if (!a.ok) return { statusCode: a.status || 401, body: JSON.stringify({ error: a.error }) };

  const tenant = a.tenant_id;
  const window = (event.queryStringParameters?.window || '7d').toLowerCase();
  const span = window === '30d' ? "interval '30 days'" : "interval '7 days'";

  try {
    const rows = await db`
      SELECT
        date_trunc('day', started_at) AS day,
        COUNT(*)::int AS total,
        COALESCE(AVG(duration_sec),0)::int AS avg_duration
      FROM calls
      WHERE tenant_id = ${tenant}
        AND started_at >= NOW() - ${db.unsafe(span)}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    const out = rows.map(r => ({
      day: r.day.toISOString().slice(0,10),
      total: r.total,
      avg_duration: r.avg_duration
    }));
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
});
