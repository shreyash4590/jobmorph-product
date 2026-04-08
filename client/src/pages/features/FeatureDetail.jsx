// src/pages/FeatureDetail.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// ─── FEATURE DATA ────────────────────────────────────────────────
const featureData = {
  'match-score': {
    icon: '🤖',
    title: 'Resume vs JD Match Score',
    tagline: 'Know your chances before you apply',
    accentColor: '#0ea5e9',
    accentLight: '#f0f9ff',
    accentBorder: '#bae6fd',
    whatItDoes: 'JobMorph compares your resume against a job description across 50+ parameters — skills, keywords, experience level, tone, and role alignment — and gives you a score from 0 to 100%.',
    whyItMatters: "Recruiters spend 6 seconds on a resume. If your resume doesn't match the JD, it won't even reach a human. This score tells you exactly where you stand before wasting an application.",
    steps: [
      { num: '01', title: 'Upload your resume',         desc: 'PDF or DOCX, up to 10 MB'                              },
      { num: '02', title: 'Upload the job description', desc: 'Copy from LinkedIn, Naukri, or any job portal'          },
      { num: '03', title: 'Click Analyse',              desc: 'AI processes both documents in under 30 seconds'        },
      { num: '04', title: 'Read your score',            desc: 'See match %, missing skills, and improvement tips'      },
    ],
    tips: [
      'Aim for 70%+ before applying to any role',
      'A score below 50% means your resume needs tailoring for that JD',
      'Use the missing keyword list to quickly close the gap',
      'Re-scan after editing — your score updates instantly',
    ],
    demoType: 'match-score',
  },
  'ats-checker': {
    icon: '📄',
    title: 'ATS Format Checker',
    tagline: 'Make sure robots can actually read your resume',
    accentColor: '#3b82f6',
    accentLight: '#eff6ff',
    accentBorder: '#bfdbfe',
    whatItDoes: "ATS systems are software companies use to filter resumes before a human ever sees them. JobMorph scans your resume's structure and flags anything that breaks ATS parsing — tables, images, columns, fonts, and more.",
    whyItMatters: "75% of resumes are rejected by ATS before reaching a recruiter. Common culprits: tables, images, fancy fonts, columns, and contact info in headers. We catch all of them and auto-fix.",
    steps: [
      { num: '01', title: 'Upload your resume',        desc: 'We parse the actual PDF or DOCX file structure'         },
      { num: '02', title: 'ATS scan runs instantly',   desc: 'Checks fonts, images, tables, columns, headers'         },
      { num: '03', title: 'Review flagged issues',     desc: 'Each issue is labelled Critical, Warning, or OK'        },
      { num: '04', title: 'Fix & download',            desc: 'Auto-fix all issues and download a clean version'       },
    ],
    tips: [
      'Never use tables or multi-column layouts in your resume',
      'Avoid putting contact info in the page header or footer',
      'Stick to standard fonts: Arial, Calibri, or Times New Roman',
      'Remove profile photos — ATS systems cannot read images',
    ],
    demoType: 'ats-checker',
  },
  'interview-prep': {
    icon: '🎤',
    title: 'Interview Prep',
    tagline: 'Walk into every interview fully prepared',
    accentColor: '#8b5cf6',
    accentLight: '#f5f3ff',
    accentBorder: '#ddd6fe',
    whatItDoes: 'Based on the job description you paste, JobMorph generates role-specific interview questions, key concepts to revise, and a focused prep checklist — so you know exactly what to study.',
    whyItMatters: 'Generic interview prep is useless. A Data Engineer interview at a startup is completely different from one at a bank. We generate questions specific to your role, your company, and your experience level.',
    steps: [
      { num: '01', title: 'Paste the job description', desc: 'The more detail in the JD, the better the questions'    },
      { num: '02', title: 'AI generates questions',    desc: 'Technical, behavioural, and situational questions'      },
      { num: '03', title: 'Review key concepts',       desc: 'Topics to revise based on the role requirements'        },
      { num: '04', title: 'Practice your answers',     desc: 'Use the STAR framework for each behavioural question'   },
    ],
    tips: [
      'Treat the generated questions as a minimum — prepare for more',
      'Practise your answers out loud, not just in your head',
      'For technical roles, write the code on paper before the interview',
      'Research the company before your prep session for extra context',
    ],
    demoType: 'interview-prep',
  },
  'company-research': {
    icon: '🏢',
    title: 'Company Research Hub',
    tagline: 'Know your interviewer before they know you',
    accentColor: '#ec4899',
    accentLight: '#fdf2f8',
    accentBorder: '#fbcfe8',
    whatItDoes: 'Get a structured overview of what a company values, what the role really involves, and how to position yourself to fit their culture — all in one place before you apply or interview.',
    whyItMatters: "Interviewers can tell instantly if you've done your research. Candidates who demonstrate company knowledge are 3× more likely to get an offer. This feature does the research for you.",
    steps: [
      { num: '01', title: 'Enter the company name',    desc: 'Search across Glassdoor, LinkedIn, and more'            },
      { num: '02', title: 'Review the company brief',  desc: 'Culture, values, salary data, and interview insights'   },
      { num: '03', title: 'Complete the checklist',    desc: 'Track your research progress before applying'           },
      { num: '04', title: 'Tailor your story',         desc: 'Align your experience to what the company cares about'  },
    ],
    tips: [
      "Cross-check the research with the company's own LinkedIn and website",
      'Note the values mentioned in the JD — use those exact words in interviews',
      'Look for recent company news for strong talking points',
      'Understand team size and funding stage — startup prep differs from enterprise',
    ],
    demoType: 'company-research',
  },
  'job-ranking': {
    icon: '🎯',
    title: 'Batch Job Matcher',
    tagline: 'Apply where you actually fit — not everywhere',
    accentColor: '#e91e8c',
    accentLight: '#fdf2f8',
    accentBorder: '#f9a8d4',
    whatItDoes: 'Upload your resume once, add multiple job descriptions, and JobMorph ranks them by how well your profile matches each one — so you know exactly which jobs to prioritise.',
    whyItMatters: "Most job seekers spray-and-pray applications everywhere. That wastes time and hurts your confidence. Smart ranking means you spend energy only on applications where you have the highest chance of success.",
    steps: [
      { num: '01', title: 'Upload your resume once',   desc: 'Your profile stays loaded for all comparisons'          },
      { num: '02', title: 'Add multiple JDs',          desc: 'Upload up to 10 job descriptions at once'               },
      { num: '03', title: 'AI ranks all of them',      desc: 'Each job gets a match score and priority level'         },
      { num: '04', title: 'Apply in order',            desc: 'Start with 70%+ scores, tailor resume for each one'     },
    ],
    tips: [
      'Focus your energy on jobs scoring 70% and above',
      'Jobs scoring 50–70% are worth applying after tailoring your resume',
      'Below 50% — use the missing skills list to see if you can close the gap fast',
      'Re-rank after every resume edit to see how your standing improves',
    ],
    demoType: 'job-ranking',
  },
};

