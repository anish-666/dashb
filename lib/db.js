const postgres = require('postgres');

let client;
function db() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL missing');
    client = postgres(url, { prepare: true, max: 1 });
  }
  return client;
}

module.exports = db();
