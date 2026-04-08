import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  BookOpen, FileText, Play, GraduationCap, Layers, ExternalLink,
  Sparkles, TrendingUp, ChevronRight, Star, CheckCircle2,
  Clock, Zap, GripVertical, Flame, Circle, Trophy,
} from 'lucide-react';

/* ─── Skill metadata ────────────────────────────────────────── */
const getSkillMeta = (skill) => {
  const h = [...skill].reduce((a, c) => a + c.charCodeAt(0), 0);
  return {
    difficulty: ['Beginner','Intermediate','Advanced'][h % 3],
    hours:      ['2–4 hrs','4–6 hrs','6–10 hrs','8–12 hrs','12–20 hrs'][h % 5],
    demand:     ['High','High','Medium'][h % 3],
    matchBoost: [7,8,10,12,15,18][h % 6],
    related:    [
      ['REST APIs','SQL','Git'],
      ['TypeScript','Webpack','CSS'],
      ['Python','NumPy','Pandas'],
      ['Docker','CI/CD','Linux'],
      ['PostgreSQL','Redis','MongoDB'],
      ['Figma','Tailwind','UX Writing'],
    ][h % 6],
  };
};

const DIFF = {
  Beginner:     { color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200', Icon: Circle },
  Intermediate: { color:'text-amber-600',   bg:'bg-amber-50',   border:'border-amber-200',   Icon: Zap    },
  Advanced:     { color:'text-red-500',      bg:'bg-red-50',     border:'border-red-200',     Icon: Flame  },
};

const PLATFORMS = (skill) => {
  const q = encodeURIComponent(skill);
  return [
    { name:'YouTube',      sub:'Free videos',     href:`https://www.youtube.com/results?search_query=${q}+tutorial`,         Icon:Play,         ic:'text-red-500',     bg:'bg-red-50',     bd:'border-red-100'               },
    { name:'Coursera',     sub:'Certified course', href:`https://www.coursera.org/search?query=${q}`,                         Icon:GraduationCap, ic:'text-blue-600',    bg:'bg-blue-50',    bd:'border-blue-100',  best:true },
    { name:'Udemy',        sub:'Project-based',   href:`https://www.udemy.com/courses/search/?q=${q}`,                        Icon:Layers,        ic:'text-violet-600',  bg:'bg-violet-50',  bd:'border-violet-100'            },
    { name:'Official Docs',sub:'Reference guide', href:`https://www.google.com/search?q=${q}+official+documentation`,         Icon:FileText,      ic:'text-emerald-600', bg:'bg-emerald-50', bd:'border-emerald-100'           },
  ];
};

/* ─── Confetti burst ─────────────────────────────────────────── */
function Confetti({ active }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
      {Array.from({length:10},(_,i)=>i).map(i=>(
        <div key={i} className="absolute w-2 h-2 rounded-full"
          style={{
            background:['#e91e8c','#7c3aed','#f59e0b','#10b981','#3b82f6'][i%5],
            top:'40%', left:'50%',
            animation:`cf${i%4} 0.65s ease-out ${(i*0.06).toFixed(2)}s forwards`,
            opacity:0,
          }}
        />
      ))}
      <style>{`
        @keyframes cf0{0%{transform:translate(0,0);opacity:1}100%{transform:translate(40px,-50px) scale(0);opacity:0}}
        @keyframes cf1{0%{transform:translate(0,0);opacity:1}100%{transform:translate(-40px,-50px) scale(0);opacity:0}}
        @keyframes cf2{0%{transform:translate(0,0);opacity:1}100%{transform:translate(40px,30px) scale(0);opacity:0}}
        @keyframes cf3{0%{transform:translate(0,0);opacity:1}100%{transform:translate(-40px,30px) scale(0);opacity:0}}
      `}</style>
    </div>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar({ navigate, rightSlot }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-8"
      style={{ height:'56px', display:'flex', alignItems:'center' }}>
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
              <span className="hover:text-purple-600 cursor-pointer transition-colors hidden sm:block"
                onClick={() => navigate('/dashboard')}>Dashboard</span>
              <ChevronRight size={10} className="hidden sm:block" />
              <span className="text-gray-500 font-medium">Career Skill Map</span>
            </div>
            <h1 className="text-sm font-semibold text-gray-900 leading-none">Career Skill Map</h1>
          </div>
        </div>
        {rightSlot}
      </div>
    </div>
  );
}

/* ─── Skill card ─────────────────────────────────────────────── */
function SkillCard({ item, index, dragging, onDragStart, onDragOver, onDrop, onDragEnd, onToggle }) {
  const [burst, setBurst] = useState(false);
  const meta = item.meta;
  const diff = DIFF[meta.difficulty] || DIFF.Intermediate;
  const DiffIcon = diff.Icon;

  const toggle = () => {
    if (!item.learned) { setBurst(true); setTimeout(()=>setBurst(false), 700); }
    onToggle();
  };

  return (
    <div
      draggable
      onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      className={`relative bg-white rounded-2xl border transition-all duration-200 select-none flex flex-col
        ${dragging ? 'opacity-40 scale-95 border-purple-300 shadow-xl' : 'border-gray-200 hover:shadow-lg hover:shadow-purple-50 hover:-translate-y-0.5'}
        ${item.learned ? 'ring-2 ring-emerald-300 ring-offset-1' : ''}
      `}
    >
      <Confetti active={burst} />
      <div className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ background: item.learned ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fdf2f8,#f5f3ff)', borderRadius:'16px 16px 0 0' }}>
        <GripVertical size={13} className="text-gray-300 flex-shrink-0 cursor-grab hidden sm:block" />
        <button onClick={toggle}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow transition-all duration-200 hover:scale-105"
          style={{ background: item.learned ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
          {item.learned ? <CheckCircle2 size={18} className="text-white" /> : <span className="text-sm font-extrabold text-white">{index+1}</span>}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-extrabold text-base truncate ${item.learned ? 'line-through text-emerald-600' : 'text-gray-900'}`}>{item.skill}</p>
          {item.learned && <p className="text-[11px] text-emerald-500 font-semibold">✓ Marked as learned</p>}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0">
          <Clock size={11}/> {meta.hours}
        </div>
      </div>
      <div className="mx-4 border-t border-dashed border-gray-200" />
      <div className="px-4 py-3 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${diff.bg} ${diff.color} ${diff.border}`}>
          <DiffIcon size={10}/> {meta.difficulty}
        </span>
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg
          ${meta.demand==='High' ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
          {meta.demand} demand
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 ml-auto">
          <TrendingUp size={10}/> +{meta.matchBoost}% job match
        </span>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Learning progress</span>
          <span className="text-[11px] font-bold" style={{ color: item.learned ? '#10b981' : '#9ca3af' }}>
            {item.learned ? '100% — Done!' : '0% — Not started'}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: item.learned ? '100%' : '0%', background:'linear-gradient(90deg,#e91e8c,#7c3aed)' }} />
        </div>
      </div>
      <div className="mx-4 border-t border-dashed border-gray-200" />
      <div className="px-4 py-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Also learn alongside</p>
        <div className="flex gap-1.5 flex-wrap">
          {meta.related.map(r=>(
            <span key={r} className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200">{r}</span>
          ))}
        </div>
      </div>
      <div className="mx-4 border-t border-dashed border-gray-200" />
      <div className="p-3 bg-gray-50 rounded-b-2xl mt-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Where to learn</p>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS(item.skill).map((p,i)=>{
            const PIcon = p.Icon;
            return (
              <a key={i} href={p.href} target="_blank" rel="noopener noreferrer"
                className="relative flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all group/p">
                {p.best && (
                  <span className="absolute -top-2 -right-2 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white z-10"
                    style={{background:'linear-gradient(135deg,#e91e8c,#7c3aed)'}}>
                    <Star size={7} fill="white"/> BEST
                  </span>
                )}
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${p.bg} border ${p.bd}`}>
                  <PIcon size={14} className={p.ic}/>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 truncate leading-none">{p.name}</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">{p.sub}</p>
                </div>
                <ExternalLink size={10} className="text-gray-300 group-hover/p:text-purple-400 flex-shrink-0 transition-colors"/>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Progress summary — mobile stacks vertically ───────────── */
function ProgressSummary({ skills }) {
  const total   = skills.length;
  const learned = skills.filter(s=>s.learned).length;
  const pct     = total ? Math.round((learned/total)*100) : 0;
  const C = 2 * Math.PI * 22;

  return (
    <div className="rounded-2xl border border-purple-100 p-4 sm:p-5 mb-6"
      style={{background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)'}}>

      {/* Top row: ring + text — always side by side */}
      <div className="flex items-center gap-4 sm:gap-6 mb-4">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#e9d5ff" strokeWidth="5"/>
            <circle cx="28" cy="28" r="22" fill="none" strokeWidth="5" strokeLinecap="round"
              stroke="url(#pg)" strokeDasharray={C} strokeDashoffset={C*(1-pct/100)}
              style={{transition:'stroke-dashoffset 0.8s ease'}}/>
            <defs>
              <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e91e8c"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base sm:text-lg font-extrabold text-purple-700 leading-none">{pct}%</span>
            <span className="text-[8px] sm:text-[9px] text-purple-400 font-semibold leading-none mt-0.5">done</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-extrabold text-gray-800 mb-0.5">
            {pct===100 ? '🎉 All skills mastered!' : `${learned} of ${total} skills learned`}
          </p>
          <p className="text-xs text-gray-400 mb-2">
            {pct===0 ? 'Tap the number badge on a card to mark complete.' : 'Keep going — each skill boosts your match score.'}
          </p>

          {/* Progress bar */}
          <div>
            <div className="h-2.5 sm:h-3 bg-white rounded-full overflow-hidden border border-purple-100 relative">
              <div className="h-full rounded-full transition-all duration-700"
                style={{width:`${pct}%`, background:'linear-gradient(90deg,#e91e8c,#7c3aed)'}}>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat pills — row on all sizes */}
      <div className="flex gap-3 sm:gap-4">
        <div className="flex-1 text-center bg-white rounded-xl px-3 py-2.5 border border-purple-100">
          <p className="text-xl sm:text-2xl font-extrabold text-purple-700">{total-learned}</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Remaining</p>
        </div>
        <div className="flex-1 text-center bg-white rounded-xl px-3 py-2.5 border border-emerald-100">
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-500">{learned}</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Completed</p>
        </div>
        <div className="flex-1 text-center bg-white rounded-xl px-3 py-2.5 border border-gray-100">
          <p className="text-xl sm:text-2xl font-extrabold text-gray-700">{total}</p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Total</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-16" style={{background:'linear-gradient(135deg,#fce7f3,#ede9fe)'}}/>
      <div className="p-4 space-y-3">
        <div className="flex gap-2"><div className="h-6 w-20 bg-gray-100 rounded-lg"/><div className="h-6 w-20 bg-gray-100 rounded-lg"/></div>
        <div className="h-2 bg-gray-100 rounded-full"/>
        <div className="flex gap-1.5"><div className="h-6 w-12 bg-gray-100 rounded-lg"/><div className="h-6 w-12 bg-gray-100 rounded-lg"/><div className="h-6 w-12 bg-gray-100 rounded-lg"/></div>
        <div className="grid grid-cols-2 gap-2 pt-1">{[0,1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded-xl"/>)}</div>
      </div>
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{background:'linear-gradient(135deg,#fce7f3,#ede9fe)'}}>
        <Trophy size={28} className="text-purple-500"/>
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1">You're all caught up!</h3>
      <p className="text-sm text-gray-400 max-w-xs">No missing skills detected. Your resume is well-aligned.</p>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function MissingSkills() {
  const [skills,  setSkills]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [, tick]              = useState(0);
  const dragIdx               = useRef(null);
  const navigate              = useNavigate();

  useEffect(()=>{
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user)=>{
      if (!user) { setLoading(false); return; }
      try {
        const q    = query(collection(db,'resume_analysis'), where('user_id','==',user.uid));
        const snap = await getDocs(q);
        if (snap.empty) { setLoading(false); return; }
        let latest=null, lt=0;
        snap.forEach(d=>{ const data=d.data(), t=data.timestamp?.toDate?.().getTime()||0; if(t>=lt){lt=t;latest=data;}});
        if (!latest?.gemini_missing_keywords?.length) { setSkills([]); setLoading(false); return; }
        setSkills(latest.gemini_missing_keywords.map(skill=>({ skill, meta:getSkillMeta(skill), learned:false })));
      } catch(e){ console.error(e); setSkills([]); }
      finally { setLoading(false); }
    });
    return ()=>unsub();
  },[]);

  const onDragStart = useCallback(idx=>()=>{ dragIdx.current=idx; },[]);
  const onDragOver  = useCallback(idx=>e=>{
    e.preventDefault();
    if (dragIdx.current===null||dragIdx.current===idx) return;
    setSkills(prev=>{
      const next=[...prev];
      const [m]=next.splice(dragIdx.current,1);
      next.splice(idx,0,m);
      dragIdx.current=idx;
      return next;
    });
  },[]);
  const onDrop    = useCallback(()=>e=>e.preventDefault(),[]);
  const onDragEnd = useCallback(()=>()=>{ dragIdx.current=null; tick(n=>n+1); },[]);
  const onToggle  = useCallback(idx=>()=>{
    setSkills(prev=>{ const n=[...prev]; n[idx]={...n[idx],learned:!n[idx].learned}; return n; });
  },[]);

  const learnedCount = skills.filter(s=>s.learned).length;

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar
        navigate={navigate}
        rightSlot={
          !loading && skills.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-2 rounded-lg flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                <TrendingUp size={12}/> {skills.length} skills
              </div>
              {learnedCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg flex-shrink-0">
                  <CheckCircle2 size={12}/> {learnedCount} learned
                </div>
              )}
            </div>
          ) : null
        }
      />

      {/* Body — mobile-friendly padding */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_,i)=><SkeletonCard key={i}/>)}
          </div>
        ) : skills.length===0 ? <EmptyState/> : (
          <>
            <div className="flex items-start sm:items-center gap-2 mb-4 px-3 sm:px-4 py-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-700 font-medium">
              <BookOpen size={13} className="flex-shrink-0 mt-0.5 sm:mt-0"/>
              <span>Tap the <strong>number badge</strong> on any card to mark it as learned.</span>
            </div>

            <ProgressSummary skills={skills} key={learnedCount}/>

            {/* Platform legend + drag hint — hide drag hint on mobile */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1 w-full sm:w-auto">Platforms:</span>
              {[
                {label:'YouTube',       color:'bg-red-100 text-red-600'},
                {label:'Coursera',      color:'bg-blue-100 text-blue-600'},
                {label:'Udemy',         color:'bg-violet-100 text-violet-600'},
                {label:'Official Docs', color:'bg-emerald-100 text-emerald-600'},
              ].map(p=>(
                <span key={p.label} className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${p.color}`}>{p.label}</span>
              ))}
              {/* Drag hint — only show on non-touch devices */}
              <span className="hidden sm:flex ml-auto items-center gap-1 text-xs text-gray-400">
                <GripVertical size={12}/> Drag to reprioritise
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {skills.map((item,idx)=>(
                <SkillCard
                  key={item.skill} item={item} index={idx}
                  dragging={dragIdx.current===idx}
                  onDragStart={onDragStart(idx)} onDragOver={onDragOver(idx)}
                  onDrop={onDrop(idx)} onDragEnd={onDragEnd(idx)} onToggle={onToggle(idx)}
                />
              ))}
            </div>
          </>
        )}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <span className="text-xs text-gray-400">Career Skill Map — JobMorph AI</span>
        </div>
      </div>
    </div>
  );
}