// ─── DEMO COMPONENTS ─────────────────────────────────────────────
function MatchScoreDemo() {
  const [score, setScore] = useState(null);
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true); setScore(null);
    await new Promise(r => setTimeout(r, 1800));
    setScore(87); setRunning(false);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[['📄', 'Resume.pdf', 'Loaded'], ['💼', 'Software Engineer JD', 'Loaded']].map(([ic, name, status], i) => (
          <div key={i} className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <div className="text-2xl mb-1">{ic}</div>
            <p className="text-xs font-bold text-gray-700">{name}</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">✓ {status}</p>
          </div>
        ))}
      </div>
      <button onClick={run} disabled={running}
        className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
        {running ? '⏳ Analysing…' : score ? '🔄 Run Again' : '▶️ Run Analysis'}
      </button>
      {score && (
        <div className="p-5 bg-white border border-gray-100 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800">Match Score</span>
            <span className="text-3xl font-extrabold text-emerald-600">{score}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${score}%`, background: 'linear-gradient(90deg,#e91e8c,#7c3aed)' }} />
          </div>
          <p className="text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-2.5 rounded-xl border border-emerald-100">
            ✅ Strong match! Add "Kubernetes" and "Docker" to push your score higher.
          </p>
        </div>
      )}
    </div>
  );
}

function ATSCheckerDemo() {
  const [scanned, setScanned] = useState(false);
  const issues = [
    { level: 'ok',       icon: '✅', text: 'Standard fonts detected (Calibri)' },
    { level: 'ok',       icon: '✅', text: 'No multi-column layout found' },
    { level: 'warn',     icon: '⚠️', text: 'Contact info is in page header — may be skipped' },
    { level: 'critical', icon: '❌', text: 'Profile photo found — ATS cannot read images' },
    { level: 'warn',     icon: '⚠️', text: 'Decorative divider lines detected' },
    { level: 'ok',       icon: '✅', text: 'No tables found' },
  ];
  return (
    <div className="space-y-4">
      <div onClick={() => setScanned(true)}
        className="p-5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all">
        <div className="text-3xl mb-2">📄</div>
        <p className="text-sm font-semibold text-gray-700">
          {scanned ? 'My_Resume.pdf — scan complete' : 'Click to run ATS scan on sample resume'}
        </p>
      </div>
      {scanned && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-500 px-1 mb-1">
            <span>ATS Compatibility Report</span>
            <span className="text-amber-600">2 issues found</span>
          </div>
          {issues.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-xs font-medium ${
              item.level === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
              item.level === 'warn' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
              'bg-red-50 text-red-700 border border-red-100'}`}>
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
          <button onClick={() => setScanned(false)}
            className="text-xs text-gray-400 hover:text-gray-600 underline mt-1">Reset demo</button>
        </div>
      )}
    </div>
  );
}

