const { withCors } = require('../lib/cors.js');

module.exports.handler = withCors(async () => {
  return { statusCode: 200, body: JSON.stringify({ ok: true, ts: Date.now() }) };
});
