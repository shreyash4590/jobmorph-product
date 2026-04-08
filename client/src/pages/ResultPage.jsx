// src/pages/ResultPage.jsx
// ⚠️  NO SidebarLayout — App.jsx already wraps this page.

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import html2pdf from 'html2pdf.js';
import {
  FileText, Lightbulb, AlertCircle, CheckCircle, Download, Link2,
  Target, Clock, BarChart3, Brain, RefreshCw, XCircle, AlertTriangle,
  Briefcase, GraduationCap, Code, Mail, ArrowLeft, FileCheck,
  TrendingUp, Zap, ChevronRight, Home, Scan, Star, Award,
  ArrowUpRight, RotateCcw, BookOpen, Layers, Activity
} from 'lucide-react';

/* ─────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────── */
/* ─────────────────────────────────────────
   SKILL DOMAIN MAP — mirrors verify_cert.py
   Used to allow same cert for same-domain skills
───────────────────────────────────────── */
const clamp    = (v, lo = 0, hi = 100) => Math.min(Math.max(v, lo), hi);
const scoreHex = (s) => s >= 85 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626';
const scoreBg  = (s) => s >= 85 ? '#f0fdf4' : s >= 60 ? '#fffbeb' : '#fef2f2';
const scoreBdr = (s) => s >= 85 ? '#bbf7d0' : s >= 60 ? '#fde68a' : '#fecaca';
const scoreLbl = (s) => s >= 85 ? 'Strong'  : s >= 60 ? 'Fair'   : 'Weak';
const gradeOf  = (s) => s >= 90 ? 'A+' : s >= 85 ? 'A' : s >= 75 ? 'B+' : s >= 65 ? 'B' : s >= 55 ? 'C' : 'D';

const overallMeta = (s) =>
  s >= 85 ? { label:'Excellent Match', accent:'#16a34a', soft:'#f0fdf4', ring:'#bbf7d0', ringHex:'#16a34a' }
: s >= 70 ? { label:'Good Match',      accent:'#2563eb', soft:'#eff6ff', ring:'#bfdbfe', ringHex:'#2563eb' }
: s >= 50 ? { label:'Fair Match',      accent:'#d97706', soft:'#fffbeb', ring:'#fde68a', ringHex:'#d97706' }
:           { label:'Needs Work',      accent:'#dc2626', soft:'#fef2f2', ring:'#fecaca', ringHex:'#dc2626' };

/* ─────────────────────────────────────────
   MINI COMPONENTS (screen)
───────────────────────────────────────── */
const Bar = ({ value, h = 6 }) => (
  <div style={{ height:h, background:'#f1f5f9', borderRadius:99, overflow:'hidden', flex:1 }}>
    <div style={{ height:'100%', width:`${value}%`, background:scoreHex(value), borderRadius:99, transition:'width 1.1s cubic-bezier(.4,0,.2,1)' }} />
  </div>
);

const Pill = ({ score }) => (
  <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.05em', padding:'3px 9px', borderRadius:99, background:scoreBg(score), color:scoreHex(score), border:`1px solid ${scoreBdr(score)}` }}>
    {scoreLbl(score).toUpperCase()}
  </span>
);

const Divider = () => <div style={{ height:1, background:'#f1f5f9', margin:'4px 0' }} />;

const Btn = ({ onClick, children, style = {} }) => (
  <button onClick={onClick} style={{ display:'inline-flex', alignItems:'center', gap:7, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'opacity .15s', ...style }}
    onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
    {children}
  </button>
);

