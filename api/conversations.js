
const { withCors, json } = require('../lib/cors.js');
const auth = require('../lib/auth.js');
const sql = require('../lib/db.js');

// For this version, we proxy recent calls as "conversations"
module.exports.handler = withCors(async (event) => {
  const a = auth.requireAuth(event);
  if (!a.ok) return json(a.status || 401, { error: a.error });
  const tenant = a.tenant_id;

  const rows = await sql`
    select id, phone, status, summary, recording_url, started_at, ended_at, duration_sec, provider_call_id, agent_id
    from calls
    where tenant_id = ${tenant}
    order by started_at desc
    limit 200
  `;
  return json(200, rows);
});
