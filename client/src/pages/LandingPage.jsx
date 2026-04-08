import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Brain,
  BarChart2,
  Building2,
  Mic,
  Target,
  ShieldCheck,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  Zap,
  Crosshair,
  GraduationCap,
  RefreshCw,
  Rocket,
  Briefcase,
  Check,
  Sparkles,
  KeyRound,
  Mail,
  HelpCircle,
  FileCheck,
  Layers,
} from "lucide-react";
import "./landing.css";

/* ─────────────── DATA ─────────────── */
const NAV_ITEMS = [
  { label: "How It Works", id: "how-it-works" },
  { label: "Features",     id: "features"     },
  { label: "Use Cases",    id: "use-cases"    },
  { label: "Pricing",      id: "pricing"      },
];

const PROBLEMS = [
  "Sending <strong>50 applications</strong> with 0 replies",
  "No idea if your resume <strong>passes ATS systems</strong>",
  "Guessing which <strong>keywords to include</strong>",
  "Wasting hours on <strong>mismatched applications</strong>",
  "Never knowing <strong>why you got rejected</strong>",
];
const SOLUTIONS = [
  "AI analyses your resume in <strong>30 seconds</strong>",
  "Know exactly <strong>how well you match</strong> before applying",
  "Get specific <strong>missing keyword recommendations</strong>",
  "Focus only on jobs where you <strong>score 70%+</strong>",
  "Understand <strong>exactly what to fix</strong> for better results",
];

const STEPS = [
  { num: "01", Icon: Upload,    title: "Upload Resume",       desc: "PDF or DOCX. Encrypted immediately. Never shared with anyone."                          },
  { num: "02", Icon: FileText,  title: "Add Job Description", desc: "Paste from LinkedIn, Naukri, Indeed — any job board, anywhere."                         },
  { num: "03", Icon: Brain,     title: "AI Analysis",         desc: "50+ parameters checked across keywords, skills, experience, and education."              },
  { num: "04", Icon: BarChart2, title: "Get Your Score",      desc: "Match %, missing keywords, and exactly what to fix to improve."                          },
];

const ANALYSIS_STEPS = [
  { label: "Reading your resume…",        done: true  },
  { label: "Parsing job description…",    done: true  },
  { label: "Matching keywords & skills…", done: true  },
  { label: "Checking experience level…",  done: true  },
  { label: "Generating match score…",     done: false },
];

const FEATURES = [
  { Icon: BarChart2,   chip: "Core",     title: "AI-Powered Analysis", desc: "Advanced algorithms analyse your resume against job descriptions with precision, delivering clear match insights and actionable improvement suggestions.", slug: "match-score"       },
  { Icon: FileCheck,   chip: "ATS",      title: "ATS Format Checker",  desc: "Detects issues like scanned PDFs, images, tables, columns, fonts, and layouts that ATS cannot read — and shows exactly what to fix.",                    slug: "ats-checker"      },
  { Icon: Building2,   chip: "Research", title: "Company Research",    desc: "Get a clear understanding of the company, its role expectations, and key focus areas before your interview — walk in fully prepared.",                   slug: "company-research" },
  { Icon: Mic,         chip: "Prep",     title: "Interview Prep",      desc: "Get role-specific interview questions, key concepts to revise, and focused preparation based on the exact job description you're targeting.",             slug: "interview-prep"   },
  { Icon: Target,      chip: "Smart",    title: "Smart Job Ranking",   desc: "Evaluates multiple job descriptions and ranks them by how well your resume fits — apply where you have real chances, not just hopes.",                    slug: "job-ranking"      },
  { Icon: ShieldCheck, chip: "Privacy",  title: "Secure & Private",    desc: "Your data is encrypted end-to-end and never shared with anyone. GDPR compliant. Complete privacy guaranteed, always, no exceptions.",                     slug: null               },
];

const CMP_ROWS = [
  { Icon: Zap,       label: "Analysis Time",       manual: "30+ minutes",      jm: "30 seconds"      },
  { Icon: Crosshair, label: "Accuracy",             manual: "Subjective guess", jm: "95% AI accuracy" },
  { Icon: BarChart2, label: "Match Score",          manual: "No scoring",       jm: "Detailed %"      },
  { Icon: KeyRound,  label: "Keyword Suggestions",  manual: "Manual research",  jm: "Auto-generated"  },
  { Icon: Layers,    label: "History Tracking",     manual: "None",             jm: "Full history"    },
  { Icon: Sparkles,  label: "Cost",                 manual: "Time = money",     jm: "Free"            },
];

