// src/pages/HowItWorks.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Brain,
  BarChart2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Rocket,
  Lock,
  Bot,
  Mic,
  Building2,
  Target,
  ShieldCheck,
  KeyRound,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    Icon: Upload,
    title: 'Upload Your Resume',
    subtitle: 'Start with your existing resume',
    accentColor: '#0ea5e9',
    accentLight: '#f0f9ff',
    accentBorder: '#bae6fd',
    details: [
      'Supports PDF and DOCX formats',
      'Drag & drop or click to browse',
      'File size up to 10 MB',
      'Your resume is encrypted immediately',
    ],
  },
  {
    number: '02',
    Icon: FileText,
    title: 'Paste Job Description',
    subtitle: 'From LinkedIn, Naukri, or any job board',
    accentColor: '#3b82f6',
    accentLight: '#eff6ff',
    accentBorder: '#bfdbfe',
    details: [
      'Copy JD from any job portal',
      'Paste the full description for best results',
      'Supports PDF, DOCX, and TXT formats',
      'Include role, requirements & responsibilities',
    ],
  },
  {
    number: '03',
    Icon: Brain,
    title: 'AI Analyses in 30 Seconds',
    subtitle: 'Our AI reads, compares and scores everything',
    accentColor: '#8b5cf6',
    accentLight: '#f5f3ff',
    accentBorder: '#ddd6fe',
    details: [
      'Scans 50+ matching parameters',
      'Checks keywords, skills, and experience',
      'Detects ATS compatibility issues',
      'Compares tone and role alignment',
    ],
  },
  {
    number: '04',
    Icon: BarChart2,
    title: 'Get Your Results',
    subtitle: 'Detailed insights, not just a number',
    accentColor: '#e91e8c',
    accentLight: '#fdf2f8',
    accentBorder: '#f9a8d4',
    details: [
      'Overall match score from 0–100%',
      'Missing keywords to add to your resume',
      'Skills gap analysis with learning resources',
      'ATS issues flagged with auto-fix option',
    ],
  },
];

