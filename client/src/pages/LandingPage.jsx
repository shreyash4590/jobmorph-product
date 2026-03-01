/**
 * LandingPage.jsx — Performance-optimised build
 *
 * Fixes applied (zero logic changes):
 *  1. Removed AOS entirely — framer-motion handles all animations, AOS was dead weight
 *  2. Static data (features, navItems, steps, variants) moved outside component — allocated once, never re-created
 *  3. theme object wrapped in useMemo(isDark) — only recomputed on actual theme change
 *  4. ModeIcon moved outside component as a pure function — no more inline component-in-render
 *  5. mousemove throttled with requestAnimationFrame — was firing setState 100+ times/sec
 *  6. scroll handler throttled with requestAnimationFrame — was calling getBoundingClientRect 4× per tick
 *  7. hasPointer flag computed once on mount via useRef — was calling matchMedia on every mouse event
 *  8. scrollToSection, handleGetStarted, handleEmailSubmit wrapped in useCallback — stable refs
 *  9. heroRef removed — was created but never used
 * 10. viewport={{ once:true, margin:'-80px' }} added to all whileInView — avoids re-triggering near edges
 */

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll } from 'framer-motion';

// ─── Static data — defined once at module level, never re-allocated ───────────

const DARK_THEME = {
  bg:            '#0f172a',
  bgAlt:         '#1e293b',
  bgCard:        '#1e293b',
  border:        '#334155',
  borderLight:   '#475569',
  text:          '#f1f5f9',
  textMuted:     '#94a3b8',
  textSub:       '#64748b',
  navBg:         'rgba(15,23,42,0.95)',
  navBorder:     '#1e293b',
  inputBg:       '#1e293b',
  badgeBg:       '#1e293b',
  badgeBorder:   '#334155',
  modeBtnBg:     '#1e293b',
  modeBtnBorder: '#475569',
  modeBtnText:   '#94a3b8',
  tableHead:     '#1e293b',
  tableRow:      '#0f172a',
  footerBg:      '#0f172a',
  redBg:         'rgba(239,68,68,0.08)',
  redBorder:     'rgba(239,68,68,0.2)',
  cyanBg:        'rgba(6,182,212,0.08)',
  cyanBorder:    'rgba(6,182,212,0.2)',
  greenBg:       'rgba(34,197,94,0.08)',
  greenBorder:   'rgba(34,197,94,0.25)',
  yellowBg:      'rgba(234,179,8,0.08)',
  yellowBorder:  'rgba(234,179,8,0.2)',
  purpleBg:      'rgba(168,85,247,0.08)',
  purpleBorder:  'rgba(168,85,247,0.2)',
  stepBg:        '#1e293b',
  stepBorder:    '#334155',
};

const LIGHT_THEME = {
  bg:            '#ffffff',
  bgAlt:         '#f9fafb',
  bgCard:        '#ffffff',
  border:        '#e5e7eb',
  borderLight:   '#d1d5db',
  text:          '#111827',
  textMuted:     '#6b7280',
  textSub:       '#9ca3af',
  navBg:         'rgba(255,255,255,0.95)',
  navBorder:     '#e5e7eb',
  inputBg:       '#ffffff',
  badgeBg:       '#ffffff',
  badgeBorder:   '#e5e7eb',
  modeBtnBg:     '#ffffff',
  modeBtnBorder: '#e5e7eb',
  modeBtnText:   '#6b7280',
  tableHead:     '#f9fafb',
  tableRow:      '#ffffff',
  footerBg:      '#f9fafb',
  redBg:         '#fef2f2',
  redBorder:     '#fecaca',
  cyanBg:        '#ecfeff',
  cyanBorder:    '#a5f3fc',
  greenBg:       '#f0fdf4',
  greenBorder:   '#bbf7d0',
  yellowBg:      '#fefce8',
  yellowBorder:  '#fde68a',
  purpleBg:      '#faf5ff',
  purpleBorder:  '#e9d5ff',
  stepBg:        '#ffffff',
  stepBorder:    '#e5e7eb',
};

const NAV_ITEMS = [
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Features',     id: 'features'     },
  { label: 'Use Cases',    id: 'use-cases'    },
  { label: 'Pricing',      id: 'pricing'      },
];

const FEATURES = [
  { icon:'🤖', title:'AI-Powered Analysis',  slug:'match-score',      gradient:'from-cyan-500 to-blue-600',    desc:'Advanced algorithms analyze your resume against job descriptions with precision, delivering clear match insights and actionable improvement suggestions.' },
  { icon:'📄', title:'ATS Format Checker',   slug:'ats-checker',      gradient:'from-blue-500 to-indigo-600',  desc:'Detects issues like scanned PDFs, images, tables, columns, fonts, and layouts that ATS cannot read — and shows exactly what to fix.' },
  { icon:'🏢', title:'Company Research',     slug:'company-research', gradient:'from-indigo-500 to-purple-600',desc:'Get a clear understanding of the company, its role expectations, and key focus areas before your interview.' },
  { icon:'🎤', title:'Interview Prep',        slug:'interview-prep',   gradient:'from-purple-500 to-pink-600',  desc:'Get role-specific interview questions, key concepts to revise, and focused preparation based on the job description.' },
  { icon:'🎯', title:'Smart Job Ranking',    slug:'job-ranking',      gradient:'from-pink-500 to-rose-600',    desc:'Evaluates multiple job descriptions and ranks them by how well your resume fits — so you apply where you actually belong.' },
  { icon:'🔒', title:'Secure & Private',     slug:null,               gradient:'from-rose-500 to-orange-600',  desc:'Your data is encrypted and never shared with anyone. Complete privacy guaranteed.' },
];

const HOW_STEPS = [
  { number:'1', icon:'📤', title:'Upload Resume',       desc:'Upload your resume in PDF or DOCX format',         gradient:'from-cyan-500 to-blue-600'    },
  { number:'2', icon:'📋', title:'Add Job Description', desc:'Paste the job description you want to apply for',  gradient:'from-blue-500 to-indigo-600'  },
  { number:'3', icon:'🧠', title:'AI Analysis',          desc:'Our AI analyses your match in 30 seconds',        gradient:'from-indigo-500 to-purple-600' },
  { number:'4', icon:'📊', title:'Get Results',          desc:'Review your match score and actionable insights', gradient:'from-purple-500 to-pink-600'   },
];

const USE_CASES = [
  { icon:'🎓', title:'Recent Graduates',  gradient:'from-cyan-500 to-blue-600',    desc:'Land your first job with confidence by knowing exactly how your resume stacks up against real requirements.' },
  { icon:'🔄', title:'Career Changers',   gradient:'from-blue-500 to-indigo-600',  desc:'See which transferable skills match your new target roles — and which gaps to fill before applying.' },
  { icon:'🚀', title:'Active Job Seekers',gradient:'from-indigo-500 to-purple-600',desc:'Apply smarter, not harder. Focus only on jobs where you score 70%+ and save hours of wasted effort.' },
  { icon:'💼', title:'HR Professionals',  gradient:'from-purple-500 to-pink-600',  desc:'Screen candidates faster with instant AI-powered match scoring against your job descriptions.' },
];

const FAQ_ITEMS = [
  { q:'Is JobMorph completely free?',         a:'Yes! Core features are completely free — upload resumes, analyze matches, and get detailed results at no cost. Premium features are coming soon.' },
  { q:'Is my resume data safe?',              a:'Absolutely. All data is encrypted with SSL. Your resume is never shared with third parties and remains completely private.' },
  { q:'Do I need to create an account?',     a:'Yes — a free account gives you a personalized dashboard, scan history, and saved results. Signup takes under 60 seconds.' },
  { q:'What file formats are supported?',     a:'We support PDF and DOCX formats — the most common formats used by job seekers and ATS systems.' },
  { q:'How does the AI matching work?',       a:'Our AI analyzes keywords, skills, experience, education, and qualifications — then compares them against job requirements to give you an accurate match % with specific recommendations.' },
  { q:'Can I use it for multiple applications?',a:'Absolutely! Analyze your resume against as many job descriptions as you want. We recommend testing a tailored version for each role.' },
  { q:'Will this help me pass ATS systems?',  a:'Yes. We check formatting, keywords, and layout issues that cause ATS rejections — and show you exactly what to fix.' },
  { q:'How long does analysis take?',         a:'Under 30 seconds. Our AI processes your resume and job description in real-time.' },
];

const COMPARISON_ROWS = [
  { feature:'Analysis Time',        manual:'30+ minutes',     jobmorph:'30 seconds',      icon:'⚡' },
  { feature:'Accuracy',             manual:'Subjective guess', jobmorph:'95% AI accuracy', icon:'🎯' },
  { feature:'Match Score',          manual:'No scoring',       jobmorph:'Detailed %',      icon:'📊' },
  { feature:'Keyword Suggestions',  manual:'Manual research',  jobmorph:'Auto-generated',  icon:'💡' },
  { feature:'History Tracking',     manual:'None',             jobmorph:'Full history',    icon:'📂' },
  { feature:'Cost',                 manual:'Time = money',     jobmorph:'Free',            icon:'💰' },
];

const TRUST_BADGES = [
  { icon:'🔒', text:'SSL Encrypted'  },
  { icon:'⚡', text:'Lightning Fast' },
  { icon:'🎯', text:'95% Accuracy'   },
  { icon:'🔐', text:'GDPR Compliant' },
];

// Framer-motion variants — module level, stable references
const fadeInUp = { hidden:{ opacity:0, y:30 }, visible:{ opacity:1, y:0 } };
const stagger  = { hidden:{ opacity:0 }, visible:{ opacity:1, transition:{ staggerChildren:0.12 } } };
const scaleIn  = { hidden:{ scale:0.85, opacity:0 }, visible:{ scale:1, opacity:1, transition:{ type:'spring', stiffness:100 } } };

// Shared viewport config — avoids creating a new object on every whileInView render
const VP = { once: true, margin: '-80px' };