const USE_CASES = [
  { Icon: GraduationCap, title: "Recent Graduates",   desc: "Land your first job with confidence by knowing exactly how your resume stacks up against real requirements."  },
  { Icon: RefreshCw,     title: "Career Changers",    desc: "See which transferable skills match your new target roles — and which gaps to fill before you apply."          },
  { Icon: Rocket,        title: "Active Job Seekers", desc: "Apply smarter, not harder. Focus only on jobs where you score 70%+ and save hours of wasted effort."          },
  { Icon: Briefcase,     title: "HR Professionals",   desc: "Screen candidates faster with instant AI-powered match scoring against your job descriptions."                 },
];

const FREE_FEATURES    = ["Unlimited resume uploads","AI-powered matching","Basic match scores","Scan history (last 10)","Email support"];
const PREMIUM_FEATURES = ["Everything in Free","Advanced AI insights","Detailed improvement suggestions","Unlimited scan history","Priority support","Export PDF reports","ATS optimisation tools"];

const FAQS = [
  { q: "Is JobMorph completely free?",            a: "Yes. Core features are completely free — upload resumes, analyse matches, get detailed results at no cost. Premium features are coming soon."                                                              },
  { q: "Is my resume data safe?",                 a: "Absolutely. All data is encrypted with SSL. Your resume is never shared with third parties and remains completely private."                                                                              },
  { q: "Do I need to create an account?",         a: "Yes — a free account gives you a personalised dashboard, scan history, and saved results. Signup takes under 60 seconds."                                                                               },
  { q: "What file formats are supported?",        a: "We support PDF and DOCX formats — the most common formats used by job seekers and ATS systems worldwide."                                                                                               },
  { q: "How does the AI matching work?",          a: "Our AI analyses keywords, skills, experience, education, and qualifications — compares them against job requirements to give you an accurate match % with specific recommendations."                     },
  { q: "Can I use it for multiple applications?", a: "Absolutely. Analyse your resume against as many job descriptions as you want. We recommend a tailored version for each role."                                                                            },
  { q: "Will this help me pass ATS systems?",     a: "Yes. We check formatting, keywords, and layout issues that cause ATS rejections — and show you exactly what to fix."                                                                                    },
  { q: "How long does analysis take?",            a: "Under 30 seconds. Our AI processes your resume and job description in real-time with no waiting at all."                                                                                                },
];

const MARQUEE_ITEMS = [
  "AI-Powered Analysis","ATS Format Checker","Match Score in 30 Seconds",
  "Interview Prep","Company Research","Smart Job Ranking",
  "Keyword Suggestions","95% Accuracy","GDPR Compliant",
];

/*
 * Footer Product labels — these are display-only.
 * No onClick, no navigation, no hover state.
 * Matches the screenshot: Resume Matcher / ATS Checker / Batch Matcher / Career Skill Map
 */
const FOOTER_PRODUCT_LABELS = [
  "Resume Matcher",
  "ATS Checker",
  "Batch Matcher",
  "Career Skill Map",
];

