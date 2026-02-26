import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MinimalNavbar from '../../components/MinimalNavbar';

// ─── FEATURE DATA ───────────────────────────────────────────────
const featureData = {
  'match-score': {
    icon: '🤖',
    title: 'Resume vs JD Match Score',
    tagline: 'Know your chances before you apply',
    gradient: 'from-cyan-500 to-blue-600',
    bgLight: 'bg-cyan-50',
    border: 'border-cyan-200',
    textAccent: 'text-cyan-700',
    whatItDoes: 'JobMorph compares your resume against a job description across 50+ parameters — skills, keywords, experience level, tone, and role alignment — and gives you a score from 0 to 100%.',
    whyItMatters: 'Recruiters spend 6 seconds on a resume. If your resume doesn\'t match the JD, it won\'t even reach a human. This score tells you exactly where you stand before wasting an application.',
    steps: [
      { step: '01', title: 'Upload your resume', desc: 'PDF or DOCX format, up to 5MB' },
      { step: '02', title: 'Paste the job description', desc: 'Copy directly from LinkedIn, Naukri, or any portal' },
      { step: '03', title: 'Click Analyse', desc: 'AI processes both in under 30 seconds' },
      { step: '04', title: 'Read your score + breakdown', desc: 'See which areas match and which need work' },
    ],
    demoType: 'match-score',
    tips: [
      'Aim for 70%+ before applying to a role',
      'A score below 50% means your resume needs tailoring',
      'Use the keyword suggestions to close the gap quickly',
      'Recheck your score after editing — it updates instantly',
    ],
  },

  'ats-checker': {
    icon: '📄',
    title: 'ATS Format Checker',
    tagline: 'Make sure robots can actually read your resume',
    gradient: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    textAccent: 'text-blue-700',
    whatItDoes: 'ATS (Applicant Tracking Systems) are software that companies use to filter resumes before a human ever sees them. JobMorph scans your resume\'s structure and flags anything that breaks ATS parsing.',
    whyItMatters: '75% of resumes are rejected by ATS before reaching a recruiter. Common culprits: tables, images, fancy fonts, columns, and headers with contact info. We catch all of them.',
    steps: [
      { step: '01', title: 'Upload your resume', desc: 'We parse the actual PDF/DOCX structure' },
      { step: '02', title: 'ATS scan runs automatically', desc: 'Checks formatting, fonts, images, tables, columns' },
      { step: '03', title: 'See what\'s flagged', desc: 'Each issue is labelled as Critical, Warning, or OK' },
      { step: '04', title: 'Fix & re-upload', desc: 'Check again after edits until all issues are resolved' },
    ],
    demoType: 'ats-checker',
    tips: [
      'Never use tables or multi-column layouts',
      'Avoid putting contact info in the header/footer',
      'Stick to standard fonts: Arial, Calibri, Times New Roman',
      'Remove profile photos — ATS cannot read images',
    ],
  },

  'interview-prep': {
    icon: '🎤',
    title: 'Interview Prep',
    tagline: 'Walk into every interview prepared',
    gradient: 'from-indigo-500 to-purple-600',
    bgLight: 'bg-indigo-50',
    border: 'border-indigo-200',
    textAccent: 'text-indigo-700',
    whatItDoes: 'Based on the job description you paste, JobMorph generates role-specific interview questions, key concepts to revise, and a focused prep checklist — so you know exactly what to study.',
    whyItMatters: 'Generic interview prep is useless. A Data Engineer interview at a startup is completely different from one at a bank. We generate questions specific to YOUR role and YOUR company.',
    steps: [
      { step: '01', title: 'Paste the job description', desc: 'The more detail, the better the questions' },
      { step: '02', title: 'AI generates questions', desc: 'Technical, behavioural, and situational questions' },
      { step: '03', title: 'Review key concepts', desc: 'Topics to revise based on the role requirements' },
      { step: '04', title: 'Practice answers', desc: 'Use suggested frameworks like STAR for each question' },
    ],
    demoType: 'interview-prep',
    tips: [
      'Treat the generated questions as a minimum — prepare more',
      'Practise answers out loud, not just in your head',
      'For technical roles, code the concepts on paper first',
      'Research the company before your prep session for context',
    ],
  },

  'company-research': {
    icon: '🏢',
    title: 'Company Research',
    tagline: 'Know your interviewer before they know you',
    gradient: 'from-purple-500 to-pink-600',
    bgLight: 'bg-purple-50',
    border: 'border-purple-200',
    textAccent: 'text-purple-700',
    whatItDoes: 'Paste a job description and JobMorph gives you a structured overview of what the company values, what the role really involves, and how to position yourself to fit their culture and expectations.',
    whyItMatters: 'Interviewers can tell instantly if you\'ve researched the company. Candidates who demonstrate company knowledge are 3x more likely to get an offer. This feature does that research for you.',
    steps: [
      { step: '01', title: 'Paste the job description', desc: 'Include company name and role details' },
      { step: '02', title: 'AI extracts company signals', desc: 'Values, culture, expectations, and priorities' },
      { step: '03', title: 'Read the company brief', desc: 'Structured overview you can read in 5 minutes' },
      { step: '04', title: 'Tailor your story', desc: 'Align your experience to what they care about most' },
    ],
    demoType: 'company-research',
    tips: [
      'Cross-check the AI summary with the company\'s LinkedIn and website',
      'Note the values mentioned in the JD — use those exact words in interviews',
      'Look at recent company news for talking points',
      'Understand the team size and stage — startup vs enterprise prep differs',
    ],
  },

  'job-ranking': {
    icon: '🎯',
    title: 'Smart Job Ranking',
    tagline: 'Apply where you actually fit — not everywhere',
    gradient: 'from-pink-500 to-rose-600',
    bgLight: 'bg-pink-50',
    border: 'border-pink-200',
    textAccent: 'text-pink-700',
    whatItDoes: 'Upload your resume once, paste multiple job descriptions, and JobMorph ranks them by how well your profile matches each one — so you know exactly which jobs to prioritise.',
    whyItMatters: 'Most job seekers spray-and-pray. That wastes time and tanks your confidence. Smart Job Ranking means you spend your energy on applications where you have the highest chance of success.',
    steps: [
      { step: '01', title: 'Upload your resume once', desc: 'Your profile stays loaded for all comparisons' },
      { step: '02', title: 'Add multiple job descriptions', desc: 'Up to 10 JDs from any portal' },
      { step: '03', title: 'AI scores and ranks all of them', desc: 'Each job gets a match score and brief explanation' },
      { step: '04', title: 'Apply in order of best match', desc: 'Start with 70%+ scores, customise resume for each' },
    ],
    demoType: 'job-ranking',
    tips: [
      'Focus your energy on jobs scoring 70% and above',
      'Jobs scoring 50–70% are worth applying to after tailoring your resume',
      'Below 50% — use the keyword suggestions to see if you can close the gap',
      'Re-rank after every resume edit to see how your standing changes',
    ],
  },
};

