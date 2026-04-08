// src/pages/ATSChecker.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, CheckCircle, Download, AlertTriangle,
  FileText, ExternalLink, ZoomIn, ZoomOut, ChevronLeft,
  ChevronRight, RefreshCw, ShieldCheck, Info,
  AlertCircle, Sparkles, ChevronRight as CR, Zap, Lock,
} from 'lucide-react';

/* ─── constants ─────────────────────────────────────────────── */
const SEVERITY = {
  critical: { label:'Critical', dot:'bg-red-500',    badge:'bg-red-50 text-red-600 ring-red-200',         border:'border-l-red-400'    },
  high:     { label:'High',     dot:'bg-orange-400', badge:'bg-orange-50 text-orange-600 ring-orange-200', border:'border-l-orange-400' },
  medium:   { label:'Medium',   dot:'bg-amber-400',  badge:'bg-amber-50 text-amber-600 ring-amber-200',   border:'border-l-amber-400'  },
  low:      { label:'Low',      dot:'bg-blue-400',   badge:'bg-blue-50 text-blue-600 ring-blue-200',      border:'border-l-blue-300'   },
};

const getGrade = (s) =>
  s >= 90 ? { label:'Excellent', color:'text-emerald-600', bar:'from-emerald-400 to-emerald-600', pill:'bg-emerald-50 text-emerald-700 ring-emerald-200', stroke:'#10b981' }
: s >= 75 ? { label:'Good',      color:'text-blue-600',    bar:'from-blue-400 to-blue-600',       pill:'bg-blue-50 text-blue-700 ring-blue-200',           stroke:'#3b82f6' }
: s >= 55 ? { label:'Fair',      color:'text-amber-600',   bar:'from-amber-400 to-amber-500',     pill:'bg-amber-50 text-amber-700 ring-amber-200',         stroke:'#f59e0b' }
:           { label:'Poor',      color:'text-red-600',     bar:'from-red-400 to-red-600',         pill:'bg-red-50 text-red-700 ring-red-200',               stroke:'#ef4444' };

const TOOLS = [
  { name:'Overleaf',   type:'LaTeX',          url:'https://www.overleaf.com/latex/templates/tagged/cv', note:'Best for clean, parseable structure' },
  { name:'Resume.io',  type:'Resume Builder', url:'https://resume.io/',                                  note:'ATS-optimised templates'             },
  { name:'Canva',      type:'Design Tool',    url:'https://www.canva.com/resumes/templates/',            note:'Professional layouts'                },
  { name:'Novoresume', type:'Resume Builder', url:'https://novoresume.com/',                             note:'Recruiter-tested formats'            },
];

const CHECKS = [
  { title:'Tables & Graphics',  desc:'80% of ATS systems cannot parse table structures.'  },
  { title:'Font Compatibility', desc:'Non-standard fonts cause text extraction failures.' },
  { title:'Images & Logos',     desc:'Embedded text inside images is invisible to ATS.'  },
  { title:'Column Layouts',     desc:'Multi-column formats confuse parsing engines.'      },
  { title:'Special Characters', desc:'Decorative symbols break keyword matching.'         },
  { title:'File Encoding',      desc:'Incorrect encoding causes garbled parsing output.'  },
];

const FEATURES = [
  { Icon: Zap,      title:'Instant Results',   body:'Full ATS compatibility report in seconds.',           color:'text-purple-600', bg:'bg-purple-50', border:'border-purple-100' },
  { Icon: Sparkles, title:'Auto-Fix Ready',    body:'One click resolves all detected formatting issues.',  color:'text-pink-600',   bg:'bg-pink-50',   border:'border-pink-100'   },
  { Icon: Lock,     title:'Format Preserved',  body:'Fixed resume returned in your original file format.', color:'text-emerald-600',bg:'bg-emerald-50',border:'border-emerald-100'},
];

