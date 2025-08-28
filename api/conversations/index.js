const db = require('../../lib/db.js');
const auth = require('../../lib/auth.js');
const { withCors } = require('../../lib/cors.js');

async function ensureTable() {
  await db`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      agent_id TEXT,
      customer_number TEXT,
      status TEXT,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      duration_seconds INT DEFAULT 0
    )
  `;
}

module.exports.handler = withCors(async (event) => {
  const a = auth.requireAuth(event);
  if (!a.ok) return { statusCode: a.status || 401, body: JSON.stringify({ error: a.error }) };
  const tenant = a.tenant_id;

  await ensureTable();

  if (event.httpMethod === 'GET') {
    const rows = await db`
      SELECT id, tenant_id, agent_id, customer_number, status, started_at, duration_seconds
      FROM conversations
      WHERE tenant_id = ${tenant}
      ORDER BY started_at DESC
      LIMIT 200
    `;
    return { statusCode: 200, body: JSON.stringify(rows) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
});