/* ─────────────── HOOKS ─────────────── */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─────────────── SMALL COMPONENTS ─────────────── */
function CheckIco({ color = "white", size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function ArrowIco({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}
function SpinIco() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation:"spin 1s linear infinite", flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function RevealSection({ children, className = "", delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`rv ${visible ? "vis" : ""} ${className}`} style={{ transitionDelay:`${delay}s` }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="sec-label">{children}</div>;
}

/* ─────────────── NAVBAR ─────────────── */
function Navbar({ onNavigate }) {
  const [scrolled, setScrolled]           = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    const observers = [];
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin:"-30% 0px -60% 0px", threshold:0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => { window.removeEventListener("scroll", onScroll); observers.forEach((o) => o.disconnect()); };
  }, []);

  const handleNav = (id) => {
    setMobileOpen(false);
    setActiveSection(id);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior:"smooth" });
    }, 80);
  };

  return (
    <>
      <nav className={`jm-nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-in">
          <button className="logo" onClick={() => onNavigate("/")} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:0 }}>
            <div className="logo-ico"><Sparkles size={18} color="white" strokeWidth={2} /></div>
            <span className="logo-text">JOBMORPH</span>
          </button>

          <ul className="nav-links">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button onClick={() => handleNav(item.id)} className={activeSection === item.id ? "nav-active" : ""}>{item.label}</button>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <button className="btn-ghost2" onClick={() => onNavigate("/login")}>Log In</button>
            <button className="btn-nav"    onClick={() => onNavigate("/signup")}>Get Started</button>
          </div>

          <button className="hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      <div className={`mob-menu ${mobileOpen ? "open" : ""}`}>
        <div className="mob-head">
          <button className="logo" onClick={() => { onNavigate("/"); setMobileOpen(false); }} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:0 }}>
            <div className="logo-ico"><Sparkles size={18} color="white" strokeWidth={2} /></div>
            <span className="logo-text">JOBMORPH</span>
          </button>
          <button className="mob-close" onClick={() => setMobileOpen(false)}>
            <XCircle size={22} />
          </button>
        </div>
        <div className="mob-navs">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={`mob-link${activeSection === item.id ? " mob-active" : ""}`} onClick={() => handleNav(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="mob-acts">
          <button className="btn-ghost2" style={{ width:"100%",padding:"13px",fontSize:"15px",borderRadius:"12px" }} onClick={() => onNavigate("/login")}>Log In</button>
          <button className="btn-nav"    style={{ width:"100%",padding:"13px",fontSize:"15px",borderRadius:"12px" }} onClick={() => onNavigate("/signup")}>Get Started</button>
        </div>
      </div>
    </>
  );
}

/* ─────────────── HERO VISUAL ─────────────── */
function HeroVisual() {
  const [animScore, setAnimScore] = useState(0);
  const [step, setStep]           = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 3;
        if (current >= 87) { setAnimScore(87); clearInterval(interval); }
        else setAnimScore(current);
      }, 28);
      return () => clearInterval(interval);
    }, 600);
    const steps = [0,1,2,3,4].map((i) =>
      setTimeout(() => setStep((s) => Math.max(s, i + 1)), 400 + i * 500)
    );
    return () => { clearTimeout(timer); steps.forEach(clearTimeout); };
  }, []);

  const analysisSteps = [
    { label:"Reading resume content…"    },
    { label:"Parsing job requirements…"  },
    { label:"Matching skills & keywords…"},
    { label:"Checking experience level…" },
    { label:"Score ready!", final:true    },
  ];

  const keywords = [
    { word:"React",      match:true  },
    { word:"Node.js",    match:true  },
    { word:"Python",     match:true  },
    { word:"AWS",        match:true  },
    { word:"Docker",     match:false },
    { word:"TypeScript", match:true  },
  ];

  return (
    <div className="hv-root">
      <div className="hv-card">
        <div className="hv-job-header">
          <div className="hv-company-logo">G</div>
          <div className="hv-job-info">
            <div className="hv-job-title">Senior Software Engineer</div>
            <div className="hv-job-company">Google · Bangalore · Full-time</div>
          </div>
          <div className="hv-live-badge">
            <span className="hv-live-dot" />
            Analysing
          </div>
        </div>

        <div className="hv-score-section">
          <div className="hv-ring-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#ede9fe" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - animScore / 100)}`}
                transform="rotate(-90 60 60)"
                style={{ transition:"stroke-dashoffset 0.05s linear" }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="hv-ring-center">
              <div className="hv-ring-num">{animScore}<span className="hv-ring-pct">%</span></div>
              <div className="hv-ring-lbl">Match</div>
            </div>
          </div>

          <div className="hv-score-details">
            <div className="hv-score-label">Strong Match</div>
            <div className="hv-score-sub">You should apply for this role</div>
            <div className="hv-steps-mini">
              {analysisSteps.map((s, i) => (
                <div key={i} className={`hv-step-row${step > i ? " done" : ""}${s.final && step > i ? " final" : ""}`}>
                  <span className="hv-step-ico">
                    {step > i ? <Check size={12} strokeWidth={3} /> : <span className="hv-step-empty" />}
                  </span>
                  <span className="hv-step-text">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hv-keywords-section">
          <div className="hv-kw-label">Keyword Match</div>
          <div className="hv-kw-chips">
            {keywords.map((k) => (
              <span key={k.word} className={`hv-chip${k.match ? " match" : " miss"}`}>
                {k.match
                  ? <Check   size={10} strokeWidth={3}   style={{ display:"inline", marginRight:3 }} />
                  : <XCircle size={10} strokeWidth={2.5} style={{ display:"inline", marginRight:3 }} />
                }
                {k.word}
              </span>
            ))}
          </div>
        </div>

        <div className="hv-tip">
          <Sparkles size={14} color="#7c3aed" style={{ flexShrink:0 }} />
          <span className="hv-tip-text">Add <strong>Docker</strong> to boost score to <strong>92%</strong></span>
        </div>
      </div>

      <div className="hv-float hv-float-ats">
        <CheckCircle size={18} color="#10b981" style={{ flexShrink:0 }} />
        <div>
          <div className="hv-float-title">ATS Compatible</div>
          <div className="hv-float-sub">Format is clean</div>
        </div>
      </div>

      <div className="hv-float hv-float-time">
        <Zap size={18} color="#f59e0b" style={{ flexShrink:0 }} />
        <div>
          <div className="hv-float-title">28 seconds</div>
          <div className="hv-float-sub">Analysis complete</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── HERO ─────────────── */
function Hero({ onNavigate }) {
  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:"smooth" }); };

  return (
    <section className="hero">
      <div className="hero-deco">
        <div className="deco-dots" />
        <div className="deco-blob deco-blob1" />
        <div className="deco-blob deco-blob2" />
        <div className="deco-blob deco-blob3" />
      </div>

      <div className="hero-inner">
        <div>
          <div className="hero-badge">
            <span className="badge-pill">AI</span>
            <span className="badge-dot" />
            <span className="badge-text">Powered Resume Matcher</span>
          </div>

          <h1 className="hero-h">
            Know your chances<br />
            <span className="grad-text">before you apply.</span>
          </h1>

          <p className="hero-sub">
            Upload your resume, paste any job description — get a precise{" "}
            <strong>match score in 30 seconds.</strong> Stop guessing. Start winning.
          </p>

          <div className="hero-ctas">
            <button className="btn-hero-p" onClick={() => onNavigate("/upload")}>
              Analyse My Resume
              <span className="arr"><ArrowIco size={17} /></span>
            </button>
            <button className="btn-hero-s" onClick={() => scrollTo("how-it-works")}>
              <PlayCircle size={16} style={{ flexShrink:0 }} />
              See How It Works
            </button>
          </div>

          <div className="trust-row">
            {[
              { Icon:Lock,      label:"SSL Encrypted"     },
              { Icon:Zap,       label:"30 Second Results" },
              { Icon:Crosshair, label:"95% Accuracy"      },
            ].map(({ Icon, label }) => (
              <div className="trust-item" key={label}>
                <div className="ti-dot"><Icon size={10} color="white" /></div>
                {label}
              </div>
            ))}
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

/* ─────────────── MARQUEE ─────────────── */
function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="marquee-wrap">
      <div className="marquee-inner">
        <div className="marquee-label">What we do</div>
        <div style={{ overflow:"hidden", flex:1 }}>
          <div className="marquee-track">
            {doubled.map((item, i) => (
              <div className="mq-item" key={i}><span className="mq-dot" />{item}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── PROBLEM / SOLUTION ─────────────── */
function ProblemSolution() {
  return (
    <section className="section ps-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>Sound Familiar?</SectionLabel>
          <h2 className="sh">Job hunting is broken.<br /><span className="g">We fixed it.</span></h2>
        </RevealSection>
        <RevealSection delay={0.1}>
          <div className="ps-grid">
            <div className="ps-col">
              <div className="ps-badge bad">
                <XCircle size={13} strokeWidth={2.5} style={{ display:"inline", marginRight:5 }} />
                The Problem
              </div>
              <div className="ps-head">Why most applications never get a reply</div>
              {PROBLEMS.map((p, i) => (
                <div className="ps-li" key={i}>
                  <div className="ps-ico x"><XCircle size={12} color="#dc2626" strokeWidth={2.5} /></div>
                  <p className="ps-text" dangerouslySetInnerHTML={{ __html:p }} />
                </div>
              ))}
            </div>
            <div className="ps-col sol">
              <div className="ps-badge good">
                <CheckCircle size={13} strokeWidth={2.5} style={{ display:"inline", marginRight:5 }} />
                The Solution
              </div>
              <div className="ps-head">How JobMorph changes everything</div>
              {SOLUTIONS.map((s, i) => (
                <div className="ps-li" key={i}>
                  <div className="ps-ico ok"><CheckCircle size={12} color="#7c3aed" strokeWidth={2.5} /></div>
                  <p className="ps-text" dangerouslySetInnerHTML={{ __html:s }} />
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── HOW IT WORKS ─────────────── */
function HowItWorks({ onNavigate }) {
  return (
    <section id="how-it-works" className="section hiw-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>Simple Process</SectionLabel>
          <h2 className="sh">Four steps.<br /><span className="g">Under 60 seconds.</span></h2>
          <p className="sp">From resume to results faster than a coffee break.</p>
        </RevealSection>
        <RevealSection delay={0.1}>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div className="step-card" key={s.num}>
                <div className="step-num-badge">Step {s.num}</div>
                <div className="step-icon"><s.Icon size={32} strokeWidth={1.5} style={{ color:"#7c3aed" }} /></div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </RevealSection>
        <RevealSection delay={0.2}>
          <div className="hiw-cta">
            <button className="btn-outline-grad" onClick={() => onNavigate("/how-it-works")}>
              See Full Interactive Walkthrough <ArrowIco size={14} />
            </button>
            <p style={{ fontSize:13, color:"var(--muted)", marginTop:12, fontWeight:600 }}>
              Interactive demos for every step + all features explained
            </p>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── DEMO ─────────────── */
function Demo({ onNavigate }) {
  return (
    <section id="demo" className="section demo-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>The Actual Process</SectionLabel>
          <h2 className="sh">Here's what <span className="g">actually happens</span></h2>
          <p className="sp">Real steps. Real interface. No mockups, no tricks.</p>
        </RevealSection>

        <div className="demo-list">
          <RevealSection>
            <div className="d-step">
              <div className="d-step-num">1</div>
              <div className="d-body">
                <div className="d-title">Upload Your Resume</div>
                <p className="d-desc">Select your file in <strong>PDF or DOCX</strong>. Your file is <strong>encrypted immediately</strong> and never shared with anyone, ever.</p>
                <div className="d-ui">
                  <div className="d-file">
                    <div className="d-file-ic"><FileText size={18} color="#dc2626" strokeWidth={1.5} /></div>
                    <div>
                      <div className="d-file-name">John_Doe_Resume.pdf</div>
                      <div className="d-file-meta">2.4 MB · Uploaded successfully</div>
                    </div>
                    <div className="d-file-ok"><Check size={13} strokeWidth={3} /> Done</div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection>
            <div className="d-step">
              <div className="d-step-num">2</div>
              <div className="d-body">
                <div className="d-title">Paste the Job Description</div>
                <p className="d-desc">Copy the full job posting from any board. Include <strong>everything</strong> — requirements, responsibilities, and company info for best results.</p>
                <div className="d-ui">
                  <div className="d-job">
                    <div className="d-logo">G</div>
                    <div>
                      <div className="d-job-title">Senior Software Engineer — Google</div>
                      <div className="d-job-meta">Requirements: 5+ yrs, Python, React, AWS, Docker, Kubernetes…</div>
                      <div className="d-job-chip">347 words detected · Ready to analyse</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection>
            <div className="d-step">
              <div className="d-step-num">3</div>
              <div className="d-body">
                <div className="d-title">AI Analyses Everything in 30 Seconds</div>
                <p className="d-desc">Our AI reads your resume, parses the job, and compares across <strong>50+ parameters</strong> — keywords, skills, experience, education.</p>
                <div className="d-ui">
                  <div className="d-steps">
                    {ANALYSIS_STEPS.map((s, i) => (
                      <div className={`das ${s.done ? "done" : "loading"}`} key={i}>
                        {s.done ? <Check size={16} strokeWidth={2.5} style={{ flexShrink:0 }} /> : <SpinIco />}
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>

          <RevealSection>
            <div className="d-step" style={{ borderColor:"rgba(16,185,129,.4)" }}>
              <div className="d-step-num gr-step4">4</div>
              <div className="d-body">
                <div className="d-title">Get Your Match Score + Actionable Insights</div>
                <p className="d-desc">Instantly see your <strong>match percentage</strong>, what's strong, what's missing, and <strong>exactly what to add</strong> to boost your score.</p>
                <div className="d-ui" style={{ background:"var(--white)" }}>
                  <div className="result-score-card">
                    <div className="rsc-row">
                      <span className="rsc-label">Your Match Score</span>
                      <span className="rsc-score">87%</span>
                    </div>
                    <div className="rsc-bar"><div className="rsc-fill" /></div>
                    <div className="rsc-hint">✦ Strong match — you should apply!</div>
                  </div>
                  <div className="r-items">
                    <div className="r-item ok">
                      <CheckCircle size={16} color="#10b981" style={{ flexShrink:0, marginTop:1 }} />
                      <div><div className="r-title">Strong technical skills match</div><div className="r-desc">Python, React, AWS found in your resume</div></div>
                    </div>
                    <div className="r-item ok">
                      <CheckCircle size={16} color="#10b981" style={{ flexShrink:0, marginTop:1 }} />
                      <div><div className="r-title">Experience level aligned</div><div className="r-desc">You have 6 years, they need 5+</div></div>
                    </div>
                    <div className="r-item warn">
                      <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink:0, marginTop:1 }} />
                      <div><div className="r-title">Missing keyword: "Kubernetes"</div><div className="r-desc">Add this to increase your match to 92%</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </div>

        <RevealSection>
          <div style={{ textAlign:"center", marginTop:48 }}>
            <button className="btn-hero-p" onClick={() => onNavigate("/upload")}>
              Try It Now <ArrowIco size={16} />
            </button>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── FEATURES ─────────────── */
function Features({ onNavigate }) {
  return (
    <section id="features" className="section feats-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>Powerful Features</SectionLabel>
          <h2 className="sh">Everything you need<br />to <span className="g">land the job.</span></h2>
          <p className="sp">One platform. All the tools. Zero guesswork.</p>
        </RevealSection>
        <RevealSection delay={0.1}>
          <div className="feats-grid">
            {FEATURES.map((f) => (
              <div className="feat-card" key={f.title}>
                <div className="feat-head">
                  <div className="feat-icon"><f.Icon size={24} strokeWidth={1.8} style={{ color:"#7c3aed" }} /></div>
                  <span className="feat-chip">{f.chip}</span>
                </div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
                {f.slug
                  ? <button className="feat-cta" onClick={() => onNavigate(`/features/${f.slug}`)}>Read More <ArrowIco size={14} /></button>
                  : <div className="feat-always"><Lock size={12} style={{ display:"inline", marginRight:4 }} />Always Enabled</div>
                }
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── COMPARISON ─────────────── */
function Comparison() {
  return (
    <section className="section cmp-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>Why JobMorph</SectionLabel>
          <h2 className="sh">vs. the <span className="g">old way</span></h2>
          <p className="sp">See exactly why job seekers switch to JobMorph.</p>
        </RevealSection>
        <RevealSection delay={0.1}>
          <div className="cmp-wrap">
            <div className="cmp-head">
              <div className="cmp-hc">Feature</div>
              <div className="cmp-hc">Manual Review</div>
              <div className="cmp-hc hl">JobMorph AI ✦</div>
            </div>
            {CMP_ROWS.map((r) => (
              <div className="cmp-row" key={r.label}>
                <div className="cmp-c fn">
                  <r.Icon size={15} strokeWidth={2} style={{ flexShrink:0, color:"#7c3aed" }} />
                  {r.label}
                </div>
                <div className="cmp-c">{r.manual}</div>
                <div className="cmp-c hl">{r.jm}</div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── USE CASES ─────────────── */
function UseCases({ onNavigate }) {
  return (
    <section id="use-cases" className="section uc-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>Who It's For</SectionLabel>
          <h2 className="sh">Built for everyone<br /><span className="g">hunting jobs.</span></h2>
          <p className="sp">Whether you're starting out or switching careers — JobMorph has you covered.</p>
        </RevealSection>
        <div className="uc-grid">
          {USE_CASES.map((u, i) => (
            <RevealSection key={u.title} delay={i * 0.08}>
              <div className="uc-card" style={{ height:"100%" }}>
                <span className="uc-icon"><u.Icon size={28} strokeWidth={1.6} style={{ color:"#7c3aed" }} /></span>
                <div className="uc-title">{u.title}</div>
                <div className="uc-desc">{u.desc}</div>
              </div>
            </RevealSection>
          ))}
        </div>
        <RevealSection>
          <div style={{ textAlign:"center", marginTop:48 }}>
            <button className="btn-hero-p" onClick={() => onNavigate("/upload")}>
              Get Started <ArrowIco size={16} />
            </button>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── PRICING ─────────────── */
function PricingCard({ children, featured = false }) {
  return <div className={`p-card ${featured ? "feat" : ""}`}>{children}</div>;
}
function PFeature({ label }) {
  return (
    <li className="p-fi">
      <div className="p-fi-ico"><CheckIco size={10} /></div>
      {label}
    </li>
  );
}
function Pricing({ onNavigate }) {
  return (
    <section id="pricing" className="section price-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>Pricing</SectionLabel>
          <h2 className="sh">Simple. Transparent.<br /><span className="g">No catch.</span></h2>
          <p className="sp">Start free. No credit card required.</p>
        </RevealSection>
        <RevealSection delay={0.1}>
          <div className="price-grid">
            <PricingCard>
              <div className="p-plan">Free Plan</div>
              <div className="p-price"><span className="p-amt">$0</span><span className="p-per">/ forever</span></div>
              <div className="p-desc">Everything you need to start — no strings attached.</div>
              <ul className="p-feats">{FREE_FEATURES.map((f) => <PFeature key={f} label={f} />)}</ul>
              <button className="btn-price main" onClick={() => onNavigate("/signup")}>Get Started Free</button>
            </PricingCard>
            <PricingCard featured>
              <div className="p-tag">Coming Soon</div>
              <div className="p-plan">Premium Plan</div>
              <div className="p-price">
                <span className="p-amt" style={{ background:"var(--grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>$9</span>
                <span className="p-per">/ month</span>
              </div>
              <div className="p-desc">Advanced tools for serious job seekers.</div>
              <ul className="p-feats">{PREMIUM_FEATURES.map((f) => <PFeature key={f} label={f} />)}</ul>
              <button className="btn-price dis" disabled>Coming Soon</button>
            </PricingCard>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── FAQ ─────────────── */
function FAQ() {
  return (
    <section className="section faq-bg">
      <div className="si">
        <RevealSection>
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="sh">Frequently asked<br /><span className="g">questions.</span></h2>
        </RevealSection>
        <RevealSection delay={0.1}>
          <div className="faq-grid">
            {FAQS.map((f) => (
              <div className="faq-item" key={f.q}>
                <div className="faq-q">
                  <HelpCircle size={15} strokeWidth={2} style={{ display:"inline", marginRight:7, color:"#7c3aed", flexShrink:0, verticalAlign:"middle" }} />
                  {f.q}
                </div>
                <div className="faq-a">{f.a}</div>
              </div>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── NEWSLETTER ─────────────── */
function Newsletter() {
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = () => { if (email && email.includes("@")) setSubmitted(true); };

  return (
    <section className="section nl-bg">
      <div className="si">
        <RevealSection>
          <div className="nl-box">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:8 }}>
              <Rocket size={22} color="white" strokeWidth={1.8} />
              <h2 className="nl-title" style={{ margin:0 }}>Stay Updated</h2>
            </div>
            <p className="nl-sub">Resume tips, job search advice, and early access to new features.</p>
            {!submitted ? (
              <div className="nl-form">
                <input type="email" className="nl-in" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                <button className="nl-btn" onClick={handleSubmit}>Subscribe</button>
              </div>
            ) : (
              <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:15,fontWeight:700,color:"rgba(255,255,255,.8)",padding:"14px 24px",border:"2px solid rgba(255,255,255,.2)",borderRadius:12,maxWidth:280,margin:"0 auto" }}>
                <CheckCircle size={18} color="rgba(255,255,255,.8)" /> Thanks for subscribing!
              </div>
            )}
            <p className="nl-note" style={{ marginTop:14 }}>We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── FINAL CTA ─────────────── */
function FinalCTA({ onNavigate }) {
  return (
    <section className="fcta">
      <div className="fcta-inner">
        <RevealSection>
          <h2 className="fcta-title">Your next job starts<br /><span className="g">right here.</span></h2>
          <p className="fcta-sub">
            No more guessing. No more wasted applications.<br />
            Know your match score before you apply.
          </p>
          <div className="fcta-btns">
            <button className="btn-hero-p" style={{ padding:"16px 32px", fontSize:16 }} onClick={() => onNavigate("/upload")}>
              Analyse My Resume <ArrowIco size={17} />
            </button>
            <button className="btn-hero-s" onClick={() => { const el = document.getElementById("how-it-works"); if (el) el.scrollIntoView({ behavior:"smooth" }); }}>
              See How It Works
            </button>
          </div>
          <p className="fcta-note">
            No credit card<span style={{ margin:"0 8px", opacity:.5 }}>·</span>
            No spam<span style={{ margin:"0 8px", opacity:.5 }}>·</span>
            Results in 30 seconds
          </p>
        </RevealSection>
      </div>
    </section>
  );
}

/* ─────────────── FOOTER ─────────────── */
function Footer({ onNavigate }) {
  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:"smooth" }); };

  return (
    <footer className="jm-footer">
      <div className="ft-in">
        <div className="ft-top">

          {/* ── Brand ── */}
          <div>
            <button className="logo" onClick={() => onNavigate("/")} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10,padding:0 }}>
              <div className="logo-ico"><Sparkles size={18} color="white" strokeWidth={2} /></div>
              <span className="logo-text" style={{ background:"linear-gradient(135deg,#a78bfa,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text" }}>JOBMORPH</span>
            </button>
            <p className="ft-logo-text">AI-powered resume analysis helping<br />job seekers match their skills with<br />perfect opportunities.</p>
            <div className="ft-socials">
              {[{ label:"𝕏", title:"Twitter" },{ label:"in", title:"LinkedIn" },{ label:"gh", title:"GitHub" }].map((s) => (
                <a key={s.label} className="ft-soc" title={s.title} onClick={(e) => e.preventDefault()}>{s.label}</a>
              ))}
            </div>
          </div>

          {/* ── PRODUCT — view only, no click, no hover, no navigation ── */}
          <div>
            <div className="ft-col-h">Product</div>
            <div className="ft-links">
              {FOOTER_PRODUCT_LABELS.map((label) => (
                <span
                  key={label}
                  style={{
                    display:        "block",
                    fontSize:       "14px",
                    color:          "var(--muted, #6b7280)",
                    padding:        "5px 0",
                    cursor:         "default",
                    userSelect:     "none",
                    pointerEvents:  "none",   /* completely dead to mouse */
                    lineHeight:     1.6,
                    fontWeight:     400,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Company ── */}
          <div>
            <div className="ft-col-h">Company</div>
            <div className="ft-links">
              {[{ label:"About Us", path:"/about" },{ label:"Contact", path:"/contact" },{ label:"Blog", path:"#" },{ label:"Careers", path:"#" }].map(({ label, path }) => (
                <button key={label} className="ft-link-btn" onClick={() => path !== "#" ? onNavigate(path) : null}>{label}</button>
              ))}
            </div>
          </div>

          {/* ── Support ── */}
          <div>
            <div className="ft-col-h">Support</div>
            <div className="ft-links">
              <a href="mailto:support@jobmorph.com" className="ft-link">
                <Mail size={12} style={{ display:"inline", marginRight:5, verticalAlign:"middle" }} />
                support@jobmorph.com
              </a>
              {[{ label:"Help Center", path:"/help" },{ label:"Privacy Policy", path:"/privacy" },{ label:"Terms of Service", path:"#" }].map(({ label, path }) => (
                <button key={label} className="ft-link-btn" onClick={() => path !== "#" ? onNavigate(path) : null}>{label}</button>
              ))}
            </div>
          </div>

        </div>

        <div className="ft-bottom">
          <span>©️ {new Date().getFullYear()} JobMorph. All rights reserved.</span>
          <div className="ft-bl">
            {["Privacy","Terms","Cookies"].map((l) => (
              <a key={l} href="#" onClick={(e) => e.preventDefault()}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────── PROGRESS BAR ─────────────── */
function ProgressBar() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const h = () => {
      const d = document.documentElement;
      setWidth((d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100);
    };
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div id="jm-pbar" style={{ width:`${width}%` }} />;
}

/* ─────────────── ROOT ─────────────── */
export default function LandingPage() {
  const navigateHook = useNavigate();
  const navigate = (path) => navigateHook(path);

  return (
    <div className="jm-landing">
      <ProgressBar />
      <Navbar        onNavigate={navigate} />
      <Hero          onNavigate={navigate} />
      <Marquee />
      <ProblemSolution />
      <HowItWorks    onNavigate={navigate} />
      <Demo          onNavigate={navigate} />
      <Features      onNavigate={navigate} />
      <Comparison />
      <UseCases      onNavigate={navigate} />
      <Pricing       onNavigate={navigate} />
      <FAQ />
      <Newsletter />
      <FinalCTA      onNavigate={navigate} />
      <Footer        onNavigate={navigate} />
    </div>
  );
}