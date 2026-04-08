import React, { useEffect, useState, useMemo, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, limit, getDocs,
} from "firebase/firestore";
import {
  Users,
  Monitor,
  Target,
  FileText,
  Phone,
  Wrench,
  Handshake,
  PartyPopper,
  CheckCircle2,
  Lightbulb,
  Timer,
  Star,
  RefreshCw,
  Map,
  Briefcase,
  Copy,
  Check,
  AlertCircle,
  Inbox,
  X,
  Mic,
  Sparkles,
  Info,
} from "lucide-react";

/* ─── Loading steps ─────────────────────────────────── */
const LOADING_STEPS = [
  "Verifying your account",
  "Loading your job description",
  "Analysing role requirements",
  "Crafting HR questions",
  "Generating technical questions",
  "Building scenario questions",
  "Building your interview roadmap",
];

/* ─── Loading screen ─────────────────────────────────── */
function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase]             = useState("entering");
  const [progress, setProgress]       = useState(0);
  const [dots, setDots]               = useState("");

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (phase === "entering") { const t = setTimeout(() => setPhase("active"), 50); return () => clearTimeout(t); }
    if (phase === "active")   { const t = setTimeout(() => setPhase("leaving"), 1400); return () => clearTimeout(t); }
    if (phase === "leaving")  {
      const t = setTimeout(() => {
        if (currentStep < LOADING_STEPS.length - 1) { setCurrentStep(s => s + 1); setPhase("entering"); }
        else setPhase("done");
      }, 450);
      return () => clearTimeout(t);
    }
  }, [phase, currentStep]);

  useEffect(() => {
    const target = Math.min(((currentStep + 1) / LOADING_STEPS.length) * 100, phase === "done" ? 100 : 95);
    const t = setInterval(() => {
      setProgress(p => { if (p >= target) { clearInterval(t); return p; } return Math.min(p + 1.2, target); });
    }, 35);
    return () => clearInterval(t);
  }, [currentStep, phase]);

  const pct      = Math.round(progress);
  const isDone   = phase === "done";
  const isLeaving = phase === "leaving";
  const label    = isDone ? "All done! Questions ready." : LOADING_STEPS[currentStep];

  return (
    <div className="ipl-page">
      <div className="ipl-wrap">
        <div className="ipl-header">
          <div className="ipl-icon">
            {/* Keep original SVG — part of brand identity, not a content emoji */}
            <svg className="ipl-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
          </div>
          <span className="ipl-title">Interview Prep</span>
          <span className="ipl-pct">{pct}%</span>
        </div>
        <p className="ipl-sub">{isDone ? "Your questions are ready!" : `${label}${dots}`}</p>
        <div className="ipl-track"><div className="ipl-fill" style={{ width:`${progress}%` }} /></div>
        <div className="ipl-step-row">
          <div className={`ipl-dot ${isDone ? "ipl-dot--done" : "ipl-dot--active"}`} />
          <span className={`ipl-step-label ${isLeaving ? "ipl-step-label--leaving" : phase === "entering" ? "ipl-step-label--entering" : "ipl-step-label--visible"}`}>
            {label}
          </span>
          <span className={`ipl-step-status ${isDone ? "ipl-status--done" : "ipl-status--active"}`}>
            {isDone ? "ready" : isLeaving ? "done" : "generating..."}
          </span>
        </div>
        <p className="ipl-counter">
          {isDone ? `${LOADING_STEPS.length} of ${LOADING_STEPS.length}` : `${currentStep + 1} of ${LOADING_STEPS.length}`}
        </p>
        <p className="ipl-footer">Usually takes 10–20 seconds · Please don't close this tab</p>
      </div>
    </div>
  );
}

/* ─── Tab config — Lucide icons replace emojis ──────── */
const TAB_CFG = {
  hr: {
    Icon:     Users,
    label:    "HR Round",
    desc:     "Behavioural & soft skills",
    border:   "#3b82f6",
    pillBg:   "rgba(59,130,246,0.08)",
    pillText: "#2563eb",
    tabGrad:  "linear-gradient(135deg,#3b82f6,#2563eb)",
  },
  technical: {
    Icon:     Monitor,
    label:    "Technical",
    desc:     "Technical knowledge",
    border:   "#7c3aed",
    pillBg:   "rgba(124,58,237,0.08)",
    pillText: "#6d28d9",
    tabGrad:  "linear-gradient(135deg,#9333ea,#7c3aed)",
  },
  scenario: {
    Icon:     Target,
    label:    "Scenario",
    desc:     "Real-world problem solving",
    border:   "#10b981",
    pillBg:   "rgba(16,185,129,0.08)",
    pillText: "#059669",
    tabGrad:  "linear-gradient(135deg,#10b981,#059669)",
  },
};

