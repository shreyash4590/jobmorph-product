// src/pages/AboutPage.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, ArrowRight } from 'lucide-react';

const coreValues = [
  {
    title: 'Help people get more interviews',
    body: "Start with job seekers and work backward. Their pain is our mission. What are we doing to make their job search easier? What have you learned from our users lately?",
  },
  {
    title: 'Be efficient',
    body: "ROI-focused and accomplish more with less time or cost. How can we reduce time or cost with quality results?",
  },
  {
    title: 'Measure your impact',
    body: "Just like resumes should be measurable, so should our work. What quantifiable results are you driving for job seekers and for JobMorph?",
  },
  {
    title: 'Reach for the impossible',
    body: "Never say \"that's impossible.\" Most things are possible if we try hard enough. We're building the future and will challenge conventional thinking.",
  },
  {
    title: 'Sense of urgency',
    body: "Speed matters in business. Many decisions are reversible and don't need extensive study. We value calculated risk-taking and experimentation. Failures are encouraged as long as we learn.",
  },
  {
    title: 'Communicate proactively',
    body: "We're privileged to work remotely, but the trade-off is communication. More proactive communication is needed to ensure we continue to execute at a great pace.",
  },
  {
    title: 'Experiment',
    body: "None of us have a magic pill. We only have best guesses — and we'd be wrong at least 50% of the time. That's okay. Faster experimentation yields results faster.",
  },
  {
    title: 'Trustworthy',
    body: "Trust is the fundamental bond — between us and our customers, and among team members. We must be honest, keep our word, and protect your data.",
  },
  {
    title: 'Set high bars',
    body: "Always raise the bar. Think about how we can improve. Are we doing the best we can for the people who depend on us?",
  },
];

const stats = [
  { value: '50,000+', label: 'Resumes Analysed'   },
  { value: '92%',     label: 'Match Accuracy'      },
  { value: '3×',      label: 'More Interviews'     },
  { value: '28 sec',  label: 'Average Scan Time'   },
];

const companies = ['Google', 'Microsoft', 'Amazon', 'Infosys', 'TCS', 'Accenture'];

const features = [
  { title: 'Resume Matching',    body: 'Instant AI match score between your resume and any job description — with specific feedback on what to improve.' },
  { title: 'ATS Format Checker', body: 'Detect and auto-fix formatting issues that cause ATS systems to reject your resume before a human ever reads it.' },
  { title: 'Batch Job Matcher',  body: 'Upload one resume against multiple JDs. Get ranked results so you know exactly where to focus your applications.' },
  { title: 'Career Skill Map',   body: 'A personalised map of every skill gap between you and your target role — with curated learning paths to close each gap.' },
  { title: 'Interview Prep',     body: 'AI-generated interview questions tailored to your specific resume and the role you are applying for.' },
  { title: 'Company Research',   body: 'Everything you need before applying — reviews, salaries, culture insights, and company funding in one place.' },
];

