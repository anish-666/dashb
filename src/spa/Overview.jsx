import React, { useEffect, useState } from 'react'
const BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions'

export default function Overview({ token }){
  const [summary, setSummary] = useState(null)
  const [series, setSeries] = useState([])
  const [err, setErr] = useState('')

  useEffect(()=>{
    ;(async ()=>{
      try {
        const s = await fetch(`${BASE}/analytics-summary`, { headers:{ Authorization:`Bearer ${token}` } })
        if (!s.ok) throw new Error(await s.text())
        setSummary(await s.json())
        const t = await fetch(`${BASE}/analytics-timeseries?window=7d`, { headers:{ Authorization:`Bearer ${token}` } })
        if (!t.ok) throw new Error(await t.text())
        setSeries(await t.json())
      } catch (e) { setErr(String(e)) }
    })()
  },[token])

  return (
    <div style={{padding:16}}>
      <h3>Overview</h3>
      {err && <pre style={{color:'crimson'}}>{err}</pre>}
      {summary && (
        <div style={{display:'flex', gap:16}}>
          <Card title="Total Calls" value={summary.total_calls} />
          <Card title="Connected" value={summary.connected} />
          <Card title="Avg Duration (s)" value={summary.avg_duration} />
        </div>
      )}
      <div style={{marginTop:16}}>
        <h4>Last 7 days</h4>
        <pre style={{background:'#fafafa', padding:12, border:'1px solid #eee'}}>{JSON.stringify(series,null,2)}</pre>
      </div>
    </div>
  )
}

function Card({title, value}){
  return (
    <div style={{border:'1px solid #eee', padding:12, borderRadius:8, minWidth:140}}>
      <div style={{opacity:.7}}>{title}</div>
      <div style={{fontSize:24}}>{value}</div>
    </div>
  )
}