// ─── INTERACTIVE DEMO COMPONENTS ────────────────────────────────

const MatchScoreDemo = () => {
  const [score, setScore] = useState(null);
  const [running, setRunning] = useState(false);

  const runDemo = async () => {
    setRunning(true);
    setScore(null);
    await new Promise(r => setTimeout(r, 1800));
    setScore(87);
    setRunning(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-cyan-50 border-2 border-dashed border-cyan-300 rounded-xl text-center">
          <div className="text-3xl mb-1">📄</div>
          <p className="text-xs font-bold text-gray-700">Resume.pdf</p>
          <p className="text-xs text-green-600 font-medium">✓ Loaded</p>
        </div>
        <div className="p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center">
          <div className="text-3xl mb-1">💼</div>
          <p className="text-xs font-bold text-gray-700">Software Engineer JD</p>
          <p className="text-xs text-green-600 font-medium">✓ Loaded</p>
        </div>
      </div>

      <button onClick={runDemo} disabled={running}
        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-60"
      >
        {running ? '⏳ Analysing...' : score ? '🔄 Run Again' : '▶ Run Analysis'}
      </button>

      <AnimatePresence>
        {score && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 p-5 bg-white border-2 border-gray-100 rounded-2xl"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Your Match Score</span>
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                className="text-4xl font-black text-green-600">{score}%</motion.span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ delay: 0.2, duration: 1 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              />
            </div>
            <p className="text-sm text-green-700 font-medium bg-green-50 p-3 rounded-xl">
              ✅ Strong match! You should apply — also add "Kubernetes" and "Docker" to improve further.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ATSCheckerDemo = () => {
  const [scanned, setScanned] = useState(false);
  const issues = [
    { level: 'ok',       icon: '✅', text: 'Standard fonts detected (Calibri)' },
    { level: 'ok',       icon: '✅', text: 'No columns or multi-column layout' },
    { level: 'warn',     icon: '⚠️', text: 'Contact info is in page header — may be skipped' },
    { level: 'critical', icon: '❌', text: 'Profile photo found — ATS cannot read images' },
    { level: 'warn',     icon: '⚠️', text: 'Decorative lines between sections detected' },
    { level: 'ok',       icon: '✅', text: 'No tables found' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center cursor-pointer"
        onClick={() => setScanned(true)}>
        <div className="text-4xl mb-2">📄</div>
        <p className="text-sm font-semibold text-gray-700">{scanned ? 'My_Resume.pdf' : 'Click to scan a sample resume'}</p>
        {scanned && <p className="text-xs text-blue-600 font-medium mt-1">Scan complete</p>}
      </div>

      <AnimatePresence>
        {scanned && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex justify-between text-sm font-semibold text-gray-600 px-1">
              <span>ATS Compatibility Report</span>
              <span className="text-yellow-600">2 issues found</span>
            </div>
            {issues.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-start gap-3 p-3 rounded-xl text-sm font-medium ${
                  item.level === 'ok' ? 'bg-green-50 text-green-700' :
                  item.level === 'warn' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-red-50 text-red-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </motion.div>
            ))}
            <button onClick={() => setScanned(false)}
              className="w-full mt-2 py-2 text-sm text-gray-500 underline">Reset demo</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InterviewPrepDemo = () => {
  const [role, setRole] = useState('');
  const [generated, setGenerated] = useState(false);

  const questions = {
    technical: [
      'Explain the difference between useEffect and useLayoutEffect in React.',
      'How would you optimise a slow SQL query with 1M+ rows?',
      'What is the difference between REST and GraphQL?',
    ],
    behavioural: [
      'Tell me about a time you had a conflict with a team member. How did you resolve it?',
      'Describe a project where you had to learn something completely new.',
      'How do you handle tight deadlines and changing requirements?',
    ],
    situational: [
      'If a critical bug is found 30 minutes before a product release, what do you do?',
      'A senior colleague disagrees with your architectural decision — how do you proceed?',
    ],
  };

  return (
    <div className="space-y-4">
      <input value={role} onChange={e => setRole(e.target.value)}
        placeholder="e.g. Senior React Developer at Razorpay"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 transition-colors"
      />
      <button onClick={() => role && setGenerated(true)}
        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
      >
        {generated ? '🔄 Regenerate Questions' : '🧠 Generate Interview Questions'}
      </button>

      <AnimatePresence>
        {generated && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {Object.entries(questions).map(([type, qs], i) => (
              <div key={type}>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2 pl-1">
                  {type} Questions
                </p>
                <div className="space-y-2">
                  {qs.map((q, j) => (
                    <motion.div key={j} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: j * 0.1 }}
                      className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-gray-700 leading-relaxed"
                    >
                      <span className="font-bold text-indigo-600">Q{j + 1}:</span> {q}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CompanyResearchDemo = () => {
  const [company, setCompany] = useState('');
  const [researched, setResearched] = useState(false);

  const brief = {
    overview: 'A fast-growing B2B SaaS company focused on enterprise workflow automation. Series B funded, ~200 employees, expanding across Southeast Asia.',
    values: ['Speed over perfection', 'Customer obsession', 'Ownership mentality', 'Data-driven decisions'],
    roleExpectations: 'They want someone who can own the frontend independently, work closely with backend engineers, and ship features fast. Communication and proactiveness are highly valued.',
    redFlags: 'High-growth environment — expect ambiguity and shifting priorities.',
  };

  return (
    <div className="space-y-4">
      <input value={company} onChange={e => setCompany(e.target.value)}
        placeholder="e.g. Freshworks — Senior Product Manager"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors"
      />
      <button onClick={() => company && setResearched(true)}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
      >
        {researched ? '🔄 Research Again' : '🏢 Research This Company'}
      </button>

      <AnimatePresence>
        {researched && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {[
              { label: '🏢 Company Overview', content: brief.overview, bg: 'bg-purple-50', border: 'border-purple-100' },
              { label: '🔑 Role Expectations', content: brief.roleExpectations, bg: 'bg-blue-50', border: 'border-blue-100' },
              { label: '⚠️ Things to Know', content: brief.redFlags, bg: 'bg-yellow-50', border: 'border-yellow-100' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`p-4 ${item.bg} border ${item.border} rounded-xl`}
              >
                <p className="text-xs font-bold text-gray-500 mb-2">{item.label}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-xs font-bold text-gray-500 mb-2">💚 Core Values</p>
              <div className="flex flex-wrap gap-2">
                {brief.values.map((v, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-green-200 text-green-700 text-xs rounded-full font-medium">{v}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const JobRankingDemo = () => {
  const jobs = [
    { title: 'Senior React Developer', company: 'Razorpay', score: 91, tag: 'Best Match' },
    { title: 'Frontend Engineer', company: 'Swiggy', score: 78, tag: 'Good Match' },
    { title: 'Full Stack Developer', company: 'Zomato', score: 64, tag: 'Moderate' },
    { title: 'UI Engineer', company: 'PhonePe', score: 47, tag: 'Low Match' },
  ];
  const [revealed, setRevealed] = useState(false);

  const scoreColor = (s) =>
    s >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
    s >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
    'text-red-500 bg-red-50 border-red-200';

  return (
    <div className="space-y-4">
      <div className="p-4 bg-pink-50 border-2 border-pink-200 rounded-xl text-center">
        <p className="text-sm font-bold text-gray-700 mb-1">📄 Resume.pdf loaded</p>
        <p className="text-xs text-gray-500">4 job descriptions added</p>
      </div>

      <button onClick={() => setRevealed(true)}
        className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
      >
        {revealed ? '🔄 Re-rank' : '🎯 Rank My Job Matches'}
      </button>

      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <p className="text-xs font-bold text-gray-500 px-1">Ranked by best fit for your resume:</p>
            {jobs.map((job, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="flex items-center gap-3 p-3 bg-white border-2 border-gray-100 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-black text-gray-400 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.company}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border-2 text-center flex-shrink-0 ${scoreColor(job.score)}`}>
                  <p className="text-lg font-black leading-none">{job.score}%</p>
                  <p className="text-xs font-medium">{job.tag}</p>
                </div>
              </motion.div>
            ))}
            <button onClick={() => setRevealed(false)}
              className="w-full mt-1 py-2 text-xs text-gray-400 underline">Reset</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const demoMap = {
  'match-score': MatchScoreDemo,
  'ats-checker': ATSCheckerDemo,
  'interview-prep': InterviewPrepDemo,
  'company-research': CompanyResearchDemo,
  'job-ranking': JobRankingDemo,
};

// ─── OTHER FEATURES (sidebar navigation) ────────────────────────
const allFeatures = [
  { slug: 'match-score', icon: '🤖', label: 'Match Score' },
  { slug: 'ats-checker', icon: '📄', label: 'ATS Checker' },
  { slug: 'interview-prep', icon: '🎤', label: 'Interview Prep' },
  { slug: 'company-research', icon: '🏢', label: 'Company Research' },
  { slug: 'job-ranking', icon: '🎯', label: 'Job Ranking' },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────────
export default function FeatureDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const feature = featureData[slug];

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!feature) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Feature not found</h2>
          <Link to="/" className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-bold">Back to Home</Link>
        </div>
      </div>
    );
  }

  const DemoComponent = demoMap[feature.demoType];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-lg text-white">J</div>
            <span className="text-xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">JobMorph</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/#features"
              className="text-sm font-semibold text-gray-600 hover:text-cyan-600 transition-colors hidden sm:block"
            >
              ← All Features
            </Link>
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
            >
              ← Back
              
            </button>
            <MinimalNavbar />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-4 gap-10">

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">All Features</p>
              <nav className="space-y-2">
                {allFeatures.map(f => (
                  <Link key={f.slug} to={`/features/${f.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                      f.slug === slug
                        ? `bg-gradient-to-r ${feature.gradient} text-white shadow-md`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <span>{f.icon}</span>
                    <span>{f.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="mt-6 pt-5 border-t border-gray-100">
                <Link to="/signup"
                  className={`block text-center px-4 py-3 bg-gradient-to-r ${feature.gradient} text-white font-bold rounded-xl text-sm hover:shadow-lg transition-all`}
                >
                  🚀 Try Free
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-10">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${feature.bgLight} border ${feature.border} mb-5`}>
                <span className={`text-sm font-bold ${feature.textAccent}`}>Feature Deep Dive</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
                {feature.icon} {feature.title}
              </h1>
              <p className="text-xl text-gray-500">{feature.tagline}</p>
            </motion.div>

            {/* What It Does + Why It Matters */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className={`p-6 ${feature.bgLight} border ${feature.border} rounded-2xl`}
              >
                <h3 className={`font-bold text-lg mb-3 ${feature.textAccent}`}>⚙️ What It Does</h3>
                <p className="text-gray-700 leading-relaxed">{feature.whatItDoes}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="p-6 bg-amber-50 border border-amber-200 rounded-2xl"
              >
                <h3 className="font-bold text-lg mb-3 text-amber-700">💡 Why It Matters</h3>
                <p className="text-gray-700 leading-relaxed">{feature.whyItMatters}</p>
              </motion.div>
            </div>

            {/* How to Use — Steps */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-2xl font-black text-gray-900 mb-6">📋 How to Use This Feature</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {feature.steps.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-start gap-4 p-5 bg-white border-2 border-gray-100 rounded-2xl hover:border-gray-200 transition-colors shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center font-black text-white text-sm flex-shrink-0`}>
                      {step.step}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 mb-1">{step.title}</p>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Interactive Demo */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h2 className="text-2xl font-black text-gray-900 mb-6">🎮 Try It Right Here</h2>
              <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">Interactive Demo — {feature.title}</span>
                </div>
                <DemoComponent />
              </div>
            </motion.div>

            {/* Pro Tips */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h2 className="text-2xl font-black text-gray-900 mb-6">🏆 Pro Tips</h2>
              <div className="space-y-3">
                {feature.tips.map((tip, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.07 }}
                    className="flex items-start gap-4 p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                  >
                    <span className={`text-lg flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <p className="text-gray-700 font-medium leading-relaxed">{tip}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Explore Other Features */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6"
            >
              <h3 className="font-bold text-gray-800 mb-4">Explore Other Features</h3>
              <div className="flex flex-wrap gap-3">
                {allFeatures.filter(f => f.slug !== slug).map(f => (
                  <Link key={f.slug} to={`/features/${f.slug}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 hover:border-cyan-400 text-gray-700 hover:text-cyan-700 rounded-xl text-sm font-semibold transition-all"
                  >
                    {f.icon} {f.label}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className={`p-10 bg-gradient-to-br ${feature.bgLight} border-2 ${feature.border} rounded-3xl text-center`}
            >
              <h2 className="text-3xl font-black text-gray-900 mb-3">
                Ready to use {feature.title}?
              </h2>
              <p className="text-gray-600 mb-7 max-w-md mx-auto">
                Sign up for free and start using this feature in under 60 seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/signup"
                  className={`px-8 py-4 bg-gradient-to-r ${feature.gradient} text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all`}
                >
                  🚀 Try It Free
                </Link>
                <Link to="/"
                  className="px-8 py-4 bg-white text-gray-700 font-semibold text-lg rounded-xl border-2 border-gray-200 hover:border-cyan-400 transition-all"
                >
                  ← Back to Home
                </Link>
              </div>
              <p className="text-sm text-gray-400 mt-4">No credit card • Free forever • 30-second setup</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}