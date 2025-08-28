
const { withCors, json } = require('../lib/cors.js');
const auth = require('../lib/auth.js');
const sql = require('../lib/db.js');
const bolna = require('../lib/bolna.js');

module.exports.handler = withCors(async (event) => {
  const isRefresh = event.queryStringParameters && event.queryStringParameters.refresh;
  const admin = auth.requireAdmin(event);
  let tenant_id;

  if (admin.ok) {
    tenant_id = 't_demo'; // default tenant for admin probes
  } else {
    const a = auth.requireAuth(event);
    if (!a.ok) return json(a.status || 401, { error: a.error });
    tenant_id = a.tenant_id;
  }

  if (isRefresh) {
    const r = await bolna.listAgents();
    if (!r.ok) return json(r.status || 500, { ok: false, error: 'bolna_list_failed', body: r.body });
    const agents = Array.isArray(r.body) ? r.body : [];
    for (const ag of agents) {
      const provider_id = ag.id || ag.agent_id || ag.agentId;
      const name = ag.agent_name || ag.name || (`Agent ${provider_id}`);
      if (!provider_id) continue;
      await sql`
        insert into agents (id, tenant_id, name, provider_agent_id, active)
        values (${`agent_${provider_id}`}, ${tenant_id}, ${name}, ${provider_id}, true)
        on conflict (id) do update set
          tenant_id = excluded.tenant_id,
          name = excluded.name,
          provider_agent_id = excluded.provider_agent_id,
          active = excluded.active
      `;
    }
  }

  const rows = await sql`
    select id, tenant_id, name, provider_agent_id, coalesce(active,true) as active
    from agents
    where tenant_id = ${tenant_id}
    order by name asc
  `;
  return json(200, rows);
});
