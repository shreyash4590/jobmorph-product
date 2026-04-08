import React, { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";

/* ─── Spinner ─── */
const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
    className="auth-spinner">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M4 12a8 8 0 018-8" stroke="#fff"/>
  </svg>
);

/* ─── Field error icon ─── */
const ErrIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="#ef4444" style={{ flexShrink:0, marginTop:"1px" }}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
  </svg>
);

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const ForgotPasswordPage = () => {
  const [email, setEmail]                   = useState("");
  const [sentTo, setSentTo]                 = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [resendLoading, setResendLoading]   = useState(false);
  const [resendSuccess, setResendSuccess]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate    = useNavigate();
  const cooldownRef = React.useRef(null);

  /* ── Send / resend handler ── */
  const sendReset = async (targetEmail) => {
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      return true;
    } catch (err) {
      console.error("Reset error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Unable to send reset email. Please try again later.");
      }
      return false;
    }
  };

  /* ── Initial form submit ── */
  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your registered email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const ok = await sendReset(trimmedEmail);
    setLoading(false);
    if (ok) setSentTo(trimmedEmail);
  };

  /* ── Resend cooldown ── */
  const startCooldown = (secs) => {
    setResendCooldown(secs);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  /* ── Resend link click ── */
  const handleResend = async () => {
    if (resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setResendSuccess(false);
    setError("");
    const ok = await sendReset(sentTo);
    setResendLoading(false);
    if (ok) {
      setResendSuccess(true);
      startCooldown(60);
    }
  };

  const onKey = (e) => e.key === "Enter" && !loading && handleReset(e);

  /* ════════════════════════════════════════
     SUCCESS STATE
  ════════════════════════════════════════ */
  if (sentTo) {
    return (
      <div className="fp-page">
        <div className="fp-bg-blob fp-blob-1"/>
        <div className="fp-bg-blob fp-blob-2"/>
        <div className="fp-bg-blob fp-blob-3"/>

        <div className="fp-wrap">

          {/* Brand */}
          <div className="fp-brand-row">
            <div className="fp-logo-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            </div>
            <span className="fp-brand-name">JOBMORPH</span>
          </div>

          {/* ── Success Card ── */}
          <div className="fp-success-card">

            <h2 className="fp-success-title">Check your email</h2>

            <p className="fp-success-body">
              A link to reset your password has been sent to{" "}
              <strong className="fp-success-email">{sentTo}</strong>.
            </p>

            <p className="fp-success-body">
              If you do not receive the email, check that it's the email address
              you used to sign up for your JobMorph account.
            </p>

            <p className="fp-success-body">
              Be sure to check your spam folder, too.
            </p>

            {/* Resend */}
            <p className="fp-resend-row">
              Didn't receive the link?{" "}
              {resendCooldown > 0 ? (
                <span className="fp-resend-cooldown">
                  {resendSuccess ? "Sent! " : ""}Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="fp-resend-btn"
                >
                  {resendLoading ? "Sending…" : "Send again"}
                </button>
              )}
              {!resendCooldown && "."}
            </p>

            {/* Inline error */}
            {error && (
              <div className="fp-inline-error">
                <ErrIcon/><span>{error}</span>
              </div>
            )}

            <div className="fp-divider"/>

            {/* ── Need Help → opens /contact page ── */}
            <Link to="/contact" className="fp-help-link-box">
              <div className="fp-help-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="#7c3aed" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="fp-help-link-text">
                <div className="fp-help-title">Need help?</div>
                <p className="fp-help-text">Contact our support team for assistance.</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="#7c3aed" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>

            <div className="fp-divider"/>

            {/* Back to login */}
            <Link to="/login" className="fp-back-link">
              <ArrowLeft size={14}/> Back to Login
            </Link>

          </div>
          {/* ── End Success Card ── */}

        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     FORM STATE
  ════════════════════════════════════════ */
  return (
    <div className="fp-page">
      <div className="fp-bg-blob fp-blob-1"/>
      <div className="fp-bg-blob fp-blob-2"/>
      <div className="fp-bg-blob fp-blob-3"/>

      <div className="fp-wrap">

        {/* Brand */}
        <div className="fp-brand-row">
          <div className="fp-logo-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
          </div>
          <span className="fp-brand-name">JOBMORPH</span>
        </div>

        {/* Mail icon */}
        <div className="fp-icon-wrap">
          <div className="fp-icon-box">
            <Mail size={28} color="#fff"/>
          </div>
        </div>

        <h2 className="fp-title">Forgot Password?</h2>
        <p className="fp-sub">
          Enter your registered email and we'll send<br/>you a reset link right away.
        </p>

        <form onSubmit={handleReset} className="fp-form">

          <div className="fp-field">
            <label className="fp-label">Email Address</label>
            <div className="fp-input-wrap">
              <span className="fp-input-icon"><Mail size={16}/></span>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={onKey}
                disabled={loading}
                className="fp-input"
              />
            </div>
            {error && (
              <div className="fp-field-error">
                <ErrIcon/><span>{error}</span>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="fp-btn">
            {loading ? <><Spinner/> Sending…</> : <><Send size={16}/> Send Reset Link</>}
          </button>

        </form>

        <div className="fp-back-row">
          <Link to="/login" className="fp-back-link">
            <ArrowLeft size={14}/> Back to Login
          </Link>
        </div>

        {/* Static help tip on form state */}
        <div className="fp-help-box">
          <div className="fp-help-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#7c3aed" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div className="fp-help-title">Need help?</div>
            <p className="fp-help-text">
              If you don't receive the email within a few minutes, check your spam folder.
            </p>
          </div>
        </div>

        <p className="fp-signup-row">
          Don't have an account?{" "}
          <Link to="/signup" className="fp-signup-link">Sign up</Link>
        </p>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
