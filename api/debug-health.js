const db = require('../lib/db.js');
const { withCors } = require('../lib/cors.js');

module.exports.handler = withCors(async () => {
  let dbOk = false;
  try {
    await db`select 1`;
    dbOk = true;
  } catch (e) {
    dbOk = false;
  }
  const flags = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    BOLNA_API_KEY: !!process.env.BOLNA_API_KEY,
    BOLNA_AGENT_ID: !!process.env.BOLNA_AGENT_ID,
    PUBLIC_SITE_URL: !!process.env.PUBLIC_SITE_URL,
    OUTBOUND_CALLER_ID: !!process.env.OUTBOUND_CALLER_ID,
    DEMO_USERS: !!process.env.DEMO_USERS
  };
  return { statusCode: 200, body: JSON.stringify({ ok: true, env: flags, dbOk }) };
});
