const db = require('../lib/db.js');
const auth = require('../lib/auth.js');
const { withCors } = require('../lib/cors.js');
const bolna = require('../lib/bolna.js');
const { randomUUID } = require('crypto');

module.exports.handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }
  const a = auth.requireAuth(event);
  if (!a.ok) return { statusCode: a.status || 401, body: JSON.stringify({ error: a.error }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const numbers = Array.isArray(body.numbers) ? body.numbers : [];
    if (numbers.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'numbers_required' }) };
    }

    const tenant = a.tenant_id;
    const agentId = body.agentId || process.env.BOLNA_AGENT_ID;

    const created = [];
    const provider = [];

    for (const phone of numbers) {
      const id = randomUUID();
      created.push(id);

      // Insert into calls (schema provided by user)
      await db`
        INSERT INTO calls (id, tenant_id, agent_id, provider_agent_id, phone, direction, status, started_at, duration_sec)
        VALUES (${id}, ${tenant}, ${agentId}, ${agentId}, ${phone}, 'outbound', 'created', NOW(), 0)
      `;

      // Hit Bolna provider
      let pr = await bolna.startCall(agentId, phone);
      provider.push({ phone, ok: pr.ok, status: pr.status, body: pr.body || null });

      // Update provider_call_id / status if any id returned
      try {
        const provider_call_id = pr.body?.id || pr.body?.call_id || null;
        const status = pr.ok ? 'requested' : `error_${pr.status}`;
        await db`
          UPDATE calls
          SET provider_call_id = ${provider_call_id}, status = ${status}
          WHERE id = ${id}
        `;
      } catch {}
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, created_count: created.length, created, provider }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
});
