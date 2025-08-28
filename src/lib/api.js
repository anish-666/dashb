const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function authHeader() {
  const t = localStorage.getItem('token');
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

async function http(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...authHeader()
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

export const api = {
  login: (email, password) =>
    fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(r => r.json()),

  summary: () => http('/analytics/summary'),
  timeseries: (w='7d') => http('/analytics/timeseries?window=' + encodeURIComponent(w)),
  agents: (refresh=false) => http('/agents' + (refresh ? '?refresh=1':'')),
  outbound: (numbers, agentId) => http('/calls/outbound', { method: 'POST', body: JSON.stringify({ numbers, agentId }) }),
  conversations: () => http('/conversations'),
  status: () => http('/status'),
  debug: () => http('/debug-health')
}