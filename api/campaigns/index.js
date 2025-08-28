const db = require('../../lib/db.js');
const auth = require('../../lib/auth.js');
const { withCors } = require('../../lib/cors.js');

async function ensureTable() {
  await db`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT,
      total INT DEFAULT 0,
      completed INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

const { randomUUID } = require('crypto');

module.exports.handler = withCors(async (event) => {
  const a = auth.requireAuth(event);
  if (!a.ok) return { statusCode: a.status || 401, body: JSON.stringify({ error: a.error }) };
  const tenant = a.tenant_id;

  await ensureTable();

  if (event.httpMethod === 'GET') {
    const rows = await db`
      SELECT id, tenant_id, name, status, total, completed, created_at
      FROM campaigns
      WHERE tenant_id = ${tenant}
      ORDER BY created_at DESC
    `;
    return { statusCode: 200, body: JSON.stringify(rows) };
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const name = (body.name || '').trim();
    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'name_required' }) };
    const id = randomUUID();
    await db`
      INSERT INTO campaigns (id, tenant_id, name, status, total, completed)
      VALUES (${id}, ${tenant}, ${name}, 'queued', 0, 0)
    `;
    return { statusCode: 200, body: JSON.stringify({ ok: true, id }) };
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
});
