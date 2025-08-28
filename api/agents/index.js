const db = require('../../lib/db.js');
const auth = require('../../lib/auth.js');
const { withCors } = require('../../lib/cors.js');
const bolna = require('../../lib/bolna.js');

async function ensureAgentsTable() {
  await db`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT,
      provider_agent_id TEXT,
      active BOOLEAN DEFAULT TRUE
    )
  `;
}

module.exports.handler = withCors(async (event) => {
  const a = auth.requireAuth(event);
  if (!a.ok) return { statusCode: a.status || 401, body: JSON.stringify({ error: a.error }) };
  const tenant = a.tenant_id;

  if (event.httpMethod === 'GET') {
    try {
      await ensureAgentsTable();

      // Optional refresh from Bolna
      const refresh = event.queryStringParameters?.refresh;
      if (refresh === '1' || refresh === 'true') {
        const resp = await bolna.listAgents();
        if (resp.ok && Array.isArray(resp.body)) {
          for (const ag of resp.body) {
            const pid = ag.id;
            const name = ag.agent_name || `Agent ${pid}`;
            await db`
              INSERT INTO agents (id, tenant_id, name, provider_agent_id, active)
              VALUES (${`agent_${pid}`}, ${tenant}, ${name}, ${pid}, TRUE)
              ON CONFLICT (id) DO UPDATE SET
                tenant_id = EXCLUDED.tenant_id,
                name = EXCLUDED.name,
                provider_agent_id = EXCLUDED.provider_agent_id,
                active = EXCLUDED.active
            `;
          }
        }
      }

      const rows = await db`
        SELECT id, tenant_id, name, provider_agent_id, active
        FROM agents
        WHERE tenant_id = ${tenant}
        ORDER BY name
      `;
      return { statusCode: 200, body: JSON.stringify(rows) };
    } catch (e) {
      console.error(e);
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
});
