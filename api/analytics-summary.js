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
  try {
    const [{ total_calls }] = await db`
      SELECT COUNT(*)::int AS total_calls
      FROM calls
      WHERE tenant_id = ${tenant}
    `;

    const [{ connected }] = await db`
      SELECT COUNT(*)::int AS connected
      FROM calls
      WHERE tenant_id = ${tenant}
        AND (status ILIKE 'connected' OR status ILIKE 'completed' OR disposition ILIKE 'connected')
    `;

    const [{ avg_duration }] = await db`
      SELECT COALESCE(AVG(duration_sec),0)::int AS avg_duration
      FROM calls
      WHERE tenant_id = ${tenant}
    `;

    return { statusCode: 200, body: JSON.stringify({ total_calls, connected, avg_duration }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
});
