import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MinimalNavbar from '../components/MinimalNavbar';

const steps = [
  {
    number: '01',
    icon: '📤',
    title: 'Upload Your Resume',
    subtitle: 'Start with your existing resume',
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    details: [
      'Supports PDF and DOCX formats',
      'Drag & drop or click to browse',
      'File size up to 5MB',
      'Your resume is encrypted immediately',
    ],
    demo: {
      type: 'upload',
      label: 'Try dragging a file here',
    },
  },
  {
    number: '02',
    icon: '📋',
    title: 'Paste Job Description',
    subtitle: 'From LinkedIn, Naukri, or any job board',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    details: [
      'Copy JD from any job portal',
      'Paste the full description for best results',
      'Supports any language format',
      'Include role, requirements & responsibilities',
    ],
    demo: {
      type: 'paste',
      label: 'See a sample job description',
    },
  },
  {
    number: '03',
    icon: '🧠',
    title: 'AI Analyses in 30 Seconds',
    subtitle: 'Our AI reads, compares and scores everything',
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    details: [
      'Scans 50+ matching parameters',
      'Checks keywords, skills, experience',
      'Detects ATS compatibility issues',
      'Compares tone and role alignment',
    ],
    demo: {
      type: 'analyze',
      label: 'Watch the AI work',
    },
  },
  {
    number: '04',
    icon: '📊',
    title: 'Get Your Results',
    subtitle: 'Detailed insights, not just a number',
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    details: [
      'Overall match score (0–100%)',
      'Missing keywords to add',
      'Skills gap analysis',
      'ATS issues & how to fix them',
    ],
    demo: {
      type: 'results',
      label: 'Preview sample results',
    },
  },
];

// Interactive Demo Components
const UploadDemo = () => {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-4">
      <motion.div
        onHoverStart={() => setDragging(true)}
        onHoverEnd={() => setDragging(false)}
        onClick={() => setUploaded(!uploaded)}
        animate={{ borderColor: dragging ? '#06b6d4' : '#e5e7eb', scale: dragging ? 1.02 : 1 }}
        className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer transition-colors"
        style={{ background: dragging ? 'rgba(6,182,212,0.04)' : 'white' }}
      >
        {uploaded ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="space-y-2">
            <div className="text-5xl">✅</div>
            <p className="font-bold text-gray-800">Resume_John.pdf</p>
            <p className="text-sm text-green-600 font-medium">Uploaded successfully!</p>
            <p className="text-xs text-gray-400">Click to reset</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <motion.div animate={{ y: dragging ? -8 : 0 }} className="text-5xl">📄</motion.div>
            <p className="font-semibold text-gray-700">Drag & drop your resume here</p>
            <p className="text-sm text-gray-400">or click to upload • PDF, DOCX</p>
            <div className="inline-block px-4 py-2 bg-cyan-500 text-white text-sm rounded-lg font-medium">
              Browse Files
            </div>
          </div>
        )}
      </motion.div>
      <div className="flex gap-2 text-xs text-gray-500 justify-center">
        <span className="px-2 py-1 bg-gray-100 rounded">🔒 SSL Encrypted</span>
        <span className="px-2 py-1 bg-gray-100 rounded">📁 Max 5MB</span>
        <span className="px-2 py-1 bg-gray-100 rounded">✅ PDF & DOCX</span>
      </div>
    </div>
  );
};

