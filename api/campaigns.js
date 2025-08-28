
const { withCors, json } = require('../lib/cors.js');
const auth = require('../lib/auth.js');
const sql = require('../lib/db.js');
const crypto = require('crypto');

module.exports.handler = withCors(async (event) => {
  const a = auth.requireAuth(event);
  if (!a.ok) return json(a.status || 401, { error: a.error });
  const tenant = a.tenant_id;

  if (event.httpMethod === 'GET') {
    const rows = await sql`
      select id, tenant_id, name, status, total, completed, created_at
      from campaigns
      where tenant_id = ${tenant}
      order by created_at desc
    `;
    return json(200, rows);
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'invalid_json' }); }
    const name = (body.name || '').trim();
    if (!name) return json(400, { error: 'name_required' });
    const id = crypto.randomUUID();
    await sql`
      insert into campaigns (id, tenant_id, name, status, total, completed)
      values (${id}, ${tenant}, ${name}, 'queued', 0, 0)
    `;
    return json(200, { ok: true, id });
  }

  return json(405, { error: 'method_not_allowed' });
});
