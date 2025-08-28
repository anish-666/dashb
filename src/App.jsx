import React, { useEffect, useState } from 'react'
import { api } from './lib/api'

function useAuth() {
  const [me, setMe] = useState(() => {
    const email = localStorage.getItem('email');
    const tenant = localStorage.getItem('tenant_id');
    const token = localStorage.getItem('token');
    return token ? { email, tenant_id: tenant, token } : null;
  });
  return { me, setMe };
}

const Nav = ({ onRoute, route }) => (
  <nav style={{display:'flex',gap:12, padding:12, borderBottom:'1px solid #eee'}}>
    {['overview','agents','outbound','conversations','settings'].map(r =>
      <a key={r} href="#" onClick={(e)=>{e.preventDefault();onRoute(r)}} style={{fontWeight: route===r ? 700 : 400}}>
        {r[0].toUpperCase()+r.slice(1)}
      </a>
    )}
    <div style={{marginLeft:'auto'}}><a href="#" onClick={(e)=>{e.preventDefault();localStorage.clear();location.reload()}}>Logout</a></div>
  </nav>
);

function Login({ setMe }) {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [err,setErr] = useState('');

  async function submit(e){
    e.preventDefault();
    setErr('');
    try {
      const res = await api.login(email,password);
      if (!res?.token) { setErr('Invalid credentials'); return; }
      localStorage.setItem('token', res.token);
      localStorage.setItem('email', res.email);
      localStorage.setItem('tenant_id', res.tenant_id);
      setMe({ email: res.email, tenant_id: res.tenant_id, token: res.token });
    } catch (e) {
      setErr('Login failed');
    }
  }

  return (
    <div style={{maxWidth:360, margin:'80px auto', padding:24, border:'1px solid #eee', borderRadius:8}}>
      <h2 style={{marginTop:0}}>Docvai Dashboard</h2>
      <form onSubmit={submit}>
        <div style={{display:'grid', gap:8}}>
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" />
          <label>Password</label>
          <input value={password} type="password" onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          {err && <div style={{color:'crimson'}}>{err}</div>}
          <button style={{marginTop:12}}>Sign in</button>
        </div>
      </form>
    </div>
  )
}

function Overview() {
  const [summary,setSummary] = useState(null);
  const [series,setSeries] = useState([]);
  const [err,setErr] = useState('');
  useEffect(()=>{
    (async()=>{
      try { setSummary(await api.summary()); } catch(e){ setErr('Summary failed'); }
      try { setSeries(await api.timeseries('7d')); } catch(e){}
    })();
  },[]);
  return (
    <div style={{padding:16}}>
      <h3>Overview</h3>
      {err && <div style={{color:'crimson'}}>{err}</div>}
      {summary && <div style={{display:'flex',gap:16}}>
        <Stat label="Total Calls" value={summary.total_calls} />
        <Stat label="Connected" value={summary.connected} />
        <Stat label="Avg Duration (s)" value={summary.avg_duration} />
      </div>}
      <div style={{marginTop:24}}>
        <h4>Last 7 days</h4>
        <div style={{display:'grid',gridTemplateColumns:'auto auto auto',gap:8,maxWidth:420}}>
          <div style={{fontWeight:700}}>Day</div><div style={{fontWeight:700}}>Total</div><div style={{fontWeight:700}}>Avg (s)</div>
          {series.map(s => <React.Fragment key={s.day}><div>{s.day}</div><div>{s.total}</div><div>{s.avg_duration}</div></React.Fragment>)}
        </div>
      </div>
    </div>
  )
}

const Stat = ({label,value}) => (
  <div style={{border:'1px solid #eee', padding:12, borderRadius:8}}>
    <div style={{fontSize:12,opacity:.7}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700}}>{value}</div>
  </div>
);

function Agents() {
  const [rows,setRows] = useState([]);
  const [err,setErr] = useState('');
  async function load(refresh=false){
    setErr('');
    try { setRows(await api.agents(refresh)); } catch(e){ setErr('Failed to load agents'); }
  }
  useEffect(()=>{ load(false) },[]);
  return (
    <div style={{padding:16}}>
      <h3>Agents</h3>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={()=>load(false)}>Refresh</button>
        <button onClick={()=>load(true)}>Pull from Bolna</button>
      </div>
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <table border="1" cellPadding="6" style={{borderCollapse:'collapse'}}>
        <thead><tr><th>Name</th><th>Provider Agent ID</th><th>Active</th></tr></thead>
        <tbody>
          {rows.map(r => <tr key={r.id}><td>{r.name}</td><td>{r.provider_agent_id}</td><td>{String(r.active)}</td></tr>)}
        </tbody>
      </table>
    </div>
  )
}