/* ─── Score ring ─────────────────────────────────────────────── */
function ScoreRing({ score, grade }) {
  const r = 44, circ = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e9d5ff" strokeWidth="7" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={grade.stroke} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${(score/100)*circ} ${circ}`}
        style={{ transition:'stroke-dasharray 1.2s ease' }} />
    </svg>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar({ title, pageName, icon: Icon, onReset, showReset, navigate }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-8"
      style={{ height:'56px', display:'flex', alignItems:'center' }}>
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
            <Icon size={15} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
              <span className="hover:text-purple-600 cursor-pointer transition-colors hidden sm:block"
                onClick={() => navigate('/dashboard')}>Dashboard</span>
              <CR size={10} className="hidden sm:block" />
              <span className="text-gray-500 font-medium">{pageName}</span>
            </div>
            <h1 className="text-sm font-semibold text-gray-900 leading-none">{title}</h1>
          </div>
        </div>
        {showReset && (
          <button onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-3 py-2 rounded-lg transition-all flex-shrink-0">
            <RefreshCw size={12} /> <span className="hidden sm:inline">New Check</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ATSChecker() {
  const [file,           setFile]           = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [preview,        setPreview]        = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fixing,         setFixing]         = useState(false);
  const [currentPage,    setCurrentPage]    = useState(0);
  const [zoom,           setZoom]           = useState(1);
  const [dragOver,       setDragOver]       = useState(false);
  const previewRef = useRef(null);
  const inputRef   = useRef(null);
  const navigate   = useNavigate();

  const acceptFile = (f) => {
    if (!f) return;
    const valid = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!valid.includes(f.type)) { alert('Please upload a PDF or DOCX file.'); return; }
    if (f.size > 10 * 1024 * 1024) { alert('File exceeds 10 MB.'); return; }
    setFile(f); setResult(null); setPreview(null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files[0]); };

  const checkATS = async () => {
    if (!file) return; setLoading(true);
    try {
      const fd = new FormData(); fd.append('resume', file);
      const res  = await fetch('/api/ats/check', { method:'POST', body:fd });
      const data = await res.json();
      if (data.is_valid_resume === false) { alert(data.issues?.[0]?.description || 'Invalid resume.'); setFile(null); return; }
      setResult(data); loadPreview(data.temp_file);
    } catch { alert('Analysis failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const loadPreview = async (filename) => {
    setLoadingPreview(true);
    try {
      const res  = await fetch('/api/ats/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ filename }) });
      const data = await res.json();
      if (data.success && data.pages?.length) { setPreview(data.pages); setCurrentPage(0); }
    } catch { } finally { setLoadingPreview(false); }
  };

  const fixAndDownload = async () => {
    if (!result) return; setFixing(true);
    try {
      const res = await fetch('/api/ats/fix', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ filename:result.temp_file }) });
      if (res.ok) {
        const blob = await res.blob(), url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement('a'), { href:url, download:`${file.name.split('.')[0]}_ATS_Optimized${result.original_extension||'.docx'}` });
        document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
      } else { alert('Could not fix resume.'); }
    } catch { alert('An error occurred.'); } finally { setFixing(false); }
  };

  const reset = () => { setFile(null); setResult(null); setPreview(null); setZoom(1); setCurrentPage(0); };
  const hasIssues = result?.issues?.length > 0;
  const grade     = result ? getGrade(result.score) : null;

  /* ══ UPLOAD VIEW ════════════════════════════════════════════ */
  if (!result) return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar title="ATS Format Checker" pageName="ATS Checker" icon={ShieldCheck} navigate={navigate} showReset={false} />

      <div className="flex-1 px-4 sm:px-8 py-5 sm:py-6 flex flex-col gap-4 sm:gap-5">

        {/* Upload zone */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100"
            style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Upload Resume</p>
          </div>
          <div className="p-4 sm:p-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`w-full flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-10 sm:py-16
                ${dragOver ? 'border-purple-400 bg-purple-50/40' : file ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'}`}
            >
              <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={(e) => acceptFile(e.target.files[0])} className="hidden" />
              {file ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-bold text-gray-800 break-all">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size/1024).toFixed(0)} KB · click to change</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                    <CheckCircle className="w-4 h-4" /> Ready to analyse
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background:'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                    <Upload className="w-7 h-7 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">Drag and drop your resume here</p>
                    <p className="text-xs text-gray-400 mt-1">PDF or DOCX · max 10 MB</p>
                  </div>
                  <span className="px-6 sm:px-8 py-2.5 sm:py-3 text-white text-sm font-bold rounded-xl"
                    style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>Browse File</span>
                </>
              )}
            </div>
            {file && (
              <button onClick={checkATS} disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 sm:py-4 rounded-xl transition-all text-sm disabled:opacity-60"
                style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />Analysing…</>
                  : <><ShieldCheck className="w-4 h-4" />Run ATS Check</>}
              </button>
            )}
          </div>
        </div>

        {/* What we analyse — 2 cols on mobile */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 flex items-center justify-between"
            style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">What We Analyse</p>
            <span className="text-xs text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full font-semibold">{CHECKS.length} checks</span>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {CHECKS.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background:'linear-gradient(135deg,#fdf2f8,#f5f3ff)', border:'1px solid #e9d5ff' }}>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-gray-800">{c.title}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature cards — 1 col mobile, 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 w-full">
          {FEATURES.map(({ Icon, title, body, color, bg, border }, i) => (
            <div key={i} className={`bg-white rounded-2xl border ${border} p-4 sm:p-6 flex items-start gap-3 sm:gap-4`}>
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-800 mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-100 mt-auto">
          <span className="text-xs text-gray-400">ATS Format Checker — JobMorph AI</span>
        </div>
      </div>
    </div>
  );

  /* ══ RESULTS VIEW ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="ATS Format Checker" pageName="ATS Checker" icon={ShieldCheck} navigate={navigate} showReset onReset={reset} />

      <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100"
            style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ATS Score</p>
          </div>
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
              <ScoreRing score={result.score} grade={grade} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl sm:text-2xl font-black leading-none ${grade.color}`}>{result.score}</span>
                <span className="text-[10px] text-gray-400 font-semibold mt-0.5">/ 100</span>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900">{result.passed ? 'Passed ATS Check' : 'Issues Detected'}</h2>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${grade.pill}`}>{grade.label}</span>
                {result.passed ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full bg-gradient-to-r ${grade.bar}`}
                  style={{ width:`${result.score}%`, transition:'width 1.2s ease' }} />
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${result.issues?.length ? 'bg-red-50 text-red-600 ring-red-200' : 'bg-gray-100 text-gray-400 ring-gray-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${result.issues?.length ? 'bg-red-500' : 'bg-gray-300'}`} />
                  {result.issues?.length || 0} issues
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${result.warnings?.length ? 'bg-amber-50 text-amber-600 ring-amber-200' : 'bg-gray-100 text-gray-400 ring-gray-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${result.warnings?.length ? 'bg-amber-400' : 'bg-gray-300'}`} />
                  {result.warnings?.length || 0} warnings
                </span>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 w-full sm:w-auto sm:min-w-[160px]">
              <button onClick={fixAndDownload} disabled={fixing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shadow-sm"
                style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                {fixing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Processing…</> : <><Download className="w-3.5 h-3.5" />{hasIssues ? 'Fix & Download' : 'Download'}</>}
              </button>
              <button onClick={reset} className="flex-1 sm:flex-none text-xs text-gray-400 hover:text-purple-600 font-medium transition-colors text-center py-1 border border-gray-200 rounded-xl sm:border-none">
                Check another
              </button>
            </div>
          </div>
        </div>

        {/* Main grid — stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

          {/* LEFT */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Issues */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 flex items-center justify-between"
                style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {hasIssues ? `${result.issues.length} Issues` : 'No Issues'}
                </span>
                {hasIssues && (
                  <div className="flex items-center gap-1">
                    {['critical','high','medium','low'].map(s => {
                      const n = result.issues.filter(i => i.severity === s).length;
                      return n > 0 ? (
                        <span key={s} className={`w-5 h-5 rounded-full ${SEVERITY[s].dot} flex items-center justify-center text-white`}
                          style={{ fontSize:9, fontWeight:700 }}>{n}</span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              {hasIssues ? (
                <div className="divide-y divide-gray-50 max-h-72 sm:max-h-80 overflow-y-auto">
                  {result.issues.map((issue, idx) => {
                    const sev = SEVERITY[issue.severity] || SEVERITY.low;
                    return (
                      <div key={idx}
                        className={`px-4 sm:px-5 py-3 sm:py-3.5 border-l-[3px] ${sev.border} hover:bg-gray-50 transition-colors cursor-pointer`}>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2 ${sev.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">{issue.title}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ring-1 flex-shrink-0 mt-0.5 ${sev.badge}`}>{sev.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{issue.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 py-8 sm:py-10 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background:'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                    <ShieldCheck className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">Resume is ATS-compatible</p>
                  <p className="text-xs text-gray-400">No formatting issues were detected.</p>
                </div>
              )}
            </div>

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100"
                  style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{result.warnings.length} Warnings</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {result.warnings.map((w, idx) => (
                    <div key={idx} className="px-4 sm:px-5 py-3 sm:py-3.5 border-l-[3px] border-l-amber-400 flex items-start gap-2 sm:gap-3">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-800">{w.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{w.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rebuild tools */}
            {hasIssues && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100"
                  style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Rebuild With</p>
                </div>
                <div className="p-3 sm:p-4 grid grid-cols-2 gap-2">
                  {TOOLS.map((tool, i) => (
                    <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer"
                      className="group flex flex-col gap-1 p-2.5 sm:p-3 rounded-xl border border-gray-100 hover:border-purple-200 bg-gray-50 hover:bg-white transition-all">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-bold text-gray-800">{tool.name}</p>
                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-px rounded w-fit">{tool.type}</span>
                      <p className="text-[11px] text-gray-400 leading-snug">{tool.note}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Preview (hidden on mobile unless useful) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
              <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Resume Preview</span>
                </div>
                {preview?.length > 0 && (
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setZoom(z => Math.max(0.4, +(z-0.1).toFixed(1)))} className="p-1 sm:p-1.5 rounded hover:bg-white transition-colors text-gray-500"><ZoomOut className="w-3 h-3" /></button>
                    <span className="text-xs font-semibold text-gray-600 w-8 sm:w-10 text-center">{Math.round(zoom*100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2, +(z+0.1).toFixed(1)))} className="p-1 sm:p-1.5 rounded hover:bg-white transition-colors text-gray-500"><ZoomIn className="w-3 h-3" /></button>
                  </div>
                )}
              </div>

              {preview?.length > 1 && (
                <div className="px-4 sm:px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <button onClick={() => setCurrentPage(p => Math.max(0,p-1))} disabled={currentPage===0} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
                  <span className="text-xs font-medium text-gray-500">Page {currentPage+1} of {preview.length}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(preview.length-1,p+1))} disabled={currentPage===preview.length-1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-25"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
                </div>
              )}

              <div className="p-3 sm:p-4 flex-1">
                {loadingPreview ? (
                  <div className="flex flex-col items-center justify-center h-48 sm:h-64 gap-3">
                    <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                    <p className="text-sm text-gray-400">Generating preview…</p>
                  </div>
                ) : preview?.length > 0 ? (
                  <>
                    <div ref={previewRef} className="border border-gray-200 rounded-xl overflow-auto bg-gray-50 max-h-[400px] sm:max-h-[600px] shadow-inner">
                      <img src={preview[currentPage].image} alt={`Resume page ${currentPage+1}`} className="mx-auto block"
                        style={{ transform:`scale(${zoom})`, transformOrigin:'top center', transition:'transform 0.2s ease' }} />
                    </div>
                    {hasIssues && (
                      <div className="mt-3 flex items-start gap-2 sm:gap-2.5 rounded-xl p-3 sm:p-3.5 border border-amber-200 bg-amber-50">
                        <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Use <span className="font-bold">Fix &amp; Download</span> to resolve all issues automatically.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 sm:h-64 gap-3 text-center">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background:'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                      <FileText className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-semibold">Preview unavailable</p>
                    <p className="text-xs text-gray-400">You can still download the optimised version.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action strip */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {hasIssues ? 'Resolve all issues and download your optimised resume' : 'Your resume passed — download the verified version'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {hasIssues ? 'All formatting issues fixed automatically.' : 'No changes needed. Your resume is ready.'}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
            <button onClick={reset} className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-xl hover:border-purple-300 hover:text-purple-700 transition-all">New Check</button>
            <button onClick={fixAndDownload} disabled={fixing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 shadow-sm"
              style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
              {fixing
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Processing…</>
                : <><Download className="w-4 h-4" />{hasIssues ? 'Fix & Download' : 'Download'}</>}
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">ATS Format Checker — JobMorph AI</span>
        </div>
      </div>
    </div>
  );
}