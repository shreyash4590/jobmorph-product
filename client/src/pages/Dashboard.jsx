import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, LineChart, Line, Tooltip, ReferenceLine,
} from 'recharts';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, TrendingUp, Trophy, Target, Clock,
  Sparkles, Flame, ArrowUp, ArrowDown,
  Minus, Lightbulb, Award, Calendar, FileText,
} from 'lucide-react';

/* ══ GLOBAL ANIMATION STYLES ══════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @keyframes confettiFall {
      0%   { transform: translateY(0) rotate(0deg);    opacity: 1; }
      100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
    }
    @keyframes floatA {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50%      { transform: translateY(-12px) rotate(8deg); }
    }
    @keyframes floatB {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      50%      { transform: translateY(-8px) rotate(-10deg); }
    }
    @keyframes floatC {
      0%,100% { transform: translateY(0px) scale(1); }
      50%      { transform: translateY(-10px) scale(1.08); }
    }
    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes spinSlowRev {
      from { transform: rotate(360deg); }
      to   { transform: rotate(0deg); }
    }
    @keyframes pulseRing {
      0%,100% { opacity: 0.12; transform: scale(1); }
      50%      { opacity: 0.22; transform: scale(1.06); }
    }
    @keyframes waveMove {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes driftDot {
      0%,100% { opacity: 0.18; }
      50%      { opacity: 0.35; }
    }
    @keyframes orbitA {
      from { transform: rotate(0deg) translateX(38px) rotate(0deg); }
      to   { transform: rotate(360deg) translateX(38px) rotate(-360deg); }
    }
    @keyframes orbitB {
      from { transform: rotate(180deg) translateX(52px) rotate(-180deg); }
      to   { transform: rotate(540deg) translateX(52px) rotate(-540deg); }
    }
    @keyframes twinkle {
      0%,100% { opacity: 0.15; transform: scale(1); }
      50%      { opacity: 0.6;  transform: scale(1.5); }
    }
    @keyframes slideStripe {
      from { background-position: 0 0; }
      to   { background-position: 28px 28px; }
    }
    @keyframes scanLine {
      0%   { top: 0%;   opacity: 0.5; }
      100% { top: 100%; opacity: 0; }
    }
    .card-lift { transition: transform 0.22s ease, box-shadow 0.22s ease; }
    .card-lift:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.09); }
  `}</style>
);

/* ══ DECORATIVE BACKGROUNDS ════════════════════════════════════ */
function BestMatchDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full"
        style={{ background:'radial-gradient(circle,#e91e8c33,transparent)', animation:'pulseRing 3.5s ease-in-out infinite' }}/>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full"
        style={{ background:'radial-gradient(circle,#7c3aed22,transparent)', animation:'pulseRing 4.2s ease-in-out infinite', animationDelay:'1.5s' }}/>
      <svg className="absolute top-3 right-3 opacity-[0.08]" width="90" height="90"
        style={{ animation:'spinSlow 12s linear infinite' }}>
        <defs><linearGradient id="bdg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e91e8c"/><stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient></defs>
        <circle cx="45" cy="45" r="40" fill="none" stroke="url(#bdg)" strokeWidth="1.5" strokeDasharray="8 5"/>
      </svg>
    </div>
  );
}

function LatestMatchDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <svg className="absolute top-2 right-2 opacity-[0.07]" width="70" height="70"
        style={{ animation:'floatA 5s ease-in-out infinite' }}>
        <path d="M35 4 L64 20 L64 52 L35 68 L6 52 L6 20 Z" fill="none" stroke="#e91e8c" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

function StatCardDecor({ type }) {
  if (type === 'scans') return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <svg className="absolute bottom-0 right-0 opacity-[0.05]" width="80" height="50">
        {[10,20,30,14,25,35,18].map((h,i)=>(
          <rect key={i} x={i*11+2} y={50-h} width="8" height={h} fill="#e91e8c" rx="2"/>
        ))}
      </svg>
    </div>
  );
  if (type === 'avg') return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.05]"
        style={{ background:'radial-gradient(circle,#8b5cf6,transparent)', animation:'pulseRing 4s ease-in-out infinite' }}/>
    </div>
  );
  return null;
}

function AchievementsDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-[0.04]"
        style={{ background:'radial-gradient(circle,#f59e0b,transparent)' }}/>
    </div>
  );
}

function ImprovementDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-[0.04]"
        style={{ background:'radial-gradient(circle,#7c3aed,transparent)' }}/>
    </div>
  );
}

function TrendDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute top-0 left-0 opacity-[0.04]" style={{ width:'200%', animation:'waveMove 8s linear infinite' }}>
        <svg width="800" height="60">
          <path d="M0,30 Q100,10 200,30 Q300,50 400,30 Q500,10 600,30 Q700,50 800,30" fill="none" stroke="#e91e8c" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
}

function HeatmapDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-[0.04]"
        style={{ background:'radial-gradient(circle,#10b981,transparent)', animation:'pulseRing 5s ease-in-out infinite' }}/>
    </div>
  );
}

function TopPerformersDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute inset-0 opacity-[0.025] rounded-2xl"
        style={{ backgroundImage:'repeating-linear-gradient(45deg,#7c3aed 0,#7c3aed 1px,transparent 0,transparent 50%)', backgroundSize:'14px 14px', animation:'slideStripe 3s linear infinite' }}/>
    </div>
  );
}

function RecentScansDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute -top-10 right-10 w-40 h-40 rounded-full opacity-[0.04]"
        style={{ background:'radial-gradient(circle,#e91e8c,transparent)', animation:'floatA 7s ease-in-out infinite' }}/>
    </div>
  );
}

function DistributionDecor() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full opacity-[0.04]"
        style={{ background:'radial-gradient(circle,#7c3aed,transparent)' }}/>
    </div>
  );
}

/* ══ HOOK ══════════════════════════════════════════════════════ */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

/* ══ CONFETTI ══════════════════════════════════════════════════ */
function ConfettiBurst({ trigger }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ['#e91e8c','#7c3aed','#10b981','#f59e0b','#ef4444','#3b82f6','#f97316'];
    setPieces(Array.from({ length: 80 }, (_, i) => ({
      id: i, x: Math.random()*100, delay: Math.random()*1.2,
      duration: 2.5+Math.random()*1.5,
      color: colors[Math.floor(Math.random()*colors.length)],
      size: 6+Math.random()*8, shape: Math.random()>0.5?'circle':'rect',
    })));
    const t = setTimeout(() => setPieces([]), 4500);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!pieces.length) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="absolute"
          style={{ left:`${p.x}%`,top:'-20px',width:p.size,height:p.size,background:p.color,
            borderRadius:p.shape==='circle'?'50%':'2px',
            animation:`confettiFall ${p.duration}s ${p.delay}s ease-in forwards` }}/>
      ))}
    </div>
  );
}

/* ══ SCORE GAUGE ════════════════════════════════════════════════ */
function ScoreGauge({ score, size=180 }) {
  const animScore=useCountUp(score);
  const cx=size/2,cy=size/2+10,r=size*0.38,startAngle=-210,totalAngle=240;
  const angle=startAngle+totalAngle*Math.min(Math.max(score,0),100)/100;
  const toRad=d=>d*Math.PI/180;
  const arcPath=(s,e,rad)=>{
    const p1={x:cx+rad*Math.cos(toRad(s)),y:cy+rad*Math.sin(toRad(s))};
    const p2={x:cx+rad*Math.cos(toRad(e)),y:cy+rad*Math.sin(toRad(e))};
    return `M ${p1.x} ${p1.y} A ${rad} ${rad} 0 ${e-s>180?1:0} 1 ${p2.x} ${p2.y}`;
  };
  const nx=cx+r*0.76*Math.cos(toRad(angle)),ny=cy+r*0.76*Math.sin(toRad(angle));
  const color=score>=75?'#10b981':score>=45?'#f59e0b':'#ef4444';
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size*0.72} viewBox={`0 0 ${size} ${size*0.72}`}>
        {[[-210,-150,'#ef4444'],[-150,-90,'#f59e0b'],[-90,-30,'#84cc16'],[-30,30,'#10b981']].map(([s,e,c],i)=>(
          <path key={i} d={arcPath(s,e,r)} fill="none" stroke={c} strokeWidth={8} strokeLinecap="round" opacity={0.2}/>
        ))}
        <path d={arcPath(-210,30,r)} fill="none" stroke="#e5e7eb" strokeWidth={8} strokeLinecap="round" opacity={0.35}/>
        <path d={arcPath(-210,angle,r)} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"
          style={{ transition:'all 1.2s cubic-bezier(0.4,0,0.2,1)',filter:`drop-shadow(0 0 6px ${color}55)` }}/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#374151" strokeWidth={2} strokeLinecap="round"
          style={{ transition:'all 1.2s cubic-bezier(0.4,0,0.2,1)' }}/>
        <circle cx={cx} cy={cy} r={5} fill="#374151"/><circle cx={cx} cy={cy} r={2.5} fill="white"/>
      </svg>
      <div className="flex flex-col items-center -mt-2">
        <span className="text-2xl font-black tabular-nums" style={{color}}>{animScore}%</span>
        <span className="text-xs text-gray-400 tracking-wide mt-0.5">MATCH SCORE</span>
      </div>
    </div>
  );
}

/* ══ TINY SPARKLINE ════════════════════════════════════════════ */
function TinySparkline({ data, color }) {
  if (!data||data.length<2) return null;
  const w=80,h=28,min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(' ');
  const last=data[data.length-1],ly=h-((last-min)/range)*h;
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={w} cy={ly} r={2.5} fill={color}/>
    </svg>
  );
}

