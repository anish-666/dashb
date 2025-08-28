const bolna = require('../lib/bolna.js');
const { withCors } = require('../lib/cors.js');
const { requireAdmin } = require('../lib/auth.js');

module.exports.handler = withCors(async (event) => {
  const a = requireAdmin(event);
  if (!a.ok) return { statusCode: a.status || 401, body: JSON.stringify({ error: a.error }) };

  const resp = await bolna.listAgents();
  return { statusCode: resp.ok ? 200 : 500, body: JSON.stringify(resp.body) };
});
