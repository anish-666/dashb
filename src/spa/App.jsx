import React, { useEffect, useState } from 'react'
import Login from './Login.jsx'
import Overview from './Overview.jsx'
import Agents from './Agents.jsx'
import Outbound from './Outbound.jsx'

function getToken() { return localStorage.getItem('token') }
function setToken(t) { localStorage.setItem('token', t) }

export default function App(){
  const [token, setTok] = useState(getToken())
  useEffect(()=>{
    const h = e => {
      if (e.detail?.token) { setTok(e.detail.token); setToken(e.detail.token) }
      if (e.detail?.logout) { setTok(null); localStorage.removeItem('token') }
    }
    window.addEventListener('auth', h)
    return ()=>window.removeEventListener('auth', h)
  },[])

  if (!token) return <Login />
  return (
    <div style={{fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'}}>
      <div style={{display:'flex', gap:12, padding:12, borderBottom:'1px solid #eee'}}>
        <b>Docvai</b>
        <a href="#" onClick={()=>location.hash='#overview'}>Overview</a>
        <a href="#" onClick={()=>location.hash='#agents'}>Agents</a>
        <a href="#" onClick={()=>location.hash='#outbound'}>Outbound</a>
        <span style={{marginLeft:'auto'}}>
          <button onClick={()=>window.dispatchEvent(new CustomEvent('auth',{detail:{logout:true}}))}>Logout</button>
        </span>
      </div>
      {location.hash === '#agents' ? <Agents token={token}/> :
       location.hash === '#outbound' ? <Outbound token={token}/> :
       <Overview token={token}/>}
    </div>
  )
}