/* ══ HERO BANNER ════════════════════════════════════════════════ */
const TAGLINES = [
  "Every scan is a step closer to your dream job.",
  "Your resume is your story — make it unforgettable.",
  "Keep refining. Keep improving. You've got this.",
  "The best match is just one tweak away.",
  "Consistency beats perfection. Scan. Learn. Grow.",
  "Today's effort is tomorrow's offer letter.",
  "Small improvements compound into big opportunities.",
];
function getGreeting() {
  const h=new Date().getHours();
  return h<12?'Good morning':h<17?'Good afternoon':'Good evening';
}
function HeroBanner({ userName, scanCount, bestScore, weekStreak }) {
  const tagline=TAGLINES[new Date().getDay()%TAGLINES.length];
  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ background:'linear-gradient(135deg,#e91e8c 0%,#9333ea 50%,#7c3aed 100%)',minHeight:120 }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-52 h-52 rounded-full opacity-20 animate-pulse"
          style={{ background:'radial-gradient(circle,#fff,transparent)',animationDuration:'3s' }}/>
      </div>
      <div className="relative z-10 px-4 sm:px-8 py-5 sm:py-6 flex flex-col gap-4">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1 hidden sm:block">
            {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1">
            {getGreeting()}, <span className="text-white/90">{userName}</span> 👋
          </h2>
          <p className="text-white/80 text-sm font-medium italic">{tagline}</p>
        </div>
        {/* <div className="flex flex-wrap gap-2">
          {[
            {label:'Total Scans', val:scanCount,        icon:<BarChart2 size={14} className="text-white/80"/>},
            {label:'Best Score',  val:`${bestScore}%`,  icon:<Trophy    size={14} className="text-white/80"/>},
            {label:'This Week',   val:weekStreak,        icon:<Flame     size={14} className="text-white/80"/>},
          ].map(s=>(
            <div key={s.label} className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
              {s.icon}
              <div><p className="text-white font-black text-sm leading-none">{s.val}</p><p className="text-white/60 text-xs">{s.label}</p></div>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
}

/* ══ ACHIEVEMENT BADGES ════════════════════════════════════════ */
const BADGES = [
  {id:'first', icon:'🎉',label:'First Scan',  desc:'Completed your first scan',   check:h=>h.length>=1},
  {id:'five',  icon:'📦',label:'5 Scans',      desc:'Completed 5 scans',           check:h=>h.length>=5},
  {id:'ten',   icon:'💼',label:'10 Scans',     desc:'Completed 10 scans',          check:h=>h.length>=10},
  {id:'s75',   icon:'⭐',label:'Good Match',   desc:'Scored 75% or above',         check:h=>h.some(s=>s.score>=75)},
  {id:'s90',   icon:'🔥',label:'Excellent',    desc:'Scored 90% or above',         check:h=>h.some(s=>s.score>=90)},
  {id:'s100',  icon:'💯',label:'Perfect',      desc:'Scored 100%',                 check:h=>h.some(s=>s.score>=100)},
  {id:'str',   icon:'⚡',label:'3-Day Streak', desc:'3 scans in one week',         check:h=>{const w=new Date();w.setDate(w.getDate()-7);return h.filter(s=>s.timestamp>=w).length>=3;}},
  {id:'imp',   icon:'📈',label:'Improver',     desc:'Beat your previous score',    check:h=>h.length>=2&&h[0].score>h[1].score},
  {id:'con',   icon:'🎯',label:'Consistent',   desc:'Last 5 scans above 60%',      check:h=>h.length>=5&&h.slice(0,5).every(s=>s.score>=60)},
];

function AchievementBadges({ history }) {
  const earned=BADGES.filter(b=>b.check(history)),locked=BADGES.filter(b=>!b.check(history));
  return (
    <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
      <AchievementsDecor/>
      <div className="relative z-10">
        <SectionHeading icon={Award}>Achievements</SectionHeading>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {earned.map(b=>(
            <div key={b.id} title={b.desc} className="flex flex-col items-center gap-1.5 w-12 sm:w-16 group cursor-default">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl border-2 border-violet-100 shadow-sm transition-all group-hover:scale-110"
                style={{background:'linear-gradient(135deg,#fce7f3,#ede9fe)'}}>{b.icon}</div>
              <p className="text-[10px] sm:text-xs font-bold text-gray-700 text-center leading-tight">{b.label}</p>
            </div>
          ))}
          {locked.map(b=>(
            <div key={b.id} title={`Locked: ${b.desc}`} className="flex flex-col items-center gap-1.5 w-12 sm:w-16 opacity-35 grayscale cursor-default">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl bg-gray-100 border-2 border-gray-200">{b.icon}</div>
              <p className="text-[10px] sm:text-xs text-gray-400 text-center leading-tight">{b.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">{earned.length} / {BADGES.length} badges earned</p>
      </div>
    </div>
  );
}

/* ══ IMPROVEMENT PANEL ═════════════════════════════════════════ */
function ImprovementPanel({ history }) {
  if (!history.length) return null;
  const last3=history.slice(0,3),avg3=Math.round(last3.reduce((a,c)=>a+c.score,0)/last3.length);
  const overall=Math.round(history.reduce((a,c)=>a+c.score,0)/history.length);
  const suggestions=[];
  if(avg3<60) suggestions.push({icon:'🔑',color:'red',title:'Low recent average',tip:`Your last ${last3.length} scans averaged ${avg3}%. Paste keywords directly from the JD into your resume's skills and summary.`});
  if(avg3>=60&&avg3<75) suggestions.push({icon:'📝',color:'amber',title:'Room to grow',tip:`Averaging ${avg3}% recently. Quantify achievements and match the exact phrasing in JDs.`});
  if(history.length>=2&&history[0].score<history[1].score) suggestions.push({icon:'📉',color:'red',title:'Score dropped',tip:`Latest (${history[0].score}%) is lower than previous (${history[1].score}%). The newer JD may require different skills.`});
  if(history.length>=2&&history[0].score>history[1].score) suggestions.push({icon:'🚀',color:'green',title:'Great progress!',tip:`Improved from ${history[1].score}% to ${history[0].score}%. Keep using the same tailoring strategy!`});
  if(overall>=75) suggestions.push({icon:'💡',color:'violet',title:'Strong performer',tip:`Average ${overall}% is excellent. Target senior or specialized roles where your profile stands out.`});
  if(history.length<3) suggestions.push({icon:'📊',color:'blue',title:'More data needed',tip:'Run 3–5 scans across different JDs to unlock meaningful patterns and insights.'});
  const C={red:{bg:'bg-red-50',border:'border-red-100',text:'text-red-600'},amber:{bg:'bg-amber-50',border:'border-amber-100',text:'text-amber-600'},green:{bg:'bg-emerald-50',border:'border-emerald-100',text:'text-emerald-600'},violet:{bg:'bg-violet-50',border:'border-violet-100',text:'text-violet-600'},blue:{bg:'bg-blue-50',border:'border-blue-100',text:'text-blue-600'}};
  return (
    <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
      <ImprovementDecor/>
      <div className="relative z-10">
        <SectionHeading icon={Lightbulb}>Improvement Suggestions</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s,i)=>{
            const c=C[s.color];
            return (
              <div key={i} className={`flex gap-3 p-3 sm:p-4 rounded-xl border ${c.bg} ${c.border}`}>
                <span className="text-lg sm:text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                <div><p className={`text-xs font-bold mb-1 ${c.text}`}>{s.title}</p><p className="text-xs text-gray-600 leading-relaxed">{s.tip}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══ HEATMAP CALENDAR ══════════════════════════════════════════ */
function HeatmapCalendar({ history }) {
  const weeks=14,today=new Date();today.setHours(0,0,0,0);
  const dayMap={};
  history.forEach(item=>{const d=new Date(item.timestamp);d.setHours(0,0,0,0);const k=d.toISOString().slice(0,10);dayMap[k]=Math.max(dayMap[k]||0,item.score);});
  const startDate=new Date(today);startDate.setDate(today.getDate()-(weeks*7-1)-((today.getDay()+6)%7));
  const grid=[];
  for(let w=0;w<weeks;w++){const col=[];for(let d=0;d<7;d++){const date=new Date(startDate);date.setDate(startDate.getDate()+w*7+d);const key=date.toISOString().slice(0,10);col.push({date,key,score:dayMap[key]||0,isFuture:date>today});}grid.push(col);}
  const getColor=(score,isFuture)=>{if(isFuture)return'#f9fafb';if(!score)return'#f3f4f6';if(score>=90)return'#10b981';if(score>=75)return'#34d399';if(score>=60)return'#a78bfa';if(score>=45)return'#f59e0b';return'#fca5a5';};
  return (
    <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
      <HeatmapDecor/>
      <div className="relative z-10">
        <SectionHeading icon={Calendar}>Scan Activity Heatmap</SectionHeading>
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-1.5 min-w-max">
            <div className="flex flex-col gap-1 mr-1">
              <div className="h-5"/>
              {['M','T','W','T','F','S','S'].map((d,i)=>(<div key={i} className="w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center text-[9px] sm:text-xs text-gray-400 font-medium">{d}</div>))}
            </div>
            {grid.map((col,wi)=>{
              const fom=col.find(c=>c.date.getDate()===1);
              return (
                <div key={wi} className="flex flex-col gap-1">
                  <div className="h-5 flex items-center">{fom&&<span className="text-[9px] sm:text-xs text-gray-400 font-semibold">{fom.date.toLocaleString('en',{month:'short'})}</span>}</div>
                  {col.map((cell,di)=>(
                    <div key={di} title={cell.isFuture?'':`${cell.key}: ${cell.score?cell.score+'%':'No scan'}`}
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-transform hover:scale-125 cursor-default"
                      style={{background:getColor(cell.score,cell.isFuture),border:cell.score?'1px solid rgba(0,0,0,0.06)':'none'}}/>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-4 flex-wrap">
          <span className="text-xs text-gray-400">Less</span>
          {['#f3f4f6','#fca5a5','#f59e0b','#a78bfa','#34d399','#10b981'].map((c,i)=>(
            <div key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm" style={{background:c}}/>
          ))}
          <span className="text-xs text-gray-400">More / Higher score</span>
        </div>
      </div>
    </div>
  );
}

/* ══ TOP PERFORMERS ════════════════════════════════════════════ */
function TopPerformersTable({ history }) {
  const [tab,setTab]=useState('resume');
  const grouped={};
  history.forEach(item=>{const key=tab==='resume'?item.resume:item.jd;if(!grouped[key])grouped[key]={name:key,scores:[],best:0,total:0};grouped[key].scores.push(item.score);grouped[key].best=Math.max(grouped[key].best,item.score);grouped[key].total++;});
  const rows=Object.values(grouped).map(g=>({...g,avg:Math.round(g.scores.reduce((a,b)=>a+b,0)/g.scores.length)})).sort((a,b)=>b.avg-a.avg).slice(0,6);
  return (
    <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
      <TopPerformersDecor/>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <SectionHeading icon={FileText}>{tab==='resume'?'Top Resumes':'Top Job Descriptions'}</SectionHeading>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {['resume','jd'].map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${tab===t?'bg-white shadow-sm text-violet-600':'text-gray-400 hover:text-gray-600'}`}>
                {t==='resume'?'Resumes':'JDs'}
              </button>
            ))}
          </div>
        </div>
        {!rows.length?<p className="text-xs text-gray-400 py-4 text-center">No data available</p>:(
          <div className="space-y-2">
            {rows.map((row,idx)=>{
              const color=row.avg>=75?'#10b981':row.avg>=60?'#f59e0b':'#ef4444';
              return (
                <div key={row.name} className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                    {idx<3?['🥇','🥈','🥉'][idx]:<span className="text-xs font-bold text-gray-400">{idx+1}</span>}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{row.name}</p>
                    <p className="text-[11px] text-gray-400">{row.total} scan{row.total>1?'s':''} · Best: {row.best}%</p>
                  </div>
                  <div className="hidden sm:block w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full" style={{width:`${row.avg}%`,background:color,transition:'width 0.8s ease'}}/>
                  </div>
                  <span className="text-xs font-black tabular-nums flex-shrink-0" style={{color}}>{row.avg}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ SHARED COMPONENTS ═════════════════════════════════════════ */
function ScoreRing({ score, size=140, stroke=10, id='ringGrad' }) {
  const r=(size-stroke)/2,circ=2*Math.PI*r,dash=circ*Math.min(Math.max(score,0),100)/100;
  const color=score>=75?'#10b981':score>=45?'#f59e0b':'#ef4444';
  const animScore=useCountUp(score);
  return (
    <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
      <span className="absolute rounded-full animate-ping opacity-10" style={{width:size*0.72,height:size*0.72,background:color}}/>
      <svg width={size} height={size} className="absolute" style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          style={{transition:'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)'}}/>
        <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e91e8c"/><stop offset="100%" stopColor="#7c3aed"/>
        </linearGradient></defs>
      </svg>
      <div className="relative flex flex-col items-center justify-center z-10">
        <span className="text-3xl font-black tabular-nums leading-none" style={{color}}>{animScore}%</span>
        <span className="text-xs font-medium text-gray-400 mt-0.5 tracking-wide">BEST SCORE</span>
      </div>
    </div>
  );
}

function DeltaBadge({ current, previous }) {
  if(previous==null) return null;
  const diff=current-previous;
  if(diff===0) return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><Minus size={10}/> Same</span>;
  const up=diff>0;
  return <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${up?'bg-emerald-50 text-emerald-600':'bg-red-50 text-red-500'}`}>{up?<ArrowUp size={10}/>:<ArrowDown size={10}/>}{up?'+':''}{diff}%</span>;
}

function StreakBadge({ count }) {
  if(count<2) return null;
  return <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-50 text-orange-500 border border-orange-100"><Flame size={12} className="text-orange-400"/>{count} scans this week</span>;
}

function StatCard({ label, value, suffix, sub, icon:Icon, gradFrom, gradTo, iconBg, iconColor, extra, sparkData, sparkColor, decorType }) {
  const animated=useCountUp(value);
  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm card-lift overflow-hidden">
      <StatCardDecor type={decorType}/>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${iconBg}`}><Icon size={15} className={iconColor}/></div>
          {sparkData&&<TinySparkline data={sparkData} color={sparkColor}/>}
        </div>
        <div className="text-2xl sm:text-3xl font-black tabular-nums text-gray-800 mb-1 leading-none">{animated}{suffix}</div>
        <p className="text-xs font-semibold text-gray-800 mb-0.5">{label}</p>
        <div className="flex items-center gap-2 flex-wrap"><p className="text-xs text-gray-400">{sub}</p>{extra}</div>
        <div className="mt-3 sm:mt-4 h-0.5 rounded-full" style={{background:`linear-gradient(to right,${gradFrom},${gradTo})`}}/>
      </div>
    </div>
  );
}

function SectionHeading({ icon:Icon, children }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{background:'linear-gradient(135deg,#fce7f3,#ede9fe)'}}>
        <Icon size={13} style={{color:'#9333ea'}}/>
      </span>
      <h2 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-widest">{children}</h2>
    </div>
  );
}

function ScoreBar({ score }) {
  const color=score>=75?'#10b981':score>=45?'#f59e0b':'#ef4444';
  return <div className="w-16 sm:w-24 h-1.5 rounded-full bg-gray-100 overflow-hidden flex-shrink-0"><div className="h-full rounded-full transition-all duration-700" style={{width:`${score}%`,background:color}}/></div>;
}

function CustomTooltip({ active, payload, label }) {
  if(!active||!payload?.length) return null;
  return <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-xs"><p className="font-bold text-gray-700 mb-1">{label}</p><p className="text-violet-600 font-black text-base">{payload[0].value}%</p></div>;
}

function ColorBar(props) {
  const {x,y,width,height,name}=props;
  const color=name==='Great (90+)'?'#10b981':name==='Decent (70+)'?'#8b5cf6':'#f59e0b';
  return <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={color}/>;
}

/* ══ DASHBOARD MAIN ════════════════════════════════════════════ */
function Dashboard() {
  const [userName,setUserName]           = useState('User');
  const [scoreHistory,setScoreHistory]   = useState([]);
  const [filteredHistory,setFiltered]    = useState([]);
  const [latestGemini,setLatestGemini]   = useState(null);
  const [loading,setLoading]             = useState(true);
  const [selectedRange,setSelectedRange] = useState('All');
  const [weekStreak,setWeekStreak]       = useState(0);
  const [confetti,setConfetti]           = useState(false);
  const prevBestRef                      = useRef(null);
  const navigate = useNavigate();

  useEffect(()=>{
    const auth=getAuth();
    const unsub=onAuthStateChanged(auth,user=>{
      if(!user){setLoading(false);return;}
      setUserName(user.displayName||user.email.split('@')[0]);
      fetchMatchScores(user.uid);
    });
    return ()=>unsub();
  },[]);

  const fetchMatchScores=async(uid)=>{
    try{
      const q=query(collection(db,'resume_analysis'),where('user_id','==',uid));
      const snap=await getDocs(q);
      const seen=new Set(),scores=[];
      snap.forEach(doc=>{
        const d=doc.data(),ts=d.timestamp?.toDate?d.timestamp.toDate():new Date();
        if(!seen.has(doc.id)){seen.add(doc.id);scores.push({id:doc.id,date:ts.toLocaleDateString('en-IN'),timeLabel:ts.toLocaleString('en-IN',{month:'short',day:'numeric'}),timestamp:ts,score:Number(d.gemini_score||0),resume:d.resume_name||'Unnamed Resume',jd:d.jd_name||'Unnamed JD'});}
      });
      scores.sort((a,b)=>b.timestamp-a.timestamp);
      setScoreHistory(scores);setFiltered(scores);setLatestGemini(scores[0]||null);
      const best=scores.length?Math.max(...scores.map(s=>s.score)):0;
      if(prevBestRef.current!==null&&best>prevBestRef.current)setConfetti(true);
      prevBestRef.current=best;
      const w=new Date();w.setDate(w.getDate()-7);
      setWeekStreak(scores.filter(s=>s.timestamp>=w).length);
    }catch(e){console.error(e);}finally{setLoading(false);}
  };

  useEffect(()=>{
    if(!scoreHistory.length)return;
    if(selectedRange==='All'){setFiltered(scoreHistory);return;}
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-Number(selectedRange));
    setFiltered(scoreHistory.filter(i=>i.timestamp>=cutoff));
  },[selectedRange,scoreHistory]);

  const getBestMatch=()=>!filteredHistory.length?null:filteredHistory.reduce((b,c)=>c.score>b.score?c:b);
  const getAvgScore=()=>!filteredHistory.length?0:Math.round(filteredHistory.reduce((a,c)=>a+c.score,0)/filteredHistory.length);
  const getScoreBadge=s=>s>=90?'Excellent':s>=75?'Good Match':s>=60?'Fair Match':'Needs Work';
  const getScoreDistrib=()=>{const b={Great:0,Decent:0,NI:0};filteredHistory.forEach(({score})=>{if(score>=90)b.Great++;else if(score>=70)b.Decent++;else b.NI++;});return[{name:'Great (90+)',count:b.Great},{name:'Decent (70+)',count:b.Decent},{name:'Below 70',count:b.NI}];};
  const getPillStyle=s=>s>=90?{text:'text-emerald-700',bg:'bg-emerald-50'}:s>=75?{text:'text-violet-700',bg:'bg-violet-50'}:s>=60?{text:'text-amber-700',bg:'bg-amber-50'}:{text:'text-red-600',bg:'bg-red-50'};
  const last7=[...scoreHistory].slice(0,7).reverse().map(s=>s.score);
  const tooltipStyle={background:'#fff',border:'none',borderRadius:12,boxShadow:'0 8px 30px rgba(0,0,0,0.10)'};

  if(loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse" style={{background:'linear-gradient(135deg,#e91e8c,#7c3aed)'}}>
          <Sparkles size={24} className="text-white"/>
        </div>
        <p className="text-sm font-medium text-gray-400">Loading dashboard…</p>
      </div>
    </div>
  );

  const best=getBestMatch(),avg=getAvgScore(),prevScore=scoreHistory.length>=2?scoreHistory[1].score:null;

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalStyles/>
      <ConfettiBurst trigger={confetti}/>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between border-b bg-white border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs text-gray-400 font-medium hidden sm:block">ATS Dashboard</p>
          <StreakBadge count={weekStreak}/>
        </div>
        <select
          value={selectedRange}
          onChange={e=>setSelectedRange(e.target.value)}
          className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer bg-gray-50 border-gray-200 text-gray-700"
        >
          <option value="All">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* 1. Hero Banner */}
        <HeroBanner userName={userName} scanCount={filteredHistory.length} bestScore={best?.score||0} weekStreak={weekStreak}/>

        {/* 2. Stat Cards — 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Scans"  value={filteredHistory.length} suffix=""  sub="Resume analyses"    icon={BarChart2}  gradFrom="#e91e8c" gradTo="#f43f5e" iconBg="bg-pink-50"    iconColor="text-pink-500"    sparkData={last7.map((_,i)=>i+1)} sparkColor="#e91e8c" decorType="scans"/>
          <StatCard label="Avg Score"    value={avg}                    suffix="%" sub="Overall performance" icon={TrendingUp} gradFrom="#8b5cf6" gradTo="#7c3aed" iconBg="bg-violet-50"  iconColor="text-violet-500"  sparkData={last7} sparkColor="#8b5cf6" decorType="avg"/>
          <StatCard label="Best Score"   value={best?.score||0}         suffix="%" sub="Highest match"      icon={Trophy}     gradFrom="#10b981" gradTo="#059669" iconBg="bg-emerald-50" iconColor="text-emerald-500" sparkData={last7} sparkColor="#10b981"/>
          <StatCard label="Latest Score" value={latestGemini?.score||0} suffix="%" sub="vs previous scan"   icon={Target}     gradFrom="#f59e0b" gradTo="#f97316" iconBg="bg-amber-50"   iconColor="text-amber-500"   sparkData={last7} sparkColor="#f59e0b" decorType="latest" extra={<DeltaBadge current={latestGemini?.score||0} previous={prevScore}/>}/>
        </div>

        {/* 3. Latest + Best Match — stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
            <LatestMatchDecor/>
            <div className="relative z-10">
              <SectionHeading icon={Target}>Latest Match</SectionHeading>
              {latestGemini?(
                <div className="flex flex-col items-center gap-4">
                  <ScoreGauge score={latestGemini.score} size={160}/>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{background:'linear-gradient(135deg,#e91e8c,#7c3aed)'}}>{getScoreBadge(latestGemini.score)}</span>
                    <DeltaBadge current={latestGemini.score} previous={prevScore}/>
                  </div>
                  <div className="w-full p-3 sm:p-4 rounded-xl bg-gray-50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Resume vs JD</p>
                    <p className="text-sm font-semibold text-gray-800 break-words leading-snug">{latestGemini.resume}<span className="mx-2 text-violet-400 font-normal">→</span>{latestGemini.jd}</p>
                    <p className="text-xs text-gray-400 mt-2">{latestGemini.date}</p>
                  </div>
                </div>
              ):(
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-200">
                  <Target size={22} className="text-gray-300 mb-3"/><p className="text-sm text-gray-400">No scans yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
            <BestMatchDecor/>
            <div className="relative z-10">
              <SectionHeading icon={Trophy}>Best Match Ever</SectionHeading>
              {best?(
                <div className="flex flex-col items-center gap-4">
                  <ScoreRing score={best.score} size={140} stroke={10} id="ringGradBest"/>
                  <div className="w-full p-3 sm:p-4 rounded-xl bg-gray-50">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Winning Combination</p>
                    <p className="text-sm font-semibold text-gray-800 break-words">{best.resume}</p>
                    <div className="flex items-center gap-1 my-1"><div className="flex-1 h-px bg-gradient-to-r from-pink-300 to-violet-300 opacity-40"/><span className="text-xs text-gray-400 px-2">matched with</span><div className="flex-1 h-px bg-gradient-to-r from-violet-300 to-pink-300 opacity-40"/></div>
                    <p className="text-sm font-semibold text-gray-800 break-words">{best.jd}</p>
                  </div>
                  <span className="inline-block px-4 sm:px-5 py-2 text-xs font-bold text-white rounded-full" style={{background:'linear-gradient(135deg,#e91e8c 0%,#7c3aed 100%)'}}>🏆 PERSONAL BEST</span>
                </div>
              ):(
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-200">
                  <Trophy size={22} className="text-gray-300 mb-3"/><p className="text-sm text-gray-400">No matches recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Achievements */}
        <AchievementBadges history={scoreHistory}/>

        {/* 5. Improvement Suggestions */}
        <ImprovementPanel history={filteredHistory}/>

        {/* 6. Score Trend */}
        {filteredHistory.length>0&&(
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
            <TrendDecor/>
            <div className="relative z-10">
              <SectionHeading icon={TrendingUp}>Match Score Trend</SectionHeading>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="min-w-[280px]">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[...filteredHistory].reverse()}>
                      <defs><linearGradient id="lineGrad2" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#e91e8c"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                      <XAxis dataKey="timeLabel" tick={{fontSize:10,fill:'#9ca3af'}} angle={-30} textAnchor="end" height={55}/>
                      <YAxis domain={[0,100]} tick={{fontSize:10,fill:'#9ca3af'}} width={28}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <ReferenceLine y={avg} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5}/>
                      <Line type="monotone" dataKey="score" stroke="url(#lineGrad2)" strokeWidth={2.5} dot={{r:3,fill:'#7c3aed',strokeWidth:0}} activeDot={{r:5,fill:'#e91e8c'}} name="Score"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Score Distribution */}
        {filteredHistory.length>0&&(
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
            <div className="relative z-10">
              <SectionHeading icon={BarChart2}>Score Distribution</SectionHeading>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="min-w-[240px]">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={getScoreDistrib()} barCategoryGap="35%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                      <XAxis dataKey="name" tick={{fontSize:10,fill:'#9ca3af'}}/>
                      <YAxis allowDecimals={false} tick={{fontSize:10,fill:'#9ca3af'}} width={24}/>
                      <Tooltip contentStyle={tooltipStyle}/>
                      <Bar dataKey="count" radius={[6,6,0,0]} shape={<ColorBar/>} name="Count"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Heatmap */}
        <HeatmapCalendar history={scoreHistory}/>

        {/* 9. Top Performers */}
        {filteredHistory.length>0&&<TopPerformersTable history={filteredHistory}/>}

        {/* 10. Recent Scans */}
        {filteredHistory.length>0&&(
          <div className="relative bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm card-lift overflow-hidden">
            <RecentScansDecor/>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <SectionHeading icon={Clock}>Recent Scans</SectionHeading>
                {filteredHistory.length>5&&<span className="text-xs text-gray-400">5 of {filteredHistory.length}</span>}
              </div>
              <div className="space-y-2">
                {filteredHistory.slice(0,5).map((item,idx)=>{
                  const pill=getPillStyle(item.score);
                  return (
                    <div key={item.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl bg-gray-50/80 hover:bg-violet-50/60 transition-all">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black text-white flex-shrink-0" style={{background:'linear-gradient(135deg,#e91e8c,#7c3aed)'}}>{idx+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.resume}<span className="mx-1 text-violet-400 font-normal">→</span>{item.jd}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.date}</p>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <ScoreBar score={item.score}/>
                        <div className={`text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg tabular-nums ${pill.text} ${pill.bg}`}>{item.score}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredHistory.length===0&&!loading&&(
          <div className="relative bg-white rounded-2xl p-10 sm:p-16 border border-gray-100 shadow-sm text-center overflow-hidden">
            <BestMatchDecor/>
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{background:'linear-gradient(135deg,#fce7f3,#ede9fe)'}}>
                <BarChart2 size={24} style={{color:'#9333ea'}}/>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Data Yet</h3>
              <p className="text-gray-400 mb-7 text-sm max-w-xs mx-auto leading-relaxed">Upload your resume and a job description to start tracking your ATS match scores.</p>
              <button onClick={()=>navigate('/upload')} className="inline-flex items-center gap-2 px-7 py-2.5 text-white text-xs font-bold rounded-xl transition-all hover:opacity-90" style={{background:'linear-gradient(135deg,#e91e8c 0%,#7c3aed 100%)'}}>GET STARTED</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
