const { withCors } = require('../lib/cors.js');
const auth = require('../lib/auth.js');

module.exports.handler = withCors(async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }
  try {
    const { email, password } = JSON.parse(event.body || '{}');
    const users = auth.parseDemoUsers();
    const user = users[(email || '').toLowerCase()];
    if (!user || user.password !== password) {
      return { statusCode: 401, body: JSON.stringify({ error: 'invalid_credentials' }) };
    }
    const token = auth.issueToken(user.tenant_id, email);
    return { statusCode: 200, body: JSON.stringify({ token }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
});
