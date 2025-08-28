const API = 'https://api.bolna.ai';

async function bolna(path, init = {}) {
  const apiKey = process.env.BOLNA_API_KEY;
  if (!apiKey) throw new Error('BOLNA_API_KEY missing');
  const headers = Object.assign(
    { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    init.headers || {}
  );
  const res = await fetch(`${API}${path}`, { ...init, headers });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { ok: res.ok, status: res.status, body };
}

async function listAgents() {
  return bolna('/agent/all', { method: 'GET' });
}

// According to docs: POST /call with { agent_id, recipient_phone_number }
async function startCall(agent_id, recipient_phone_number) {
  return bolna('/call', {
    method: 'POST',
    body: JSON.stringify({ agent_id, recipient_phone_number })
  });
}

module.exports = { bolna, listAgents, startCall };