function InterviewPrepDemo() {
  const [role, setRole] = useState('');
  const [generated, setGenerated] = useState(false);
  const questions = {
    Technical:    ['Explain useEffect vs useLayoutEffect in React.', 'How would you optimise a slow SQL query with 1M+ rows?'],
    Behavioural:  ['Tell me about a time you had a conflict with a teammate.', 'Describe a project where you had to learn something completely new.'],
    Situational:  ['A critical bug is found 30 minutes before release — what do you do?'],
  };
  return (
    <div className="space-y-4">
      <input value={role} onChange={e => setRole(e.target.value)}
        placeholder="e.g. Senior React Developer at Razorpay"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all" />
      <button onClick={() => role && setGenerated(true)}
        className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
        {generated ? '🔄 Regenerate' : '🧠 Generate Interview Questions'}
      </button>
      {generated && (
        <div className="space-y-4">
          {Object.entries(questions).map(([type, qs]) => (
            <div key={type}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#e91e8c' }}>{type}</p>
              <div className="space-y-2">
                {qs.map((q, j) => (
                  <div key={j} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-700 leading-relaxed">
                    <span className="font-bold text-purple-600">Q{j+1}: </span>{q}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyResearchDemo() {
  const [company, setCompany] = useState('');
  const [done, setDone] = useState(false);
  return (
    <div className="space-y-4">
      <input value={company} onChange={e => setCompany(e.target.value)}
        placeholder="e.g. Freshworks — Senior Product Manager"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all" />
      <button onClick={() => company && setDone(true)}
        className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
        {done ? '🔄 Research Again' : '🏢 Research This Company'}
      </button>
      {done && (
        <div className="space-y-3">
          {[
            { label: 'Company Overview',  text: 'Fast-growing B2B SaaS, Series B, ~200 employees. Expanding across Southeast Asia.', bg: '#fdf2f8', border: '#f9a8d4' },
            { label: 'Role Expectations', text: 'They want someone who can own the frontend independently, ship fast, and communicate proactively.', bg: '#f5f3ff', border: '#ddd6fe' },
            { label: 'Things to Know',    text: 'High-growth environment — expect ambiguity and shifting priorities.', bg: '#fefce8', border: '#fde68a' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl border text-xs text-gray-700 leading-relaxed"
              style={{ background: item.bg, borderColor: item.border }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{item.label}</p>
              {item.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JobRankingDemo() {
  const [revealed, setRevealed] = useState(false);
  const jobs = [
    { title: 'Senior React Developer', company: 'Razorpay', score: 91, tag: 'Best Match',  color: '#10b981' },
    { title: 'Frontend Engineer',      company: 'Swiggy',   score: 78, tag: 'Good Match',  color: '#3b82f6' },
    { title: 'Full Stack Developer',   company: 'Zomato',   score: 64, tag: 'Moderate',    color: '#f59e0b' },
    { title: 'UI Engineer',            company: 'PhonePe',  score: 47, tag: 'Low Match',   color: '#ef4444' },
  ];
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
        <p className="text-sm font-bold text-gray-700 mb-0.5">📄 Resume.pdf loaded</p>
        <p className="text-xs text-gray-400">4 job descriptions ready</p>
      </div>
      <button onClick={() => setRevealed(true)}
        className="w-full py-3 text-white text-sm font-bold rounded-xl transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
        {revealed ? '🔄 Re-rank' : '🎯 Rank My Job Matches'}
      </button>
      {revealed && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1">Ranked by best fit:</p>
          {jobs.map((job, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
              <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-extrabold text-gray-400 flex-shrink-0">{i+1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">{job.title}</p>
                <p className="text-[10px] text-gray-400">{job.company}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-extrabold leading-none" style={{ color: job.color }}>{job.score}%</p>
                <p className="text-[10px] text-gray-400">{job.tag}</p>
              </div>
            </div>
          ))}
          <button onClick={() => setRevealed(false)} className="text-xs text-gray-400 underline hover:text-gray-600">Reset</button>
        </div>
      )}
    </div>
  );
}

const demoMap = {
  'match-score':      MatchScoreDemo,
  'ats-checker':      ATSCheckerDemo,
  'interview-prep':   InterviewPrepDemo,
  'company-research': CompanyResearchDemo,
  'job-ranking':      JobRankingDemo,
};

const allFeatures = [
  { slug: 'match-score',      icon: '🤖', label: 'Match Score'        },
  { slug: 'ats-checker',      icon: '📄', label: 'ATS Checker'        },
  { slug: 'interview-prep',   icon: '🎤', label: 'Interview Prep'     },
  { slug: 'company-research', icon: '🏢', label: 'Company Research'   },
  { slug: 'job-ranking',      icon: '🎯', label: 'Batch Job Matcher'  },
];

// ─── MAIN ────────────────────────────────────────────────────────
export default function FeatureDetail() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const feature    = featureData[slug];

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!feature) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Feature not found</h2>
        <Link to="/" className="px-6 py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>Back to Home</Link>
      </div>
    </div>
  );

  const DemoComponent = demoMap[feature.demoType];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-8"
        style={{ height: '56px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center justify-between w-full gap-4">

          {/* Left: Logo + breadcrumb */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-xs"
                style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>J</div>
              <span className="text-sm font-extrabold tracking-wide hidden sm:block"
                style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                JOBMORPH
              </span>
            </Link>
            <span className="text-gray-300 text-sm hidden sm:block">›</span>
            <span className="text-xs text-gray-400 hidden sm:block">Features</span>
            <span className="text-gray-300 text-sm hidden sm:block">›</span>
            <span className="text-xs font-semibold text-gray-600 hidden sm:block truncate max-w-32">{feature.title}</span>
          </div>

          {/* Right: user flow actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all hidden sm:flex items-center gap-1">
              ← Back
            </button>
            <Link to="/login"
              className="text-xs font-semibold text-gray-600 hover:text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-50 transition-all hidden md:block">
              Log In
            </Link>
            <Link to="/signup"
              className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
              Get Started Free →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-10">

          {/* ── Sidebar ──────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100"
                style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">All Features</p>
              </div>
              <nav className="p-2 space-y-0.5">
                {allFeatures.map(f => {
                  const isActive = f.slug === slug;
                  return (
                    <Link key={f.slug} to={`/features/${f.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={isActive
                        ? { background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)', color: '#7c3aed', fontWeight: 600 }
                        : { color: '#6b7280' }}>
                      {isActive && <span className="absolute left-0 w-1 h-5 rounded-r-full"
                        style={{ background: 'linear-gradient(180deg,#e91e8c,#7c3aed)' }} />}
                      <span>{f.icon}</span>
                      <span>{f.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-3 border-t border-gray-100">
                <Link to="/signup"
                  className="block text-center py-2.5 text-xs font-bold text-white rounded-xl transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                  🚀 Try Free — No Sign-up Needed
                </Link>
              </div>
            </div>
          </div>

          {/* ── Main content ─────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-8">

            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 border"
                style={{ background: feature.accentLight, borderColor: feature.accentBorder, color: feature.accentColor }}>
                Feature Guide
              </div>
              <h1 className="text-3xl font-extrabold mb-2" style={{ color: '#1e1b4b' }}>
                {feature.icon} {feature.title}
              </h1>
              <p className="text-base text-gray-400">{feature.tagline}</p>
            </div>

            {/* What + Why */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl border" style={{ background: feature.accentLight, borderColor: feature.accentBorder }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: feature.accentColor }}>What It Does</p>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.whatItDoes}</p>
              </div>
              <div className="p-6 rounded-2xl border border-amber-100" style={{ background: '#fffbeb' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3 text-amber-600">Why It Matters</p>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.whyItMatters}</p>
              </div>
            </div>

            {/* How to use */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#e91e8c' }}>How to Use This Feature</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {feature.steps.map(({ num, title, desc }) => (
                  <div key={num} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-purple-100 transition-all">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>{num}</div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>
                      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive demo */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#e91e8c' }}>Try It Right Here</p>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">Interactive Demo</span>
                </div>
                <div className="p-5">
                  <DemoComponent />
                </div>
              </div>
            </div>

            {/* Pro tips */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#e91e8c' }}>Pro Tips</p>
              <div className="space-y-3">
                {feature.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-purple-100 transition-all">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                      <svg width="9" height="9" viewBox="0 0 20 20" fill="white">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Explore other features */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-400">Explore Other Features</p>
              <div className="flex flex-wrap gap-2">
                {allFeatures.filter(f => f.slug !== slug).map(f => (
                  <Link key={f.slug} to={`/features/${f.slug}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-600 hover:text-purple-700 rounded-xl text-xs font-semibold transition-all">
                    {f.icon} {f.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl px-8 py-10 text-center border border-purple-100"
              style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
              <p className="text-2xl font-extrabold mb-2" style={{ color: '#1e1b4b' }}>
                Ready to use {feature.title}?
              </p>
              <p className="text-sm text-gray-400 mb-7 max-w-md mx-auto">
                Sign up free and start using this feature in under 60 seconds. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup"
                  className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                  🚀 Get Started Free
                </Link>
                <Link to="/"
                  className="flex items-center justify-center px-7 py-3 bg-white text-sm font-semibold text-gray-600 rounded-xl border border-gray-200 hover:border-purple-300 hover:text-purple-700 transition-all">
                  ← Back to Home
                </Link>
              </div>
              <p className="text-xs text-gray-400 mt-4">No credit card · Free forever · 30-second setup</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
// import React, { useState, useEffect } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import MinimalNavbar from '../../components/MinimalNavbar';

// // ─── FEATURE DATA ───────────────────────────────────────────────
// const featureData = {
//   'match-score': {
//     icon: '🤖',
//     title: 'Resume vs JD Match Score',
//     tagline: 'Know your chances before you apply',
//     gradient: 'from-cyan-500 to-blue-600',
//     bgLight: 'bg-cyan-50',
//     border: 'border-cyan-200',
//     textAccent: 'text-cyan-700',
//     whatItDoes: 'JobMorph compares your resume against a job description across 50+ parameters — skills, keywords, experience level, tone, and role alignment — and gives you a score from 0 to 100%.',
//     whyItMatters: 'Recruiters spend 6 seconds on a resume. If your resume doesn\'t match the JD, it won\'t even reach a human. This score tells you exactly where you stand before wasting an application.',
//     steps: [
//       { step: '01', title: 'Upload your resume', desc: 'PDF or DOCX format, up to 5MB' },
//       { step: '02', title: 'Paste the job description', desc: 'Copy directly from LinkedIn, Naukri, or any portal' },
//       { step: '03', title: 'Click Analyse', desc: 'AI processes both in under 30 seconds' },
//       { step: '04', title: 'Read your score + breakdown', desc: 'See which areas match and which need work' },
//     ],
//     demoType: 'match-score',
//     tips: [
//       'Aim for 70%+ before applying to a role',
//       'A score below 50% means your resume needs tailoring',
//       'Use the keyword suggestions to close the gap quickly',
//       'Recheck your score after editing — it updates instantly',
//     ],
//   },

//   'ats-checker': {
//     icon: '📄',
//     title: 'ATS Format Checker',
//     tagline: 'Make sure robots can actually read your resume',
//     gradient: 'from-blue-500 to-indigo-600',
//     bgLight: 'bg-blue-50',
//     border: 'border-blue-200',
//     textAccent: 'text-blue-700',
//     whatItDoes: 'ATS (Applicant Tracking Systems) are software that companies use to filter resumes before a human ever sees them. JobMorph scans your resume\'s structure and flags anything that breaks ATS parsing.',
//     whyItMatters: '75% of resumes are rejected by ATS before reaching a recruiter. Common culprits: tables, images, fancy fonts, columns, and headers with contact info. We catch all of them.',
//     steps: [
//       { step: '01', title: 'Upload your resume', desc: 'We parse the actual PDF/DOCX structure' },
//       { step: '02', title: 'ATS scan runs automatically', desc: 'Checks formatting, fonts, images, tables, columns' },
//       { step: '03', title: 'See what\'s flagged', desc: 'Each issue is labelled as Critical, Warning, or OK' },
//       { step: '04', title: 'Fix & re-upload', desc: 'Check again after edits until all issues are resolved' },
//     ],
//     demoType: 'ats-checker',
//     tips: [
//       'Never use tables or multi-column layouts',
//       'Avoid putting contact info in the header/footer',
//       'Stick to standard fonts: Arial, Calibri, Times New Roman',
//       'Remove profile photos — ATS cannot read images',
//     ],
//   },

//   'interview-prep': {
//     icon: '🎤',
//     title: 'Interview Prep',
//     tagline: 'Walk into every interview prepared',
//     gradient: 'from-indigo-500 to-purple-600',
//     bgLight: 'bg-indigo-50',
//     border: 'border-indigo-200',
//     textAccent: 'text-indigo-700',
//     whatItDoes: 'Based on the job description you paste, JobMorph generates role-specific interview questions, key concepts to revise, and a focused prep checklist — so you know exactly what to study.',
//     whyItMatters: 'Generic interview prep is useless. A Data Engineer interview at a startup is completely different from one at a bank. We generate questions specific to YOUR role and YOUR company.',
//     steps: [
//       { step: '01', title: 'Paste the job description', desc: 'The more detail, the better the questions' },
//       { step: '02', title: 'AI generates questions', desc: 'Technical, behavioural, and situational questions' },
//       { step: '03', title: 'Review key concepts', desc: 'Topics to revise based on the role requirements' },
//       { step: '04', title: 'Practice answers', desc: 'Use suggested frameworks like STAR for each question' },
//     ],
//     demoType: 'interview-prep',
//     tips: [
//       'Treat the generated questions as a minimum — prepare more',
//       'Practise answers out loud, not just in your head',
//       'For technical roles, code the concepts on paper first',
//       'Research the company before your prep session for context',
//     ],
//   },

//   'company-research': {
//     icon: '🏢',
//     title: 'Company Research',
//     tagline: 'Know your interviewer before they know you',
//     gradient: 'from-purple-500 to-pink-600',
//     bgLight: 'bg-purple-50',
//     border: 'border-purple-200',
//     textAccent: 'text-purple-700',
//     whatItDoes: 'Paste a job description and JobMorph gives you a structured overview of what the company values, what the role really involves, and how to position yourself to fit their culture and expectations.',
//     whyItMatters: 'Interviewers can tell instantly if you\'ve researched the company. Candidates who demonstrate company knowledge are 3x more likely to get an offer. This feature does that research for you.',
//     steps: [
//       { step: '01', title: 'Paste the job description', desc: 'Include company name and role details' },
//       { step: '02', title: 'AI extracts company signals', desc: 'Values, culture, expectations, and priorities' },
//       { step: '03', title: 'Read the company brief', desc: 'Structured overview you can read in 5 minutes' },
//       { step: '04', title: 'Tailor your story', desc: 'Align your experience to what they care about most' },
//     ],
//     demoType: 'company-research',
//     tips: [
//       'Cross-check the AI summary with the company\'s LinkedIn and website',
//       'Note the values mentioned in the JD — use those exact words in interviews',
//       'Look at recent company news for talking points',
//       'Understand the team size and stage — startup vs enterprise prep differs',
//     ],
//   },

//   'job-ranking': {
//     icon: '🎯',
//     title: 'Smart Job Ranking',
//     tagline: 'Apply where you actually fit — not everywhere',
//     gradient: 'from-pink-500 to-rose-600',
//     bgLight: 'bg-pink-50',
//     border: 'border-pink-200',
//     textAccent: 'text-pink-700',
//     whatItDoes: 'Upload your resume once, paste multiple job descriptions, and JobMorph ranks them by how well your profile matches each one — so you know exactly which jobs to prioritise.',
//     whyItMatters: 'Most job seekers spray-and-pray. That wastes time and tanks your confidence. Smart Job Ranking means you spend your energy on applications where you have the highest chance of success.',
//     steps: [
//       { step: '01', title: 'Upload your resume once', desc: 'Your profile stays loaded for all comparisons' },
//       { step: '02', title: 'Add multiple job descriptions', desc: 'Up to 10 JDs from any portal' },
//       { step: '03', title: 'AI scores and ranks all of them', desc: 'Each job gets a match score and brief explanation' },
//       { step: '04', title: 'Apply in order of best match', desc: 'Start with 70%+ scores, customise resume for each' },
//     ],
//     demoType: 'job-ranking',
//     tips: [
//       'Focus your energy on jobs scoring 70% and above',
//       'Jobs scoring 50–70% are worth applying to after tailoring your resume',
//       'Below 50% — use the keyword suggestions to see if you can close the gap',
//       'Re-rank after every resume edit to see how your standing changes',
//     ],
//   },
// };

// // ─── INTERACTIVE DEMO COMPONENTS ────────────────────────────────

// const MatchScoreDemo = () => {
//   const [score, setScore] = useState(null);
//   const [running, setRunning] = useState(false);

//   const runDemo = async () => {
//     setRunning(true);
//     setScore(null);
//     await new Promise(r => setTimeout(r, 1800));
//     setScore(87);
//     setRunning(false);
//   };

//   return (
//     <div className="space-y-5">
//       <div className="grid grid-cols-2 gap-3">
//         <div className="p-4 bg-cyan-50 border-2 border-dashed border-cyan-300 rounded-xl text-center">
//           <div className="text-3xl mb-1">📄</div>
//           <p className="text-xs font-bold text-gray-700">Resume.pdf</p>
//           <p className="text-xs text-green-600 font-medium">✓ Loaded</p>
//         </div>
//         <div className="p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center">
//           <div className="text-3xl mb-1">💼</div>
//           <p className="text-xs font-bold text-gray-700">Software Engineer JD</p>
//           <p className="text-xs text-green-600 font-medium">✓ Loaded</p>
//         </div>
//       </div>

//       <button onClick={runDemo} disabled={running}
//         className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
//       >
//         {running ? '⏳ Analysing...' : score ? '🔄 Run Again' : '▶ Run Analysis'}
//       </button>

//       <AnimatePresence>
//         {score && (
//           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
//             className="space-y-4 p-5 bg-white border-2 border-gray-100 rounded-2xl"
//           >
//             <div className="flex justify-between items-center">
//               <span className="font-bold text-gray-800">Your Match Score</span>
//               <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
//                 className="text-4xl font-black text-green-600">{score}%</motion.span>
//             </div>
//             <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
//               <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.2, duration: 1 }}
//                 className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
//               />
//             </div>
//             <p className="text-sm text-green-700 font-medium bg-green-50 p-3 rounded-xl">
//               ✅ Strong match! You should apply — also add "Kubernetes" and "Docker" to improve further.
//             </p>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// const ATSCheckerDemo = () => {
//   const [scanned, setScanned] = useState(false);
//   const issues = [
//     { level: 'ok',       icon: '✅', text: 'Standard fonts detected (Calibri)' },
//     { level: 'ok',       icon: '✅', text: 'No columns or multi-column layout' },
//     { level: 'warn',     icon: '⚠️', text: 'Contact info is in page header — may be skipped' },
//     { level: 'critical', icon: '❌', text: 'Profile photo found — ATS cannot read images' },
//     { level: 'warn',     icon: '⚠️', text: 'Decorative lines between sections detected' },
//     { level: 'ok',       icon: '✅', text: 'No tables found' },
//   ];

//   return (
//     <div className="space-y-4">
//       <div className="p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center cursor-pointer"
//         onClick={() => setScanned(true)}>
//         <div className="text-4xl mb-2">📄</div>
//         <p className="text-sm font-semibold text-gray-700">{scanned ? 'My_Resume.pdf' : 'Click to scan a sample resume'}</p>
//         {scanned && <p className="text-xs text-blue-600 font-medium mt-1">Scan complete</p>}
//       </div>

//       <AnimatePresence>
//         {scanned && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
//             <div className="flex justify-between text-sm font-semibold text-gray-600 px-1">
//               <span>ATS Compatibility Report</span>
//               <span className="text-yellow-600">2 issues found</span>
//             </div>
//             {issues.map((item, i) => (
//               <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: i * 0.08 }}
//                 className={`flex items-start gap-3 p-3 rounded-xl text-sm font-medium ${
//                   item.level === 'ok' ? 'bg-green-50 text-green-700' :
//                   item.level === 'warn' ? 'bg-yellow-50 text-yellow-700' :
//                   'bg-red-50 text-red-700'
//                 }`}
//               >
//                 <span>{item.icon}</span>
//                 <span>{item.text}</span>
//               </motion.div>
//             ))}
//             <button onClick={() => setScanned(false)}
//               className="w-full mt-2 py-2 text-sm text-gray-500 underline">Reset demo</button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// const InterviewPrepDemo = () => {
//   const [role, setRole] = useState('');
//   const [generated, setGenerated] = useState(false);

//   const questions = {
//     technical: [
//       'Explain the difference between useEffect and useLayoutEffect in React.',
//       'How would you optimise a slow SQL query with 1M+ rows?',
//       'What is the difference between REST and GraphQL?',
//     ],
//     behavioural: [
//       'Tell me about a time you had a conflict with a team member. How did you resolve it?',
//       'Describe a project where you had to learn something completely new.',
//       'How do you handle tight deadlines and changing requirements?',
//     ],
//     situational: [
//       'If a critical bug is found 30 minutes before a product release, what do you do?',
//       'A senior colleague disagrees with your architectural decision — how do you proceed?',
//     ],
//   };

//   return (
//     <div className="space-y-4">
//       <input value={role} onChange={e => setRole(e.target.value)}
//         placeholder="e.g. Senior React Developer at Razorpay"
//         className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
//       />
//       <button onClick={() => role && setGenerated(true)}
//         className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
//       >
//         {generated ? '🔄 Regenerate Questions' : '🧠 Generate Interview Questions'}
//       </button>

//       <AnimatePresence>
//         {generated && (
//           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
//             {Object.entries(questions).map(([type, qs], i) => (
//               <div key={type}>
//                 <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2 pl-1">
//                   {type} Questions
//                 </p>
//                 <div className="space-y-2">
//                   {qs.map((q, j) => (
//                     <motion.div key={j} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: j * 0.1 }}
//                       className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-gray-700 leading-relaxed"
//                     >
//                       <span className="font-bold text-indigo-600">Q{j + 1}:</span> {q}
//                     </motion.div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// const CompanyResearchDemo = () => {
//   const [company, setCompany] = useState('');
//   const [researched, setResearched] = useState(false);

//   const brief = {
//     overview: 'A fast-growing B2B SaaS company focused on enterprise workflow automation. Series B funded, ~200 employees, expanding across Southeast Asia.',
//     values: ['Speed over perfection', 'Customer obsession', 'Ownership mentality', 'Data-driven decisions'],
//     roleExpectations: 'They want someone who can own the frontend independently, work closely with backend engineers, and ship features fast. Communication and proactiveness are highly valued.',
//     redFlags: 'High-growth environment — expect ambiguity and shifting priorities.',
//   };

//   return (
//     <div className="space-y-4">
//       <input value={company} onChange={e => setCompany(e.target.value)}
//         placeholder="e.g. Freshworks — Senior Product Manager"
//         className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
//       />
//       <button onClick={() => company && setResearched(true)}
//         className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
//       >
//         {researched ? '🔄 Research Again' : '🏢 Research This Company'}
//       </button>

//       <AnimatePresence>
//         {researched && (
//           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
//             {[
//               { label: '🏢 Company Overview', content: brief.overview, bg: 'bg-purple-50', border: 'border-purple-100' },
//               { label: '🔑 Role Expectations', content: brief.roleExpectations, bg: 'bg-blue-50', border: 'border-blue-100' },
//               { label: '⚠️ Things to Know', content: brief.redFlags, bg: 'bg-yellow-50', border: 'border-yellow-100' },
//             ].map((item, i) => (
//               <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: i * 0.15 }}
//                 className={`p-4 ${item.bg} border ${item.border} rounded-xl`}
//               >
//                 <p className="text-xs font-bold text-gray-500 mb-2">{item.label}</p>
//                 <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
//               </motion.div>
//             ))}
//             <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
//               <p className="text-xs font-bold text-gray-500 mb-2">💚 Core Values</p>
//               <div className="flex flex-wrap gap-2">
//                 {brief.values.map((v, i) => (
//                   <span key={i} className="px-3 py-1 bg-white border border-green-200 text-green-700 text-xs rounded-full font-medium">{v}</span>
//                 ))}
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// const JobRankingDemo = () => {
//   const jobs = [
//     { title: 'Senior React Developer', company: 'Razorpay', score: 91, tag: 'Best Match' },
//     { title: 'Frontend Engineer', company: 'Swiggy', score: 78, tag: 'Good Match' },
//     { title: 'Full Stack Developer', company: 'Zomato', score: 64, tag: 'Moderate' },
//     { title: 'UI Engineer', company: 'PhonePe', score: 47, tag: 'Low Match' },
//   ];
//   const [revealed, setRevealed] = useState(false);

//   const scoreColor = (s) =>
//     s >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
//     s >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
//     'text-red-500 bg-red-50 border-red-200';

//   return (
//     <div className="space-y-4">
//       <div className="p-4 bg-pink-50 border-2 border-pink-200 rounded-xl text-center">
//         <p className="text-sm font-bold text-gray-700 mb-1">📄 Resume.pdf loaded</p>
//         <p className="text-xs text-gray-500">4 job descriptions added</p>
//       </div>

//       <button onClick={() => setRevealed(true)}
//         className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
//       >
//         {revealed ? '🔄 Re-rank' : '🎯 Rank My Job Matches'}
//       </button>

//       <AnimatePresence>
//         {revealed && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
//             <p className="text-xs font-bold text-gray-500 px-1">Ranked by best fit for your resume:</p>
//             {jobs.map((job, i) => (
//               <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
//                 transition={{ delay: i * 0.12 }}
//                 className="flex items-center gap-3 p-3 bg-white border-2 border-gray-100 rounded-xl"
//               >
//                 <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-black text-gray-400 flex-shrink-0">
//                   {i + 1}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-bold text-gray-800 text-sm truncate">{job.title}</p>
//                   <p className="text-xs text-gray-500">{job.company}</p>
//                 </div>
//                 <div className={`px-3 py-1.5 rounded-xl border-2 text-center flex-shrink-0 ${scoreColor(job.score)}`}>
//                   <p className="text-lg font-black leading-none">{job.score}%</p>
//                   <p className="text-xs font-medium">{job.tag}</p>
//                 </div>
//               </motion.div>
//             ))}
//             <button onClick={() => setRevealed(false)}
//               className="w-full mt-1 py-2 text-xs text-gray-400 underline">Reset</button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// const demoMap = {
//   'match-score': MatchScoreDemo,
//   'ats-checker': ATSCheckerDemo,
//   'interview-prep': InterviewPrepDemo,
//   'company-research': CompanyResearchDemo,
//   'job-ranking': JobRankingDemo,
// };

// // ─── OTHER FEATURES (sidebar navigation) ────────────────────────
// const allFeatures = [
//   { slug: 'match-score', icon: '🤖', label: 'Match Score' },
//   { slug: 'ats-checker', icon: '📄', label: 'ATS Checker' },
//   { slug: 'interview-prep', icon: '🎤', label: 'Interview Prep' },
//   { slug: 'company-research', icon: '🏢', label: 'Company Research' },
//   { slug: 'job-ranking', icon: '🎯', label: 'Job Ranking' },
// ];

// // ─── MAIN COMPONENT ─────────────────────────────────────────────
// export default function FeatureDetail() {
//   const { slug } = useParams();
//   const navigate = useNavigate();
//   const feature = featureData[slug];

//   useEffect(() => { window.scrollTo(0, 0); }, [slug]);

//   if (!feature) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-6xl mb-4">🔍</div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">Feature not found</h2>
//           <Link to="/" className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-bold">Back to Home</Link>
//         </div>
//       </div>
//     );
//   }

//   const DemoComponent = demoMap[feature.demoType];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
//       {/* Top Bar */}
//       <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
//         <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
//           <Link to="/" className="flex items-center gap-2">
//             <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-lg text-white">J</div>
//             <span className="text-xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">JobMorph</span>
//           </Link>
//           <div className="flex items-center gap-3">
//             <Link to="/#features"
//               className="text-sm font-semibold text-gray-600 hover:text-cyan-600 transition-colors hidden sm:block"
//             >
//               ← All Features
//             </Link>
//             <button onClick={() => navigate(-1)}
//               className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
//             >
//               ← Back
              
//             </button>
//             <MinimalNavbar />
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-6 py-16">
//         <div className="grid lg:grid-cols-4 gap-10">

//           {/* Sidebar */}
//           <div className="lg:col-span-1">
//             <div className="sticky top-24 bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-sm">
//               <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">All Features</p>
//               <nav className="space-y-2">
//                 {allFeatures.map(f => (
//                   <Link key={f.slug} to={`/features/${f.slug}`}
//                     className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
//                       f.slug === slug
//                         ? `bg-gradient-to-r ${feature.gradient} text-white shadow-md`
//                         : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
//                     }`}
//                   >
//                     <span>{f.icon}</span>
//                     <span>{f.label}</span>
//                   </Link>
//                 ))}
//               </nav>
//               <div className="mt-6 pt-5 border-t border-gray-100">
//                 <Link to="/signup"
//                   className={`block text-center px-4 py-3 bg-gradient-to-r ${feature.gradient} text-white font-bold rounded-xl text-sm hover:shadow-lg transition-all`}
//                 >
//                   🚀 Try Free
//                 </Link>
//               </div>
//             </div>
//           </div>

//           {/* Main Content */}
//           <div className="lg:col-span-3 space-y-10">
//             {/* Header */}
//             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//               <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${feature.bgLight} border ${feature.border} mb-5`}>
//                 <span className={`text-sm font-bold ${feature.textAccent}`}>Feature Deep Dive</span>
//               </div>
//               <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
//                 {feature.icon} {feature.title}
//               </h1>
//               <p className="text-xl text-gray-500">{feature.tagline}</p>
//             </motion.div>

//             {/* What It Does + Why It Matters */}
//             <div className="grid md:grid-cols-2 gap-6">
//               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
//                 className={`p-6 ${feature.bgLight} border ${feature.border} rounded-2xl`}
//               >
//                 <h3 className={`font-bold text-lg mb-3 ${feature.textAccent}`}>⚙️ What It Does</h3>
//                 <p className="text-gray-700 leading-relaxed">{feature.whatItDoes}</p>
//               </motion.div>
//               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
//                 className="p-6 bg-amber-50 border border-amber-200 rounded-2xl"
//               >
//                 <h3 className="font-bold text-lg mb-3 text-amber-700">💡 Why It Matters</h3>
//                 <p className="text-gray-700 leading-relaxed">{feature.whyItMatters}</p>
//               </motion.div>
//             </div>

//             {/* How to Use — Steps */}
//             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//               <h2 className="text-2xl font-black text-gray-900 mb-6">📋 How to Use This Feature</h2>
//               <div className="grid sm:grid-cols-2 gap-4">
//                 {feature.steps.map((step, i) => (
//                   <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.2 + i * 0.08 }}
//                     className="flex items-start gap-4 p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-colors shadow-sm"
//                   >
//                     <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center font-black text-white text-sm flex-shrink-0`}>
//                       {step.step}
//                     </div>
//                     <div>
//                       <p className="font-bold text-gray-800 mb-1">{step.title}</p>
//                       <p className="text-sm text-gray-500">{step.desc}</p>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Interactive Demo */}
//             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
//               <h2 className="text-2xl font-black text-gray-900 mb-6">🎮 Try It Right Here</h2>
//               <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6">
//                 <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
//                   <div className="flex gap-1.5">
//                     <div className="w-3 h-3 rounded-full bg-red-400" />
//                     <div className="w-3 h-3 rounded-full bg-yellow-400" />
//                     <div className="w-3 h-3 rounded-full bg-green-400" />
//                   </div>
//                   <span className="text-xs text-gray-400 font-medium">Interactive Demo — {feature.title}</span>
//                 </div>
//                 <DemoComponent />
//               </div>
//             </motion.div>

//             {/* Pro Tips */}
//             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
//               <h2 className="text-2xl font-black text-gray-900 mb-6">🏆 Pro Tips</h2>
//               <div className="space-y-3">
//                 {feature.tips.map((tip, i) => (
//                   <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: 0.4 + i * 0.07 }}
//                     className="flex items-start gap-4 p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
//                   >
//                     <span className={`text-lg flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}>
//                       <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                       </svg>
//                     </span>
//                     <p className="text-gray-700 font-medium leading-relaxed">{tip}</p>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Explore Other Features */}
//             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
//               className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6"
//             >
//               <h3 className="font-bold text-gray-800 mb-4">Explore Other Features</h3>
//               <div className="flex flex-wrap gap-3">
//                 {allFeatures.filter(f => f.slug !== slug).map(f => (
//                   <Link key={f.slug} to={`/features/${f.slug}`}
//                     className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 hover:border-cyan-400 text-gray-700 hover:text-cyan-700 rounded-xl text-sm font-semibold transition-all"
//                   >
//                     {f.icon} {f.label}
//                   </Link>
//                 ))}
//               </div>
//             </motion.div>

//             {/* CTA */}
//             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
//               className={`p-10 bg-gradient-to-br ${feature.bgLight} border-2 ${feature.border} rounded-3xl text-center`}
//             >
//               <h2 className="text-3xl font-black text-gray-900 mb-3">
//                 Ready to use {feature.title}?
//               </h2>
//               <p className="text-gray-600 mb-7 max-w-md mx-auto">
//                 Sign up for free and start using this feature in under 60 seconds.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                 <Link to="/signup"
//                   className={`px-8 py-4 bg-gradient-to-r ${feature.gradient} text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all`}
//                 >
//                   🚀 Try It Free
//                 </Link>
//                 <Link to="/"
//                   className="px-8 py-4 bg-white text-gray-700 font-semibold text-lg rounded-xl border-2 border-gray-200 hover:border-cyan-400 transition-all"
//                 >
//                   ← Back to Home
//                 </Link>
//               </div>
//               <p className="text-sm text-gray-400 mt-4">No credit card • Free forever • 30-second setup</p>
//             </motion.div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }