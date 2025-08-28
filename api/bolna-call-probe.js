const bolna = require('../lib/bolna.js');
const { withCors } = require('../lib/cors.js');
const { requireAdmin } = require('../lib/auth.js');

module.exports.handler = withCors(async (event) => {
  const a = requireAdmin(event);
  if (!a.ok) return { statusCode: a.status || 401, body: JSON.stringify({ error: a.error }) };

  const qs = event.queryStringParameters || {};
  const agent = qs.agent;
  const to = qs.to;
  if (!agent || !to) {
    return { statusCode: 400, body: JSON.stringify({ error: 'agent_and_to_required' }) };
  }
  const attempts = [];
  const r = await bolna.startCall(agent, to);
  attempts.push({ path: '/call', payload: { agent_id: agent, recipient_phone_number: to }, status: r.status, ok: r.ok, body: r.body });
  return { statusCode: 200, body: JSON.stringify({ ok: r.ok, attempts }) };
});