// ─── ModeIcon — pure function outside component, no closure needed ────────────
function ModeIcon({ mode }) {
  if (mode === 'dark') return (
    <svg style={{ width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
  if (mode === 'light') return (
    <svg style={{ width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
  return (
    <svg style={{ width:15, height:15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

// ─── useTheme hook ────────────────────────────────────────────────────────────
function useTheme() {
  const [mode, setMode] = useState(() => localStorage.getItem('jm_theme') || 'system');

  const isDark = useMemo(() => (
    mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ), [mode]);

  useEffect(() => { localStorage.setItem('jm_theme', mode); }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    // Use a dummy state flip to react to system changes
    const handler = () => setMode(m => m); // same value, triggers re-eval of isDark memo
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const cycle = useCallback(() => {
    setMode(prev => prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system');
  }, []);

  return { mode, isDark, cycle };
}

// ─── Main component ───────────────────────────────────────────────────────────
function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition]   = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [email, setEmail]                   = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [activeSection, setActiveSection]   = useState('');

  const { mode, isDark, cycle } = useTheme();

  // theme object — only re-built when isDark flips
  const s = useMemo(() => isDark ? DARK_THEME : LIGHT_THEME, [isDark]);

  const { scrollYProgress } = useScroll();

  // Stable flag — check hover capability once, store in ref
  const hasPointer = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches
  );

  // RAF refs for throttling — one flag per event type
  const mouseTicking  = useRef(false);
  const scrollTicking = useRef(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!hasPointer.current || mouseTicking.current) return;
      mouseTicking.current = true;
      requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        mouseTicking.current = false;
      });
    };

    const onScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 50);
        let current = '';
        for (const { id } of NAV_ITEMS) {
          const el = document.getElementById(id);
          if (el && el.getBoundingClientRect().top <= 130) current = id;
        }
        setActiveSection(current);
        scrollTicking.current = false;
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll',    onScroll,    { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll',    onScroll);
    };
  }, []); // no deps — handlers read from refs/closures, never stale

  const scrollToSection = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveSection(id);
    }
    setMobileMenuOpen(false);
  }, []);

  const handleGetStarted = useCallback(() => {
    navigate(localStorage.getItem('token') ? '/upload' : '/signup');
  }, [navigate]);

  const handleEmailSubmit = useCallback((e) => {
    e.preventDefault();
    if (email) {
      setEmailSubmitted(true);
      setTimeout(() => { setEmailSubmitted(false); setEmail(''); }, 3000);
    }
  }, [email]);

  const modeLabel = mode === 'dark' ? 'Dark' : mode === 'light' ? 'Light' : 'System';

  // Derived theme values used in JSX
  const heroGradient  = isDark ? 'linear-gradient(135deg,#0f172a,#0c1a2e,#0f172a)' : 'linear-gradient(135deg,#ffffff,#ecfeff40,#eff6ff40)';
  const darkGradText  = isDark ? { backgroundImage: 'linear-gradient(to right,#f1f5f9,#22d3ee)' } : {};
  const darkGradText3 = isDark ? { backgroundImage: 'linear-gradient(to right,#f1f5f9,#22d3ee,#f1f5f9)' } : {};

  return (
    <div style={{ backgroundColor:s.bg, color:s.text, minHeight:'100vh', overflowX:'hidden', transition:'background-color 0.3s,color 0.3s' }}>

      {/* ── Scroll progress bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* ── Cursor glow (desktop only) ── */}
      <div className="pointer-events-none fixed inset-0 z-30 hidden md:block"
        style={{ background:`radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px,rgba(6,182,212,0.07),transparent 80%)` }}
      />

      {/* ════════════════════════════════════════════════════════════ */}
      {/* NAVBAR                                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <motion.nav
        initial={{ y:-100 }} animate={{ y:0 }}
        transition={{ type:'spring', stiffness:100 }}
        style={{
          position:'fixed', top:0, left:0, right:0, zIndex:50,
          backgroundColor: scrolled ? s.navBg       : 'transparent',
          borderBottom:     scrolled ? `1px solid ${s.navBorder}` : 'none',
          backdropFilter:   scrolled ? 'blur(20px)'  : 'none',
          boxShadow:        scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
          transition:'background-color 0.3s,border-color 0.3s',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <motion.div whileHover={{ rotate:360 }} transition={{ duration:0.6 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg"
              >J</motion.div>
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">JobMorph</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <motion.button key={item.id} onClick={() => scrollToSection(item.id)} whileHover={{ scale:1.05 }}
                    style={{
                      position:'relative', padding:'6px 14px', borderRadius:8,
                      fontWeight:500, fontSize:14, border:'none', cursor:'pointer',
                      backgroundColor: isActive ? (isDark ? 'rgba(6,182,212,0.12)' : '#ecfeff') : 'transparent',
                      color: isActive ? '#0891b2' : s.textMuted,
                      transition:'all 0.2s',
                    }}
                  >
                    {item.label}
                    <motion.span
                      style={{ position:'absolute', bottom:3, left:'50%', transform:'translateX(-50%)', height:2, backgroundColor:'#06b6d4', borderRadius:2, display:'block' }}
                      animate={{ width: isActive ? '55%' : '0%' }}
                      transition={{ duration:0.25 }}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Right side: theme toggle + Log In + Sign Up */}
            <div className="hidden md:flex items-center gap-2">
              <motion.button onClick={cycle} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                title={`Theme: ${modeLabel} — click to change`}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'7px 12px', borderRadius:8,
                  border:`1px solid ${s.modeBtnBorder}`,
                  backgroundColor:s.modeBtnBg, color:s.modeBtnText,
                  fontSize:12, fontWeight:600, cursor:'pointer',
                  transition:'all 0.2s', whiteSpace:'nowrap',
                }}
              >
                <ModeIcon mode={mode} />
                <span>{modeLabel}</span>
              </motion.button>

              <Link to="/login"
                style={{ padding:'9px 20px', color:s.textMuted, fontWeight:600, borderRadius:8, fontSize:14, textDecoration:'none', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.color='#0891b2'; e.currentTarget.style.backgroundColor=isDark ? 'rgba(6,182,212,0.08)' : '#f9fafb'; }}
                onMouseLeave={e => { e.currentTarget.style.color=s.textMuted;  e.currentTarget.style.backgroundColor='transparent'; }}
              >Log In</Link>

              <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
                <Link to="/signup" className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 relative overflow-hidden group text-sm" style={{ textDecoration:'none' }}>
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </motion.div>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(o => !o)}
              style={{ background:'none', border:'none', cursor:'pointer', padding:8, color:s.text }}
              className="md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              style={{ borderTop:`1px solid ${s.border}`, marginTop:16, paddingTop:16, paddingBottom:16 }}
            >
              <div className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button key={item.id} onClick={() => scrollToSection(item.id)}
                      style={{
                        textAlign:'left', padding:'10px 14px', borderRadius:10,
                        fontWeight:500, border:'none', cursor:'pointer',
                        backgroundColor: isActive ? (isDark ? 'rgba(6,182,212,0.12)' : '#ecfeff') : 'transparent',
                        color: isActive ? '#0891b2' : s.textMuted,
                      }}
                    >{item.label}</button>
                  );
                })}
                <div style={{ borderTop:`1px solid ${s.border}`, marginTop:8, paddingTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                  <button onClick={cycle}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:10, border:'none', cursor:'pointer', backgroundColor:'transparent', color:s.textMuted, fontWeight:500, fontSize:14 }}
                  >
                    <ModeIcon mode={mode} /><span>{modeLabel} Mode</span>
                  </button>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ textAlign:'center', padding:'10px 24px', color:s.text, fontWeight:600, textDecoration:'none' }}>Sign In</Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg" style={{ textDecoration:'none' }}>Sign Up</Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Grid background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage:'linear-gradient(to right,rgba(6,182,212,.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(6,182,212,.03) 1px,transparent 1px)', backgroundSize:'80px 80px' }} />
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HERO                                                          */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20" style={{ background: heroGradient }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:8, repeat:Infinity }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
          <motion.div animate={{ scale:[1.2,1,1.2], opacity:[0.5,0.3,0.5] }} transition={{ duration:10, repeat:Infinity, delay:1 }} className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[130px]" />
          <motion.div animate={{ scale:[1,1.3,1], opacity:[0.2,0.4,0.2] }} transition={{ duration:12, repeat:Infinity, delay:2 }} className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left space-y-8">

              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border"
                style={{ backgroundColor:'rgba(6,182,212,0.1)', borderColor:'rgba(6,182,212,0.3)' }}
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </div>
                <span className="text-sm font-bold text-cyan-600">AI-Powered Resume Analysis</span>
              </motion.div>

              <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
                  <span className="block" style={{ color:s.text }}>Your Resume.</span>
                  <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2 animate-gradient">Perfectly Matched.</span>
                </h1>
                <p className="text-xl md:text-2xl max-w-2xl leading-relaxed" style={{ color:s.textMuted }}>
                  Upload your resume, paste any job description — get your match score in{' '}
                  <span className="font-bold" style={{ color:s.text }}>30 seconds</span>. Know your chances before you apply.
                </p>
              </motion.div>

              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
                className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
              >
                <motion.button onClick={handleGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl overflow-hidden shadow-lg hover:shadow-[0_20px_50px_rgba(6,182,212,0.4)] transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started Free
                    <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x:[0,5,0] }} transition={{ duration:1.5, repeat:Infinity }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </span>
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500" initial={{ x:'100%' }} whileHover={{ x:0 }} transition={{ duration:0.3 }} />
                </motion.button>

                <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
                  <button onClick={() => scrollToSection('how-it-works')}
                    className="flex items-center gap-2 px-10 py-4 font-semibold text-lg rounded-xl border-2 transition-all duration-300 shadow-lg cursor-pointer"
                    style={{ backgroundColor:s.bgCard, color:s.text, borderColor:s.border }}
                  >
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Read More
                  </button>
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
              >
                {TRUST_BADGES.map((b, i) => (
                  <motion.div key={i} whileHover={{ scale:1.08, rotate:1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    style={{ backgroundColor:s.badgeBg, border:`1px solid ${s.badgeBorder}` }}
                  >
                    <span className="text-xl">{b.icon}</span>
                    <span className="font-semibold text-sm" style={{ color:s.textMuted }}>{b.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Resume Mockup */}
            <motion.div initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.8, type:'spring' }} className="relative hidden lg:block">
              <motion.div animate={{ y:[0,-20,0], rotate:[0,2,0,-2,0] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }} className="relative">
                <div className="rounded-2xl shadow-2xl p-8 border-2" style={{ backgroundColor:s.bgCard, borderColor:s.border }}>
                  <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom:`2px solid ${s.border}` }}>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">JD</div>
                    <div>
                      <div className="h-4 w-32 rounded mb-2" style={{ backgroundColor:s.border }} />
                      <div className="h-3 w-24 rounded" style={{ backgroundColor:s.bgAlt }} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div><div className="h-3 w-20 bg-cyan-100 rounded mb-2" /><div className="h-2 w-full rounded mb-1" style={{ backgroundColor:s.bgAlt }} /><div className="h-2 w-5/6 rounded mb-1" style={{ backgroundColor:s.bgAlt }} /></div>
                    <div><div className="h-3 w-24 bg-blue-100 rounded mb-2" /><div className="h-2 w-full rounded mb-1" style={{ backgroundColor:s.bgAlt }} /><div className="h-2 w-3/4 rounded" style={{ backgroundColor:s.bgAlt }} /></div>
                  </div>
                  <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:2, repeat:Infinity }} className="absolute -top-4 -right-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl px-6 py-3 shadow-xl">
                    <div className="text-white text-center"><div className="text-3xl font-black">87%</div><div className="text-xs font-semibold">Match</div></div>
                  </motion.div>
                </div>
                {[{ delay:0, pos:'-top-8 -left-8' },{ delay:0.5, pos:'top-1/3 -right-12' },{ delay:1, pos:'bottom-8 -left-12' }].map((item, i) => (
                  <motion.div key={i} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:item.delay+1.5, type:'spring' }}
                    className={`absolute ${item.pos} w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        <motion.div animate={{ y:[0,10,0] }} transition={{ duration:1.5, repeat:Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* PROBLEM → SOLUTION                                           */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6" style={{ backgroundColor:s.bgAlt }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color:s.text }}>Sound familiar?</h2>
            <p className="text-xl" style={{ color:s.textMuted }}>These are the problems JobMorph solves for you</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ duration:0.6 }}>
              <div className="inline-block px-4 py-2 rounded-full mb-6" style={{ backgroundColor:s.redBg, border:`1px solid ${s.redBorder}` }}>
                <span className="text-sm font-bold text-red-600">❌ THE PROBLEM</span>
              </div>
              <h3 className="text-3xl font-black mb-6" style={{ color:s.text }}>Job Searching is <span className="text-red-500">Frustrating</span></h3>
              <div className="space-y-3">
                {['Sending 50 applications with 0 replies','No idea if your resume passes ATS systems','Guessing which keywords to include','Wasting hours on mismatched applications','Never knowing why you got rejected'].map((p, i) => (
                  <motion.div key={p} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ delay:i*0.1 }} whileHover={{ x:5 }}
                    className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor:s.redBg, border:`1px solid ${s.redBorder}` }}
                  >
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <p className="font-medium text-sm" style={{ color:s.textMuted }}>{p}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ duration:0.6 }}>
              <div className="inline-block px-4 py-2 rounded-full mb-6" style={{ backgroundColor:s.cyanBg, border:`1px solid ${s.cyanBorder}` }}>
                <span className="text-sm font-bold text-cyan-600">✅ THE SOLUTION</span>
              </div>
              <h3 className="text-3xl font-black mb-6" style={{ color:s.text }}>JobMorph Makes it <span className="text-cyan-600">Simple</span></h3>
              <div className="space-y-3">
                {['AI analyzes your resume in 30 seconds','Know exactly how well you match before applying','Get specific missing keyword recommendations','Focus only on jobs where you score 70%+','Understand what to fix for better results'].map((sol, i) => (
                  <motion.div key={sol} initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ delay:i*0.1 }} whileHover={{ x:-5 }}
                    className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor:s.cyanBg, border:`1px solid ${s.cyanBorder}` }}
                  >
                    <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <p className="font-medium text-sm" style={{ color:s.textMuted }}>{sol}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS                                                  */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative py-24 px-6" style={{ backgroundColor:s.bg }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full mb-5" style={{ backgroundColor:s.cyanBg, border:`1px solid ${s.cyanBorder}` }}>
              <span className="text-sm font-bold text-cyan-600">SIMPLE PROCESS</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent" style={darkGradText}>How It Works</h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color:s.textMuted }}>Four simple steps — from resume to results in under 60 seconds</p>
          </motion.div>

          {/* 4 step cards */}
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={VP} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {HOW_STEPS.map((step, idx) => (
              <motion.div key={step.number} variants={fadeInUp} whileHover={{ y:-10 }} className="group relative">
                <div className="relative h-full rounded-2xl p-8 border-2 transition-all duration-500 hover:shadow-xl" style={{ backgroundColor:s.stepBg, borderColor:s.stepBorder }}>
                  <motion.div whileHover={{ rotate:360 }} transition={{ duration:0.6 }}
                    className={`absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-r ${step.gradient} flex items-center justify-center font-black text-xl text-white shadow-lg`}
                  >{step.number}</motion.div>
                  <motion.div whileHover={{ scale:1.2, rotate:10 }} className="text-5xl mb-5">{step.icon}</motion.div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-600 transition-colors" style={{ color:s.text }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:s.textMuted }}>{step.desc}</p>
                  {idx < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-14">
            <div className="flex-1 h-px" style={{ background:`linear-gradient(to right,transparent,${s.border},transparent)` }} />
            <div className="inline-block px-4 py-2 rounded-full flex-shrink-0" style={{ backgroundColor:s.cyanBg, border:`1px solid ${s.cyanBorder}` }}>
              <span className="text-sm font-bold text-cyan-600">THE ACTUAL PROCESS</span>
            </div>
            <div className="flex-1 h-px" style={{ background:`linear-gradient(to right,transparent,${s.border},transparent)` }} />
          </div>

          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-black mb-3" style={{ color:s.text }}>Here's What Actually Happens</h3>
            <p className="text-lg" style={{ color:s.textMuted }}>Real steps. Real interface. Real results.</p>
          </motion.div>

          {/* Detailed steps */}
          <div className="space-y-8">
            {/* Step 1 */}
            <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ duration:0.6 }}
              className="rounded-2xl p-8 border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor:s.stepBg, borderColor:s.stepBorder }}
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">1</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-3" style={{ color:s.text }}>Upload Your Resume</h3>
                  <p className="leading-relaxed mb-4" style={{ color:s.textMuted }}>
                    Click the upload button and select your resume file. We support <strong style={{ color:s.text }}>PDF</strong> and <strong style={{ color:s.text }}>DOCX</strong> formats. Your file is <strong className="text-cyan-600">encrypted immediately</strong> and never shared.
                  </p>
                  <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ backgroundColor:s.cyanBg, borderColor:s.cyanBorder }}>
                    <svg className="w-6 h-6 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color:s.text }}>John_Doe_Resume.pdf</p>
                      <p className="text-xs" style={{ color:s.textMuted }}>2.4 MB • Uploaded successfully</p>
                    </div>
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ duration:0.6 }}
              className="rounded-2xl p-8 border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor:s.stepBg, borderColor:s.stepBorder }}
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">2</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-3" style={{ color:s.text }}>Paste the Job Description</h3>
                  <p className="leading-relaxed mb-4" style={{ color:s.textMuted }}>
                    Copy the entire job description from any job board and paste it. Include <strong style={{ color:s.text }}>everything</strong> — role, requirements, responsibilities, and company info for best results.
                  </p>
                  <div className="p-4 rounded-xl border" style={{ backgroundColor:s.purpleBg, borderColor:s.purpleBorder }}>
                    <p className="text-sm font-bold mb-1" style={{ color:s.text }}>Senior Software Engineer — Google</p>
                    <p className="text-xs" style={{ color:s.textMuted }}>Requirements: 5+ years experience, Python, React, AWS, Docker, Kubernetes...</p>
                    <p className="text-xs text-purple-600 font-semibold mt-2">✓ Job description added (347 words)</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ duration:0.6 }}
              className="rounded-2xl p-8 border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor:s.stepBg, borderColor:s.stepBorder }}
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">3</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-3" style={{ color:s.text }}>AI Analyses Everything in 30 Seconds</h3>
                  <p className="leading-relaxed mb-4" style={{ color:s.textMuted }}>Our AI checks <strong style={{ color:s.text }}>keywords, skills, experience level, education, and qualifications</strong> across 50+ parameters.</p>
                  <div className="space-y-2">
                    {['Reading your resume...','Parsing job description...','Matching keywords & skills...','Checking experience level...'].map((t) => (
                      <div key={t} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor:s.bgAlt }}>
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span className="text-sm font-medium" style={{ color:s.textMuted }}>{t}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor:s.bgAlt }}>
                      <svg className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      <span className="text-sm font-medium text-indigo-500">Generating match score...</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} transition={{ duration:0.6 }}
              className="rounded-2xl p-8 border-2 shadow-lg hover:shadow-xl transition-shadow" style={{ backgroundColor:s.stepBg, borderColor:s.greenBorder }}
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">4</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-3" style={{ color:s.text }}>Get Your Match Score + Actionable Insights</h3>
                  <div className="rounded-xl p-6 border-2 mb-4 shadow-sm" style={{ backgroundColor:s.bgCard, borderColor:s.greenBorder }}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold" style={{ color:s.text }}>Your Match Score</h4>
                      <motion.span initial={{ scale:0 }} whileInView={{ scale:1 }} viewport={VP} transition={{ type:'spring', stiffness:200 }} className="text-5xl font-black text-green-500">87%</motion.span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden mb-2" style={{ backgroundColor:s.border }}>
                      <motion.div initial={{ width:0 }} whileInView={{ width:'87%' }} viewport={VP} transition={{ duration:1.2, delay:0.3 }} className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                    </div>
                    <p className="text-sm" style={{ color:s.textMuted }}>Strong match! You should apply.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor:s.bgCard, borderColor:s.border }}>
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <div><p className="font-bold text-sm" style={{ color:s.text }}>✅ Strong technical skills match</p><p className="text-xs" style={{ color:s.textMuted }}>Python, React, AWS found in your resume</p></div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor:s.yellowBg, borderColor:s.yellowBorder }}>
                      <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      <div><p className="font-bold text-sm" style={{ color:s.text }}>⚠️ Missing keyword: "Kubernetes"</p><p className="text-xs" style={{ color:s.textMuted }}>Add this to increase your match to 92%</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* CTAs */}
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mt-16">
            <p className="mb-6" style={{ color:s.textMuted }}>This is the actual interface you'll use — no mockups, no tricks.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/how-it-works" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300" style={{ textDecoration:'none' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                See Full Interactive Walkthrough
              </Link>
              <motion.button onClick={handleGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all">
                Try It Now — Free
              </motion.button>
            </div>
            <p className="text-sm mt-3" style={{ color:s.textSub }}>Interactive demos for every step + all features explained</p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FEATURES                                                      */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-24 px-6" style={{ backgroundColor:s.bgAlt }}>
        <div className="relative max-w-7xl mx-auto">
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full mb-5" style={{ backgroundColor:s.cyanBg, border:`1px solid ${s.cyanBorder}` }}>
              <span className="text-sm font-bold text-cyan-600">POWERFUL FEATURES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent" style={darkGradText3}>Everything You Need</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color:s.textMuted }}>One platform. All the tools to land your dream job.</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={VP} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp} whileHover={{ y:-10, scale:1.02 }}>
                <div className="relative h-full rounded-2xl p-8 border-2 transition-all duration-500 hover:shadow-xl group flex flex-col" style={{ backgroundColor:s.bgCard, borderColor:s.border }}>
                  <motion.div whileHover={{ scale:1.2, rotate:360 }} transition={{ duration:0.8 }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}
                  >{feature.icon}</motion.div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-cyan-600 transition-colors" style={{ color:s.text }}>{feature.title}</h3>
                  <p className="leading-relaxed flex-1 text-sm" style={{ color:s.textMuted }}>{feature.desc}</p>
                  {feature.slug ? (
                    <div className="mt-6 pt-5" style={{ borderTop:`1px solid ${s.border}` }}>
                      <Link to={`/features/${feature.slug}`} className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${feature.gradient} text-white text-sm font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200`} style={{ textDecoration:'none' }}>
                        Read More <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-6 pt-5" style={{ borderTop:`1px solid ${s.border}` }}>
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor:s.bgAlt, border:`1px solid ${s.border}`, color:s.textMuted }}>🔒 Always Enabled</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* COMPARISON TABLE                                              */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6" style={{ backgroundColor:s.bg }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent" style={darkGradText}>Why Choose JobMorph?</h2>
            <p className="text-xl" style={{ color:s.textMuted }}>See how we compare to the old way</p>
          </motion.div>
          <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={VP} className="overflow-hidden rounded-2xl shadow-xl" style={{ border:`2px solid ${s.border}` }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor:s.tableHead }}>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color:s.textMuted }}>Feature</th>
                  <th className="px-6 py-4 text-center font-semibold" style={{ color:s.textMuted }}>Manual Review</th>
                  <th className="px-6 py-4 text-center font-semibold" style={{ backgroundColor:isDark ? 'rgba(6,182,212,0.1)' : '#ecfeff', borderLeft:`2px solid ${s.cyanBorder}`, borderRight:`2px solid ${s.cyanBorder}` }}>
                    <span className="text-cyan-600">JobMorph AI</span>
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor:s.tableRow }}>
                {COMPARISON_ROWS.map((row) => (
                  <motion.tr key={row.feature} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={VP} style={{ borderTop:`1px solid ${s.border}` }}>
                    <td className="px-6 py-4 font-medium" style={{ color:s.text }}><span className="flex items-center gap-2"><span className="text-xl">{row.icon}</span>{row.feature}</span></td>
                    <td className="px-6 py-4 text-center text-sm" style={{ color:s.textMuted }}>{row.manual}</td>
                    <td className="px-6 py-4 text-center font-bold text-sm text-cyan-600" style={{ backgroundColor:isDark ? 'rgba(6,182,212,0.08)' : '#ecfeff', borderLeft:`2px solid ${s.cyanBorder}`, borderRight:`2px solid ${s.cyanBorder}` }}>{row.jobmorph}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* USE CASES                                                     */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section id="use-cases" className="relative py-24 px-6" style={{ backgroundColor:s.bgAlt }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full mb-5" style={{ backgroundColor:s.purpleBg, border:`1px solid ${s.purpleBorder}` }}>
              <span className="text-sm font-bold text-purple-600">WHO IT'S FOR</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent" style={darkGradText}>Who Is JobMorph For?</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color:s.textMuted }}>Whether you're starting out or switching careers — JobMorph has you covered</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={VP} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {USE_CASES.map((u) => (
              <motion.div key={u.title} variants={scaleIn} whileHover={{ y:-8 }}>
                <div className="relative h-full rounded-2xl p-8 border-2 transition-all duration-500 hover:shadow-xl" style={{ backgroundColor:s.bgCard, borderColor:s.border }}>
                  <motion.div whileHover={{ scale:1.2, rotate:360 }} transition={{ duration:0.6 }} className={`w-16 h-16 rounded-xl bg-gradient-to-r ${u.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}>{u.icon}</motion.div>
                  <h3 className="text-xl font-bold mb-3" style={{ color:s.text }}>{u.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color:s.textMuted }}>{u.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mt-12">
            <Link to="/use-cases" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300" style={{ textDecoration:'none' }}>
              Read Success Stories <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* PRICING                                                       */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-24 px-6" style={{ backgroundColor:s.bg }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full mb-5" style={{ backgroundColor:s.greenBg, border:`1px solid ${s.greenBorder}` }}>
              <span className="text-sm font-bold text-green-600">PRICING</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent" style={darkGradText}>Simple, Transparent Pricing</h2>
            <p className="text-xl" style={{ color:s.textMuted }}>Start free. No credit card. No catch.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} whileHover={{ y:-8 }}
              className="relative rounded-2xl p-8 shadow-xl" style={{ backgroundColor:s.bgCard, border:`2px solid ${s.border}` }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2" style={{ color:s.text }}>Free</h3>
                <div className="flex items-baseline gap-2"><span className="text-5xl font-black" style={{ color:s.text }}>$0</span><span style={{ color:s.textMuted }}>/ forever</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited resume uploads','AI-powered matching','Basic match scores','Scan history (last 10)','Email support'].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="text-sm" style={{ color:s.textMuted }}>{f}</span>
                  </li>
                ))}
              </ul>
              <motion.button onClick={handleGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                className="w-full px-6 py-3 font-bold rounded-xl transition-all shadow-lg"
                style={{ backgroundColor:isDark ? '#f1f5f9' : '#111827', color:isDark ? '#111827' : '#ffffff' }}
              >Get Started Free</motion.button>
            </motion.div>

            <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={VP} whileHover={{ y:-8 }}
              className="relative rounded-2xl p-8 shadow-xl"
              style={{ background:isDark ? 'linear-gradient(135deg,rgba(6,182,212,0.12),rgba(59,130,246,0.12))' : 'linear-gradient(135deg,#ecfeff,#eff6ff)', border:`2px solid ${s.cyanBorder}` }}
            >
              <motion.div animate={{ scale:[1,1.05,1] }} transition={{ duration:2, repeat:Infinity }} className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg">
                <span className="text-sm font-bold text-white">COMING SOON</span>
              </motion.div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2" style={{ color:s.text }}>Premium</h3>
                <div className="flex items-baseline gap-2"><span className="text-5xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">$9</span><span style={{ color:s.textMuted }}>/ month</span></div>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Free','Advanced AI insights','Detailed improvement suggestions','Unlimited scan history','Priority support','Export reports (PDF)','ATS optimization tools'].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="text-sm" style={{ color:s.textMuted }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button disabled className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-xl cursor-not-allowed opacity-60">Coming Soon</button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mt-12">
            <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300" style={{ textDecoration:'none' }}>
              View Full Pricing Details <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FAQ                                                           */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6" style={{ backgroundColor:s.bgAlt }}>
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent" style={darkGradText}>Frequently Asked Questions</h2>
            <p className="text-xl" style={{ color:s.textMuted }}>Everything you want to know before signing up</p>
          </motion.div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, idx) => (
              <motion.div key={item.q} initial={{ opacity:0, y:15 }} whileInView={{ opacity:1, y:0 }} viewport={VP} transition={{ delay:idx*0.04 }} whileHover={{ scale:1.01 }}
                className="group rounded-2xl p-6 border-2 transition-all duration-300 shadow-sm hover:shadow-lg" style={{ backgroundColor:s.bgCard, borderColor:s.border }}
              >
                <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-600 transition-colors flex items-start gap-3" style={{ color:s.text }}>
                  <span className="text-cyan-500 flex-shrink-0">Q:</span>{item.q}
                </h3>
                <p className="leading-relaxed pl-7 text-sm" style={{ color:s.textMuted }}>{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* NEWSLETTER + FINAL CTA                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6" style={{ backgroundColor:s.bg }}>
        <div className="max-w-4xl mx-auto space-y-16">
          <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={VP}
            className="relative rounded-3xl p-12 overflow-hidden shadow-xl text-center"
            style={{ background:isDark ? 'linear-gradient(135deg,rgba(6,182,212,0.1),rgba(59,130,246,0.1))' : 'linear-gradient(135deg,#ecfeff,#eff6ff)', border:`2px solid ${s.cyanBorder}` }}
          >
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ color:s.text }}>Stay Updated</h2>
              <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color:s.textMuted }}>Get resume tips, job search advice, and be first to know about new features</p>
              {!emailSubmitted ? (
                <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
                    className="flex-1 px-6 py-4 rounded-xl focus:outline-none transition-colors shadow-sm"
                    style={{ backgroundColor:s.inputBg, border:`2px solid ${s.border}`, color:s.text }}
                  />
                  <motion.button type="submit" whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300">
                    Subscribe
                  </motion.button>
                </form>
              ) : (
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }} className="flex items-center justify-center gap-3 p-4 rounded-xl max-w-md mx-auto" style={{ backgroundColor:s.greenBg, border:`2px solid ${s.greenBorder}` }}>
                  <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="text-green-500 font-semibold">Thanks for subscribing!</span>
                </motion.div>
              )}
              <p className="text-sm mt-4" style={{ color:s.textSub }}>We respect your privacy. Unsubscribe at any time.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={VP} className="text-center py-8">
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent" style={darkGradText3}>
              Your Next Job Starts Here
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color:s.textMuted }}>
              No more guessing. No more wasted applications.<br />Know your match score before you apply — free, forever.
            </p>
            <motion.button onClick={handleGetStarted} whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }}
              className="px-14 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xl rounded-xl shadow-xl hover:shadow-[0_20px_60px_rgba(6,182,212,0.45)] transition-all duration-300"
            >
              <span className="flex items-center gap-3">
                Analyse My Resume — Free
                <motion.svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x:[0,5,0] }} transition={{ duration:1.5, repeat:Infinity }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            </motion.button>
            <p className="text-sm mt-5" style={{ color:s.textSub }}>No credit card • No spam • Results in 30 seconds</p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor:s.footerBg, borderTop:`2px solid ${s.border}` }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">J</div>
                <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">JobMorph</span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color:s.textMuted }}>AI-powered resume analysis helping job seekers match their skills with perfect opportunities.</p>
              <div className="flex gap-3">
                {['T','L','G'].map((soc) => (
                  <motion.a key={soc} href="#" whileHover={{ scale:1.2, rotate:5 }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm"
                    style={{ backgroundColor:s.bgCard, border:`2px solid ${s.border}` }}
                  >
                    <span className="text-cyan-600 text-xs font-bold">{soc}</span>
                  </motion.a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color:s.text }}>Product</h4>
              <ul className="space-y-3">
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <button onClick={() => scrollToSection(item.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:s.textMuted, fontSize:14 }}
                      onMouseEnter={e => e.currentTarget.style.color='#0891b2'}
                      onMouseLeave={e => e.currentTarget.style.color=s.textMuted}
                    >{item.label}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color:s.text }}>Company</h4>
              <ul className="space-y-3">
                {[{ label:'About Us', to:'/about' },{ label:'Contact', to:'/contact' },{ label:'Blog', to:'#' },{ label:'Careers', to:'#' }].map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} style={{ color:s.textMuted, textDecoration:'none', fontSize:14 }}
                      onMouseEnter={e => e.currentTarget.style.color='#0891b2'}
                      onMouseLeave={e => e.currentTarget.style.color=s.textMuted}
                    >{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4" style={{ color:s.text }}>Support</h4>
              <ul className="space-y-3">
                <li><a href="mailto:support@jobmorph.com" style={{ color:s.textMuted, textDecoration:'none', fontSize:14 }}>support@jobmorph.com</a></li>
                <li><Link to="/help"    style={{ color:s.textMuted, textDecoration:'none', fontSize:14 }}>Help Center</Link></li>
                <li><Link to="/privacy" style={{ color:s.textMuted, textDecoration:'none', fontSize:14 }}>Privacy Policy</Link></li>
                <li><a href="#"         style={{ color:s.textMuted, textDecoration:'none', fontSize:14 }}>Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm" style={{ borderTop:`2px solid ${s.border}`, color:s.textSub }}>
            <p>©️ {new Date().getFullYear()} JobMorph. All rights reserved.</p>
            <span>Made with ❤️ for job seekers</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient-shift {
          0%,100% { background-position:0% 50%; }
          50%      { background-position:100% 50%; }
        }
        .animate-gradient {
          background-size:200% auto;
          animation:gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;


// import React, { useEffect, useState, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { motion, useInView, useScroll } from 'framer-motion';
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// function LandingPage() {
//   const navigate = useNavigate();
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [email, setEmail] = useState('');
//   const [emailSubmitted, setEmailSubmitted] = useState(false);

//   const { scrollYProgress } = useScroll();
//   const heroRef = useRef(null);

//   useEffect(() => {
//     AOS.init({ duration: 1000, once: true, easing: 'ease-out-cubic' });

//     const handleMouseMove = (e) => {
//       if (window.matchMedia('(hover: hover)').matches) {
//         setMousePosition({ x: e.clientX, y: e.clientY });
//       }
//     };
//     const handleScroll = () => setScrolled(window.scrollY > 50);

//     window.addEventListener('mousemove', handleMouseMove);
//     window.addEventListener('scroll', handleScroll);
//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   // Auth-aware CTA
//   const handleGetStarted = () => {
//     const isLoggedIn = !!localStorage.getItem('token');
//     navigate(isLoggedIn ? '/upload' : '/signup');
//   };

//   const handleEmailSubmit = (e) => {
//     e.preventDefault();
//     if (email) {
//       setEmailSubmitted(true);
//       setTimeout(() => { setEmailSubmitted(false); setEmail(''); }, 3000);
//     }
//   };

//   // Animation variants
//   const fadeInUp = {
//     hidden: { opacity: 0, y: 30 },
//     visible: { opacity: 1, y: 0 }
//   };
//   const staggerContainer = {
//     hidden: { opacity: 0 },
//     visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
//   };
//   const scaleIn = {
//     hidden: { scale: 0.85, opacity: 0 },
//     visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
//   };

//   // Features with slugs
//   const features = [
//     { icon: '🤖', title: 'AI-Powered Analysis',  slug: 'match-score',       gradient: 'from-cyan-500 to-blue-600',    desc: 'Advanced algorithms analyze your resume against job descriptions with precision, delivering clear match insights and actionable improvement suggestions.' },
//     { icon: '📄', title: 'ATS Format Checker',   slug: 'ats-checker',       gradient: 'from-blue-500 to-indigo-600',  desc: 'Detects issues like scanned PDFs, images, tables, columns, fonts, and layouts that ATS cannot read — and shows exactly what to fix.' },
//     { icon: '🏢', title: 'Company Research',     slug: 'company-research',  gradient: 'from-indigo-500 to-purple-600',desc: 'Get a clear understanding of the company, its role expectations, and key focus areas before your interview.' },
//     { icon: '🎤', title: 'Interview Prep',        slug: 'interview-prep',    gradient: 'from-purple-500 to-pink-600',  desc: 'Get role-specific interview questions, key concepts to revise, and focused preparation based on the job description.' },
//     { icon: '🎯', title: 'Smart Job Ranking',    slug: 'job-ranking',       gradient: 'from-pink-500 to-rose-600',    desc: 'Evaluates multiple job descriptions and ranks them by how well your resume fits — so you apply where you actually belong.' },
//     { icon: '🔒', title: 'Secure & Private',     slug: null,                gradient: 'from-rose-500 to-orange-600',  desc: 'Your data is encrypted and never shared with anyone. Complete privacy guaranteed.' },
//   ];

//   return (
//     <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

//       {/* Scroll Progress Bar */}
//       <motion.div
//         className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 origin-left z-[100]"
//         style={{ scaleX: scrollYProgress }}
//       />

//       {/* Cursor Glow — desktop only */}
//       <div
//         className="pointer-events-none fixed inset-0 z-30 hidden md:block"
//         style={{ background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6,182,212,0.07), transparent 80%)` }}
//       />

//       {/* ─────────────────────────────────────────────────────────── */}
//       {/* NAVBAR                                                       */}
//       {/* ─────────────────────────────────────────────────────────── */}
//       <motion.nav
//         initial={{ y: -100 }} animate={{ y: 0 }}
//         transition={{ type: 'spring', stiffness: 100 }}
//         className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg' : 'bg-transparent'}`}
//       >
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <Link to="/" className="flex items-center gap-2">
//               <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}
//                 className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg"
//               >J</motion.div>
//               <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">JobMorph</span>
//             </Link>

//             <div className="hidden lg:flex items-center gap-8">
//               {['Features', 'How It Works', 'Use Cases', 'Pricing'].map((item, i) => (
//                 <motion.a key={i} href={`#${item.toLowerCase().replace(' ', '-')}`}
//                   className="text-gray-700 hover:text-cyan-600 transition-colors font-medium relative group"
//                   whileHover={{ scale: 1.05 }}
//                 >
//                   {item}
//                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-600 group-hover:w-full transition-all duration-300" />
//                 </motion.a>
//               ))}
//             </div>

//             <div className="hidden md:flex items-center gap-3">
//               <Link to="/login" className="px-6 py-2.5 text-gray-700 font-semibold hover:text-cyan-600 transition-colors rounded-lg hover:bg-gray-100">Log In</Link>
//               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                 <Link to="/signup" className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 relative overflow-hidden group">
//                   <span className="relative z-10">Sign Up</span>
//                   <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                 </Link>
//               </motion.div>
//             </div>

//             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-900 hover:text-cyan-600 transition-colors">
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 {mobileMenuOpen
//                   ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
//               </svg>
//             </button>
//           </div>

//           {mobileMenuOpen && (
//             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
//               <div className="flex flex-col space-y-3">
//                 {['Features', 'How It Works', 'Use Cases', 'Pricing'].map((item, i) => (
//                   <a key={i} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileMenuOpen(false)}
//                     className="text-gray-700 hover:text-cyan-600 transition-colors font-medium py-2">{item}</a>
//                 ))}
//                 <div className="border-t border-gray-200 pt-3 mt-2 space-y-3">
//                   <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center px-6 py-2.5 text-gray-900 font-semibold hover:text-cyan-600">Sign In</Link>
//                   <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg">Sign Up</Link>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </div>
//       </motion.nav>

//       {/* Subtle Grid BG */}
//       <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
//         <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to right,rgba(6,182,212,.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(6,182,212,.03) 1px,transparent 1px)`, backgroundSize: '80px 80px' }} />
//       </div>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 1 — HERO                                            */}
//       {/* "What is this?"                                             */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30">
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:8, repeat:Infinity }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
//           <motion.div animate={{ scale:[1.2,1,1.2], opacity:[0.5,0.3,0.5] }} transition={{ duration:10, repeat:Infinity, delay:1 }} className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[130px]" />
//           <motion.div animate={{ scale:[1,1.3,1], opacity:[0.2,0.4,0.2] }} transition={{ duration:12, repeat:Infinity, delay:2 }} className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px]" />
//         </div>

//         <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">

//             {/* Left: Text */}
//             <div className="text-center lg:text-left space-y-8">
//               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
//                 className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/30"
//               >
//                 <div className="relative flex h-2 w-2">
//                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75" />
//                   <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
//                 </div>
//                 <span className="text-sm font-bold text-cyan-700">AI-Powered Resume Analysis</span>
//               </motion.div>

//               <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
//                 <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
//                   <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Your Resume.</span>
//                   <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2 animate-gradient">Perfectly Matched.</span>
//                 </h1>
//                 <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
//                   Upload your resume, paste any job description — get your match score in <span className="font-bold text-gray-800">30 seconds</span>. Know your chances before you apply.
//                 </p>
//               </motion.div>

//               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
//                 className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
//               >
//                 <motion.button onClick={handleGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
//                   className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl overflow-hidden shadow-lg hover:shadow-[0_20px_50px_rgba(6,182,212,0.4)] transition-all duration-300"
//                 >
//                   <span className="relative z-10 flex items-center gap-2">
//                     Get Started Free
//                     <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x:[0,5,0] }} transition={{ duration:1.5, repeat:Infinity }}>
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                     </motion.svg>
//                   </span>
//                   <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500" initial={{ x:'100%' }} whileHover={{ x:0 }} transition={{ duration:0.3 }} />
//                 </motion.button>

//                 <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
//                   <Link to="/how-it-works" className="flex items-center gap-2 px-10 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-cyan-500 transition-all duration-300 shadow-lg">
//                     <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//                     </svg>
//                     Read More
//                   </Link>
//                 </motion.div>
//               </motion.div>

//               <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
//                 className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
//               >
//                 {[{ icon:'🔒', text:'SSL Encrypted' },{ icon:'⚡', text:'Lightning Fast' },{ icon:'🎯', text:'95% Accuracy' },{ icon:'🔐', text:'GDPR Compliant' }].map((b,i) => (
//                   <motion.div key={i} whileHover={{ scale:1.08, rotate:1 }}
//                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
//                   >
//                     <span className="text-xl">{b.icon}</span>
//                     <span className="font-semibold text-gray-700 text-sm">{b.text}</span>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </div>

//             {/* Right: Resume Mockup */}
//             <motion.div initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.8, type:'spring' }} className="relative hidden lg:block">
//               <motion.div animate={{ y:[0,-20,0], rotate:[0,2,0,-2,0] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }} className="relative">
//                 <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
//                   <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-100">
//                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">JD</div>
//                     <div><div className="h-4 w-32 bg-gray-200 rounded mb-2" /><div className="h-3 w-24 bg-gray-100 rounded" /></div>
//                   </div>
//                   <div className="space-y-4">
//                     <div><div className="h-3 w-20 bg-cyan-100 rounded mb-2" /><div className="h-2 w-full bg-gray-100 rounded mb-1" /><div className="h-2 w-5/6 bg-gray-100 rounded mb-1" /><div className="h-2 w-4/6 bg-gray-100 rounded" /></div>
//                     <div><div className="h-3 w-24 bg-blue-100 rounded mb-2" /><div className="h-2 w-full bg-gray-100 rounded mb-1" /><div className="h-2 w-3/4 bg-gray-100 rounded" /></div>
//                     <div><div className="h-3 w-16 bg-purple-100 rounded mb-2" /><div className="flex gap-2"><div className="h-6 w-16 bg-cyan-50 border border-cyan-200 rounded" /><div className="h-6 w-16 bg-blue-50 border border-blue-200 rounded" /><div className="h-6 w-20 bg-purple-50 border border-purple-200 rounded" /></div></div>
//                   </div>
//                   <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:2, repeat:Infinity }} className="absolute -top-4 -right-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl px-6 py-3 shadow-xl">
//                     <div className="text-white text-center"><div className="text-3xl font-black">87%</div><div className="text-xs font-semibold">Match</div></div>
//                   </motion.div>
//                 </div>
//                 {[{ delay:0, position:'-top-8 -left-8' },{ delay:0.5, position:'top-1/3 -right-12' },{ delay:1, position:'bottom-8 -left-12' }].map((item, i) => (
//                   <motion.div key={i} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:item.delay+1.5, type:'spring' }}
//                     className={`absolute ${item.position} w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg`}
//                   >
//                     <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                     </svg>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </motion.div>
//           </div>
//         </div>

//         <motion.div animate={{ y:[0,10,0] }} transition={{ duration:1.5, repeat:Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
//           <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
//           </svg>
//         </motion.div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 2 — PROBLEM → SOLUTION                             */}
//       {/* "Omg that's MY problem!"                                   */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-6xl mx-auto">
//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Sound familiar?</h2>
//             <p className="text-xl text-gray-500">These are the problems JobMorph solves for you</p>
//           </motion.div>

//           <div className="grid md:grid-cols-2 gap-12 items-start">
//             {/* Problem */}
//             <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
//               <div className="inline-block px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-6">
//                 <span className="text-sm font-bold text-red-600">❌ THE PROBLEM</span>
//               </div>
//               <h3 className="text-3xl font-black text-gray-900 mb-6">Job Searching is <span className="text-red-500">Frustrating</span></h3>
//               <div className="space-y-3">
//                 {['Sending 50 applications with 0 replies','No idea if your resume passes ATS systems','Guessing which keywords to include','Wasting hours on mismatched applications','Never knowing why you got rejected'].map((p, i) => (
//                   <motion.div key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }} whileHover={{ x:5 }}
//                     className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100"
//                   >
//                     <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                     <p className="text-gray-700 font-medium text-sm">{p}</p>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Solution */}
//             <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
//               <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-6">
//                 <span className="text-sm font-bold text-cyan-600">✅ THE SOLUTION</span>
//               </div>
//               <h3 className="text-3xl font-black text-gray-900 mb-6">JobMorph Makes it <span className="text-cyan-600">Simple</span></h3>
//               <div className="space-y-3">
//                 {['AI analyzes your resume in 30 seconds','Know exactly how well you match before applying','Get specific missing keyword recommendations','Focus only on jobs where you score 70%+','Understand what to fix for better results'].map((s, i) => (
//                   <motion.div key={i} initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }} whileHover={{ x:-5 }}
//                     className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50 border border-cyan-100"
//                   >
//                     <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>
//                     <p className="text-gray-700 font-medium text-sm">{s}</p>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 3 — HOW IT WORKS                                   */}
//       {/* "Only 4 steps? That's easy!"                               */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="how-it-works" className="relative py-24 px-6 bg-white">
//         <div className="max-w-6xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-5">
//               <span className="text-sm font-bold text-cyan-600">SIMPLE PROCESS</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">How It Works</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-2xl mx-auto">Four simple steps — from resume to results in under 60 seconds</p>
//           </motion.div>

//           <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once:true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-14">
//             {[
//               { number:'1', icon:'📤', title:'Upload Resume',      desc:'Upload your resume in PDF or DOCX format',           gradient:'from-cyan-500 to-blue-600' },
//               { number:'2', icon:'📋', title:'Add Job Description', desc:'Paste the job description you want to apply for',   gradient:'from-blue-500 to-indigo-600' },
//               { number:'3', icon:'🧠', title:'AI Analysis',         desc:'Our AI analyses your match in 30 seconds',          gradient:'from-indigo-500 to-purple-600' },
//               { number:'4', icon:'📊', title:'Get Results',         desc:'Review your match score and actionable insights',   gradient:'from-purple-500 to-pink-600' },
//             ].map((step, idx) => (
//               <motion.div key={idx} variants={fadeInUp} whileHover={{ y:-10 }} className="group relative">
//                 <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl">
//                   <motion.div whileHover={{ rotate:360 }} transition={{ duration:0.6 }}
//                     className={`absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-r ${step.gradient} flex items-center justify-center font-black text-xl text-white shadow-lg`}
//                   >{step.number}</motion.div>
//                   <motion.div whileHover={{ scale:1.2, rotate:10 }} className="text-5xl mb-5">{step.icon}</motion.div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors">{step.title}</h3>
//                   <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
//                   {idx < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />}
//                 </div>
//               </motion.div>
//             ))}
//           </motion.div>

//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center">
//             <Link to="/how-it%20works" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
//               See Full Interactive Walkthrough
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//             </Link>
//             <p className="text-sm text-gray-400 mt-3">Interactive demos for every step + all features explained</p>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 4 — STEP-BY-STEP PROCESS                          */}
//       {/* "I can actually see it working!"                           */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="demo" className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-6xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-5">
//               <span className="text-sm font-bold text-cyan-600">THE ACTUAL PROCESS</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Here's What Actually Happens</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-2xl mx-auto">Real steps. Real interface. Real results.</p>
//           </motion.div>

//           {/* Step-by-step cards */}
//           <div className="space-y-12">
            
//             {/* STEP 1 */}
//             <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
//               className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
//             >
//               <div className="flex items-start gap-6">
//                 <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
//                   1
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-2xl font-black text-gray-900 mb-3">Upload Your Resume</h3>
//                   <p className="text-gray-600 leading-relaxed mb-4">
//                     Click the upload button and select your resume file. We support <span className="font-bold text-gray-800">PDF</span> and <span className="font-bold text-gray-800">DOCX</span> formats. 
//                     Your file is <span className="font-bold text-cyan-600">encrypted immediately</span> and never shared with anyone.
//                   </p>
//                   <div className="flex items-center gap-3 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
//                     <svg className="w-6 h-6 text-cyan-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                     </svg>
//                     <div className="flex-1">
//                       <p className="text-sm font-semibold text-gray-900">John_Doe_Resume.pdf</p>
//                       <p className="text-xs text-gray-500">2.4 MB • Uploaded successfully</p>
//                     </div>
//                     <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>

//             {/* STEP 2 */}
//             <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
//               className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
//             >
//               <div className="flex items-start gap-6">
//                 <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
//                   2
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-2xl font-black text-gray-900 mb-3">Paste the Job Description</h3>
//                   <p className="text-gray-600 leading-relaxed mb-4">
//                     Copy the entire job description from any job board (LinkedIn, Naukri, Indeed, etc.) and paste it into the text box. 
//                     Include <span className="font-bold text-gray-800">everything</span> — role, requirements, responsibilities, and company info for best results.
//                   </p>
//                   <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
//                     <div className="flex items-start gap-3 mb-2">
//                       <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                       </svg>
//                       <div className="flex-1">
//                         <p className="text-sm font-bold text-gray-900 mb-1">Senior Software Engineer — Google</p>
//                         <p className="text-xs text-gray-600 leading-relaxed">
//                           Requirements: 5+ years experience, Python, React, AWS, Docker, Kubernetes...
//                         </p>
//                       </div>
//                     </div>
//                     <div className="text-xs text-purple-600 font-semibold flex items-center gap-1 mt-2">
//                       <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       Job description added (347 words)
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>

//             {/* STEP 3 */}
//             <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
//               className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
//             >
//               <div className="flex items-start gap-6">
//                 <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
//                   3
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-2xl font-black text-gray-900 mb-3">AI Analyses Everything in 30 Seconds</h3>
//                   <p className="text-gray-600 leading-relaxed mb-4">
//                     Our AI reads your resume, parses the job description, and compares them across 50+ parameters. 
//                     It checks <span className="font-bold text-gray-800">keywords, skills, experience level, education, and qualifications</span>.
//                   </p>
//                   <div className="space-y-3">
//                     {[
//                       { step: 'Reading your resume...', done: true },
//                       { step: 'Parsing job description...', done: true },
//                       { step: 'Matching keywords & skills...', done: true },
//                       { step: 'Checking experience level...', done: true },
//                       { step: 'Generating match score...', done: false, loading: true },
//                     ].map((item, i) => (
//                       <motion.div
//                         key={i}
//                         initial={{ opacity: 0, x: -20 }}
//                         whileInView={{ opacity: 1, x: 0 }}
//                         viewport={{ once: true }}
//                         transition={{ delay: i * 0.1 }}
//                         className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
//                       >
//                         {item.done && (
//                           <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                           </svg>
//                         )}
//                         {item.loading && (
//                           <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
//                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                           </svg>
//                         )}
//                         <span className={`text-sm font-medium ${item.done ? 'text-gray-700' : 'text-indigo-600'}`}>
//                           {item.step}
//                         </span>
//                       </motion.div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </motion.div>

//             {/* STEP 4 */}
//             <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
//               className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow"
//             >
//               <div className="flex items-start gap-6">
//                 <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
//                   4
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-2xl font-black text-gray-900 mb-3">Get Your Match Score + Actionable Insights</h3>
//                   <p className="text-gray-600 leading-relaxed mb-6">
//                     You instantly see your <span className="font-bold text-gray-800">match percentage</span>, what's working, 
//                     what's missing, and <span className="font-bold text-green-600">exactly what to add</span> to improve your score.
//                   </p>

//                   {/* Match Score Display */}
//                   <div className="bg-white rounded-xl p-6 border-2 border-green-300 mb-4 shadow-sm">
//                     <div className="flex items-center justify-between mb-4">
//                       <h4 className="text-lg font-bold text-gray-900">Your Match Score</h4>
//                       <motion.span
//                         initial={{ scale: 0 }}
//                         whileInView={{ scale: 1 }}
//                         viewport={{ once: true }}
//                         transition={{ type: 'spring', stiffness: 200 }}
//                         className="text-5xl font-black text-green-600"
//                       >
//                         87%
//                       </motion.span>
//                     </div>
//                     <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
//                       <motion.div
//                         initial={{ width: 0 }}
//                         whileInView={{ width: '87%' }}
//                         viewport={{ once: true }}
//                         transition={{ duration: 1.2, delay: 0.3 }}
//                         className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
//                       />
//                     </div>
//                     <p className="text-sm text-gray-500">Strong match! You should apply.</p>
//                   </div>

//                   {/* Insights */}
//                   <div className="space-y-3">
//                     <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
//                       <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       <div>
//                         <p className="font-bold text-gray-900 text-sm mb-1">✅ Strong technical skills match</p>
//                         <p className="text-xs text-gray-500">Python, React, AWS found in your resume</p>
//                       </div>
//                     </div>
//                     <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
//                       <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       <div>
//                         <p className="font-bold text-gray-900 text-sm mb-1">✅ Experience level aligned</p>
//                         <p className="text-xs text-gray-500">You have 6 years, they need 5+</p>
//                       </div>
//                     </div>
//                     <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-300">
//                       <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                       </svg>
//                       <div>
//                         <p className="font-bold text-gray-900 text-sm mb-1">⚠️ Missing keyword: "Kubernetes"</p>
//                         <p className="text-xs text-gray-600">Add this to increase your match to 92%</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           </div>

//           {/* CTA */}
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mt-16">
//             <p className="text-gray-500 mb-6">This is the actual interface you'll use — no mockups, no tricks.</p>
//             <motion.button
//               onClick={handleGetStarted}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
//             >
//               Try It Now — Free
//             </motion.button>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 5 — FEATURES                                       */}
//       {/* "It does ALL of this?!"                                    */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="features" className="relative py-24 px-6 bg-white">
//         <div className="relative max-w-7xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-5">
//               <span className="text-sm font-bold text-cyan-600">POWERFUL FEATURES</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent">Everything You Need</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-3xl mx-auto">One platform. All the tools to land your dream job.</p>
//           </motion.div>

//           <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once:true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {features.map((feature, i) => (
//               <motion.div key={i} variants={fadeInUp} whileHover={{ y:-10, scale:1.02 }}>
//                 <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl group flex flex-col">
//                   <motion.div whileHover={{ scale:1.2, rotate:360 }} transition={{ duration:0.8 }}
//                     className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}
//                   >{feature.icon}</motion.div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">{feature.title}</h3>
//                   <p className="text-gray-500 leading-relaxed flex-1 text-sm">{feature.desc}</p>
//                   {feature.slug ? (
//                     <div className="mt-6 pt-5 border-t border-gray-100">
//                       <Link to={`/features/${feature.slug}`}
//                         className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${feature.gradient} text-white text-sm font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200`}
//                       >
//                         Read More
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//                       </Link>
//                     </div>
//                   ) : (
//                     <div className="mt-6 pt-5 border-t border-gray-100">
//                       <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500">🔒 Always Enabled</span>
//                     </div>
//                   )}
//                   <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
//                 </div>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 6 — COMPARISON TABLE                               */}
//       {/* "AND it's better than everything else?"                    */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-5xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Why Choose JobMorph?</span>
//             </h2>
//             <p className="text-xl text-gray-500">See how we compare to the old way</p>
//           </motion.div>

//           <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-xl">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
//                   <th className="px-6 py-4 text-left text-gray-700 font-semibold">Feature</th>
//                   <th className="px-6 py-4 text-center text-gray-700 font-semibold">Manual Review</th>
//                   <th className="px-6 py-4 text-center bg-cyan-50 border-l-2 border-r-2 border-cyan-200"><span className="text-cyan-600 font-bold">JobMorph AI</span></th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white">
//                 {[
//                   { feature:'Analysis Time',       manual:'30+ minutes',      jobmorph:'30 seconds',       icon:'⚡' },
//                   { feature:'Accuracy',             manual:'Subjective guess', jobmorph:'95% AI accuracy',  icon:'🎯' },
//                   { feature:'Match Score',          manual:'No scoring',       jobmorph:'Detailed %',       icon:'📊' },
//                   { feature:'Keyword Suggestions',  manual:'Manual research',  jobmorph:'Auto-generated',   icon:'💡' },
//                   { feature:'History Tracking',     manual:'None',             jobmorph:'Full history',     icon:'📂' },
//                   { feature:'Cost',                 manual:'Time = money',     jobmorph:'Free',             icon:'💰' },
//                 ].map((row, i) => (
//                   <motion.tr key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
//                     <td className="px-6 py-4 text-gray-900 font-medium"><span className="flex items-center gap-2"><span className="text-xl">{row.icon}</span>{row.feature}</span></td>
//                     <td className="px-6 py-4 text-center text-gray-500 text-sm">{row.manual}</td>
//                     <td className="px-6 py-4 text-center font-bold text-cyan-600 bg-cyan-50 border-l-2 border-r-2 border-cyan-100 text-sm">{row.jobmorph}</td>
//                   </motion.tr>
//                 ))}
//               </tbody>
//             </table>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 7 — USE CASES                                      */}
//       {/* "This is literally made for me"                            */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="use-cases" className="relative py-24 px-6 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-purple-50 border border-purple-200 mb-5">
//               <span className="text-sm font-bold text-purple-600">WHO IT'S FOR</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Who Is JobMorph For?</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-3xl mx-auto">Whether you're starting out or switching careers — JobMorph has you covered</p>
//           </motion.div>

//           <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once:true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {[
//               { icon:'🎓', title:'Recent Graduates',  desc:'Land your first job with confidence by knowing exactly how your resume stacks up against real requirements.',         gradient:'from-cyan-500 to-blue-600' },
//               { icon:'🔄', title:'Career Changers',   desc:'See which transferable skills match your new target roles — and which gaps to fill before applying.',                gradient:'from-blue-500 to-indigo-600' },
//               { icon:'🚀', title:'Active Job Seekers',desc:'Apply smarter, not harder. Focus only on jobs where you score 70%+ and save hours of wasted effort.',                gradient:'from-indigo-500 to-purple-600' },
//               { icon:'💼', title:'HR Professionals',  desc:'Screen candidates faster with instant AI-powered match scoring against your job descriptions.',                       gradient:'from-purple-500 to-pink-600' },
//             ].map((u, i) => (
//               <motion.div key={i} variants={scaleIn} whileHover={{ y:-8 }}>
//                 <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl">
//                   <motion.div whileHover={{ scale:1.2, rotate:360 }} transition={{ duration:0.6 }}
//                     className={`w-16 h-16 rounded-xl bg-gradient-to-r ${u.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}
//                   >{u.icon}</motion.div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-3">{u.title}</h3>
//                   <p className="text-gray-500 text-sm leading-relaxed">{u.desc}</p>
//                 </div>
//               </motion.div>
//             ))}
//           </motion.div>

//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mt-12">
//             <Link to="/use-cases" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
//               Read Success Stories
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//             </Link>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 8 — PRICING                                        */}
//       {/* "FREE?! I'm in!"                                           */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="pricing" className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-5xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-5">
//               <span className="text-sm font-bold text-green-600">PRICING</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Simple, Transparent Pricing</span>
//             </h2>
//             <p className="text-xl text-gray-500">Start free. No credit card. No catch.</p>
//           </motion.div>

//           <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
//             {/* Free */}
//             <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} whileHover={{ y:-8 }} className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl">
//               <div className="mb-6">
//                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
//                 <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-gray-900">$0</span><span className="text-gray-500">/ forever</span></div>
//               </div>
//               <ul className="space-y-4 mb-8">
//                 {['Unlimited resume uploads','AI-powered matching','Basic match scores','Scan history (last 10)','Email support'].map((f, i) => (
//                   <li key={i} className="flex items-start gap-3">
//                     <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
//                     <span className="text-gray-700 text-sm">{f}</span>
//                   </li>
//                 ))}
//               </ul>
//               <motion.button onClick={handleGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="w-full px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg">
//                 Get Started Free
//               </motion.button>
//             </motion.div>

//             {/* Premium */}
//             <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} whileHover={{ y:-8 }} className="relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border-2 border-cyan-300 shadow-xl">
//               <motion.div animate={{ scale:[1,1.05,1] }} transition={{ duration:2, repeat:Infinity }} className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg">
//                 <span className="text-sm font-bold text-white">COMING SOON</span>
//               </motion.div>
//               <div className="mb-6">
//                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
//                 <div className="flex items-baseline gap-2"><span className="text-5xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">$9</span><span className="text-gray-500">/ month</span></div>
//               </div>
//               <ul className="space-y-4 mb-8">
//                 {['Everything in Free','Advanced AI insights','Detailed improvement suggestions','Unlimited scan history','Priority support','Export reports (PDF)','ATS optimization tools'].map((f, i) => (
//                   <li key={i} className="flex items-start gap-3">
//                     <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
//                     <span className="text-gray-700 text-sm">{f}</span>
//                   </li>
//                 ))}
//               </ul>
//               <button disabled className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-xl cursor-not-allowed opacity-60">Coming Soon</button>
//             </motion.div>
//           </div>

//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mt-12">
//             <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300">
//               View Full Pricing Details
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//             </Link>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 9 — FAQ                                            */}
//       {/* "Ok my last doubts are gone"                               */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-white">
//         <div className="max-w-4xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Frequently Asked Questions</span>
//             </h2>
//             <p className="text-xl text-gray-500">Everything you want to know before signing up</p>
//           </motion.div>

//           <div className="space-y-4">
//             {[
//               { q:'Is JobMorph completely free?',              a:'Yes! Core features are completely free — upload resumes, analyze matches, and get detailed results at no cost. Premium features are coming soon.' },
//               { q:'Is my resume data safe?',                   a:'Absolutely. All data is encrypted with SSL. Your resume is never shared with third parties and remains completely private.' },
//               { q:'Do I need to create an account?',          a:'Yes — a free account gives you a personalized dashboard, scan history, and saved results. Signup takes under 60 seconds.' },
//               { q:'What file formats are supported?',          a:'We support PDF and DOCX formats — the most common formats used by job seekers and ATS systems.' },
//               { q:'How does the AI matching work?',            a:'Our AI analyzes keywords, skills, experience, education, and qualifications — then compares them against job requirements to give you an accurate match % with specific recommendations.' },
//               { q:'Can I use it for multiple applications?',  a:'Absolutely! Analyze your resume against as many job descriptions as you want. We recommend testing a tailored version for each role.' },
//               { q:'Will this help me pass ATS systems?',       a:'Yes. We check formatting, keywords, and layout issues that cause ATS rejections — and show you exactly what to fix.' },
//               { q:'How long does analysis take?',              a:'Under 30 seconds. Our AI processes your resume and job description in real-time.' },
//             ].map((item, idx) => (
//               <motion.div key={idx} initial={{ opacity:0, y:15 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:idx*0.05 }} whileHover={{ scale:1.01 }}
//                 className="group bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-300 shadow-sm hover:shadow-lg"
//               >
//                 <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors flex items-start gap-3">
//                   <span className="text-cyan-500 flex-shrink-0">Q:</span>{item.q}
//                 </h3>
//                 <p className="text-gray-500 leading-relaxed pl-7 text-sm">{item.a}</p>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 10 — NEWSLETTER + FINAL CTA                        */}
//       {/* "Let me sign up now"                                        */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-4xl mx-auto space-y-16">

//           {/* Newsletter */}
//           <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
//             className="relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-12 border-2 border-cyan-200 overflow-hidden shadow-xl text-center"
//           >
//             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />
//             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
//             <div className="relative">
//               <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Stay Updated</h2>
//               <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">Get resume tips, job search advice, and be first to know about new features</p>
//               {!emailSubmitted ? (
//                 <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
//                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
//                     className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm"
//                   />
//                   <motion.button type="submit" whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300">
//                     Subscribe
//                   </motion.button>
//                 </form>
//               ) : (
//                 <motion.div initial={{ scale:0 }} animate={{ scale:1 }} className="flex items-center justify-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl max-w-md mx-auto">
//                   <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
//                   <span className="text-green-600 font-semibold">Thanks for subscribing!</span>
//                 </motion.div>
//               )}
//               <p className="text-sm text-gray-400 mt-4">We respect your privacy. Unsubscribe at any time.</p>
//             </div>
//           </motion.div>

//           {/* Final CTA */}
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center py-8">
//             <h2 className="text-5xl md:text-6xl font-black mb-6">
//               <span className="bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent">Your Next Job Starts Here</span>
//             </h2>
//             <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
//               No more guessing. No more wasted applications.<br />Know your match score before you apply — free, forever.
//             </p>
//             <motion.button onClick={handleGetStarted} whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }}
//               className="px-14 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xl rounded-xl shadow-xl hover:shadow-[0_20px_60px_rgba(6,182,212,0.45)] transition-all duration-300"
//             >
//               <span className="flex items-center gap-3">
//                 Analyse My Resume — Free
//                 <motion.svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x:[0,5,0] }} transition={{ duration:1.5, repeat:Infinity }}>
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                 </motion.svg>
//               </span>
//             </motion.button>
//             <p className="text-gray-400 text-sm mt-5">No credit card • No spam • Results in 30 seconds</p>
//           </motion.div>
//         </div>
//       </section>

//       {/* ─────────────────────────────────────────────────────────── */}
//       {/* FOOTER                                                       */}
//       {/* ─────────────────────────────────────────────────────────── */}
//       <footer className="relative bg-gray-50 border-t-2 border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-12">
//           <div className="grid md:grid-cols-4 gap-12 mb-12">
//             <div className="md:col-span-1">
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">J</div>
//                 <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">JobMorph</span>
//               </div>
//               <p className="text-gray-500 text-sm leading-relaxed mb-6">AI-powered resume analysis helping job seekers match their skills with perfect opportunities.</p>
//               <div className="flex gap-3">
//                 {['T','L','G'].map((s,i) => (
//                   <motion.a key={i} href="#" whileHover={{ scale:1.2, rotate:5 }} className="w-9 h-9 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-cyan-50 hover:border-cyan-400 transition-all shadow-sm">
//                     <span className="text-cyan-600 text-xs font-bold">{s}</span>
//                   </motion.a>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <h4 className="text-gray-900 font-bold mb-4">Product</h4>
//               <ul className="space-y-3">
//                 {['Features','How It Works','Pricing','Demo'].map((item, i) => (
//                   <li key={i}><a href={`#${item.toLowerCase().replace(' ','-')}`} className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">{item}</a></li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-gray-900 font-bold mb-4">Company</h4>
//               <ul className="space-y-3">
//                 {[{ label:'About Us', to:'/about' },{ label:'Contact', to:'/contact' },{ label:'Blog', to:'#' },{ label:'Careers', to:'#' }].map((item, i) => (
//                   <li key={i}><Link to={item.to} className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">{item.label}</Link></li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-gray-900 font-bold mb-4">Support</h4>
//               <ul className="space-y-3">
//                 <li><a href="mailto:support@jobmorph.com" className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">support@jobmorph.com</a></li>
//                 <li><Link to="/help"    className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">Help Center</Link></li>
//                 <li><Link to="/privacy" className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">Privacy Policy</Link></li>
//                 <li><a href="#"         className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">Terms of Service</a></li>
//               </ul>
//             </div>
//           </div>

//           <div className="border-t-2 border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
//             <p>©️ {new Date().getFullYear()} JobMorph. All rights reserved.</p>
//             <span>Made with ❤️ for job seekers</span>
//           </div>
//         </div>
//       </footer>

//       <style jsx>{`
//         @keyframes gradient-shift {
//           0%, 100% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//         }
//         .animate-gradient {
//           background-size: 200% auto;
//           animation: gradient-shift 3s ease infinite;
//         }
//       `}</style>
//     </div>
//   );
// }

// export default LandingPage;

// import React, { useEffect, useState, useRef } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { motion, useInView, useScroll } from 'framer-motion';
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// function LandingPage() {
//   const navigate = useNavigate();
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
//   const [scrolled, setScrolled] = useState(false);
//   const [email, setEmail] = useState('');
//   const [emailSubmitted, setEmailSubmitted] = useState(false);

//   const { scrollYProgress } = useScroll();
//   const heroRef = useRef(null);

//   useEffect(() => {
//     AOS.init({ duration: 1000, once: true, easing: 'ease-out-cubic' });

//     const handleMouseMove = (e) => {
//       if (window.matchMedia('(hover: hover)').matches) {
//         setMousePosition({ x: e.clientX, y: e.clientY });
//       }
//     };
//     const handleScroll = () => setScrolled(window.scrollY > 50);

//     window.addEventListener('mousemove', handleMouseMove);
//     window.addEventListener('scroll', handleScroll);
//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   // Auth-aware CTA
//   const handleGetStarted = () => {
//     const isLoggedIn = !!localStorage.getItem('token');
//     navigate(isLoggedIn ? '/upload' : '/signup');
//   };

//   const handleEmailSubmit = (e) => {
//     e.preventDefault();
//     if (email) {
//       setEmailSubmitted(true);
//       setTimeout(() => { setEmailSubmitted(false); setEmail(''); }, 3000);
//     }
//   };

//   // Animation variants
//   const fadeInUp = {
//     hidden: { opacity: 0, y: 30 },
//     visible: { opacity: 1, y: 0 }
//   };
//   const staggerContainer = {
//     hidden: { opacity: 0 },
//     visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
//   };
//   const scaleIn = {
//     hidden: { scale: 0.85, opacity: 0 },
//     visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
//   };

//   // Features with slugs
//   const features = [
//     { icon: '🤖', title: 'AI-Powered Analysis',  slug: 'match-score',       gradient: 'from-cyan-500 to-blue-600',    desc: 'Advanced algorithms analyze your resume against job descriptions with precision, delivering clear match insights and actionable improvement suggestions.' },
//     { icon: '📄', title: 'ATS Format Checker',   slug: 'ats-checker',       gradient: 'from-blue-500 to-indigo-600',  desc: 'Detects issues like scanned PDFs, images, tables, columns, fonts, and layouts that ATS cannot read — and shows exactly what to fix.' },
//     { icon: '🏢', title: 'Company Research',     slug: 'company-research',  gradient: 'from-indigo-500 to-purple-600',desc: 'Get a clear understanding of the company, its role expectations, and key focus areas before your interview.' },
//     { icon: '🎤', title: 'Interview Prep',        slug: 'interview-prep',    gradient: 'from-purple-500 to-pink-600',  desc: 'Get role-specific interview questions, key concepts to revise, and focused preparation based on the job description.' },
//     { icon: '🎯', title: 'Smart Job Ranking',    slug: 'job-ranking',       gradient: 'from-pink-500 to-rose-600',    desc: 'Evaluates multiple job descriptions and ranks them by how well your resume fits — so you apply where you actually belong.' },
//     { icon: '🔒', title: 'Secure & Private',     slug: null,                gradient: 'from-rose-500 to-orange-600',  desc: 'Your data is encrypted and never shared with anyone. Complete privacy guaranteed.' },
//   ];

//   return (
//     <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

//       {/* Scroll Progress Bar */}
//       <motion.div
//         className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 origin-left z-[100]"
//         style={{ scaleX: scrollYProgress }}
//       />

//       {/* Cursor Glow — desktop only */}
//       <div
//         className="pointer-events-none fixed inset-0 z-30 hidden md:block"
//         style={{ background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6,182,212,0.07), transparent 80%)` }}
//       />

//       {/* ─────────────────────────────────────────────────────────── */}
//       {/* NAVBAR                                                       */}
//       {/* ─────────────────────────────────────────────────────────── */}
//       <motion.nav
//         initial={{ y: -100 }} animate={{ y: 0 }}
//         transition={{ type: 'spring', stiffness: 100 }}
//         className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg' : 'bg-transparent'}`}
//       >
//         <div className="max-w-7xl mx-auto px-6 py-4">
//           <div className="flex items-center justify-between">
//             <Link to="/" className="flex items-center gap-2">
//               <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}
//                 className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg"
//               >J</motion.div>
//               <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">JobMorph</span>
//             </Link>

//             <div className="hidden lg:flex items-center gap-8">
//               {['Features', 'How It Works', 'Use Cases', 'Pricing'].map((item, i) => (
//                 <motion.a key={i} href={`#${item.toLowerCase().replace(' ', '-')}`}
//                   className="text-gray-700 hover:text-cyan-600 transition-colors font-medium relative group"
//                   whileHover={{ scale: 1.05 }}
//                 >
//                   {item}
//                   <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-600 group-hover:w-full transition-all duration-300" />
//                 </motion.a>
//               ))}
//             </div>

//             <div className="hidden md:flex items-center gap-3">
//               <Link to="/login" className="px-6 py-2.5 text-gray-700 font-semibold hover:text-cyan-600 transition-colors rounded-lg hover:bg-gray-100">Log In</Link>
//               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//                 <Link to="/signup" className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 relative overflow-hidden group">
//                   <span className="relative z-10">Sign Up</span>
//                   <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                 </Link>
//               </motion.div>
//             </div>

//             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-900 hover:text-cyan-600 transition-colors">
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 {mobileMenuOpen
//                   ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
//               </svg>
//             </button>
//           </div>

//           {mobileMenuOpen && (
//             <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
//               <div className="flex flex-col space-y-3">
//                 {['Features', 'How It Works', 'Use Cases', 'Pricing'].map((item, i) => (
//                   <a key={i} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileMenuOpen(false)}
//                     className="text-gray-700 hover:text-cyan-600 transition-colors font-medium py-2">{item}</a>
//                 ))}
//                 <div className="border-t border-gray-200 pt-3 mt-2 space-y-3">
//                   <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-center px-6 py-2.5 text-gray-900 font-semibold hover:text-cyan-600">Sign In</Link>
//                   <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="block text-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg">Sign Up</Link>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </div>
//       </motion.nav>

//       {/* Subtle Grid BG */}
//       <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
//         <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to right,rgba(6,182,212,.03) 1px,transparent 1px),linear-gradient(to bottom,rgba(6,182,212,.03) 1px,transparent 1px)`, backgroundSize: '80px 80px' }} />
//       </div>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 1 — HERO                                            */}
//       {/* "What is this?"                                             */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30">
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <motion.div animate={{ scale:[1,1.2,1], opacity:[0.3,0.5,0.3] }} transition={{ duration:8, repeat:Infinity }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
//           <motion.div animate={{ scale:[1.2,1,1.2], opacity:[0.5,0.3,0.5] }} transition={{ duration:10, repeat:Infinity, delay:1 }} className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[130px]" />
//           <motion.div animate={{ scale:[1,1.3,1], opacity:[0.2,0.4,0.2] }} transition={{ duration:12, repeat:Infinity, delay:2 }} className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-[120px]" />
//         </div>

//         <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">

//             {/* Left: Text */}
//             <div className="text-center lg:text-left space-y-8">
//               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
//                 className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/30"
//               >
//                 <div className="relative flex h-2 w-2">
//                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75" />
//                   <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
//                 </div>
//                 <span className="text-sm font-bold text-cyan-700">AI-Powered Resume Analysis</span>
//               </motion.div>

//               <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
//                 <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
//                   <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Your Resume.</span>
//                   <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2 animate-gradient">Perfectly Matched.</span>
//                 </h1>
//                 <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
//                   Upload your resume, paste any job description — get your match score in <span className="font-bold text-gray-800">30 seconds</span>. Know your chances before you apply.
//                 </p>
//               </motion.div>

//               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
//                 className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
//               >
//                 <motion.button onClick={handleGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
//                   className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl overflow-hidden shadow-lg hover:shadow-[0_20px_50px_rgba(6,182,212,0.4)] transition-all duration-300"
//                 >
//                   <span className="relative z-10 flex items-center gap-2">
//                     Get Started Free
//                     <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x:[0,5,0] }} transition={{ duration:1.5, repeat:Infinity }}>
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                     </motion.svg>
//                   </span>
//                   <motion.div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500" initial={{ x:'100%' }} whileHover={{ x:0 }} transition={{ duration:0.3 }} />
//                 </motion.button>

//                 <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
//                   <Link to="/how-it-works" className="flex items-center gap-2 px-10 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-cyan-500 transition-all duration-300 shadow-lg">
//                     <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//                     </svg>
//                     Read More
//                   </Link>
//                 </motion.div>
//               </motion.div>

//               <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.8 }}
//                 className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
//               >
//                 {[{ icon:'🔒', text:'SSL Encrypted' },{ icon:'⚡', text:'Lightning Fast' },{ icon:'🎯', text:'95% Accuracy' },{ icon:'🔐', text:'GDPR Compliant' }].map((b,i) => (
//                   <motion.div key={i} whileHover={{ scale:1.08, rotate:1 }}
//                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
//                   >
//                     <span className="text-xl">{b.icon}</span>
//                     <span className="font-semibold text-gray-700 text-sm">{b.text}</span>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </div>

//             {/* Right: Resume Mockup */}
//             <motion.div initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.8, type:'spring' }} className="relative hidden lg:block">
//               <motion.div animate={{ y:[0,-20,0], rotate:[0,2,0,-2,0] }} transition={{ duration:6, repeat:Infinity, ease:'easeInOut' }} className="relative">
//                 <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
//                   <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-100">
//                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">JD</div>
//                     <div><div className="h-4 w-32 bg-gray-200 rounded mb-2" /><div className="h-3 w-24 bg-gray-100 rounded" /></div>
//                   </div>
//                   <div className="space-y-4">
//                     <div><div className="h-3 w-20 bg-cyan-100 rounded mb-2" /><div className="h-2 w-full bg-gray-100 rounded mb-1" /><div className="h-2 w-5/6 bg-gray-100 rounded mb-1" /><div className="h-2 w-4/6 bg-gray-100 rounded" /></div>
//                     <div><div className="h-3 w-24 bg-blue-100 rounded mb-2" /><div className="h-2 w-full bg-gray-100 rounded mb-1" /><div className="h-2 w-3/4 bg-gray-100 rounded" /></div>
//                     <div><div className="h-3 w-16 bg-purple-100 rounded mb-2" /><div className="flex gap-2"><div className="h-6 w-16 bg-cyan-50 border border-cyan-200 rounded" /><div className="h-6 w-16 bg-blue-50 border border-blue-200 rounded" /><div className="h-6 w-20 bg-purple-50 border border-purple-200 rounded" /></div></div>
//                   </div>
//                   <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:2, repeat:Infinity }} className="absolute -top-4 -right-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl px-6 py-3 shadow-xl">
//                     <div className="text-white text-center"><div className="text-3xl font-black">87%</div><div className="text-xs font-semibold">Match</div></div>
//                   </motion.div>
//                 </div>
//                 {[{ delay:0, position:'-top-8 -left-8' },{ delay:0.5, position:'top-1/3 -right-12' },{ delay:1, position:'bottom-8 -left-12' }].map((item, i) => (
//                   <motion.div key={i} initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:item.delay+1.5, type:'spring' }}
//                     className={`absolute ${item.position} w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg`}
//                   >
//                     <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                     </svg>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </motion.div>
//           </div>
//         </div>

//         <motion.div animate={{ y:[0,10,0] }} transition={{ duration:1.5, repeat:Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
//           <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
//           </svg>
//         </motion.div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 2 — PROBLEM → SOLUTION                             */}
//       {/* "Omg that's MY problem!"                                   */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-6xl mx-auto">
//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Sound familiar?</h2>
//             <p className="text-xl text-gray-500">These are the problems JobMorph solves for you</p>
//           </motion.div>

//           <div className="grid md:grid-cols-2 gap-12 items-start">
//             {/* Problem */}
//             <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
//               <div className="inline-block px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-6">
//                 <span className="text-sm font-bold text-red-600">❌ THE PROBLEM</span>
//               </div>
//               <h3 className="text-3xl font-black text-gray-900 mb-6">Job Searching is <span className="text-red-500">Frustrating</span></h3>
//               <div className="space-y-3">
//                 {['Sending 50 applications with 0 replies','No idea if your resume passes ATS systems','Guessing which keywords to include','Wasting hours on mismatched applications','Never knowing why you got rejected'].map((p, i) => (
//                   <motion.div key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }} whileHover={{ x:5 }}
//                     className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100"
//                   >
//                     <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                     <p className="text-gray-700 font-medium text-sm">{p}</p>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Solution */}
//             <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
//               <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-6">
//                 <span className="text-sm font-bold text-cyan-600">✅ THE SOLUTION</span>
//               </div>
//               <h3 className="text-3xl font-black text-gray-900 mb-6">JobMorph Makes it <span className="text-cyan-600">Simple</span></h3>
//               <div className="space-y-3">
//                 {['AI analyzes your resume in 30 seconds','Know exactly how well you match before applying','Get specific missing keyword recommendations','Focus only on jobs where you score 70%+','Understand what to fix for better results'].map((s, i) => (
//                   <motion.div key={i} initial={{ opacity:0, x:20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }} whileHover={{ x:-5 }}
//                     className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50 border border-cyan-100"
//                   >
//                     <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>
//                     <p className="text-gray-700 font-medium text-sm">{s}</p>
//                   </motion.div>
//                 ))}
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 3 — HOW IT WORKS                                   */}
//       {/* "Only 4 steps? That's easy!"                               */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="how-it-works" className="relative py-24 px-6 bg-white">
//         <div className="max-w-6xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-5">
//               <span className="text-sm font-bold text-cyan-600">SIMPLE PROCESS</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">How It Works</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-2xl mx-auto">Four simple steps — from resume to results in under 60 seconds</p>
//           </motion.div>

//           <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once:true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-14">
//             {[
//               { number:'1', icon:'📤', title:'Upload Resume',      desc:'Upload your resume in PDF or DOCX format',           gradient:'from-cyan-500 to-blue-600' },
//               { number:'2', icon:'📋', title:'Add Job Description', desc:'Paste the job description you want to apply for',   gradient:'from-blue-500 to-indigo-600' },
//               { number:'3', icon:'🧠', title:'AI Analysis',         desc:'Our AI analyses your match in 30 seconds',          gradient:'from-indigo-500 to-purple-600' },
//               { number:'4', icon:'📊', title:'Get Results',         desc:'Review your match score and actionable insights',   gradient:'from-purple-500 to-pink-600' },
//             ].map((step, idx) => (
//               <motion.div key={idx} variants={fadeInUp} whileHover={{ y:-10 }} className="group relative">
//                 <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl">
//                   <motion.div whileHover={{ rotate:360 }} transition={{ duration:0.6 }}
//                     className={`absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-r ${step.gradient} flex items-center justify-center font-black text-xl text-white shadow-lg`}
//                   >{step.number}</motion.div>
//                   <motion.div whileHover={{ scale:1.2, rotate:10 }} className="text-5xl mb-5">{step.icon}</motion.div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors">{step.title}</h3>
//                   <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
//                   {idx < 3 && <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />}
//                 </div>
//               </motion.div>
//             ))}
//           </motion.div>

//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center">
//             <Link to="/how-it-works" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
//               See Full Interactive Walkthrough
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//             </Link>
//             <p className="text-sm text-gray-400 mt-3">Interactive demos for every step + all features explained</p>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 4 — DEMO                                           */}
//       {/* "I can actually see it working!"                           */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="demo" className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-6xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-5">
//               <span className="text-sm font-bold text-cyan-600">SEE IT IN ACTION</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Watch JobMorph Work</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-2xl mx-auto">Upload → Paste → Analyse → Get your score. That's it.</p>
//           </motion.div>

//           <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
//             <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border-2 border-gray-200 shadow-2xl">
//               {/* Browser Bar */}
//               <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
//                 <div className="flex gap-2">
//                   <div className="w-3 h-3 rounded-full bg-red-400" />
//                   <div className="w-3 h-3 rounded-full bg-yellow-400" />
//                   <div className="w-3 h-3 rounded-full bg-green-400" />
//                 </div>
//                 <div className="flex-1 ml-4 bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
//                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//                   </svg>
//                   jobmorph.com/analyze
//                 </div>
//               </div>

//               <div className="grid md:grid-cols-2 gap-8">
//                 <div className="space-y-4">
//                   <motion.div whileHover={{ scale:1.02, rotate:1 }} className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-dashed border-cyan-300 rounded-xl text-center cursor-pointer">
//                     <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:2, repeat:Infinity }} className="text-5xl mb-3">📄</motion.div>
//                     <h3 className="text-lg font-bold text-gray-900 mb-1">Resume Uploaded</h3>
//                     <p className="text-sm text-gray-500">John_Doe_Resume.pdf</p>
//                   </motion.div>
//                   <motion.div whileHover={{ scale:1.02, rotate:-1 }} className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-xl text-center cursor-pointer">
//                     <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:2, repeat:Infinity, delay:0.5 }} className="text-5xl mb-3">💼</motion.div>
//                     <h3 className="text-lg font-bold text-gray-900 mb-1">Job Description Added</h3>
//                     <p className="text-sm text-gray-500">Senior Software Engineer</p>
//                   </motion.div>
//                 </div>

//                 <div className="space-y-4">
//                   <motion.div initial={{ opacity:0, scale:0.8 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ delay:0.3 }} className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-xl">
//                     <div className="flex items-center justify-between mb-4">
//                       <h3 className="text-lg font-bold text-gray-900">Match Score</h3>
//                       <motion.span initial={{ scale:0 }} whileInView={{ scale:1 }} viewport={{ once:true }} transition={{ delay:0.5, type:'spring' }} className="text-4xl font-black text-green-600">87%</motion.span>
//                     </div>
//                     <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
//                       <motion.div initial={{ width:0 }} whileInView={{ width:'87%' }} viewport={{ once:true }} transition={{ delay:0.6, duration:1 }} className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
//                     </div>
//                   </motion.div>
//                   <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:0.7 }} className="p-4 bg-white border border-gray-200 rounded-xl space-y-2 shadow-sm">
//                     {[
//                       { icon:'check', text:'Strong technical skills match', color:'green' },
//                       { icon:'check', text:'Experience level aligned',       color:'green' },
//                       { icon:'warn',  text:'Add "Kubernetes" keyword',       color:'yellow' },
//                     ].map((item, i) => (
//                       <motion.div key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:0.8+i*0.1 }} className="flex items-center gap-2">
//                         <svg className={`w-5 h-5 text-${item.color}-600`} fill="currentColor" viewBox="0 0 20 20">
//                           {item.icon === 'check'
//                             ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                             : <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />}
//                         </svg>
//                         <span className="text-sm text-gray-700">{item.text}</span>
//                       </motion.div>
//                     ))}
//                   </motion.div>
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 5 — FEATURES                                       */}
//       {/* "It does ALL of this?!"                                    */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="features" className="relative py-24 px-6 bg-white">
//         <div className="relative max-w-7xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-5">
//               <span className="text-sm font-bold text-cyan-600">POWERFUL FEATURES</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent">Everything You Need</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-3xl mx-auto">One platform. All the tools to land your dream job.</p>
//           </motion.div>

//           <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once:true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {features.map((feature, i) => (
//               <motion.div key={i} variants={fadeInUp} whileHover={{ y:-10, scale:1.02 }}>
//                 <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl group flex flex-col">
//                   <motion.div whileHover={{ scale:1.2, rotate:360 }} transition={{ duration:0.8 }}
//                     className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}
//                   >{feature.icon}</motion.div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">{feature.title}</h3>
//                   <p className="text-gray-500 leading-relaxed flex-1 text-sm">{feature.desc}</p>
//                   {feature.slug ? (
//                     <div className="mt-6 pt-5 border-t border-gray-100">
//                       <Link to={`/features/${feature.slug}`}
//                         className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${feature.gradient} text-white text-sm font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200`}
//                       >
//                         Read More
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//                       </Link>
//                     </div>
//                   ) : (
//                     <div className="mt-6 pt-5 border-t border-gray-100">
//                       <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500">🔒 Always Enabled</span>
//                     </div>
//                   )}
//                   <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
//                 </div>
//               </motion.div>
//             ))}
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 6 — COMPARISON TABLE                               */}
//       {/* "AND it's better than everything else?"                    */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-5xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Why Choose JobMorph?</span>
//             </h2>
//             <p className="text-xl text-gray-500">See how we compare to the old way</p>
//           </motion.div>

//           <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-xl">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
//                   <th className="px-6 py-4 text-left text-gray-700 font-semibold">Feature</th>
//                   <th className="px-6 py-4 text-center text-gray-700 font-semibold">Manual Review</th>
//                   <th className="px-6 py-4 text-center bg-cyan-50 border-l-2 border-r-2 border-cyan-200"><span className="text-cyan-600 font-bold">JobMorph AI</span></th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white">
//                 {[
//                   { feature:'Analysis Time',       manual:'30+ minutes',      jobmorph:'30 seconds',       icon:'⚡' },
//                   { feature:'Accuracy',             manual:'Subjective guess', jobmorph:'95% AI accuracy',  icon:'🎯' },
//                   { feature:'Match Score',          manual:'No scoring',       jobmorph:'Detailed %',       icon:'📊' },
//                   { feature:'Keyword Suggestions',  manual:'Manual research',  jobmorph:'Auto-generated',   icon:'💡' },
//                   { feature:'History Tracking',     manual:'None',             jobmorph:'Full history',     icon:'📂' },
//                   { feature:'Cost',                 manual:'Time = money',     jobmorph:'Free',             icon:'💰' },
//                 ].map((row, i) => (
//                   <motion.tr key={i} initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.08 }} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
//                     <td className="px-6 py-4 text-gray-900 font-medium"><span className="flex items-center gap-2"><span className="text-xl">{row.icon}</span>{row.feature}</span></td>
//                     <td className="px-6 py-4 text-center text-gray-500 text-sm">{row.manual}</td>
//                     <td className="px-6 py-4 text-center font-bold text-cyan-600 bg-cyan-50 border-l-2 border-r-2 border-cyan-100 text-sm">{row.jobmorph}</td>
//                   </motion.tr>
//                 ))}
//               </tbody>
//             </table>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 7 — USE CASES                                      */}
//       {/* "This is literally made for me"                            */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="use-cases" className="relative py-24 px-6 bg-white">
//         <div className="max-w-7xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-purple-50 border border-purple-200 mb-5">
//               <span className="text-sm font-bold text-purple-600">WHO IT'S FOR</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Who Is JobMorph For?</span>
//             </h2>
//             <p className="text-xl text-gray-500 max-w-3xl mx-auto">Whether you're starting out or switching careers — JobMorph has you covered</p>
//           </motion.div>

//           <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once:true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
//             {[
//               { icon:'🎓', title:'Recent Graduates',  desc:'Land your first job with confidence by knowing exactly how your resume stacks up against real requirements.',         gradient:'from-cyan-500 to-blue-600' },
//               { icon:'🔄', title:'Career Changers',   desc:'See which transferable skills match your new target roles — and which gaps to fill before applying.',                gradient:'from-blue-500 to-indigo-600' },
//               { icon:'🚀', title:'Active Job Seekers',desc:'Apply smarter, not harder. Focus only on jobs where you score 70%+ and save hours of wasted effort.',                gradient:'from-indigo-500 to-purple-600' },
//               { icon:'💼', title:'HR Professionals',  desc:'Screen candidates faster with instant AI-powered match scoring against your job descriptions.',                       gradient:'from-purple-500 to-pink-600' },
//             ].map((u, i) => (
//               <motion.div key={i} variants={scaleIn} whileHover={{ y:-8 }}>
//                 <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl">
//                   <motion.div whileHover={{ scale:1.2, rotate:360 }} transition={{ duration:0.6 }}
//                     className={`w-16 h-16 rounded-xl bg-gradient-to-r ${u.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}
//                   >{u.icon}</motion.div>
//                   <h3 className="text-xl font-bold text-gray-900 mb-3">{u.title}</h3>
//                   <p className="text-gray-500 text-sm leading-relaxed">{u.desc}</p>
//                 </div>
//               </motion.div>
//             ))}
//           </motion.div>

//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mt-12">
//             <Link to="/use-cases" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300">
//               Read Success Stories
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//             </Link>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 8 — PRICING                                        */}
//       {/* "FREE?! I'm in!"                                           */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section id="pricing" className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-5xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <div className="inline-block px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-5">
//               <span className="text-sm font-bold text-green-600">PRICING</span>
//             </div>
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Simple, Transparent Pricing</span>
//             </h2>
//             <p className="text-xl text-gray-500">Start free. No credit card. No catch.</p>
//           </motion.div>

//           <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
//             {/* Free */}
//             <motion.div initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} whileHover={{ y:-8 }} className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl">
//               <div className="mb-6">
//                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
//                 <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-gray-900">$0</span><span className="text-gray-500">/ forever</span></div>
//               </div>
//               <ul className="space-y-4 mb-8">
//                 {['Unlimited resume uploads','AI-powered matching','Basic match scores','Scan history (last 10)','Email support'].map((f, i) => (
//                   <li key={i} className="flex items-start gap-3">
//                     <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
//                     <span className="text-gray-700 text-sm">{f}</span>
//                   </li>
//                 ))}
//               </ul>
//               <motion.button onClick={handleGetStarted} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="w-full px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg">
//                 Get Started Free
//               </motion.button>
//             </motion.div>

//             {/* Premium */}
//             <motion.div initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} whileHover={{ y:-8 }} className="relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border-2 border-cyan-300 shadow-xl">
//               <motion.div animate={{ scale:[1,1.05,1] }} transition={{ duration:2, repeat:Infinity }} className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg">
//                 <span className="text-sm font-bold text-white">COMING SOON</span>
//               </motion.div>
//               <div className="mb-6">
//                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
//                 <div className="flex items-baseline gap-2"><span className="text-5xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">$9</span><span className="text-gray-500">/ month</span></div>
//               </div>
//               <ul className="space-y-4 mb-8">
//                 {['Everything in Free','Advanced AI insights','Detailed improvement suggestions','Unlimited scan history','Priority support','Export reports (PDF)','ATS optimization tools'].map((f, i) => (
//                   <li key={i} className="flex items-start gap-3">
//                     <svg className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
//                     <span className="text-gray-700 text-sm">{f}</span>
//                   </li>
//                 ))}
//               </ul>
//               <button disabled className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-xl cursor-not-allowed opacity-60">Coming Soon</button>
//             </motion.div>
//           </div>

//           <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mt-12">
//             <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300">
//               View Full Pricing Details
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
//             </Link>
//           </motion.div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 9 — FAQ                                            */}
//       {/* "Ok my last doubts are gone"                               */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-white">
//         <div className="max-w-4xl mx-auto">
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-16">
//             <h2 className="text-5xl md:text-6xl font-black mb-4">
//               <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">Frequently Asked Questions</span>
//             </h2>
//             <p className="text-xl text-gray-500">Everything you want to know before signing up</p>
//           </motion.div>

//           <div className="space-y-4">
//             {[
//               { q:'Is JobMorph completely free?',              a:'Yes! Core features are completely free — upload resumes, analyze matches, and get detailed results at no cost. Premium features are coming soon.' },
//               { q:'Is my resume data safe?',                   a:'Absolutely. All data is encrypted with SSL. Your resume is never shared with third parties and remains completely private.' },
//               { q:'Do I need to create an account?',          a:'Yes — a free account gives you a personalized dashboard, scan history, and saved results. Signup takes under 60 seconds.' },
//               { q:'What file formats are supported?',          a:'We support PDF and DOCX formats — the most common formats used by job seekers and ATS systems.' },
//               { q:'How does the AI matching work?',            a:'Our AI analyzes keywords, skills, experience, education, and qualifications — then compares them against job requirements to give you an accurate match % with specific recommendations.' },
//               { q:'Can I use it for multiple applications?',  a:'Absolutely! Analyze your resume against as many job descriptions as you want. We recommend testing a tailored version for each role.' },
//               { q:'Will this help me pass ATS systems?',       a:'Yes. We check formatting, keywords, and layout issues that cause ATS rejections — and show you exactly what to fix.' },
//               { q:'How long does analysis take?',              a:'Under 30 seconds. Our AI processes your resume and job description in real-time.' },
//             ].map((item, idx) => (
//               <motion.div key={idx} initial={{ opacity:0, y:15 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:idx*0.05 }} whileHover={{ scale:1.01 }}
//                 className="group bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-300 shadow-sm hover:shadow-lg"
//               >
//                 <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors flex items-start gap-3">
//                   <span className="text-cyan-500 flex-shrink-0">Q:</span>{item.q}
//                 </h3>
//                 <p className="text-gray-500 leading-relaxed pl-7 text-sm">{item.a}</p>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ═══════════════════════════════════════════════════════════ */}
//       {/* SECTION 10 — NEWSLETTER + FINAL CTA                        */}
//       {/* "Let me sign up now"                                        */}
//       {/* ═══════════════════════════════════════════════════════════ */}
//       <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
//         <div className="max-w-4xl mx-auto space-y-16">

//           {/* Newsletter */}
//           <motion.div initial={{ opacity:0, scale:0.95 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }}
//             className="relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-12 border-2 border-cyan-200 overflow-hidden shadow-xl text-center"
//           >
//             <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />
//             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
//             <div className="relative">
//               <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Stay Updated</h2>
//               <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">Get resume tips, job search advice, and be first to know about new features</p>
//               {!emailSubmitted ? (
//                 <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
//                   <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required
//                     className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm"
//                   />
//                   <motion.button type="submit" whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300">
//                     Subscribe
//                   </motion.button>
//                 </form>
//               ) : (
//                 <motion.div initial={{ scale:0 }} animate={{ scale:1 }} className="flex items-center justify-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl max-w-md mx-auto">
//                   <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
//                   <span className="text-green-600 font-semibold">Thanks for subscribing!</span>
//                 </motion.div>
//               )}
//               <p className="text-sm text-gray-400 mt-4">We respect your privacy. Unsubscribe at any time.</p>
//             </div>
//           </motion.div>

//           {/* Final CTA */}
//           <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center py-8">
//             <h2 className="text-5xl md:text-6xl font-black mb-6">
//               <span className="bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent">Your Next Job Starts Here</span>
//             </h2>
//             <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
//               No more guessing. No more wasted applications.<br />Know your match score before you apply — free, forever.
//             </p>
//             <motion.button onClick={handleGetStarted} whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }}
//               className="px-14 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xl rounded-xl shadow-xl hover:shadow-[0_20px_60px_rgba(6,182,212,0.45)] transition-all duration-300"
//             >
//               <span className="flex items-center gap-3">
//                 Analyse My Resume — Free
//                 <motion.svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" animate={{ x:[0,5,0] }} transition={{ duration:1.5, repeat:Infinity }}>
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                 </motion.svg>
//               </span>
//             </motion.button>
//             <p className="text-gray-400 text-sm mt-5">No credit card • No spam • Results in 30 seconds</p>
//           </motion.div>
//         </div>
//       </section>

//       {/* ─────────────────────────────────────────────────────────── */}
//       {/* FOOTER                                                       */}
//       {/* ─────────────────────────────────────────────────────────── */}
//       <footer className="relative bg-gray-50 border-t-2 border-gray-200">
//         <div className="max-w-7xl mx-auto px-6 py-12">
//           <div className="grid md:grid-cols-4 gap-12 mb-12">
//             <div className="md:col-span-1">
//               <div className="flex items-center gap-2 mb-4">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">J</div>
//                 <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">JobMorph</span>
//               </div>
//               <p className="text-gray-500 text-sm leading-relaxed mb-6">AI-powered resume analysis helping job seekers match their skills with perfect opportunities.</p>
//               <div className="flex gap-3">
//                 {['T','L','G'].map((s,i) => (
//                   <motion.a key={i} href="#" whileHover={{ scale:1.2, rotate:5 }} className="w-9 h-9 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-cyan-50 hover:border-cyan-400 transition-all shadow-sm">
//                     <span className="text-cyan-600 text-xs font-bold">{s}</span>
//                   </motion.a>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <h4 className="text-gray-900 font-bold mb-4">Product</h4>
//               <ul className="space-y-3">
//                 {['Features','How It Works','Pricing','Demo'].map((item, i) => (
//                   <li key={i}><a href={`#${item.toLowerCase().replace(' ','-')}`} className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">{item}</a></li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-gray-900 font-bold mb-4">Company</h4>
//               <ul className="space-y-3">
//                 {[{ label:'About Us', to:'/about' },{ label:'Contact', to:'/contact' },{ label:'Blog', to:'#' },{ label:'Careers', to:'#' }].map((item, i) => (
//                   <li key={i}><Link to={item.to} className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">{item.label}</Link></li>
//                 ))}
//               </ul>
//             </div>

//             <div>
//               <h4 className="text-gray-900 font-bold mb-4">Support</h4>
//               <ul className="space-y-3">
//                 <li><a href="mailto:support@jobmorph.com" className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">support@jobmorph.com</a></li>
//                 <li><Link to="/help"    className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">Help Center</Link></li>
//                 <li><Link to="/privacy" className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">Privacy Policy</Link></li>
//                 <li><a href="#"         className="text-gray-500 hover:text-cyan-600 transition-colors text-sm">Terms of Service</a></li>
//               </ul>
//             </div>
//           </div>

//           <div className="border-t-2 border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
//             <p>©️ {new Date().getFullYear()} JobMorph. All rights reserved.</p>
//             <span>Made with ❤️ for job seekers</span>
//           </div>
//         </div>
//       </footer>

//       <style jsx>{`
//         @keyframes gradient-shift {
//           0%, 100% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//         }
//         .animate-gradient {
//           background-size: 200% auto;
//           animation: gradient-shift 3s ease infinite;
//         }
//       `}</style>
//     </div>
//   );
// }

// export default LandingPage;

























