function Outbound() {
  const [numbers,setNumbers] = useState('');
  const [agentId,setAgentId] = useState('');
  const [res,setRes] = useState(null);
  const [err,setErr] = useState('');
  async function start(){
    setErr(''); setRes(null);
    const nums = numbers.split(/\s|,|;|\n/).map(s=>s.trim()).filter(Boolean);
    if (!nums.length) { setErr('Enter at least one phone number'); return; }
    try {
      const r = await api.outbound(nums, agentId || undefined);
      setRes(r);
    } catch (e) {
      setErr('Failed to create calls');
    }
  }
  return (
    <div style={{padding:16}}>
      <h3>Outbound</h3>
      <div style={{display:'grid',gap:8,maxWidth:520}}>
        <label>Agent ID (provider)</label>
        <input placeholder="leave blank to use default" value={agentId} onChange={e=>setAgentId(e.target.value)} />
        <label>Numbers (comma/space/newline separated)</label>
        <textarea rows="5" value={numbers} onChange={e=>setNumbers(e.target.value)} placeholder="+911234567890, +919876543210"></textarea>
        <button onClick={start}>Start</button>
      </div>
      {err && <div style={{color:'crimson',marginTop:12}}>{err}</div>}
      {res && <pre style={{marginTop:12,background:'#f7f7f7',padding:12,borderRadius:8}}>{JSON.stringify(res,null,2)}</pre>}
    </div>
  )
}

function Conversations() {
  const [rows,setRows] = useState([]);
  const [err,setErr] = useState('');
  useEffect(()=>{ (async()=>{ try{ setRows(await api.conversations()) }catch(e){ setErr('Failed to load') } })() },[]);
  return (
    <div style={{padding:16}}>
      <h3>Recent Calls</h3>
      {err && <div style={{color:'crimson'}}>{err}</div>}
      <table border="1" cellPadding="6" style={{borderCollapse:'collapse', width:'100%'}}>
        <thead><tr><th>Started</th><th>Phone</th><th>Status</th><th>Duration (s)</th><th>Recording</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.started_at).toLocaleString()}</td>
              <td>{r.phone}</td>
              <td>{r.status}</td>
              <td>{r.duration_sec}</td>
              <td>{r.recording_url ? <a href={r.recording_url} target="_blank">audio</a> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Settings() {
  const [status,setStatus] = useState(null);
  const [debug,setDebug] = useState(null);
  useEffect(()=>{
    (async()=>{
      try { setStatus(await api.status()); } catch {}
      try { setDebug(await api.debug()); } catch {}
    })();
  },[]);
  return (
    <div style={{padding:16}}>
      <h3>Settings</h3>
      <div>Webhook (if ever needed): <code>{(debug?.env?.PUBLIC_SITE_URL || location.origin) + '/api/webhooks/bolna'}</code></div>
      <div style={{display:'grid',gridTemplateColumns:'auto auto',gap:8, marginTop:12}}>
        <div>Site status</div><div>{status ? 'OK' : '...'}</div>
        {debug && Object.entries(debug.env || {}).map(([k,v]) => (<React.Fragment key={k}><div>{k}</div><div>{String(v)}</div></React.Fragment>))}
      </div>
    </div>
  )
}

export default function App(){
  const { me, setMe } = useAuth();
  const [route,setRoute] = useState('overview');
  useEffect(()=>{
    if (!me) document.title = 'Docvai Dashboard – Sign in';
    else document.title = 'Docvai Dashboard';
  },[me]);
  if (!me) return <Login setMe={setMe} />
  return (
    <div>
      <Nav route={route} onRoute={setRoute} />
      {route==='overview' && <Overview/>}
      {route==='agents' && <Agents/>}
      {route==='outbound' && <Outbound/>}
      {route==='conversations' && <Conversations/>}
      {route==='settings' && <Settings/>}
    </div>
  )
}