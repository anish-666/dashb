import React, { useState } from 'react'
const BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions'

export default function Outbound({ token }){
  const [agentId, setAgentId] = useState('')
  const [numbers, setNumbers] = useState('+919000000000')
  const [resp, setResp] = useState(null)
  const [err, setErr] = useState('')

  async function start(){
    setErr(''); setResp(null)
    try{
      const nums = numbers.split(/[\s,\n]+/).map(s=>s.trim()).filter(Boolean)
      const body = { numbers: nums }
      if (agentId) body.agentId = agentId
      const res = await fetch(`${BASE}/calls-outbound`, {
        method:'POST',
        headers:{ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const txt = await res.text()
      if (!res.ok) throw new Error(txt)
      setResp(JSON.parse(txt))
    }catch(e){ setErr(String(e)) }
  }

  return (
    <div style={{padding:16}}>
      <h3>Outbound Call</h3>
      <div style={{display:'grid', gap:8, maxWidth:520}}>
        <label>Agent ID (optional)</label>
        <input value={agentId} onChange={e=>setAgentId(e.target.value)} />
        <label>Numbers (comma or newline separated)</label>
        <textarea rows="4" value={numbers} onChange={e=>setNumbers(e.target.value)} />
        <button onClick={start}>Start</button>
      </div>
      {err && <pre style={{color:'crimson'}}>{err}</pre>}
      {resp && <pre style={{background:'#fafafa', padding:12, border:'1px solid #eee', marginTop:12}}>{JSON.stringify(resp,null,2)}</pre>}
    </div>
  )
}
