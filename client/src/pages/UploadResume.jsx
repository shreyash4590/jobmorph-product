import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Upload, FileText, Briefcase, Sparkles, CheckCircle2,
  ArrowRight, X, AlertCircle, Scan, Zap, Target, Shield,
} from 'lucide-react';

// ── Retry helper: retries on 502/503/504 up to `maxRetries` times ──
const axiosWithRetry = async (config, maxRetries = 3, delayMs = 2000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios(config);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const shouldRetry =
        status === 502 || status === 503 || status === 504 ||
        err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED';
      if (!shouldRetry || attempt === maxRetries) throw err;
      await new Promise((res) => setTimeout(res, delayMs * attempt));
    }
  }
  throw lastError;
};

function UploadResume() {
  const [resume,       setResume]       = useState(null);
  const [jobDesc,      setJobDesc]      = useState('');
  const [jdFile,       setJdFile]       = useState(null);
  const [step,         setStep]         = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [retryCount,   setRetryCount]   = useState(0);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [dragActive,   setDragActive]   = useState(false);
  const [dragActiveJd, setDragActiveJd] = useState(false);
  const [error,        setError]        = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  /* ── Error Modal ─────────────────────────────────────── */
  const ErrorModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #fce7f3, #ede9fe)" }}>
            <AlertCircle size={16} style={{ color: "#e91e8c" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Upload Error</h3>
            <p className="text-gray-500 text-xs whitespace-pre-line leading-relaxed">{message}</p>
          </div>
        </div>
        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #e91e8c 0%, #7c3aed 100%)" }}>
          Got it
        </button>
      </div>
    </div>
  );

  /* ── Validation ──────────────────────────────────────── */
  const validateJobDescription = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return { valid: false, message: "Job description cannot be empty." };
    if (trimmed.length < 100) return { valid: false, message: "Job description is too short. Please paste the complete job posting (minimum 100 characters)." };
    if (trimmed.replace(/[\s\n\r\t]/g, '').length < 50) return { valid: false, message: "Job description doesn't contain enough meaningful content." };
    return { valid: true };
  };

  /* ── Get fresh Firebase token ────────────────────────── */
  const getFreshToken = async (user) => {
    try {
      return await user.getIdToken(true);
    } catch (err) {
      console.error('Token refresh failed:', err);
      throw new Error('SESSION_EXPIRED');
    }
  };

  /* ── Force sign-out and redirect on dead session ─────── */
  const handleAuthError = useCallback(async () => {
    try {
      await signOut(getAuth());
    } catch (_) {}
    navigate('/login', { state: { from: '/upload', reason: 'session_expired' } });
  }, [navigate]);

  /* ── Build FormData ──────────────────────────────────── */
  const buildFormData = useCallback((resume, jdFile, jobDesc) => {
    const fd = new FormData();
    fd.append('resume', resume);
    if (jdFile) {
      fd.append('jd', jdFile);
    } else {
      fd.append('jd', new File([new Blob([jobDesc], { type: 'text/plain' })], 'job_description.txt'));
    }
    return fd;
  }, []);

  /* ── Analyze ─────────────────────────────────────────── */
  const handleAnalyze = useCallback(async () => {
    setError(null);
    setRetryCount(0);

    if (!resume) { setError('Please upload your resume first.'); return; }
    if (!jdFile && !jobDesc.trim()) { setError('Please provide a job description (paste text or upload file).'); return; }
    if (!jdFile && jobDesc.trim()) {
      const v = validateJobDescription(jobDesc);
      if (!v.valid) { setError(v.message); return; }
    }
    if (!currentUser) {
      navigate('/login', { state: { from: '/upload', pendingRedirect: true } });
      return;
    }

    setLoading(true);
    try {
      const idToken = await getFreshToken(currentUser);

      const response = await axiosWithRetry(
        {
          method: 'post',
          url: '/api/upload',
          data: buildFormData(resume, jdFile, jobDesc),
          headers: { Authorization: `Bearer ${idToken}` },
          timeout: 90000,
        },
        3,
        2000
      );

      const data = response.data;
      if (!data.valid || !data.doc_id) {
        setError(data.message || 'Upload failed. Please try again.');
        return;
      }
      navigate(`/resultpage/${data.doc_id}`);

    } catch (err) {
      console.error('Upload error:', err);

      if (err.message === 'SESSION_EXPIRED') {
        await handleAuthError();
        return;
      }

      const status  = err.response?.status;
      const message = err.response?.data?.message || '';

      if (status === 401) {
        await handleAuthError();
        return;
      }
      if (status === 502 || status === 503 || status === 504) {
        setError('The server is temporarily unavailable (all 3 attempts failed).\n\nThis is usually a temporary issue. Please wait 30 seconds and try again.');
      } else if (status === 400) {
        setError(message || 'Invalid file or data. Please check your files and try again.');
      } else if (status === 413) {
        setError('File is too large. Please reduce the file size and try again.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. The server is taking too long to respond. Please try again.');
      } else {
        setError(message || 'Something went wrong. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
      setRetryCount(0);
    }
  }, [resume, jobDesc, jdFile, currentUser, navigate, handleAuthError, buildFormData]);

  /* ── File handlers ───────────────────────────────────── */
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) { setError('Invalid resume format. Only PDF and DOCX files are allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Resume file is too large. Maximum size is 10MB.'); return; }
    if (file.size < 1024) { setError('Resume file is too small or empty.'); return; }
    if (jdFile && jdFile.name === file.name && jdFile.size === file.size) { setError('Resume and Job Description cannot be the same file.'); return; }
    setResume(file); setStep(2);
  };

  const handleJdFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(null);
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) { setError('Invalid JD format. Only PDF, DOCX, and TXT files are allowed.'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('Job Description file is too large. Maximum size is 15MB.'); return; }
    if (file.size < 100) { setError('Job Description file is too small or empty.'); return; }
    if (resume && resume.name === file.name && resume.size === file.size) { setError('Resume and Job Description cannot be the same file.'); return; }
    setJdFile(file); setJobDesc('');
  };

  const handleJobDescChange = (e) => {
    setJobDesc(e.target.value);
    if (e.target.value.trim()) setJdFile(null);
    setError(null);
  };

  const handleDrag = (e, isJd = false) => {
    e.preventDefault(); e.stopPropagation();
    const active = e.type === "dragenter" || e.type === "dragover";
    isJd ? setDragActiveJd(active) : setDragActive(active);
  };

  const handleDrop = (e, isJd = false) => {
    e.preventDefault(); e.stopPropagation();
    isJd ? setDragActiveJd(false) : setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const fake = { target: { files: [e.dataTransfer.files[0]] } };
      isJd ? handleJdFileUpload(fake) : handleResumeUpload(fake);
    }
  };

  /* ── Loading label ───────────────────────────────────── */
  const loadingLabel = retryCount > 0
    ? `Retrying… (attempt ${retryCount + 1} of 3)`
    : 'Analysing Your Resume...';

  /* ════════════════════════════════════════════════════════
     UI — compact mobile-first layout from new design
  ════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-gray-50 flex flex-col px-4 py-4 md:px-6 md:py-4">
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}

      {/* ══ HEADING SECTION ══════════════════════════════════ */}
      <div className="mb-4 text-center flex-shrink-0">

        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
          style={{ background: "linear-gradient(135deg, #fce7f3, #ede9fe)" }}>
          <Sparkles size={12} style={{ color: "#e91e8c" }} />
          <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>AI-Powered Resume Analysis</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black mb-2 bg-clip-text text-transparent leading-tight"
          style={{ backgroundImage: "linear-gradient(135deg, #e91e8c 0%, #7c3aed 100%)" }}>
          Upload &amp; Analyse Your Resume
        </h1>

        {/* Step indicators — compact on mobile */}
        <div className="flex items-center justify-center mt-4 px-2">
          {[
            { num: 1, label: "Resume",  shortLabel: "Resume",  icon: Upload,       done: !!resume },
            { num: 2, label: "Add JD",  shortLabel: "Add JD",  icon: Briefcase,    done: !!(jobDesc.trim() || jdFile) },
            { num: 3, label: "Results", shortLabel: "Results", icon: CheckCircle2, done: false },
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shadow-sm transition-all duration-300"
                  style={s.done
                    ? { background: "linear-gradient(135deg, #e91e8c, #7c3aed)", color: "#fff", boxShadow: "0 4px 14px rgba(233,30,140,0.3)" }
                    : i === 0 && !resume
                    ? { background: "linear-gradient(135deg, #fce7f3, #ede9fe)", color: "#9333ea", border: "2px solid #d8b4fe" }
                    : { background: "#f3f4f6", color: "#9ca3af" }}
                >
                  {s.done ? <CheckCircle2 size={15} /> : <s.icon size={13} />}
                </div>
                <div className="text-center">
                  <span className="text-[10px] sm:text-xs font-bold block"
                    style={{ color: s.done ? "#7c3aed" : i === 0 && !resume ? "#9333ea" : "#9ca3af" }}>
                    Step {s.num}
                  </span>
                  <span className="hidden sm:block text-xs font-semibold whitespace-nowrap"
                    style={{ color: s.done ? "#4b5563" : i === 0 && !resume ? "#6b7280" : "#d1d5db" }}>
                    {s.label}
                  </span>
                  <span className="block sm:hidden text-[10px] font-semibold whitespace-nowrap"
                    style={{ color: s.done ? "#4b5563" : i === 0 && !resume ? "#6b7280" : "#d1d5db" }}>
                    {s.shortLabel}
                  </span>
                </div>
              </div>
              {i < 2 && (
                <div className="flex-1 mx-1 sm:mx-3 mb-5 h-px rounded-full transition-all duration-500"
                  style={{
                    background: s.done ? "linear-gradient(90deg, #e91e8c, #7c3aed)" : "#e5e7eb",
                    minWidth: "20px", maxWidth: "80px",
                  }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══ TWO COLUMN PANELS — stack on mobile ═════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">

        {/* ── LEFT: Resume Upload ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-shrink-0">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #fce7f3, #ede9fe)" }}>
              <FileText size={15} style={{ color: "#9333ea" }} />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-800">Your Resume</p>
              <p className="text-xs text-gray-400">PDF or DOCX · Max 10MB</p>
            </div>
            {resume && (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} /> Uploaded
              </span>
            )}
          </div>

          <div className="flex-1 p-3 min-h-0">
            <div
              className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer h-full min-h-[160px] md:min-h-0 flex items-center justify-center ${
                dragActive
                  ? 'border-purple-400 bg-purple-50'
                  : resume
                  ? 'border-green-300 bg-green-50/60'
                  : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/30'
              }`}
              onDragEnter={(e) => handleDrag(e, false)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDragOver={(e) => handleDrag(e, false)}
              onDrop={(e) => handleDrop(e, false)}
            >
              <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

              {resume ? (
                <div className="text-center px-4">
                  <div className="w-11 h-11 mx-auto mb-2 rounded-2xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 size={22} className="text-green-600" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm mb-0.5 truncate max-w-[200px] mx-auto">{resume.name}</p>
                  <p className="text-xs text-gray-400 mb-3">{(resume.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setResume(null); setStep(1); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              ) : (
                <div className="text-center px-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #fce7f3, #ede9fe)" }}>
                    <Upload size={20} style={{ color: "#9333ea" }} />
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Drag & drop your resume</p>
                  <p className="text-xs text-gray-400 mb-3">or click anywhere to browse</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #e91e8c, #7c3aed)" }}>
                    <Upload size={11} /> Choose File
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Job Description ────────────────────────── */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col transition-opacity duration-300 ${step >= 2 || resume ? 'opacity-100' : 'opacity-50'}`}>
          <div className="px-4 sm:px-5 py-3 border-b border-gray-50 flex items-center gap-3 flex-shrink-0">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #fce7f3, #ede9fe)" }}>
              <Briefcase size={15} style={{ color: "#9333ea" }} />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-800">Job Description</p>
              <p className="text-xs text-gray-400">Paste text or upload a file</p>
            </div>
            {(jobDesc.trim() || jdFile) && (
              <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} /> Ready
              </span>
            )}
          </div>

          <div className="flex-1 p-3 flex flex-col gap-2.5 min-h-0 overflow-hidden">
            <textarea
              value={jobDesc}
              onChange={handleJobDescChange}
              disabled={!resume}
              placeholder="Paste the full job description here — include responsibilities, requirements, and qualifications (min. 100 characters)..."
              className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all resize-none focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-50 disabled:cursor-not-allowed disabled:opacity-60 min-h-[120px] md:min-h-0"
            />

            {jobDesc.trim().length > 0 && (
              <p className={`text-xs font-medium -mt-1 ${jobDesc.trim().length >= 100 ? 'text-green-600' : 'text-orange-500'}`}>
                {jobDesc.trim().length} / 100 min
                {jobDesc.trim().length < 100 && ` · ${100 - jobDesc.trim().length} more needed`}
              </p>
            )}

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">or upload as file</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* JD file drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-3 flex-shrink-0 transition-all duration-200 ${
                dragActiveJd
                  ? 'border-purple-400 bg-purple-50'
                  : jdFile
                  ? 'border-green-300 bg-green-50/60'
                  : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/30'
              }`}
              onDragEnter={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, true)}
              onDragOver={(e) => handleDrag(e, true)}
              onDrop={(e) => handleDrop(e, true)}
            >
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleJdFileUpload}
                disabled={!resume}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />

              {jdFile ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={13} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-xs truncate">{jdFile.name}</p>
                    <p className="text-xs text-gray-400">{(jdFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setJdFile(null); }}
                    className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors group">
                    <X size={13} className="text-gray-400 group-hover:text-red-500" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #fce7f3, #ede9fe)" }}>
                    <Upload size={13} style={{ color: "#9333ea" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Upload JD file</p>
                    <p className="text-xs text-gray-400">PDF, DOCX, or TXT · Max 15MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══ ANALYZE BUTTON ═══════════════════════════════════ */}
      <div className="mt-3 flex-shrink-0">
        <button
          onClick={handleAnalyze}
          disabled={loading || !resume || (!jobDesc.trim() && !jdFile)}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-pink-200 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          style={{ background: "linear-gradient(135deg, #e91e8c 0%, #7c3aed 100%)" }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {loadingLabel}
            </>
          ) : (
            <>
              <Scan size={15} />
              Start AI Analysis
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        {/* Info chips */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 mt-2 flex-wrap">
          {[
            { icon: Zap,    text: "Results in seconds"   },
            { icon: Target, text: "Precision AI scoring" },
            { icon: Shield, text: "Data stays private"   },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1">
              <Icon size={11} style={{ color: "#9333ea" }} />
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UploadResume;