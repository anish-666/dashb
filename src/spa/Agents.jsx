import React, { useEffect, useState } from 'react'
const BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions'

export default function Agents({ token }){
  const [agents, setAgents] = useState([])
  const [err, setErr] = useState('')

  async function load(refresh=false){
    setErr('')
    try {
      const url = `${BASE}/agents${refresh ? '?refresh=1' : ''}`
      const res = await fetch(url, { headers:{ Authorization:`Bearer ${token}` }})
      if (!res.ok) throw new Error(await res.text())
      setAgents(await res.json())
    } catch(e){ setErr(String(e)) }
  }
  useEffect(()=>{ load(false) },[token])

  return (
    <div style={{padding:16}}>
      <h3>Agents</h3>
      <div style={{marginBottom:8}}>
        <button onClick={()=>load(true)}>Refresh from Bolna</button>
      </div>
      {err && <pre style={{color:'crimson'}}>{err}</pre>}
      <table border="1" cellPadding="6" style={{borderCollapse:'collapse', width:'100%'}}>
        <thead><tr><th>Name</th><th>Provider Agent ID</th><th>Active</th></tr></thead>
        <tbody>
          {agents.map(a => (
            <tr key={a.id}><td>{a.name}</td><td>{a.provider_agent_id}</td><td>{String(a.active)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
