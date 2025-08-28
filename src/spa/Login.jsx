import React, { useState } from 'react'

const BASE = import.meta.env.VITE_API_BASE || '/.netlify/functions'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  async function onSubmit(e){
    e.preventDefault()
    setErr('')
    const res = await fetch(`${BASE}/auth-login`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) { setErr('Invalid credentials'); return }
    const data = await res.json()
    window.dispatchEvent(new CustomEvent('auth', { detail:{ token: data.token }}))
  }

  return (
    <div style={{maxWidth:360, margin:'10vh auto', border:'1px solid #eee', padding:20, borderRadius:8}}>
      <h2>Sign in</h2>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%', padding:8, margin:'6px 0 12px 0'}} />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%', padding:8, margin:'6px 0 12px 0'}} />
        {err && <div style={{color:'crimson', marginBottom:8}}>{err}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