/* ── Demo components ─────────────────────────────────────────── */
function UploadDemo() {
  const [uploaded, setUploaded] = useState(false);
  return (
    <div className="space-y-4">
      <div
        onClick={() => setUploaded(v => !v)}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          uploaded
            ? 'border-emerald-300 bg-emerald-50/40'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'
        }`}
      >
        {uploaded ? (
          <div className="space-y-2 flex flex-col items-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            <p className="font-bold text-gray-800 text-sm">Resume_John.pdf</p>
            <p className="text-xs text-emerald-600 font-medium">Uploaded successfully!</p>
            <p className="text-xs text-gray-400">Click to reset</p>
          </div>
        ) : (
          <div className="space-y-3 flex flex-col items-center">
            <Upload className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-gray-700">Drag & drop your resume here</p>
            <p className="text-xs text-gray-400">or click to upload · PDF, DOCX</p>
            <span
              className="inline-block px-4 py-2 text-white text-xs font-bold rounded-xl"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
            >
              Browse Files
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        {[
          { icon: <Lock className="w-3 h-3" />, label: 'SSL Encrypted' },
          { icon: <FileText className="w-3 h-3" />, label: 'Max 10 MB' },
          { icon: <CheckCircle className="w-3 h-3" />, label: 'PDF & DOCX' },
        ].map(({ icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg font-medium"
          >
            {icon} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PasteDemo() {
  const sample = `Senior Software Engineer — React\n\nWe are looking for a skilled React developer with:\n• 3+ years of experience with React.js\n• Strong knowledge of TypeScript & REST APIs\n• Experience with Node.js and MongoDB\n• Familiarity with AWS or GCP\n• Good communication skills`;
  const [text, setText] = useState('');
  const [filled, setFilled] = useState(false);
  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste the job description here…"
        rows={8}
        className="w-full border border-gray-200 rounded-xl p-4 text-xs text-gray-700 resize-none bg-gray-50 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { setText(sample); setFilled(true); }}
          className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
        >
          {filled ? (
            <><CheckCircle className="w-3.5 h-3.5" /> Sample Loaded</>
          ) : (
            <><FileText className="w-3.5 h-3.5" /> Load Sample JD</>
          )}
        </button>
        {text && (
          <button
            onClick={() => { setText(''); setFilled(false); }}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-200 transition-all"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function AnalyzeDemo() {
  const [phase, setPhase] = useState('idle');
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState([]);

  const aiSteps = [
    { label: 'Reading resume content…',      ms: 800 },
    { label: 'Parsing job description…',     ms: 600 },
    { label: 'Matching keywords & skills…',  ms: 900 },
    { label: 'Checking ATS compatibility…',  ms: 700 },
    { label: 'Generating match score…',      ms: 500 },
    { label: 'Building recommendations…',    ms: 600 },
  ];

  const run = async () => {
    setPhase('running'); setDone([]); setCurrent(0);
    for (let i = 0; i < aiSteps.length; i++) {
      setCurrent(i);
      await new Promise(r => setTimeout(r, aiSteps[i].ms));
      setDone(p => [...p, i]);
    }
    setPhase('done');
  };

  const reset = () => { setPhase('idle'); setCurrent(0); setDone([]); };

  return (
    <div className="space-y-4">
      {phase === 'idle' && (
        <div className="text-center py-8 flex flex-col items-center">
          <Brain className="w-14 h-14 text-purple-300 mb-4" strokeWidth={1.2} />
          <p className="text-sm text-gray-500 mb-5">Click below to watch the AI analyse a resume in real-time</p>
          <button
            onClick={run}
            className="flex items-center gap-2 px-7 py-3 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
          >
            <Sparkles className="w-4 h-4" /> Start Analysis Demo
          </button>
        </div>
      )}
      {(phase === 'running' || phase === 'done') && (
        <div className="space-y-2">
          {aiSteps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                done.includes(i)
                  ? 'bg-emerald-50 border-emerald-100'
                  : i === current && phase === 'running'
                  ? 'bg-purple-50 border-purple-100'
                  : 'bg-gray-50 border-gray-100 opacity-40'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done.includes(i)
                    ? 'bg-emerald-500'
                    : i === current && phase === 'running'
                    ? 'animate-pulse'
                    : 'bg-gray-300'
                }`}
                style={
                  i === current && phase === 'running'
                    ? { background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }
                    : {}
                }
              >
                {done.includes(i) ? (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                ) : (
                  <span className="text-white text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  done.includes(i)
                    ? 'text-emerald-700'
                    : i === current
                    ? 'text-purple-700'
                    : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
          {phase === 'done' && (
            <div className="p-4 rounded-xl text-center border border-emerald-200 bg-emerald-50 mt-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-700">Analysis Complete! Score: 87%</p>
              </div>
              <button onClick={reset} className="text-xs text-gray-400 underline mt-1">Run again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultsDemo() {
  const [tab, setTab] = useState('score');
  const tabs = [
    { id: 'score',    label: 'Score',    Icon: BarChart2    },
    { id: 'keywords', label: 'Keywords', Icon: KeyRound     },
    { id: 'ats',      label: 'ATS',      Icon: Bot          },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
            style={
              tab === t.id
                ? { background: 'linear-gradient(135deg,#e91e8c,#7c3aed)', color: 'white' }
                : { background: '#f3f4f6', color: '#4b5563' }
            }
          >
            <t.Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'score' && (
        <div className="p-5 bg-white border border-gray-100 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">Overall Match</span>
            <span className="text-3xl font-extrabold text-emerald-600">87%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: '87%', background: 'linear-gradient(90deg,#e91e8c,#7c3aed)' }}
            />
          </div>
          {[['Technical Skills', 92], ['Experience Level', 78], ['Soft Skills', 85]].map(([label, score]) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className="font-bold text-gray-700">{score}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${score}%`, background: 'linear-gradient(90deg,#e91e8c,#7c3aed)' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'keywords' && (
        <div className="p-5 bg-white border border-gray-100 rounded-xl space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Found in your resume</p>
          <div className="flex flex-wrap gap-2">
            {['React.js', 'TypeScript', 'REST APIs', 'Node.js', 'Git'].map(k => (
              <span
                key={k}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium border border-emerald-100"
              >
                <CheckCircle className="w-3 h-3" /> {k}
              </span>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide pt-1">Missing — add these</p>
          <div className="flex flex-wrap gap-2">
            {['MongoDB', 'AWS', 'GCP', 'CI/CD'].map(k => (
              <span
                key={k}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-full font-medium border border-red-100"
              >
                <XCircle className="w-3 h-3" /> {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'ats' && (
        <div className="p-5 bg-white border border-gray-100 rounded-xl space-y-2">
          {[
            { Icon: CheckCircle,   text: 'Standard font detected',                        level: 'ok'   },
            { Icon: CheckCircle,   text: 'No tables or columns found',                    level: 'ok'   },
            { Icon: AlertTriangle, text: 'Header contains contact info — may be skipped', level: 'warn' },
            { Icon: XCircle,       text: 'Image found — ATS cannot read images',          level: 'bad'  },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs font-medium ${
                item.level === 'ok'
                  ? 'bg-emerald-50 text-emerald-700'
                  : item.level === 'warn'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              <item.Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const demoComponents = [UploadDemo, PasteDemo, AnalyzeDemo, ResultsDemo];

const allFeatures = [
  { Icon: BarChart2,  title: 'AI Match Score',    slug: 'match-score',      desc: 'Instant score showing how well your resume matches the JD across 50+ parameters.'          },
  { Icon: Bot,        title: 'ATS Checker',       slug: 'ats-checker',      desc: 'Detect formatting issues that prevent ATS systems from reading your resume.'                },
  { Icon: Mic,        title: 'Interview Prep',    slug: 'interview-prep',   desc: 'Role-specific interview questions and key concepts to revise based on the JD.'              },
  { Icon: Building2,  title: 'Company Research',  slug: 'company-research', desc: 'Understand company culture, values, and role expectations before your interview.'           },
  { Icon: Target,     title: 'Batch Job Matcher', slug: 'job-ranking',      desc: 'Upload multiple JDs and rank them by how well your resume fits each one.'                   },
  { Icon: ShieldCheck,title: 'Secure & Private',  slug: null,               desc: 'Your resume is encrypted and never shared with anyone. Complete privacy guaranteed.'        },
];

/* ── Main ────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const ActiveDemo = demoComponents[activeStep];
  const step = steps[activeStep];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-50 bg-white border-b border-gray-100 px-8"
        style={{ height: '56px', display: 'flex', alignItems: 'center' }}
      >
        <div className="flex items-center justify-between w-full gap-4">

          {/* Left: Logo + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-xs"
                style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
              >
                J
              </div>
              <span
                className="text-sm font-extrabold tracking-wide hidden sm:block"
                style={{
                  background: 'linear-gradient(135deg,#e91e8c,#7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                JOBMORPH
              </span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden sm:block" />
            <span className="text-xs font-semibold text-gray-500 hidden sm:block">How It Works</span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all hidden sm:flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold text-gray-600 hover:text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-50 transition-all hidden md:block"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-14">

        {/* ── Page header ──────────────────────────────────── */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 border"
            style={{ background: '#fdf2f8', borderColor: '#f9a8d4', color: '#e91e8c' }}
          >
            <Sparkles className="w-3.5 h-3.5" /> Complete Walkthrough
          </div>
          <h1 className="text-4xl font-extrabold mb-3" style={{ color: '#1e1b4b' }}>
            How JobMorph Works
          </h1>
          <p className="text-base text-gray-400 max-w-xl mx-auto">
            4 simple steps. 30 seconds. Know exactly where you stand before you apply.
          </p>
        </div>

        {/* ── Step tabs ────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border"
              style={
                activeStep === i
                  ? { background: 'linear-gradient(135deg,#e91e8c,#7c3aed)', color: 'white', borderColor: 'transparent' }
                  : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
              }
            >
              <s.Icon className="w-3.5 h-3.5" />
              <span>Step {s.number}</span>
              <span className="hidden sm:block">— {s.title}</span>
            </button>
          ))}
        </div>

        {/* ── Step content ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-10 items-start mb-14">

          {/* Left — info */}
          <div className="space-y-6">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border"
                style={{ background: step.accentLight, borderColor: step.accentBorder, color: step.accentColor }}
              >
                Step {step.number} of 04
              </div>
              <h2 className="text-3xl font-extrabold mb-2 flex items-center gap-3" style={{ color: '#1e1b4b' }}>
                <step.Icon className="w-8 h-8" style={{ color: step.accentColor }} strokeWidth={1.8} />
                {step.title}
              </h2>
              <p className="text-base text-gray-400">{step.subtitle}</p>
            </div>

            <div
              className="p-6 rounded-2xl border space-y-3"
              style={{ background: step.accentLight, borderColor: step.accentBorder }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: step.accentColor }}
              >
                What happens here
              </p>
              {step.details.map((d, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
                  >
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-gray-600 leading-relaxed">{d}</span>
                </div>
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex gap-3">
              {activeStep > 0 && (
                <button
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:border-purple-300 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous
                </button>
              )}
              {activeStep < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
                >
                  Next Step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
                >
                  <Rocket className="w-3.5 h-3.5" /> Try It Now
                </Link>
              )}
            </div>
          </div>

          {/* Right — demo */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div
              className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}
            >
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
              </div>
              <span className="text-[11px] text-gray-400 font-medium">Interactive Demo — Step {step.number}</span>
            </div>
            <div className="p-5">
              <ActiveDemo />
            </div>
          </div>
        </div>

        {/* ── Progress bar ─────────────────────────────────── */}
        <div className="max-w-xl mx-auto mb-20">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{activeStep + 1} / {steps.length} steps</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((activeStep + 1) / steps.length) * 100}%`,
                background: 'linear-gradient(90deg,#e91e8c,#7c3aed)',
              }}
            />
          </div>
        </div>

        {/* ── Features grid ────────────────────────────────── */}
        <div className="mb-10">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#e91e8c' }}>
              What You Get After Analysis
            </p>
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#1e1b4b' }}>Explore All Features</h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Each feature gives you a clear edge in your job search. Click to see how each one works with a live demo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {allFeatures.map(({ Icon, title, slug, desc }, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:border-purple-200 hover:shadow-sm transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)', border: '1px solid #e9d5ff' }}
                >
                  <Icon className="w-6 h-6" style={{ color: '#7c3aed' }} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-extrabold text-gray-800 mb-2">{title}</p>
                <p className="text-xs text-gray-400 leading-relaxed flex-1">{desc}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {slug ? (
                    <Link
                      to={`/features/${slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
                    >
                      Read More <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border"
                      style={{ background: '#fdf2f8', borderColor: '#f9a8d4', color: '#e91e8c' }}
                    >
                      <Lock className="w-3 h-3" /> Always Enabled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-8 py-12 text-center border border-purple-100"
          style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}
        >
          <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#1e1b4b' }}>
            Ready to Analyse Your Resume?
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto">
            Now that you know how it works — try it yourself. Free, instant, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/signup"
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
            >
              <Rocket className="w-4 h-4" /> Get My Match Score
            </Link>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:border-purple-300 hover:text-purple-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">No credit card · No spam · Results in 30 seconds</p>
        </div>

      </div>
    </div>
  );
}