// src/pages/BatchJobMatcher.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  Upload, FileText, X, ChevronRight, Target, Sparkles,
  Trophy, AlertCircle, CheckCircle2, Lightbulb, RefreshCw,
  XCircle, Plus, BarChart2, Zap,
} from 'lucide-react';

/* ─── helpers ───────────────────────────────────────────────── */
const getScoreConfig = (s) =>
  s >= 85 ? { color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200', bar:'from-emerald-400 to-emerald-600', pill:'bg-emerald-50 text-emerald-700 ring-emerald-200' }
: s >= 70 ? { color:'text-blue-600',    bg:'bg-blue-50',    border:'border-blue-200',    bar:'from-blue-400 to-blue-600',       pill:'bg-blue-50 text-blue-700 ring-blue-200'           }
: s >= 60 ? { color:'text-amber-600',   bg:'bg-amber-50',   border:'border-amber-200',   bar:'from-amber-400 to-amber-500',     pill:'bg-amber-50 text-amber-700 ring-amber-200'        }
:           { color:'text-red-600',     bg:'bg-red-50',     border:'border-red-200',     bar:'from-red-400 to-red-500',         pill:'bg-red-50 text-red-700 ring-red-200'              };

const getRankStyle = (r) =>
  r === 1 ? { bg:'bg-yellow-400',  text:'text-yellow-900', label:'🥇' }
: r === 2 ? { bg:'bg-gray-300',    text:'text-gray-800',   label:'🥈' }
: r === 3 ? { bg:'bg-orange-400',  text:'text-orange-900', label:'🥉' }
:           { bg:'bg-purple-100',  text:'text-purple-700', label:`#${r}` };

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar({ title, onReset, showReset, navigate }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-8"
      style={{ height:'56px', display:'flex', alignItems:'center' }}>
      <div className="flex items-center justify-between w-full gap-3">

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
            <Target size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            {/* Breadcrumb hidden on mobile to avoid overflow */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
              <span className="hover:text-purple-600 cursor-pointer transition-colors"
                onClick={() => navigate('/dashboard')}>Dashboard</span>
              <ChevronRight size={10} />
              <span className="text-gray-500 font-medium">Batch Job Matcher</span>
            </div>
            <h1 className="text-sm font-semibold text-gray-900 leading-none truncate">{title}</h1>
          </div>
        </div>

        {showReset && (
          <button onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-3 py-2 rounded-lg transition-all flex-shrink-0">
            <RefreshCw size={12} /> <span className="hidden sm:inline">New Analysis</span><span className="sm:hidden">Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function BatchJobMatcher() {
  const [resume,      setResume]      = useState(null);
  const [jdFiles,     setJdFiles]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState(null);
  const [progress,    setProgress]    = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [resumeDrag,  setResumeDrag]  = useState(false);
  const [jdDrag,      setJdDrag]      = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  const acceptResume = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf','docx'].includes(ext)) { alert('Only PDF and DOCX allowed.'); return; }
    if (f.size > 10*1024*1024) { alert('Resume exceeds 10MB.'); return; }
    setResume(f); setError(null);
  };

  const acceptJds = (files) => {
    const valid = files.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      if (!['pdf','docx','txt'].includes(ext)) { alert(`${f.name}: invalid format. Skipping.`); return false; }
      if (f.size > 15*1024*1024) { alert(`${f.name}: exceeds 15MB. Skipping.`); return false; }
      return true;
    });
    setJdFiles(prev => {
      const names = prev.map(f => f.name);
      return [...prev, ...valid.filter(f => !names.includes(f.name))];
    });
    setError(null);
  };

  const handleBatchAnalyze = async () => {
    if (!resume)         { alert('Please upload your resume first.'); return; }
    if (!jdFiles.length) { alert('Please upload at least one job description.'); return; }
    if (!currentUser)    { navigate('/login', { state:{ from:'/batch-matcher' } }); return; }
    setLoading(true); setError(null); setProgress(0); setResults(null);
    try {
      const idToken = await currentUser.getIdToken(true);
      const fd = new FormData();
      fd.append('resume', resume);
      jdFiles.forEach(f => fd.append('jds', f));
      const iv = setInterval(() => setProgress(p => p >= 90 ? p : p + 10), 500);
      const res = await axios.post('/api/batch/analyze', fd, { headers:{ Authorization:`Bearer ${idToken}` } });
      clearInterval(iv); setProgress(100);
      if (!res.data.success) { setError(res.data.error || 'Analysis failed'); return; }
      setResults(res.data.results);
    } catch(err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const resetAll = () => { setResults(null); setResume(null); setJdFiles([]); setError(null); setProgress(0); };

  /* ══ UPLOAD VIEW ════════════════════════════════════════════ */
  if (!results) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Batch Job Matcher" navigate={navigate} showReset={false} />

      {/* Mobile-safe padding: px-4 on phones, px-8 on desktop */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5">

        {/* Two-column upload — stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

          {/* Resume upload */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100"
              style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Your Resume</p>
              <p className="text-xs text-gray-400 mt-0.5">PDF or DOCX · max 10 MB</p>
            </div>
            <div className="p-4 sm:p-5">
              <div
                onDragOver={(e) => { e.preventDefault(); setResumeDrag(true); }}
                onDragLeave={() => setResumeDrag(false)}
                onDrop={(e) => { e.preventDefault(); setResumeDrag(false); acceptResume(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('resumeInput').click()}
                className={`w-full flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-10 sm:py-14
                  ${resumeDrag ? 'border-purple-400 bg-purple-50/40'
                  : resume     ? 'border-emerald-300 bg-emerald-50/40'
                  :               'border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'}`}
              >
                <input id="resumeInput" type="file" accept=".pdf,.docx"
                  onChange={(e) => acceptResume(e.target.files[0])} className="hidden" />

                {resume ? (
                  <>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{resume.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{(resume.size/1024).toFixed(0)} KB · tap to change</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 size={14} /> Resume ready
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
                      style={{ background:'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                      <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-700">Drag & drop your resume</p>
                      <p className="text-xs text-gray-400 mt-1">PDF or DOCX · max 10 MB</p>
                    </div>
                    <span className="px-5 py-2.5 text-white text-xs font-bold rounded-xl"
                      style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>Browse File</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* JD upload */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between"
              style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Job Descriptions</p>
                <p className="text-xs text-gray-400 mt-0.5">PDF, DOCX or TXT · max 15 MB each</p>
              </div>
              {jdFiles.length > 0 && (
                <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full flex-shrink-0">
                  {jdFiles.length} file{jdFiles.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
              <div
                onDragOver={(e) => { e.preventDefault(); setJdDrag(true); }}
                onDragLeave={() => setJdDrag(false)}
                onDrop={(e) => { e.preventDefault(); setJdDrag(false); acceptJds(Array.from(e.dataTransfer.files)); }}
                onClick={() => document.getElementById('jdInput').click()}
                className={`w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-7 sm:py-8
                  ${jdDrag          ? 'border-purple-400 bg-purple-50/40'
                  : jdFiles.length  ? 'border-purple-200 bg-purple-50/20'
                  :                   'border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'}`}
              >
                <input id="jdInput" type="file" accept=".pdf,.docx,.txt"
                  onChange={(e) => acceptJds(Array.from(e.target.files))} className="hidden" multiple />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                  <Plus size={18} className="text-purple-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-700">
                    {jdFiles.length ? 'Add more job descriptions' : 'Drag & drop job descriptions'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Select multiple files at once</p>
                </div>
              </div>

              {jdFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                  {jdFiles.map((file, idx) => (
                    <div key={idx}
                      className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl group hover:border-purple-200 transition-all">
                      <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={11} className="text-purple-500" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 flex-1 truncate">{file.name}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{(file.size/1024).toFixed(0)} KB</span>
                      <button onClick={() => setJdFiles(p => p.filter((_,i) => i !== idx))}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Analyze button */}
        <button
          onClick={handleBatchAnalyze}
          disabled={loading || !resume || !jdFiles.length}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: (loading || !resume || !jdFiles.length)
              ? '#d1d5db'
              : 'linear-gradient(135deg,#e91e8c,#7c3aed)',
            color: (loading || !resume || !jdFiles.length) ? '#6b7280' : 'white',
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Analysing {jdFiles.length} job{jdFiles.length !== 1 ? 's' : ''}… {progress}%
            </>
          ) : (
            <>
              <Zap size={16} />
              Analyse &amp; Rank {jdFiles.length || 0} Job{jdFiles.length !== 1 ? 's' : ''}
            </>
          )}
        </button>

        {/* Loading progress bar */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500">Analysing with AI…</p>
              <p className="text-xs font-bold text-purple-600">{progress}%</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width:`${progress}%`, background:'linear-gradient(90deg,#e91e8c,#7c3aed)' }} />
            </div>
          </div>
        )}

        {/* Tip cards — 1 col mobile, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { Icon:Target,    color:'text-purple-600', bg:'bg-purple-50',  border:'border-purple-100',  title:'Ranked Results',     body:'Jobs sorted by AI match score from highest to lowest.' },
            { Icon:Sparkles,  color:'text-pink-600',   bg:'bg-pink-50',    border:'border-pink-100',    title:'AI Recommendations', body:'Personalised tips to improve your score for each role.' },
            { Icon:BarChart2, color:'text-emerald-600',bg:'bg-emerald-50', border:'border-emerald-100', title:'Gap Analysis',        body:'See exactly which skills are missing for each position.' },
          ].map(({ Icon, color, bg, border, title, body }, i) => (
            <div key={i} className={`bg-white rounded-2xl border ${border} p-4 sm:p-5 flex items-start gap-3`}>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={17} className={color} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-800 mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Batch Job Matcher — JobMorph AI</span>
        </div>
      </div>
    </div>
  );

  /* ══ RESULTS — empty ════════════════════════════════════════ */
  if (results.length === 0) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Ranked Job Matches" navigate={navigate} showReset onReset={resetAll} />
      <div className="flex flex-col items-center justify-center gap-4 text-center px-4 py-24">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
          style={{ background:'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
          <AlertCircle size={28} className="text-purple-400" />
        </div>
        <h3 className="text-base font-extrabold text-gray-800">No Matches Found</h3>
        <p className="text-sm text-gray-400 max-w-xs">None of the job descriptions could be processed. Please check your file formats.</p>
        <button onClick={resetAll}
          className="mt-2 px-6 py-3 text-sm font-bold text-white rounded-xl"
          style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>Try Again</button>
      </div>
    </div>
  );

  /* ══ RESULTS VIEW ═══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Ranked Job Matches" navigate={navigate} showReset onReset={resetAll} />

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4">

        {/* Summary strip — scrollable on mobile */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100"
            style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Match Summary</p>
          </div>
          <div className="px-4 sm:px-5 py-4 flex gap-3 overflow-x-auto">
            {[
              { label:'Total Jobs',   value:results.length,                                    color:'text-gray-800'    },
              { label:'Strong Match', value:results.filter(r=>r.score>=85).length,             color:'text-emerald-600' },
              { label:'Good Match',   value:results.filter(r=>r.score>=70&&r.score<85).length, color:'text-blue-600'    },
              { label:'Needs Work',   value:results.filter(r=>r.score<70).length,              color:'text-amber-600'   },
              { label:'Top Score',    value:`${Math.max(...results.map(r=>r.score))}%`,         color:'text-purple-600'  },
            ].map((s,i) => (
              <div key={i} className="flex flex-col items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex-shrink-0">
                <span className={`text-xl font-extrabold ${s.color}`}>{s.value}</span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5 whitespace-nowrap">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Job result cards */}
        {results.map((job, idx) => {
          const sc = getScoreConfig(job.score);
          const rk = getRankStyle(job.rank);
          return (
            <div key={idx} className={`bg-white rounded-2xl border-2 ${sc.border} overflow-hidden`}>

              {/* Card header */}
              <div className="px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 border-b border-gray-100"
                style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-extrabold ${rk.bg} ${rk.text}`}>
                  {rk.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-gray-900 truncate">{job.jd_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{job.match_quality} Match · Priority: {job.priority}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-2xl sm:text-3xl font-black leading-none ${sc.color}`}>{job.score}%</p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">match score</p>
                </div>
              </div>

              {/* Score bar */}
              <div className="h-1.5 bg-gray-100">
                <div className={`h-full bg-gradient-to-r ${sc.bar} transition-all duration-700`}
                  style={{ width:`${job.score}%` }} />
              </div>

              {/* Body — stack on mobile */}
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {job.missing_keywords?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                        <XCircle size={12} className="text-red-500" />
                      </div>
                      <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                        Missing Skills <span className="text-red-500 font-bold normal-case">({job.missing_keywords.length})</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {job.missing_keywords.slice(0,10).map((skill, i) => (
                        <span key={i} className="text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-lg">
                          {skill}
                        </span>
                      ))}
                      {job.missing_keywords.length > 10 && (
                        <span className="text-[11px] text-gray-400 font-medium px-2 py-1">
                          +{job.missing_keywords.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {job.suggestions?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                        <Lightbulb size={12} className="text-amber-500" />
                      </div>
                      <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">AI Recommendations</p>
                    </div>
                    <ul className="space-y-2">
                      {job.suggestions.slice(0,3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-[9px] font-bold"
                            style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>{i+1}</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Batch Job Matcher — JobMorph AI</span>
        </div>
      </div>
    </div>
  );
}