/* ─── Stage icons — Lucide icons replace emoji array ── */
const STAGE_ICONS = [FileText, Monitor, Phone, Target, Wrench, Handshake, PartyPopper];
const getStageIcon = (i) => {
  const Icon = STAGE_ICONS[i] ?? CheckCircle2;
  return <Icon size={16} strokeWidth={1.8} />;
};

/* ─── Tips config — Lucide icons replace emojis ─────── */
const TIPS = [
  {
    Icon: Target,
    title: "STAR Method",
    body:  "Situation · Task · Action · Result",
  },
  {
    Icon: Timer,
    title: "1–2 minutes",
    body:  "Keep answers concise",
  },
  {
    Icon: Lightbulb,
    title: "Be specific",
    body:  "Use real examples always",
  },
  {
    Icon: Info,
    title: "Tip",
    body:  "Use the Refresh button in the navbar to regenerate new questions anytime.",
  },
];

/* ─── Question card ──────────────────────────────────── */
function QuestionCard({ question, index, tabKey, isPracticed, isCopied, onCopy, onPractice }) {
  const cfg = TAB_CFG[tabKey];
  const key = `${tabKey}-${index}`;

  return (
    <div
      className={`ip-qcard ${isPracticed ? "ip-qcard--practiced" : ""}`}
      style={{ borderLeftColor: isPracticed ? "#10b981" : cfg.border }}
    >
      <div
        className="ip-qcard-num"
        style={{
          background: isPracticed ? "rgba(16,185,129,0.1)" : cfg.pillBg,
          color:      isPracticed ? "#10b981" : cfg.pillText,
        }}
      >
        {isPracticed
          ? <Check size={13} strokeWidth={2.5} />
          : index + 1
        }
      </div>

      <div className="ip-qcard-body">
        <p className="ip-qcard-text">{question}</p>

        <div className="ip-qcard-actions">
          {/* Copy button */}
          <button
            onClick={() => onCopy(question, index)}
            className={`ip-qcard-btn ${isCopied ? "ip-qcard-btn--copied" : ""}`}
          >
            {isCopied
              ? <><Check size={11} strokeWidth={2.5} />Copied!</>
              : <><Copy size={11} strokeWidth={2} />Copy</>
            }
          </button>

          <span className="ip-qcard-sep" />

          {/* Mark as practiced button */}
          <button
            onClick={() => onPractice(key)}
            className={`ip-qcard-btn ${isPracticed ? "ip-qcard-btn--done" : "ip-qcard-btn--practice"}`}
          >
            <Check size={11} strokeWidth={2.5} />
            {isPracticed ? "Practiced" : "Mark as Practiced"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */
const InterviewPrep = () => {
  const [questions, setQuestions]           = useState({ hr: [], technical: [], scenario: [] });
  const [interviewProcess, setInterviewProcess] = useState(null);
  const [jobRole, setJobRole]               = useState("");
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [activeTab, setActiveTab]           = useState("hr");
  const [refreshing, setRefreshing]         = useState(false);
  const [copiedIndex, setCopiedIndex]       = useState(null);
  const [practicedQuestions, setPracticedQuestions] = useState(new Set());
  const [showProcessModal, setShowProcessModal]     = useState(false);

  const handleCopyQuestion = useCallback((text, i) => {
    navigator.clipboard.writeText(text)
      .then(() => { setCopiedIndex(i); setTimeout(() => setCopiedIndex(null), 2000); })
      .catch(() => alert("Failed to copy"));
  }, []);

  const handleMarkAsPracticed = useCallback((key) => {
    setPracticedQuestions(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }, []);

  const extractJobRole = useCallback((jd) => {
    if (!jd) return "";
    const patterns = [
      /(?:position|role|title)[:\s]+([^\n,.(]{3,50})/i,
      /(?:job title|job role)[:\s]+([^\n,.(]{3,50})/i,
    ];
    for (const p of patterns) {
      const m = jd.match(p);
      if (m?.[1]) {
        const role = m[1].trim();
        if (role.length <= 50 && !/\b(who|that|and|with|can|will)\b/i.test(role)) return role;
      }
    }
    const first = jd.split("\n")[0].trim();
    if (first.length > 0 && first.length <= 45 && /^[A-Z]/.test(first)) return first;
    return "";
  }, []);

  const fetchInterviewPrep = useCallback(async (user) => {
    try {
      setError("");
      const q = query(
        collection(db, "resume_analysis"),
        where("user_id", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error("Job Description not found. Please analyze a resume first.");
      const data   = snapshot.docs[0].data();
      const jdText = (data.jd_text || "").trim();
      if (!jdText || jdText.length < 50) throw new Error("Job Description text is missing or too short.");
      setJobRole(extractJobRole(jdText));
      const token = await user.getIdToken(true);
      const res   = await fetch("/api/interview-prep", {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ jd_text: jdText }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed to fetch interview questions.");
      if (!json.questions) throw new Error("Invalid response from server.");
      setQuestions({
        hr:        json.questions.hr        || [],
        technical: json.questions.technical || [],
        scenario:  json.questions.scenario  || [],
      });
      if (json.interview_process) setInterviewProcess(json.interview_process);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [extractJobRole]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setError("You must be logged in."); setLoading(false); return; }
      fetchInterviewPrep(user);
    });
    return () => unsub();
  }, [fetchInterviewPrep]);

  const handleRefresh = useCallback(() => {
    const user = auth.currentUser;
    if (user) { setRefreshing(true); fetchInterviewPrep(user); }
  }, [fetchInterviewPrep]);

  const getCompanyTypeLabel = (t) =>
    ({ tech_giant: "Tech Giant", startup: "Startup", general: "General Company" }[t] ?? "Company");

  const currentQuestions = useMemo(() => questions[activeTab] || [], [questions, activeTab]);
  const totalQuestions   = useMemo(() =>
    (questions.hr?.length || 0) + (questions.technical?.length || 0) + (questions.scenario?.length || 0),
    [questions]
  );
  const practicedCount = useMemo(() =>
    [...practicedQuestions].filter(k => k.startsWith(activeTab)).length,
    [practicedQuestions, activeTab]
  );

  /* ── Loading state ── */
  if (loading) return <LoadingScreen />;

  /* ── Error state ── */
  if (error) return (
    <div className="ip-error-page">
      <div className="ip-error-card">
        <div className="ip-error-icon">
          <AlertCircle size={22} strokeWidth={2} />
        </div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={() => window.location.href = "/upload"}>Upload Resume &amp; JD</button>
      </div>
    </div>
  );

  const cfg = TAB_CFG[activeTab];

  return (
    <div className="ip-root">

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <header className="ip-nav">
        <div className="ip-nav-inner">

          {/* Brand */}
          <div className="ip-nav-brand">
            <div className="ip-nav-logo">
              <Mic size={15} strokeWidth={2.2} />
            </div>
            <span className="ip-nav-name">Interview Prep</span>
            {/* <span className="ip-nav-ai">
              <Sparkles size={10} strokeWidth={2} style={{ display:"inline", marginRight:3 }} />
              AI
            </span> */}
          </div>

          {/* Job role badge */}
          {jobRole && (
            <div className="ip-nav-role">
              <Briefcase size={10} strokeWidth={2} />
              <span>{jobRole}</span>
            </div>
          )}

          {/* Nav actions */}
          <div className="ip-nav-actions">
            {interviewProcess && (
              <button onClick={() => setShowProcessModal(true)} className="ip-nav-btn ip-nav-btn--primary">
                <Map size={12} strokeWidth={2} />
                Roadmap
              </button>
            )}
            <button onClick={handleRefresh} disabled={refreshing} className="ip-nav-btn ip-nav-btn--ghost">
              <RefreshCw size={12} strokeWidth={2} className={refreshing ? "ip-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* ══ MAIN LAYOUT ═════════════════════════════════════ */}
      <div className="ip-layout">

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="ip-sidebar">
          <div className="ip-sidebar-summary">
            <p className="ip-sidebar-total"><span>{totalQuestions}</span></p>
            <p className="ip-sidebar-total-label">Total Questions</p>
            {jobRole && <p className="ip-sidebar-role">{jobRole}</p>}
          </div>

          <nav className="ip-sidebar-nav">
            {["hr", "technical", "scenario"].map(type => {
              const c        = TAB_CFG[type];
              const isActive = activeTab === type;
              const practiced = [...practicedQuestions].filter(k => k.startsWith(type)).length;
              const total    = questions[type]?.length || 0;

              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`ip-scard ${isActive ? "ip-scard--active" : ""}`}
                  style={isActive ? { borderColor: c.border, background: c.pillBg } : {}}
                >
                  <div className="ip-scard-row">
                    {/* Lucide icon replaces emoji */}
                    <span className="ip-scard-emoji">
                      <c.Icon size={18} strokeWidth={1.8} style={{ color: isActive ? c.border : "#9ca3af" }} />
                    </span>
                    <div className="ip-scard-info">
                      <span className="ip-scard-label">{c.label}</span>
                      <span className="ip-scard-desc">{c.desc}</span>
                    </div>
                    <span className="ip-scard-count" style={{ color: isActive ? c.border : "#9ca3af" }}>{total}</span>
                  </div>

                  {practiced > 0 && total > 0 && (
                    <div className="ip-scard-prog">
                      <div className="ip-scard-prog-fill" style={{ width:`${(practiced / total) * 100}%`, background: c.border }} />
                    </div>
                  )}
                  {practiced > 0 && (
                    <p className="ip-scard-practiced-label">{practiced}/{total} practiced</p>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Tips panel */}
          <div className="ip-sidebar-tips">
            <p className="ip-sidebar-tips-hd">
              <Lightbulb size={11} strokeWidth={2} />
              Tips
            </p>
            {TIPS.map((tip, i) => (
              <div key={i} className="ip-stip">
                <tip.Icon size={14} strokeWidth={1.8} style={{ flexShrink:0, color:"#7c3aed" }} />
                <div>
                  <p>{tip.title}</p>
                  <p>{tip.body}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Questions area ─────────────────────────────────── */}
        <main className="ip-content">

          {/* Panel header */}
          <div className="ip-panel-hd">
            <div className="ip-panel-hd-left">
              <div className="ip-panel-icon" style={{ background: cfg.pillBg }}>
                <cfg.Icon size={20} strokeWidth={1.8} style={{ color: cfg.border }} />
              </div>
              <div>
                <h2 className="ip-panel-title">{cfg.label} Questions</h2>
                <p className="ip-panel-sub">
                  {practicedCount > 0
                    ? `${practicedCount} of ${currentQuestions.length} practiced`
                    : cfg.desc
                  }
                </p>
              </div>
            </div>
            <div className="ip-panel-hd-right">
              {practicedCount > 0 && (
                <span className="ip-panel-prog-pill">
                  <Check size={9} strokeWidth={2.5} />
                  {Math.round((practicedCount / currentQuestions.length) * 100)}%
                </span>
              )}
              <span className="ip-panel-total">{currentQuestions.length} total</span>
            </div>
          </div>

          {practicedCount > 0 && (
            <div className="ip-prog-track">
              <div className="ip-prog-fill" style={{ width:`${(practicedCount / currentQuestions.length) * 100}%` }} />
            </div>
          )}

          {currentQuestions.length > 0 ? (
            <div className="ip-qlist">
              {currentQuestions.map((q, i) => (
                <QuestionCard
                  key={`${activeTab}-${i}`}
                  question={q}
                  index={i}
                  tabKey={activeTab}
                  isPracticed={practicedQuestions.has(`${activeTab}-${i}`)}
                  isCopied={copiedIndex === i}
                  onCopy={handleCopyQuestion}
                  onPractice={handleMarkAsPracticed}
                />
              ))}
            </div>
          ) : (
            <div className="ip-empty">
              <div className="ip-empty-icon">
                <Inbox size={20} strokeWidth={2} />
              </div>
              <p>No {activeTab} questions yet</p>
              <button onClick={handleRefresh}>Generate Questions</button>
            </div>
          )}
        </main>
      </div>

      {/* ══ ROADMAP MODAL ═══════════════════════════════════ */}
      {showProcessModal && interviewProcess && (
        <div className="ip-overlay" onClick={e => e.target === e.currentTarget && setShowProcessModal(false)}>
          <div className="ip-modal">
            <div className="ip-modal-hd">
              <div className="ip-modal-hd-bar" />
              <div className="ip-modal-hd-row">
                <div className="ip-modal-hd-left">
                  <div className="ip-modal-hd-icon">
                    <Map size={14} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="ip-modal-hd-title">Interview Roadmap</p>
                    <p className="ip-modal-hd-sub">
                      {interviewProcess.company_name} · {getCompanyTypeLabel(interviewProcess.company_type)}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowProcessModal(false)} className="ip-modal-close">
                  <X size={12} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="ip-modal-body">
              <div className="ip-modal-stages">
                <div className="ip-modal-line" />
                {interviewProcess.stages.map((stage, idx) => (
                  <div key={idx} className="ip-mstage">
                    <div className="ip-mstage-icon">{getStageIcon(idx)}</div>
                    <div className="ip-mstage-card">
                      <div className="ip-mstage-top">
                        <p className="ip-mstage-name">{stage.stage}</p>
                        <span className="ip-mstage-dur">{stage.duration}</span>
                      </div>
                      <p className="ip-mstage-desc">{stage.description}</p>
                      <div className="ip-mstage-tips">
                        <p>
                          <Star size={11} strokeWidth={2} style={{ display:"inline", marginRight:4, color:"#f59e0b" }} />
                          Pro Tips
                        </p>
                        <ul>
                          {stage.tips.map((tip, ti) => (
                            <li key={ti}><span>·</span>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal footer */}
              <div className="ip-modal-foot">
                <CheckCircle2 size={14} strokeWidth={2} style={{ color:"#10b981", flexShrink:0 }} />
                <div>
                  <p>You've Got This!</p>
                  <p>Stay confident and prepare thoroughly. Every round is a chance to shine.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;