export default function AboutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8"
        style={{ height: '56px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
              <Heart size={15} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
                <span className="hover:text-purple-600 cursor-pointer transition-colors"
                  onClick={() => navigate('/dashboard')}>Dashboard</span>
                <ChevronRight size={10} />
                <span className="text-gray-500 font-medium">About</span>
              </div>
              <h1 className="text-sm font-semibold text-gray-900 leading-none">About JobMorph</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
          >
            Try JobMorph <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #f5f3ff 40%, #eff6ff 100%)' }}>
        <div className="max-w-4xl mx-auto px-8 py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: '#e91e8c' }}>About JobMorph</p>
          <h2 className="text-5xl font-extrabold leading-tight mb-6"
            style={{ color: '#1e1b4b' }}>
            Helping job seekers land<br />more interviews, every day.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Our vision is to make the job application process smarter, fairer, and more personalised — so your skills and potential, not keyword tricks, determine whether you get the interview.
          </p>
        </div>
      </section>

      {/* ── Users hired by ───────────────────────────────── */}
      {/* <section className="py-14 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <p className="text-sm text-gray-400 mb-8 font-medium">JobMorph users have been hired by</p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {companies.map((c, i) => (
              <span key={i}
                className="text-xl font-extrabold tracking-tight"
                style={{ color: '#c4c4c4', letterSpacing: '-0.02em' }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-4xl font-extrabold mb-2"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}
                </p>
                <p className="text-sm text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we do ───────────────────────────────────── */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8">
          <h3 className="text-3xl font-extrabold text-center mb-4" style={{ color: '#1e1b4b' }}>
            What JobMorph does
          </h3>
          <p className="text-base text-gray-400 text-center max-w-xl mx-auto mb-16 leading-relaxed">
            A full suite of AI-powered career tools — built to give every job seeker a real competitive advantage.
          </p>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
            {features.map(({ title, body }, i) => (
              <div key={i}>
                <p className="text-base font-bold mb-2"
                  style={{ color: '#7c3aed' }}>{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────── */}
      <section className="py-20 border-b border-gray-100"
        style={{ background: 'linear-gradient(160deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: '#e91e8c' }}>Our Mission</p>
          <p className="text-3xl font-extrabold leading-snug" style={{ color: '#1e1b4b' }}>
            "Empower every job seeker with the tools, insights, and confidence to land the role they deserve — regardless of who they know or where they went to school."
          </p>
        </div>
      </section>

      {/* ── Why we built it ──────────────────────────────── */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: '#e91e8c' }}>Why We Built This</p>
            <h3 className="text-2xl font-extrabold mb-4" style={{ color: '#1e1b4b' }}>
              The hiring process is broken. We're fixing it.
            </h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Most job applications never reach a human recruiter. They're screened out by ATS systems that match keywords mechanically. A brilliant candidate with the wrong resume format — or a few missing terms — gets rejected instantly, automatically, and silently.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              We built JobMorph to change that. Using advanced AI, we analyse your resume against job descriptions and give you the exact insights needed to pass those filters — so your application reaches the desk of someone who can actually hire you.
            </p>
          </div>
        </div>
      </section>

      {/* ── Core Values ──────────────────────────────────── */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8">
          <h3 className="text-3xl font-extrabold text-center mb-16" style={{ color: '#1e1b4b' }}>
            Our core values
          </h3>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
            {coreValues.map(({ title, body }, i) => (
              <div key={i}>
                <p className="text-base font-bold mb-2"
                  style={{ color: '#7c3aed' }}>{title}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h3 className="text-3xl font-extrabold mb-4" style={{ color: '#1e1b4b' }}>
            Ready to land more interviews?
          </h3>
          <p className="text-base text-gray-400 mb-8">
            Analyse your resume against any job description — free, fast, and accurate.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
          >
            Analyse My Resume <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: '#0f0a1e', color: '#a78bfa' }}>
        <div className="max-w-6xl mx-auto px-8 py-14">

          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">

            {/* Brand */}
            <div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2.5 mb-4"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                  <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                  </svg>
                </div>
                <span className="text-sm font-extrabold tracking-widest"
                  style={{ background: 'linear-gradient(135deg,#a78bfa,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  JOBMORPH
                </span>
              </button>
              <p className="text-xs leading-relaxed mb-5" style={{ color: '#6b7280' }}>
                AI-powered resume analysis helping<br />job seekers match their skills with<br />perfect opportunities.
              </p>
              <div className="flex gap-3">
                {['𝕏', 'in', 'gh'].map((s) => (
                  <a key={s}
                    href="#"
                    onClick={e => e.preventDefault()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#a78bfa' }}>Product</p>
              <div className="flex flex-col gap-2.5">
                {[['Resume Matcher', '/upload'], ['ATS Checker', '/ats-checker'], ['Batch Matcher', '/batch-matcher'], ['Career Skill Map', '/missing-skills']].map(([label, path]) => (
                  <button key={label}
                    onClick={() => navigate(path)}
                    className="text-left text-sm transition-colors hover:text-white"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b7280' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#a78bfa' }}>Company</p>
              <div className="flex flex-col gap-2.5">
                {[['About Us', '/about'], ['Help Center', '/help'], ['Contact', '/contact'], ['Privacy Policy', '/privacy']].map(([label, path]) => (
                  <button key={label}
                    onClick={() => navigate(path)}
                    className="text-left text-sm transition-colors hover:text-white"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b7280' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#a78bfa' }}>Support</p>
              <div className="flex flex-col gap-2.5">
                <a href="mailto:support@jobmorph.ai"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: '#6b7280', textDecoration: 'none' }}>
                  support@jobmorph.ai
                </a>
                {[['Help Center', '/help'], ['Privacy Policy', '/privacy'], ['Terms of Service', '#']].map(([label, path]) => (
                  <button key={label}
                    onClick={() => path !== '#' && navigate(path)}
                    className="text-left text-sm transition-colors hover:text-white"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b7280' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <span className="text-xs" style={{ color: '#4b5563' }}>
              ©️ {new Date().getFullYear()} JobMorph. All rights reserved.
            </span>
            <div className="flex items-center gap-6">
              {['Privacy', 'Terms', 'Cookies'].map((l) => (
                <a key={l} href="#" onClick={e => e.preventDefault()}
                  className="text-xs transition-colors hover:text-white"
                  style={{ color: '#4b5563', textDecoration: 'none' }}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}