const PasteDemo = () => {
  const sampleJD = `Senior Software Engineer — React

We are looking for a skilled React developer with:
• 3+ years of experience with React.js
• Strong knowledge of TypeScript & REST APIs
• Experience with Node.js and MongoDB
• Familiarity with AWS or GCP
• Good communication skills

Responsibilities:
- Build scalable frontend applications
- Collaborate with product & design teams
- Write clean, tested, documented code`;

  const [text, setText] = useState('');
  const [filled, setFilled] = useState(false);

  const fillSample = () => {
    setText(sampleJD);
    setFilled(true);
  };

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the job description here..."
        rows={8}
        className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400 transition-colors"
      />
      <div className="flex gap-2">
        <button
          onClick={fillSample}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          {filled ? '✅ Sample Loaded' : '📋 Load Sample JD'}
        </button>
        {text && (
          <button
            onClick={() => { setText(''); setFilled(false); }}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

const AnalyzeDemo = () => {
  const [phase, setPhase] = useState('idle'); // idle, running, done

  const steps_ai = [
    { label: 'Reading resume content...', duration: 800 },
    { label: 'Parsing job description...', duration: 600 },
    { label: 'Matching keywords & skills...', duration: 900 },
    { label: 'Checking ATS compatibility...', duration: 700 },
    { label: 'Generating match score...', duration: 500 },
    { label: 'Building recommendations...', duration: 600 },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const runAnalysis = async () => {
    setPhase('running');
    setCompletedSteps([]);
    setCurrentStep(0);

    for (let i = 0; i < steps_ai.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, steps_ai[i].duration));
      setCompletedSteps(prev => [...prev, i]);
    }
    setPhase('done');
  };

  const reset = () => {
    setPhase('idle');
    setCurrentStep(0);
    setCompletedSteps([]);
  };

  return (
    <div className="space-y-4">
      {phase === 'idle' && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-gray-600 mb-6">Click below to watch the AI analyse a resume in real-time</p>
          <button
            onClick={runAnalysis}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            ▶ Start Analysis Demo
          </button>
        </div>
      )}

      {(phase === 'running' || phase === 'done') && (
        <div className="space-y-3">
          {steps_ai.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.3, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                completedSteps.includes(i)
                  ? 'bg-green-500 text-white'
                  : i === currentStep && phase === 'running'
                  ? 'bg-indigo-500 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {completedSteps.includes(i) ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${
                completedSteps.includes(i) ? 'text-green-700' :
                i === currentStep ? 'text-indigo-700' : 'text-gray-400'
              }`}>{step.label}</span>
              {i === currentStep && phase === 'running' && (
                <div className="ml-auto flex gap-1">
                  {[0,1,2].map(d => (
                    <motion.div key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                      animate={{ opacity: [0.3,1,0.3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.2 }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}

          {phase === 'done' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl text-center"
            >
              <div className="text-3xl mb-1">🎉</div>
              <p className="font-bold text-green-700">Analysis Complete! Score: 87%</p>
              <button onClick={reset} className="mt-2 text-xs text-gray-500 underline">Run again</button>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

const ResultsDemo = () => {
  const [activeTab, setActiveTab] = useState('score');

  const tabs = [
    { id: 'score', label: '📊 Score', },
    { id: 'keywords', label: '🔑 Keywords', },
    { id: 'ats', label: '🤖 ATS', },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'score' && (
          <motion.div key="score" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 bg-white border-2 border-gray-100 rounded-xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700">Overall Match</span>
              <span className="text-3xl font-black text-green-600">87%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: '87%' }} transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              />
            </div>
            {[
              { label: 'Technical Skills', score: 92, color: 'bg-cyan-500' },
              { label: 'Experience Level', score: 78, color: 'bg-blue-500' },
              { label: 'Soft Skills', score: 85, color: 'bg-purple-500' },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-bold">{item.score}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    className={`h-full ${item.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'keywords' && (
          <motion.div key="keywords" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 bg-white border-2 border-gray-100 rounded-xl space-y-3"
          >
            <p className="text-sm font-semibold text-gray-500">✅ Found in your resume</p>
            <div className="flex flex-wrap gap-2">
              {['React.js', 'TypeScript', 'REST APIs', 'Node.js', 'Git'].map(k => (
                <span key={k} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium border border-green-200">{k}</span>
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-500 pt-2">❌ Missing — add these</p>
            <div className="flex flex-wrap gap-2">
              {['MongoDB', 'AWS', 'GCP', 'CI/CD'].map(k => (
                <span key={k} className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded-full font-medium border border-red-200">{k}</span>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'ats' && (
          <motion.div key="ats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-5 bg-white border-2 border-gray-100 rounded-xl space-y-3"
          >
            {[
              { icon: '✅', text: 'Standard font detected', status: 'good' },
              { icon: '✅', text: 'No tables or columns found', status: 'good' },
              { icon: '⚠️', text: 'Header contains contact info — may be skipped', status: 'warn' },
              { icon: '❌', text: 'Image found — ATS cannot read images', status: 'bad' },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                item.status === 'good' ? 'bg-green-50' :
                item.status === 'warn' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <span>{item.icon}</span>
                <span className={`text-sm font-medium ${
                  item.status === 'good' ? 'text-green-700' :
                  item.status === 'warn' ? 'text-yellow-700' : 'text-red-700'
                }`}>{item.text}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const demoComponents = [UploadDemo, PasteDemo, AnalyzeDemo, ResultsDemo];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const ActiveDemo = demoComponents[activeStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-lg text-white">J</div>
            <span className="text-xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">JobMorph</span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
          >
            ← Back to Home
          </button>
          <MinimalNavbar />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-6">
            <span className="text-sm font-bold text-cyan-700">Complete Walkthrough</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent">
              How JobMorph Works
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            4 simple steps. 30 seconds. Know exactly where you stand before applying.
          </p>
        </motion.div>

        {/* Step Selector Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {steps.map((step, i) => (
            <motion.button
              key={i}
              onClick={() => setActiveStep(i)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                activeStep === i
                  ? `bg-gradient-to-r ${step.color} text-white border-transparent shadow-lg`
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{step.icon}</span>
              <span>Step {step.number}</span>
              <span className="hidden sm:block">— {step.title}</span>
            </motion.button>
          ))}
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid lg:grid-cols-2 gap-12 items-start"
          >
            {/* Left — Step Info */}
            <div className="space-y-8">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${steps[activeStep].bgColor} border ${steps[activeStep].borderColor} mb-4`}>
                  <span className={`text-sm font-bold ${steps[activeStep].textColor}`}>
                    Step {steps[activeStep].number} of 04
                  </span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-3">
                  {steps[activeStep].icon} {steps[activeStep].title}
                </h2>
                <p className="text-xl text-gray-500">{steps[activeStep].subtitle}</p>
              </div>

              <div className={`p-6 rounded-2xl ${steps[activeStep].bgColor} border ${steps[activeStep].borderColor}`}>
                <h3 className={`font-bold text-lg mb-4 ${steps[activeStep].textColor}`}>What happens here:</h3>
                <ul className="space-y-3">
                  {steps[activeStep].details.map((detail, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${steps[activeStep].color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium">{detail}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Navigation Arrows */}
              <div className="flex gap-3">
                {activeStep > 0 && (
                  <button onClick={() => setActiveStep(activeStep - 1)}
                    className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 transition-colors"
                  >
                    ← Previous Step
                  </button>
                )}
                {activeStep < steps.length - 1 ? (
                  <button onClick={() => setActiveStep(activeStep + 1)}
                    className={`flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${steps[activeStep].color} text-white font-bold rounded-xl hover:shadow-lg transition-all`}
                  >
                    Next Step →
                  </button>
                ) : (
                  <Link to="/signup"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                  >
                    🚀 Try It Now — Free
                  </Link>
                )}
              </div>
            </div>

            {/* Right — Interactive Demo */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-400 font-medium">Interactive Demo — Step {steps[activeStep].number}</span>
              </div>
              <ActiveDemo />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{activeStep + 1} / {steps.length} steps</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FEATURES SECTION — with Read More buttons             */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24"
        >
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-5">
              <span className="text-sm font-bold text-cyan-700">What You Get After Analysis</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Explore All Features
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Each feature is designed to give you a clear edge in your job search.
              Click "Read More" to see how each one works with a live demo.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Match Score',
                slug: 'match-score',
                desc: 'Get an instant score showing how well your resume matches the job description across 50+ parameters.',
                gradient: 'from-cyan-500 to-blue-600',
                bgLight: 'bg-cyan-50',
                border: 'border-cyan-200',
                textAccent: 'text-cyan-700',
              },
              {
                icon: '📄',
                title: 'ATS Format Checker',
                slug: 'ats-checker',
                desc: 'Detect formatting issues that prevent ATS systems from reading your resume — before you apply.',
                gradient: 'from-blue-500 to-indigo-600',
                bgLight: 'bg-blue-50',
                border: 'border-blue-200',
                textAccent: 'text-blue-700',
              },
              {
                icon: '🎤',
                title: 'Interview Prep',
                slug: 'interview-prep',
                desc: 'Get role-specific interview questions and key concepts to revise based on the job description.',
                gradient: 'from-indigo-500 to-purple-600',
                bgLight: 'bg-indigo-50',
                border: 'border-indigo-200',
                textAccent: 'text-indigo-700',
              },
              {
                icon: '🏢',
                title: 'Company Research',
                slug: 'company-research',
                desc: 'Understand the company culture, values, and role expectations before your interview.',
                gradient: 'from-purple-500 to-pink-600',
                bgLight: 'bg-purple-50',
                border: 'border-purple-200',
                textAccent: 'text-purple-700',
              },
              {
                icon: '🎯',
                title: 'Smart Job Ranking',
                slug: 'job-ranking',
                desc: 'Paste multiple job descriptions and we rank them by how well your resume fits each one.',
                gradient: 'from-pink-500 to-rose-600',
                bgLight: 'bg-pink-50',
                border: 'border-pink-200',
                textAccent: 'text-pink-700',
              },
              {
                icon: '🔒',
                title: 'Secure & Private',
                slug: null,
                desc: 'Your resume and data are encrypted and never shared with anyone. Complete privacy guaranteed.',
                gradient: 'from-rose-500 to-orange-600',
                bgLight: 'bg-rose-50',
                border: 'border-rose-200',
                textAccent: 'text-rose-700',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl border-2 border-gray-100 hover:border-cyan-300 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl mb-5 shadow-md`}>
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed flex-1">
                  {feature.desc}
                </p>

                {/* Read More button — only for features with a slug */}
                {feature.slug ? (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <Link
                      to={`/features/${feature.slug}`}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${feature.gradient} text-white text-sm font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200`}
                    >
                      Read More
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 ${feature.bgLight} ${feature.border} border rounded-xl text-xs font-bold ${feature.textAccent}`}>
                      🔒 Always Enabled
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* View All Features link */}
          <div className="text-center mt-10">
            <Link
              to="/#features"
              className="inline-flex items-center gap-2 text-cyan-600 font-bold hover:text-cyan-700 transition-colors text-sm"
            >
              ← Back to all features on home page
            </Link>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-12 border-2 border-cyan-200"
        >
          <h2 className="text-4xl font-black text-gray-900 mb-4">Ready to Analyse Your Resume?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
            Now that you know how it works — try it yourself. Free, instant, no credit card.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup"
              className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
            >
              🚀 Get My Match Score — Free
            </Link>
            <Link to="/"
              className="px-10 py-4 bg-white text-gray-700 font-semibold text-lg rounded-xl border-2 border-gray-200 hover:border-cyan-400 transition-all"
            >
              ← Back to Home
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-4">No credit card • No spam • Results in 30 seconds</p>
        </motion.div>
      </div>
    </div>
  );
}