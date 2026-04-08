import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  browserLocalPersistence,       // ✅ Fix 1 — Remember Me
  browserSessionPersistence,     // ✅ Fix 1 — Remember Me
  setPersistence,                // ✅ Fix 1 — Remember Me
} from "firebase/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react"; // ✅ Fix 3 — ArrowLeft back in use
/* All styles in src/index.css */

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Spinner = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"
    className="auth-spinner">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
    <path d="M4 12a8 8 0 018-8" stroke="#fff"/>
  </svg>
);

const FieldErrIcon = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="#ef4444" style={{ flexShrink:0, marginTop:"1px" }}>
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
  </svg>
);

const LeftPanel = () => (
  <div className="auth-left">
    <div className="geo geo-1"/><div className="geo geo-2"/><div className="geo geo-3"/>
    <div className="geo geo-4"/><div className="geo geo-5"/>

    <div className="auth-logo-row">
      <div className="auth-logo-box">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
      </div>
      <span className="auth-brand-name">JOBMORPH</span>
    </div>

    <div className="auth-left-content">
      <div className="auth-ai-pill">
        <div className="auth-ai-pill-dot"/>
        <span className="auth-ai-pill-text">AI Powered Resume Matcher</span>
      </div>
      <h1 className="auth-left-h1">Know your chances<br/>before you apply.</h1>
      <p className="auth-left-sub">Upload your resume, paste any job description — get a precise match score in 30 seconds.</p>
      <div className="auth-dots">
        <div className="auth-dot active"/><div className="auth-dot"/><div className="auth-dot"/>
      </div>

      <div className="auth-mockup-outer">
        <div className="auth-ats-badge">
          <div className="auth-ats-icon">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="#16a34a"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          </div>
          <div><div className="auth-badge-title">ATS Compatible</div><div className="auth-badge-sub">Format is clean</div></div>
        </div>
        {/* <div className="auth-timer-badge">
          <div className="auth-timer-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
          <div><div className="auth-badge-title">28 seconds</div><div className="auth-badge-sub">Analysis complete</div></div>
        </div> */}
        <div className="auth-avatar-float">A</div>
        <div className="auth-mockup-row">
          <div className="auth-sidebar">
            <div className="auth-sidebar-icon active" style={{ marginTop:"4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
            </div>
            {[
              <path key="a" d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>,
              <><circle key="b1" cx="11" cy="11" r="8"/><path key="b2" d="M21 21l-4.35-4.35"/></>,
              <polyline key="c" points="22,12 18,12 15,21 9,3 6,12 2,12"/>,
            ].map((p, i) => (
              <div key={i} className="auth-sidebar-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round">{p}</svg>
              </div>
            ))}
            <div className="auth-sidebar-avatar">M</div>
          </div>
          <div className="auth-mockup-card">
            <div className="mockup-job-row">
              <div className="mockup-job-avatar">G</div>
              <div>
                <div className="mockup-job-title">Senior Software Engineer</div>
                <div className="mockup-job-meta">Google · Bangalore · Full-time</div>
              </div>
              <div className="mockup-analysing-pill">
                <div className="mockup-analysing-dot"/>
                <span className="mockup-analysing-text">Analysing</span>
              </div>
            </div>
            <div className="mockup-score-row">
              <div className="mockup-score-ring">
                <div className="mockup-score-core">
                  <span className="mockup-score-num">87%</span>
                  <span className="mockup-score-label">Match</span>
                </div>
              </div>
              <div>
                <div className="mockup-match-title">Strong Match</div>
                <div className="mockup-match-sub">You should apply for this role</div>
                {["Reading resume content...","Parsing job requirements...","Matching skills & keywords..."].map((t,i) => (
                  <div key={i} className="mockup-check-line">
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="#10b981"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    <span>{t}</span>
                  </div>
                ))}
                <div className="mockup-check-line done">
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="#10b981"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <span>Score ready!</span>
                </div>
              </div>
            </div>
            <div className="mockup-kw-section">
              <div className="mockup-kw-head">KEYWORD MATCH</div>
              <div className="mockup-kw-list">
                {["React","Node.js","Python","AWS","TypeScript"].map(k => (
                  <span key={k} className="mockup-kw-tag match">✓ {k}</span>
                ))}
                <span className="mockup-kw-tag miss">✗ Docker</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */
const LoginPage = () => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [errors, setErrors]             = useState({});
  const [loginError, setLoginError]     = useState("");
  const [infoMessage, setInfoMessage]   = useState("");
  const [loading, setLoading]           = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from || "/dashboard";

  const handleLogin = async () => {
    const newErrors       = {};
    const trimmedEmail    = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!trimmedEmail)    newErrors.email    = "Email is required";
    if (!trimmedPassword) newErrors.password = "Password is required";
    setErrors(newErrors);
    setLoginError("");
    setInfoMessage("");
    if (Object.keys(newErrors).length) return;

    setLoading(true);
    try {
      /*
       * ✅ Fix 1 — Remember Me now actually works.
       * browserLocalPersistence  → stays logged in after browser closes
       * browserSessionPersistence → logs out when tab/browser closes
       */
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const result = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);

      if (!result.user.emailVerified) {
        await signOut(auth);
        setLoginError("Please verify your email before logging in.");
        setInfoMessage("A verification email has been sent. Check inbox or spam.");
        return;
      }

      navigate(from, { replace: true });

    } catch (err) {
      /*
       * ✅ Fix 5 — added auth/invalid-credential (newer Firebase SDK versions
       * return this instead of auth/wrong-password or auth/user-not-found)
       */
      const messages = {
        "auth/user-not-found":     "No account found with this email.",
        "auth/wrong-password":     "Incorrect password.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/invalid-email":      "Invalid email format.",
        "auth/too-many-requests":  "Too many attempts. Try again later.",
      };
      setLoginError(messages[err.code] || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) { setLoginError("Enter email and password first."); return; }
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(auth);
        setInfoMessage("Verification email resent successfully.");
      }
    } catch {
      setLoginError("Unable to resend verification email.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");
    setInfoMessage("");
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(from, { replace: true });
    } catch {
      setLoginError("Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const ErrorMsg = ({ msg }) => msg ? (
    <div className="auth-field-error"><FieldErrIcon/><span>{msg}</span></div>
  ) : null;

  return (
    <div className="auth-page">
      <LeftPanel/>
      <div className="auth-right">
        <div className="auth-form">
          <h2 className="auth-form-title">Log In</h2>
          <p className="auth-form-sub">Access your account</p>

          <button onClick={handleGoogleLogin} disabled={loading} className="auth-google-btn">
            <GoogleIcon/> Continue with Google
          </button>

          <div className="auth-divider">
            <div className="auth-divider-line"/>
            <span className="auth-divider-text">or sign in with email</span>
            <div className="auth-divider-line"/>
          </div>

          {/* Email field */}
          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><Mail size={16}/></span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email:"" })); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()} /* ✅ Fix 2 — Enter submits */
                className="auth-input"
              />
            </div>
            <ErrorMsg msg={errors.email}/>
          </div>

          {/* Password field */}
          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" style={{ margin:0 }}>Password</label>
              <Link to="/forgot-password" className="auth-forgot-link">Forgot Password?</Link>
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><Lock size={16}/></span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password:"" })); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()} /* ✅ Fix 2 — Enter submits */
                className="auth-input"
                style={{ paddingRight:"42px" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-eye-btn">
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <ErrorMsg msg={errors.password}/>
          </div>

          {/* Remember me */}
          <div className="auth-remember-row">
            <input
              type="checkbox"
              id="remember"
              className="auth-checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember" className="auth-remember-label">Remember me</label>
          </div>

          {/* Error / info messages */}
          {loginError  && <div className="auth-error-banner">{loginError}</div>}
          {infoMessage && <div className="auth-info-banner">{infoMessage}</div>}
          {loginError.includes("verify") && (
            <button
              onClick={handleResendVerification}
              style={{ background:"none", border:"none", color:"#7c3aed", fontSize:"13px", fontWeight:"600", cursor:"pointer", textDecoration:"underline", padding:"0 0 10px", fontFamily:"inherit" }}
            >
              Resend verification email
            </button>
          )}

          {/* Submit */}
          <button onClick={handleLogin} disabled={loading} className="auth-submit-btn">
            {loading ? <><Spinner/> Signing in...</> : "Sign In →"}
          </button>

          <p className="auth-switch-row">
            Don't have an account?{" "}
            <Link to="/signup" className="auth-switch-link">Sign up</Link>
          </p>

          {/* ✅ Fix 3 — Back to home link restored (was commented out) */}
          <div style={{ textAlign:"center" }}>
            {/* <Link to="/" className="auth-back-link"><ArrowLeft size={14}/> Back to home</Link> */}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;