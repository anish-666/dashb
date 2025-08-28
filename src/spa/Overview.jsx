import { useEffect, useState } from "react";

const FN = (p) => `/.netlify/functions/${p}`;
const token = () => localStorage.getItem("token") || "";

function Metric({ label, value }) {
  return (
    <div style={{background:"#fff",border:"1px solid #eee",borderRadius:8,padding:18,minWidth:220}}>
      <div style={{color:"#555"}}>{label}</div>
      <div style={{fontSize:32,fontWeight:600}}>{value}</div>
    </div>
  );
}

function LineChart({ data, width=1200, height=220, pad=28 }) {
  if (!data || data.length === 0) return <div style={{color:"#777"}}>No data</div>;
  const xs = data.map((_, i) => i);
  const ys = data.map(d => Number(d.total || 0));
  const maxY = Math.max(1, ...ys);
  const minY = 0;

  const xToPx = (x) => pad + (x*(width-2*pad))/(Math.max(1,xs.length-1));
  const yToPx = (y) => height - pad - ((y-minY)*(height-2*pad))/(maxY-minY || 1);

  const points = ys.map((y,i)=>`${xToPx(i)},${yToPx(y)}`).join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{background:"#fafafa",border:"1px solid #eee",borderRadius:8}}>
      {/* axes */}
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="#ddd"/>
      <line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke="#ddd"/>
      {/* path */}
      <polyline fill="none" stroke="#000" strokeWidth="2" points={points}/>
      {/* dots */}
      {ys.map((y,i)=>(
        <circle key={i} cx={xToPx(i)} cy={yToPx(y)} r="3" fill="#000"/>
      ))}
      {/* labels (first/last date) */}
      <text x={pad} y={height-8} fontSize="10" fill="#777">{data[0]?.day}</text>
      <text x={width-pad-4} y={height-8} fontSize="10" fill="#777" textAnchor="end">{data[data.length-1]?.day}</text>
    </svg>
  );
}

export default function Overview() {
  const [summary, setSummary] = useState({ total_calls: 0, connected: 0, avg_duration: 0 });
  const [series, setSeries] = useState([]);

  useEffect(() => {
    const h = { Authorization: `Bearer ${token()}` };
    fetch(FN("analytics-summary"), { headers: h })
      .then(r => r.json()).then(setSummary).catch(()=>{});
    fetch(FN("analytics-timeseries?window=7d"), { headers: h })
      .then(r => r.json()).then(setSeries).catch(()=>{});
  }, []);

  return (
    <div style={{padding:"16px 24px"}}>
      <h2 style={{fontSize:28, fontWeight:700, margin:"12px 0 16px"}}>Overview</h2>

      <div style={{display:"flex", gap:16, flexWrap:"wrap", marginBottom:24}}>
        <Metric label="Total Calls" value={summary.total_calls ?? 0} />
        <Metric label="Connected" value={summary.connected ?? 0} />
        <Metric label="Avg Duration (s)" value={summary.avg_duration ?? 0} />
      </div>

      <h3 style={{margin:"16px 0"}}>Last 7 days</h3>
      <LineChart data={series} />
    </div>
  );
}