/* ─────────────────────────────────────────
   PDF REPORT COMPONENT (hidden off-screen)
   This is what actually gets exported.
───────────────────────────────────────── */
function PDFReport({ result, score, grade, meta, sections, hasMKW, hasTips }) {
  const scoreColor = scoreHex(score);
  const pct = score;

  return (
    <div style={{
      fontFamily: 'Arial, Helvetica, sans-serif',
      background: '#ffffff',
      color: '#1a1a1a',
      padding: '32px 36px',
      width: '190mm',
      boxSizing: 'border-box',
      fontSize: 13,
      lineHeight: 1.6,
    }}>

      {/* ── Header ── */}
      <div style={{ borderBottom:'3px solid #2563eb', paddingBottom:20, marginBottom:28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'#fff', fontWeight:900, fontSize:18 }}>J</span>
              </div>
              <span style={{ fontSize:22, fontWeight:900, color:'#2563eb', letterSpacing:'-0.5px' }}>JobMorph</span>
            </div>
            <p style={{ fontSize:11, color:'#64748b', margin:0 }}>AI-Powered Resume Analysis Report</p>
            <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>Generated on {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0, marginLeft:24 }}>
            <div style={{ fontSize:48, fontWeight:900, color:scoreColor, lineHeight:1 }}>{score}</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Overall Score</div>
            <div style={{ display:'inline-block', marginTop:6, padding:'4px 12px', borderRadius:99, background:scoreBg(score), color:scoreColor, border:`1px solid ${scoreBdr(score)}`, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
              Grade {grade} · {meta?.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Resume + JD info ── */}
      <div style={{ display:'flex', gap:16, marginBottom:20 }}>
        <div style={{ flex:1, background:'#f8fafc', borderRadius:10, padding:'14px 18px', border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Resume</div>
          <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{result?.resume_name || 'Resume'}</div>
        </div>
        <div style={{ flex:1, background:'#f8fafc', borderRadius:10, padding:'14px 18px', border:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 }}>Target Role / JD</div>
          <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{result?.jd_name || 'Job Description'}</div>
        </div>
      </div>

      {/* ── Score bar ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>Match Score</span>
          <span style={{ fontWeight:800, fontSize:13, color:scoreColor }}>{score}%</span>
        </div>
        <div style={{ height:12, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:scoreColor, borderRadius:99 }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
          <span style={{ fontSize:10, color:'#94a3b8' }}>0 — Needs Work</span>
          <span style={{ fontSize:10, color:'#94a3b8' }}>100 — Perfect</span>
        </div>
      </div>

      {/* ── Section scores ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #e2e8f0' }}>Section Scores</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              <th style={{ textAlign:'left', padding:'8px 12px', fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', borderBottom:'1px solid #e2e8f0' }}>SECTION</th>
              <th style={{ textAlign:'left', padding:'8px 12px', fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', borderBottom:'1px solid #e2e8f0', width:'45%' }}>PROGRESS</th>
              <th style={{ textAlign:'right', padding:'8px 12px', fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', borderBottom:'1px solid #e2e8f0' }}>SCORE</th>
              <th style={{ textAlign:'right', padding:'8px 12px', fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', borderBottom:'1px solid #e2e8f0' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((sec, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding:'7px 12px', fontSize:12, fontWeight:600, color:'#1e293b', borderBottom:'1px solid #f1f5f9' }}>{sec.title}</td>
                <td style={{ padding:'7px 12px', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ height:7, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${sec.score}%`, background:scoreHex(sec.score), borderRadius:99 }} />
                  </div>
                </td>
                <td style={{ padding:'7px 12px', textAlign:'right', fontWeight:800, fontSize:14, color:'#0f172a', borderBottom:'1px solid #f1f5f9' }}>{sec.score}</td>
                <td style={{ padding:'7px 12px', textAlign:'right', borderBottom:'1px solid #f1f5f9' }}>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:99, background:scoreBg(sec.score), color:scoreHex(sec.score), border:`1px solid ${scoreBdr(sec.score)}` }}>
                    {scoreLbl(sec.score).toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Missing Keywords ── */}
      {hasMKW && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #e2e8f0' }}>
            Missing Keywords ({result.gemini_missing_keywords.length})
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {result.gemini_missing_keywords.map((kw, i) => (
              <span key={i} style={{
                padding:'5px 14px', borderRadius:99,
                border:'1px solid #fecaca', background:'#fef2f2',
                fontSize:11, fontWeight:600, color:'#991b1b',
              }}>● {kw}</span>
            ))}
          </div>
          <p style={{ fontSize:11, color:'#94a3b8', marginTop:10 }}>
            💡 Add these keywords naturally into your resume to improve your match score.
          </p>
        </div>
      )}

      {/* ── AI Suggestions ── */}
      {hasTips && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#0f172a', marginBottom:14, paddingBottom:8, borderBottom:'1px solid #e2e8f0' }}>
            AI Recommendations ({result.gemini_suggestions.length})
          </div>
          {result.gemini_suggestions.map((tip, i) => (
            <div key={i} style={{ display:'flex', gap:12, marginBottom:8, padding:'10px 14px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', flexShrink:0, marginTop:1 }}>
                {i + 1}
              </div>
              <p style={{ fontSize:12, color:'#334155', lineHeight:1.7, margin:0 }}>{tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ borderTop:'2px solid #e2e8f0', paddingTop:16, marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <span style={{ fontSize:11, fontWeight:700, color:'#2563eb' }}>JobMorph</span>
          <span style={{ fontSize:11, color:'#94a3b8' }}> · AI Resume Analysis</span>
        </div>
        <span style={{ fontSize:10, color:'#94a3b8' }}>resumeapp-482804.uc.r.appspot.com</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function ResultPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const reportRef = useRef();   // screen content (for display only)
  const pdfRef    = useRef();   // hidden PDF-ready content

  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [copied,    setCopied]    = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [checklist, setChecklist] = useState({});

  // ── Certificate verification state ──────────────────────────
  const [verifiedSkills,  setVerifiedSkills]  = useState({});   // { "RAG pipelines": { issuer, date } }
  const [verifyingSkill,  setVerifyingSkill]  = useState(null); // which skill panel is open
  const [certUrl,         setCertUrl]         = useState('');
  const [courseName,      setCourseName]      = useState('');
  const [verifyLoading,   setVerifyLoading]   = useState(false);
  const [verifyResult,    setVerifyResult]    = useState(null); // { success, message, issuer, date }

  const handleVerifyCert = useCallback(async (skill) => {
    if (!certUrl.trim()) {
      setVerifyResult({ success: false, message: 'Please paste a certificate URL first.' });
      return;
    }

    // ── Smart URL reuse check ─────────────────────────────────────
    // Same URL CAN verify multiple skills IF they are in the same domain
    // e.g. IBM AI badge → open-source LLMs ✅ then RAG pipelines ✅ (both ai_ml)
    // But IBM AI badge → open-source LLMs ✅ then Django ❌ (different domain)
    const urlKey       = certUrl.trim().toLowerCase();
    const existingUse  = Object.values(verifiedSkills).find(v => v.urlKey === urlKey);

    if (existingUse) {
      // URL already used — block reuse entirely
      // Backend Gemini will handle relevance per-skill
      // One certificate = one skill to keep verification honest
      setVerifyResult({
        success: false,
        message: `This certificate was already used to verify "${existingUse.skill}". Please use a different certificate for this skill.`
      });
      return;
    }

    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const { getAuth } = await import('firebase/auth');
      const user = getAuth().currentUser;
      if (!user) { setVerifyResult({ success: false, message: 'Please log in again.' }); return; }
      const token     = await user.getIdToken(true);
      const userEmail = (user.email || '').toLowerCase().trim();
      const userName  = (user.displayName || '').toLowerCase().trim();

      const urlLower = certUrl.trim().toLowerCase();
      let pageText   = '';
      let badgeData  = null;

      {

      // ─────────────────────────────────────────────────────────────
      // FETCH HELPER — proxy with 3 fallbacks + 2 retries each
      // ─────────────────────────────────────────────────────────────
      const proxyFetch = async (targetUrl) => {
        const proxies = [
          u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
          u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
          u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        ];
        for (const makeProxy of proxies) {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const pr = await fetch(makeProxy(targetUrl), { signal: AbortSignal.timeout(10000) });
              if (!pr.ok) continue;
              // allorigins returns JSON with contents field
              const ct = pr.headers.get('content-type') || '';
              if (ct.includes('application/json')) {
                const j = await pr.json().catch(() => null);
                if (j?.contents && j.contents.length > 100) return j.contents;
              }
              // codetabs / corsproxy return raw HTML
              const txt = await pr.text().catch(() => '');
              if (txt && txt.length > 100) return txt;
            } catch (e) {
              if (attempt === 1) console.warn(`Proxy failed [${makeProxy(targetUrl).slice(0,40)}]:`, e.message);
              await new Promise(r => setTimeout(r, 800)); // wait before retry
            }
          }
        }
        return '';
      };

      // Strip HTML helper
      const stripHtml = (html) => html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ').trim().slice(0, 3000);

      // ── CREDLY ───────────────────────────────────────────────────
      if (urlLower.includes('credly.com/badges/')) {
        const m = certUrl.match(/credly\.com\/badges\/([a-f0-9\-]{20,})/i);
        if (!m) {
          setVerifyResult({ success: false, message: 'Invalid Credly URL. Expected: credly.com/badges/<id>' });
          return;
        }
        const badgeId      = m[1];
        const badgePageUrl = `https://www.credly.com/badges/${badgeId}`;
        const pageHtml     = await proxyFetch(badgePageUrl);

        if (!pageHtml || pageHtml.length < 50) {
          setVerifyResult({ success: false, message: 'Could not reach Credly right now. Please wait a moment and try again.' });
          return;
        }

        let bname = '', rname = '', issuer = 'Credly', date = '';

        // og:title → "Shreyash Shinde - Getting Started with AI | Credly"
        const ogT = pageHtml.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/) ||
                    pageHtml.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/);
        if (ogT?.[1]) {
          const parts = ogT[1].split(' - ');
          if (parts.length >= 2) {
            rname = parts[0].trim().toLowerCase();
            bname = parts.slice(1).join(' - ').replace(/\|.*$/, '').trim();
          } else {
            bname = ogT[1].replace(/\|.*$/, '').trim();
          }
        }

        // JSON-LD for issuer + date
        const ldMatch = pageHtml.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/);
        if (ldMatch?.[1]) {
          try {
            const ld = JSON.parse(ldMatch[1]);
            if (!bname) bname = ld.name || ld.award?.name || '';
            if (!rname) rname = (ld.recipient?.name || ld.person?.name || '').toLowerCase();
            issuer = ld.issuer?.name || ld.provider?.name || 'Credly';
            date   = (ld.dateCreated || ld.datePublished || '').slice(0, 10);
          } catch (e) {}
        }

        // title tag fallback
        if (!bname) {
          const tMatch = pageHtml.match(/<title>([^<]+)<\/title>/);
          if (tMatch?.[1]) bname = tMatch[1].replace(/\|.*$/, '').replace(/Credly/gi, '').trim();
        }

        // Ownership check
        if (rname && userName) {
          const uFirst = userName.split(' ')[0].toLowerCase();
          const uLast  = userName.split(' ').slice(-1)[0].toLowerCase();
          const ok     = rname.includes(uFirst) || rname.includes(uLast) || uFirst.includes(rname.split(' ')[0]);
          if (!ok) {
            setVerifyResult({ success: false, message: `This badge belongs to "${rname}". Please use your own certificate.` });
            return;
          }
        }

        if (!bname) {
          setVerifyResult({ success: false, message: 'Could not read badge name. Please try again in a moment.' });
          return;
        }

        badgeData = { bname, rname, issuer, date, skills: '', recip: '', pageText: stripHtml(pageHtml) };
      }

      // ── COURSERA / UDEMY / GOOGLE / IBM / edX / others ───────────
      else if (!urlLower.includes('linkedin.com')) {
        // For ude.my short URLs — they redirect to udemy.com
        // proxy fetch handles redirects automatically
        const html = await proxyFetch(certUrl.trim());
        if (html && html.length > 100) {
          pageText = stripHtml(html);
        } else {
          // Proxy failed — still send URL to backend, Gemini will do best effort
          console.warn('Page fetch failed for:', certUrl);
        }
      }

      } // ── end else (not same-domain reuse) ──

      // For Credly, pageText is stored inside badgeData.pageText
      const finalPageText = pageText || (badgeData && badgeData.pageText) || '';

      const res = await fetch('/api/verify-certificate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ url: certUrl.trim(), skill, page_text: finalPageText, badge_data: badgeData, course_name: courseName.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVerifyResult({ success: false, message: data.error || 'Verification failed. Please try again.' });
        return;
      }

      if (data.is_valid) {
        setVerifiedSkills(prev => ({
          ...prev,
          [skill]: {
            issuer:   data.issuer,
            date:     data.date,
            skill:    data.skill,
            certName: data.skill,   // store actual cert name for same-domain reuse
            urlKey,
          }
        }));
        setVerifyResult({ success: true, message: `Verified! ${data.skill || skill} from ${data.issuer || 'recognised platform'}.` });
        setCertUrl('');
        setCourseName('');
        setTimeout(() => { setVerifyingSkill(null); setVerifyResult(null); }, 2000);
      } else {
        setVerifyResult({ success: false, message: data.reason || 'Could not verify this certificate.' });
      }
    } catch (err) {
      setVerifyResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setVerifyLoading(false);
    }
  }, [certUrl, verifiedSkills]);

  const openVerifyPanel = useCallback((skill) => {
    setVerifyingSkill(prev => prev === skill ? null : skill);
    setCertUrl('');
    setCourseName('');
    setVerifyResult(null);
  }, []);

  useEffect(() => {
    if (!id) { navigate('/dashboard'); return; }
    let cancelled = false;
    const docRef  = doc(db, 'resume_analysis', id);
    const tid = setTimeout(() => {
      if (!cancelled) { setError('No result found. Please try again.'); setLoading(false); }
    }, 12000);
    const unsub = onSnapshot(docRef, { includeMetadataChanges: true }, (snap) => {
      if (cancelled) return;
      const fromServer = !snap.metadata.fromCache || snap.metadata.hasPendingWrites === false;
      if (snap.exists() && fromServer) {
        setResult({ ...snap.data(), id: snap.id });
        setError(null); setLoading(false); clearTimeout(tid);
      }
    }, () => { if (!cancelled) { setError('Failed to load. Please refresh.'); setLoading(false); clearTimeout(tid); } });
    return () => { cancelled = true; clearTimeout(tid); unsub?.(); };
  }, [id, navigate]);

  /* ── Derived ── */
  const score   = typeof result?.gemini_score === 'number' ? clamp(result.gemini_score) : null;
  const hasMKW  = Array.isArray(result?.gemini_missing_keywords) && result.gemini_missing_keywords.length > 0;
  const hasTips = Array.isArray(result?.gemini_suggestions)      && result.gemini_suggestions.length > 0;
  const meta    = score !== null ? overallMeta(score) : null;
  const grade   = score !== null ? gradeOf(score) : null;

  const sections = score !== null ? [
    { title:'Keywords Match',     Icon:Target,        score: hasMKW ? Math.max(58, score-12) : score, desc: hasMKW ? `${result.gemini_missing_keywords.length} keywords missing` : 'All keywords found' },
    { title:'Format & Structure', Icon:FileCheck,     score: clamp(score+5),  desc:'ATS compatibility'        },
    { title:'Work Experience',    Icon:Briefcase,     score,                  desc:'Relevance & depth'        },
    { title:'Skills Alignment',   Icon:Code,          score: clamp(score+3),  desc:'Tech & soft skills'       },
    { title:'Education',          Icon:GraduationCap, score: clamp(score+7),  desc:'Qualification match'      },
    { title:'Contact & Profile',  Icon:Mail,          score: 100,             desc:'Professional details'     },
  ] : [];

  const passed   = sections.filter(s => s.score >= 85).length;
  const warnings = sections.filter(s => s.score >= 60 && s.score < 85).length;
  const issues   = sections.filter(s => s.score < 60).length;

  const nextSteps = [
    hasMKW && `Add missing keywords: ${result?.gemini_missing_keywords?.slice(0,3).join(', ')}${result?.gemini_missing_keywords?.length > 3 ? '…' : ''}`,
    score < 85 && 'Quantify your impact — add numbers and metrics to bullet points',
    score < 75 && 'Tailor your summary section to match the job description language',
    hasTips && result?.gemini_suggestions?.[0],
    'Run ATS format check to ensure clean parsing',
  ].filter(Boolean).slice(0, 5);

  const toggleCheck = (i) => setChecklist(p => ({ ...p, [i]: !p[i] }));

  /* ── PDF Export — uses the hidden PDFReport div, not the screen DOM ── */
  const handleDownloadPDF = () => {
    if (!pdfRef.current) return;
    const filename = `JobMorph-${result?.resume_name?.replace(/\.[^.]+$/, '') || 'Report'}-${Date.now()}.pdf`;
    html2pdf().set({
      margin: [10, 15, 10, 15],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css'] },
    }).from(pdfRef.current).save();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  };

  /* ════════════ LOADING ════════════ */
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f8fafc' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ position:'relative', width:60, height:60, margin:'0 auto 20px' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#2563eb', animation:'spin .8s linear infinite' }} />
          <Brain style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:22, height:22, color:'#2563eb' }} />
        </div>
        <p style={{ fontWeight:700, color:'#0f172a', fontSize:15, marginBottom:6 }}>Analyzing your resume</p>
        <p style={{ color:'#94a3b8', fontSize:13, animation:'pulse 1.5s ease infinite' }}>AI is reviewing your document…</p>
      </div>
    </div>
  );

  /* ════════════ ERROR ════════════ */
  if (error) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f8fafc', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', padding:'40px 32px', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <AlertCircle style={{ width:22, height:22, color:'#dc2626' }} />
        </div>
        <p style={{ fontWeight:700, color:'#0f172a', fontSize:16, marginBottom:8 }}>Failed to load report</p>
        <p style={{ color:'#64748b', fontSize:13, marginBottom:24 }}>{error}</p>
        <Btn onClick={() => window.location.reload()} style={{ background:'#2563eb', color:'#fff', borderRadius:8, padding:'9px 20px', fontSize:13, fontWeight:600 }}>
          <RefreshCw style={{ width:13, height:13 }} /> Try Again
        </Btn>
      </div>
    </div>
  );

  const tabs = [
    { id:'overview',        label:'Overview',        Icon:BarChart3  },
    { id:'detailed',        label:'Section Scores',  Icon:Layers     },
    { id:'recommendations', label:'Recommendations', Icon:Lightbulb  },
    { id:'nextsteps',       label:'Action Plan',     Icon:Activity   },
  ];

  const S = {
    card: { background:'#fff', borderRadius:16, border:'1px solid #e8edf2', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }
  };

  /* ════════════ MAIN RENDER ════════════ */
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'"Inter",-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* ── Hidden PDF div — positioned off-screen, not display:none so html2pdf can render it ── */}
      <div style={{ position:'fixed', left:'-9999px', top:0, zIndex:-1, pointerEvents:'none' }}>
        <div ref={pdfRef}>
          {result && score !== null && (
            <PDFReport
              result={result}
              score={score}
              grade={grade}
              meta={meta}
              sections={sections}
              hasMKW={hasMKW}
              hasTips={hasTips}
            />
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .rp-btn-ghost:hover { background:#f1f5f9 !important; }
        .rp-tab:hover  { color:#1e293b !important; }
        .rp-card-hover { transition:box-shadow .2s,border-color .2s; }
        .rp-card-hover:hover { box-shadow:0 6px 24px rgba(0,0,0,.09) !important; border-color:#cbd5e1 !important; }
        .rp-kw:hover { transform:translateY(-1px); box-shadow:0 3px 10px rgba(0,0,0,.08) !important; }
        .rp-kw { transition:all .15s; }
        .rp-tip:hover { background:#f8fafc !important; }
        .rp-check:hover { background:#f8fafc; }
        .rp-check { transition:background .15s; border-radius:10px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
        .rp-fade-1 { animation:fadeUp .3s ease .05s both }
        .rp-fade-2 { animation:fadeUp .3s ease .12s both }
        .rp-fade-3 { animation:fadeUp .3s ease .2s  both }
        .rp-fade-4 { animation:fadeUp .3s ease .28s both }
      `}</style>

      {/* ══════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════ */}
      <div style={{
        position:'sticky', top:0, zIndex:50,
        background:'rgba(255,255,255,0.9)', backdropFilter:'blur(12px)',
        borderBottom:'1px solid #f1f5f9',
        padding:'0 28px', height:52,
        display:'flex', alignItems:'center', justifyContent:'space-between'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8' }}>
          <button className="rp-btn-ghost" onClick={() => navigate('/dashboard')} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color:'#64748b', fontWeight:500, fontSize:12, cursor:'pointer', padding:'4px 8px', borderRadius:6, fontFamily:'inherit' }}>
            <Home style={{ width:12, height:12 }} /> Dashboard
          </button>
          <ChevronRight style={{ width:11, height:11 }} />
          <button className="rp-btn-ghost" onClick={() => navigate('/history')} style={{ background:'none', border:'none', color:'#64748b', fontWeight:500, fontSize:12, cursor:'pointer', padding:'4px 8px', borderRadius:6, fontFamily:'inherit' }}>
            Scan History
          </button>
          <ChevronRight style={{ width:11, height:11 }} />
          <span style={{ color:'#1e293b', fontWeight:600 }}>Result</span>
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Btn onClick={handleCopy} style={{
            background: copied ? '#f0fdf4' : '#f8fafc',
            color: copied ? '#16a34a' : '#64748b',
            border:`1px solid ${copied ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600
          }}>
            {copied ? <><CheckCircle style={{width:12,height:12}}/> Copied!</> : <><Link2 style={{width:12,height:12}}/> Share</>}
          </Btn>
          <Btn onClick={handleDownloadPDF} style={{ background:'#1e293b', color:'#fff', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600 }}>
            <Download style={{ width:12, height:12 }} /> Export PDF
          </Btn>
          <Btn onClick={() => navigate('/upload')} style={{ background:'#2563eb', color:'#fff', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600 }}>
            <Scan style={{ width:12, height:12 }} /> New Scan
          </Btn>
        </div>
      </div>

      {/* ══════════════════════════════════
          PAGE CONTENT (screen display)
      ══════════════════════════════════ */}
      <div style={{ maxWidth:1020, margin:'0 auto', padding:'28px 28px 52px' }}>
        <div ref={reportRef}>

          {/* ── HERO CARD ── */}
          <div className="rp-fade-1" style={{ ...S.card, padding:'28px 32px', marginBottom:16 }}>
            <div style={{ display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:300 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FileText style={{ width:18, height:18, color:'#2563eb' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight:800, color:'#0f172a', fontSize:17, lineHeight:1.2, margin:0 }}>
                      {result?.resume_name || 'Resume Analysis'}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                      <Clock style={{ width:11, height:11, color:'#94a3b8' }} />
                      <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>Analyzed just now</span>
                      {meta && (
                        <span style={{ marginLeft:6, fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:99, background:meta.soft, color:meta.accent, border:`1px solid ${meta.ring}` }}>
                          ● {meta.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
                  {[
                    { label:'Passed',   val:passed,   color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', Icon:CheckCircle   },
                    { label:'Warnings', val:warnings, color:'#d97706', bg:'#fffbeb', border:'#fde68a', Icon:AlertTriangle  },
                    { label:'Issues',   val:issues,   color:'#dc2626', bg:'#fef2f2', border:'#fecaca', Icon:XCircle        },
                  ].map(({ label, val, color, bg, border, Icon:Ic }) => (
                    <div key={label} style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
                        <Ic style={{ width:12, height:12, color }} />
                        <span style={{ fontSize:10, fontWeight:700, color, letterSpacing:'0.06em' }}>{label.toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize:30, fontWeight:900, color, lineHeight:1 }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background:'#f8fafc', borderRadius:10, border:'1px solid #f1f5f9', padding:'12px 16px', marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.05em' }}>RESUME vs JOB DESCRIPTION MATCH</span>
                    <span style={{ fontSize:12, fontWeight:700, color: scoreHex(score) }}>{score}%</span>
                  </div>
                  <div style={{ height:8, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${score}%`, background: `linear-gradient(90deg, ${scoreHex(score)}cc, ${scoreHex(score)})`, borderRadius:99, transition:'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                    <span style={{ fontSize:10, color:'#94a3b8' }}>0</span>
                    <span style={{ fontSize:10, color:'#94a3b8' }}>100</span>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f8fafc', borderRadius:9, border:'1px solid #f1f5f9' }}>
                  <Target style={{ width:13, height:13, color:'#94a3b8', flexShrink:0 }} />
                  <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em', textTransform:'uppercase' }}>Target Role</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{result?.jd_name || 'Job Description'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, minWidth:180 }}>
                <div style={{ position:'relative', width:160, height:160 }}>
                  {score !== null && (
                    <CircularProgressbar
                      value={score}
                      text={`${score}`}
                      styles={buildStyles({
                        pathColor: scoreHex(score),
                        textColor:'#0f172a',
                        trailColor:'#f1f5f9',
                        textSize:'20px',
                        pathTransitionDuration:1.2,
                        strokeLinecap:'round',
                      })}
                    />
                  )}
                  <div style={{
                    position:'absolute', bottom:-8, right:-8,
                    width:38, height:38, borderRadius:'50%',
                    background: scoreHex(score), color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, fontWeight:900, boxShadow:'0 2px 8px rgba(0,0,0,.2)',
                    border:'2px solid #fff'
                  }}>{grade}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em', textTransform:'uppercase', margin:'0 0 2px' }}>Overall Score</p>
                  <p style={{ fontSize:11, color:'#cbd5e1', margin:0 }}>out of 100</p>
                </div>
                <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:5, marginTop:4 }}>
                  {sections.slice(0,4).map((sec, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <span style={{ fontSize:10, color:'#94a3b8', width:52, flexShrink:0, textAlign:'right', fontWeight:500 }}>{sec.score}</span>
                      <div style={{ flex:1, height:4, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${sec.score}%`, background:scoreHex(sec.score), borderRadius:99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── QUICK INSIGHTS ── */}
          <div className="rp-fade-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:16 }}>
            {[
              { Icon:Award,         label:'Score Grade',       value:grade,                              color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
              { Icon:BookOpen,      label:'Keywords Covered',  value: hasMKW ? `${Math.max(0, 100 - result.gemini_missing_keywords.length * 8)}%` : '100%', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
              { Icon:AlertTriangle, label:'Keywords Missing',  value: hasMKW ? result.gemini_missing_keywords.length : 0, color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
              { Icon:Zap,           label:'AI Suggestions',    value: hasTips ? result.gemini_suggestions.length : 0,     color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
            ].map(({ Icon:Ic, label, value, color, bg, border }) => (
              <div key={label} style={{ ...S.card, padding:'16px 18px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:bg, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Ic style={{ width:15, height:15, color }} />
                </div>
                <div>
                  <p style={{ fontSize:11, color:'#94a3b8', fontWeight:500, margin:'0 0 2px' }}>{label}</p>
                  <p style={{ fontSize:20, fontWeight:800, color:'#0f172a', lineHeight:1, margin:0 }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── TABS PANEL ── */}
          <div className="rp-fade-3" style={{ ...S.card, overflow:'hidden', marginBottom:16 }}>
            <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', padding:'0 6px', overflowX:'auto' }}>
              {tabs.map(({ id, label, Icon:Ic }) => {
                const active = activeTab === id;
                return (
                  <button key={id} onClick={() => setActiveTab(id)} className="rp-tab"
                    style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'14px 18px', fontSize:13,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#2563eb' : '#94a3b8',
                      background:'none', border:'none', cursor:'pointer',
                      borderBottom:`2px solid ${active ? '#2563eb' : 'transparent'}`,
                      marginBottom:'-1px', whiteSpace:'nowrap', fontFamily:'inherit',
                      transition:'all .15s'
                    }}>
                    <Ic style={{ width:13, height:13 }} /> {label}
                  </button>
                );
              })}
            </div>

            <div style={{ padding:'26px 28px' }}>

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:12 }}>
                  {sections.map((sec, i) => (
                    <div key={i} className="rp-card-hover" style={{ borderRadius:13, border:'1px solid #e8edf2', padding:'18px 20px', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:34, height:34, borderRadius:8, background:'#f8fafc', border:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <sec.Icon style={{ width:15, height:15, color:'#64748b' }} />
                          </div>
                          <div>
                            <p style={{ fontWeight:700, color:'#0f172a', fontSize:13, margin:0, lineHeight:1.2 }}>{sec.title}</p>
                            <p style={{ color:'#94a3b8', fontSize:11, margin:'3px 0 0' }}>{sec.desc}</p>
                          </div>
                        </div>
                        <Pill score={sec.score} />
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Bar value={sec.score} />
                        <span style={{ fontSize:18, fontWeight:800, color:'#0f172a', minWidth:32, textAlign:'right', lineHeight:1 }}>{sec.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION SCORES */}
              {activeTab === 'detailed' && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'40px 1fr 120px 80px', gap:16, padding:'0 8px 10px', borderBottom:'1px solid #f1f5f9' }}>
                    <div /><span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em' }}>SECTION</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em' }}>PROGRESS</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', letterSpacing:'0.06em', textAlign:'right' }}>SCORE</span>
                  </div>
                  {sections.map((sec, i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'40px 1fr 120px 80px', gap:16, alignItems:'center', padding:'13px 8px', borderRadius:10, background: i%2===0 ? '#fafbfc' : '#fff' }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:'#fff', border:'1px solid #e8edf2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <sec.Icon style={{ width:15, height:15, color:'#475569' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight:600, color:'#0f172a', fontSize:13, margin:'0 0 2px' }}>{sec.title}</p>
                        <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>{sec.desc}</p>
                      </div>
                      <Bar value={sec.score} h={5} />
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                        <span style={{ fontSize:20, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{sec.score}</span>
                        <Pill score={sec.score} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RECOMMENDATIONS */}
              {activeTab === 'recommendations' && (
                <div style={{ display:'flex', flexDirection:'column', gap:26 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <AlertCircle style={{ width:15, height:15, color:'#dc2626' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight:700, color:'#0f172a', fontSize:14, margin:0 }}>Skill Gaps</p>
                        <p style={{ fontSize:12, color:'#94a3b8', margin:'2px 0 0' }}>
                          {hasMKW ? `Learn these ${result.gemini_missing_keywords.length} skills before your next application` : 'All keywords from the job description are present'}
                        </p>
                      </div>
                    </div>
                    {hasMKW ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                        {/* Skill gap pills with Verify button */}
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {result.gemini_missing_keywords.map((kw, i) => {
                            const isVerified = !!verifiedSkills[kw];
                            const isOpen     = verifyingSkill === kw;
                            return (
                              <div key={i} style={{ display:'inline-flex', alignItems:'center', borderRadius:99, overflow:'hidden', border: isVerified ? '1px solid #86efac' : '1px solid #fecaca', fontSize:12, fontWeight:600 }}>
                                {/* Skill name */}
                                <span style={{ padding:'6px 13px', background: isVerified ? '#f0fdf4' : '#fff', color: isVerified ? '#166534' : '#991b1b', display:'inline-flex', alignItems:'center', gap:5 }}>
                                  <span style={{ width:5, height:5, borderRadius:'50%', background: isVerified ? '#16a34a' : '#dc2626', flexShrink:0, display:'inline-block' }} />
                                  {kw}
                                </span>
                                {/* Verified badge OR Verify button */}
                                {isVerified ? (
                                  <span style={{ padding:'6px 11px', background:'#dcfce7', color:'#15803d', borderLeft:'1px solid #86efac', display:'inline-flex', alignItems:'center', gap:4, fontSize:11 }}>
                                    <CheckCircle style={{ width:11, height:11 }} /> Verified
                                  </span>
                                ) : (
                                  <button onClick={() => openVerifyPanel(kw)}
                                    style={{ padding:'6px 11px', background: isOpen ? '#ede9fe' : '#fce7f3', color: isOpen ? '#6d28d9' : '#9333ea', borderLeft:'1px solid #fecaca', border:'none', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                                    {isOpen ? 'Cancel' : 'Verify →'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Verify panel — opens inline below the pill */}
                        {verifyingSkill && !verifiedSkills[verifyingSkill] && (
                          <div style={{ background:'#faf5ff', border:'1px solid #ddd6fe', borderRadius:12, padding:'16px 18px' }}>
                            <p style={{ fontSize:12, fontWeight:700, color:'#4c1d95', margin:'0 0 4px' }}>
                              Verify: <span style={{ color:'#7c3aed' }}>{verifyingSkill}</span>
                            </p>
                            <p style={{ fontSize:11, color:'#7c3aed', margin:'0 0 12px' }}>
                              Paste your certificate URL — we verify it and discard it immediately. Never stored.
                            </p>

                            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom: 10 }}>
                              <input
                                type="text"
                                value={certUrl}
                                onChange={e => {
                                  let val = e.target.value.trim();
                                  // Auto-fix common URL issues
                                  if (val && !val.startsWith('http')) {
                                    // Handle short URLs like ude.my/UC-... or credly.com/badges/...
                                    val = 'https://' + val;
                                  }
                                  setCertUrl(val);
                                  setVerifyResult(null);
                                }}
                                placeholder="https://coursera.org/verify/... or credly.com/badges/... or linkedin.com/learning/certificates/..."
                                style={{ flex:1, padding:'9px 13px', fontSize:12, border:'1px solid #ddd6fe', borderRadius:8, outline:'none', fontFamily:'inherit', background:'#fff', color:'#1e293b' }}
                                onKeyDown={e => e.key === 'Enter' && handleVerifyCert(verifyingSkill)}
                              />
                              {(
                                <button
                                  onClick={() => handleVerifyCert(verifyingSkill)}
                                  disabled={verifyLoading || !certUrl.trim()}
                                  style={{ padding:'9px 18px', background: verifyLoading ? '#d1d5db' : 'linear-gradient(135deg,#e91e8c,#7c3aed)', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor: verifyLoading ? 'not-allowed' : 'pointer', fontFamily:'inherit', whiteSpace:'nowrap', opacity: !certUrl.trim() ? 0.5 : 1 }}>
                                  {verifyLoading ? 'Verifying…' : 'Verify'}
                                </button>
                              )}
                            </div>



                            {/* Accepted platforms */}
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom: verifyResult ? 10 : 0 }}>
                              <span style={{ fontSize:10, color:'#94a3b8' }}>Accepted:</span>
                              {['Coursera','Udemy','Credly','LinkedIn','Google','AWS','Microsoft','IBM','NPTEL','edX','freeCodeCamp','HackerRank','Kaggle','DataCamp','Internshala','ude.my'].map(p => (
                                <span key={p} style={{ fontSize:10, padding:'2px 7px', background:'#f3f4f6', borderRadius:99, color:'#6b7280', border:'0.5px solid #e5e7eb' }}>{p}</span>
                              ))}
                            </div>

                            {/* Result message */}
                            {verifyResult && (
                              <div style={{ marginTop:10, padding:'10px 14px', borderRadius:8, background: verifyResult.success ? '#f0fdf4' : '#fef2f2', border:`1px solid ${verifyResult.success ? '#86efac' : '#fca5a5'}`, display:'flex', alignItems:'center', gap:8 }}>
                                {verifyResult.success
                                  ? <CheckCircle style={{ width:14, height:14, color:'#16a34a', flexShrink:0 }} />
                                  : <AlertCircle style={{ width:14, height:14, color:'#dc2626', flexShrink:0 }} />
                                }
                                <span style={{ fontSize:12, fontWeight:500, color: verifyResult.success ? '#166534' : '#991b1b' }}>
                                  {verifyResult.message}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Verified skills summary */}
                        {Object.keys(verifiedSkills).length > 0 && (
                          <div style={{ padding:'10px 14px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0', display:'flex', alignItems:'center', gap:8 }}>
                            <CheckCircle style={{ width:13, height:13, color:'#16a34a', flexShrink:0 }} />
                            <span style={{ fontSize:12, color:'#166534', fontWeight:500 }}>
                              {Object.keys(verifiedSkills).length} skill{Object.keys(verifiedSkills).length > 1 ? 's' : ''} verified · Certificate not stored
                            </span>
                          </div>
                        )}

                        {/* Disclaimer */}
                        <div style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:8, border:'1px solid #f1f5f9', borderLeft:'3px solid #7c3aed' }}>
                          <p style={{ fontSize:11, color:'#64748b', margin:0, lineHeight:1.6 }}>
                            Only add a skill to your resume once you can confidently explain and demonstrate it in an interview.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 18px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0' }}>
                        <CheckCircle style={{ width:15, height:15, color:'#16a34a', flexShrink:0 }} />
                        <span style={{ fontSize:13, color:'#166534', fontWeight:500 }}>Great — your resume covers all required keywords</span>
                      </div>
                    )}
                  </div>

                  <Divider />

                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:'#eff6ff', border:'1px solid #bfdbfe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Zap style={{ width:15, height:15, color:'#2563eb' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight:700, color:'#0f172a', fontSize:14, margin:0 }}>AI Recommendations</p>
                        <p style={{ fontSize:12, color:'#94a3b8', margin:'2px 0 0' }}>
                          {hasTips ? `${result.gemini_suggestions.length} tailored improvements for your resume` : 'Your resume is well-optimised'}
                        </p>
                      </div>
                    </div>
                    {hasTips ? (
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        {result.gemini_suggestions.map((tip, i) => (
                          <div key={i} className="rp-tip" style={{ display:'flex', gap:14, padding:'13px 14px', alignItems:'flex-start', borderRadius:10 }}>
                            <div style={{ width:24, height:24, borderRadius:'50%', background:'#f1f5f9', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#64748b', flexShrink:0, marginTop:1 }}>
                              {i+1}
                            </div>
                            <p style={{ fontSize:13, color:'#334155', lineHeight:1.65, margin:0, flex:1 }}>{tip}</p>
                            <ArrowUpRight style={{ width:13, height:13, color:'#cbd5e1', flexShrink:0, marginTop:4 }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 18px', background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0' }}>
                        <CheckCircle style={{ width:15, height:15, color:'#16a34a', flexShrink:0 }} />
                        <span style={{ fontSize:13, color:'#166534', fontWeight:500 }}>Your resume is well-optimised for this role</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ACTION PLAN */}
              {activeTab === 'nextsteps' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <p style={{ fontWeight:700, color:'#0f172a', fontSize:15, margin:0 }}>Your Action Plan</p>
                      <p style={{ fontSize:12, color:'#94a3b8', margin:'3px 0 0' }}>
                        {Object.values(checklist).filter(Boolean).length} of {nextSteps.length} tasks completed
                      </p>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#2563eb' }}>
                      {Math.round((Object.values(checklist).filter(Boolean).length / nextSteps.length) * 100)}% done
                    </div>
                  </div>
                  <div style={{ height:6, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{
                      height:'100%',
                      width:`${Math.round((Object.values(checklist).filter(Boolean).length / nextSteps.length) * 100)}%`,
                      background:'#2563eb', borderRadius:99, transition:'width .4s ease'
                    }} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {nextSteps.map((step, i) => {
                      const done = !!checklist[i];
                      return (
                        <div key={i} className="rp-check" onClick={() => toggleCheck(i)}
                          style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', cursor:'pointer', userSelect:'none' }}>
                          <div style={{
                            width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                            border:`2px solid ${done ? '#2563eb' : '#d1d5db'}`,
                            background: done ? '#2563eb' : '#fff',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            transition:'all .15s'
                          }}>
                            {done && <CheckCircle style={{ width:11, height:11, color:'#fff', strokeWidth:3 }} />}
                          </div>
                          <p style={{ fontSize:13, color: done ? '#94a3b8' : '#334155', lineHeight:1.6, margin:0, textDecoration: done ? 'line-through' : 'none', flex:1, transition:'all .15s' }}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9', padding:'16px 18px', marginTop:4 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Star style={{ width:13, height:13, color:'#2563eb' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight:700, color:'#0f172a', fontSize:13, margin:'0 0 4px' }}>Pro Tip</p>
                        <p style={{ fontSize:12, color:'#64748b', lineHeight:1.6, margin:0 }}>
                          Resumes with a score above 85 get <strong>3× more callbacks</strong>. Focus on adding missing keywords and quantifying your achievements with real numbers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ── CTA FOOTER ── */}
          <div className="rp-fade-4" style={{ ...S.card, padding:'22px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <RotateCcw style={{ width:17, height:17, color:'#475569' }} />
              </div>
              <div>
                <p style={{ fontWeight:700, color:'#0f172a', fontSize:14, margin:'0 0 3px' }}>Analyze another resume?</p>
                <p style={{ color:'#94a3b8', fontSize:12, margin:0 }}>Upload a new resume + job description for instant AI feedback.</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Btn onClick={() => navigate('/upload')} style={{ background:'#1e293b', color:'#fff', borderRadius:9, padding:'10px 22px', fontSize:13, fontWeight:600 }}>
                <TrendingUp style={{ width:14, height:14 }} /> New Analysis
              </Btn>
              <Btn onClick={handleDownloadPDF} style={{ background:'#fff', color:'#475569', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 22px', fontSize:13, fontWeight:600 }}>
                <Download style={{ width:14, height:14 }} /> Download PDF
              </Btn>
              <Btn onClick={() => navigate('/history')} style={{ background:'#fff', color:'#475569', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 22px', fontSize:13, fontWeight:600 }}>
                <BookOpen style={{ width:14, height:14 }} /> Scan History
              </Btn>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}