// src/pages/PrivacyPolicy.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, ArrowRight } from 'lucide-react';

const sections = [
  {
    num: '01',
    title: 'Introduction',
    content: `At JobMorph, your privacy is not an afterthought — it is a core part of how we build. This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our AI-powered resume analysis platform. By using JobMorph, you agree to the practices described in this policy. If you have any questions, you can always reach us at support@jobmorph.ai.`,
  },
  {
    num: '02',
    title: 'Information We Collect',
    content: null,
    list: [
      'Full name and email address — for account creation and communication.',
      'Uploaded resumes and job descriptions — used solely for AI analysis.',
      'Match scores, skill gap results, and scan history — to personalise your experience.',
      'ATS analysis results and batch job match data — stored under your account.',
      'Device and browser metadata — for analytics, troubleshooting, and security.',
      'Authentication data — managed securely via Firebase Auth.',
    ],
  },
  {
    num: '03',
    title: 'How We Use Your Information',
    content: 'We use your data strictly to provide, improve, and personalise the JobMorph experience. Specifically:',
    list: [
      'To analyse your resume against job descriptions using our AI engine (Google Gemini).',
      'To display your scan history, match scores, and skill gap recommendations.',
      'To power features like Batch Job Matcher, ATS Checker, Career Skill Map, and Interview Prep.',
      'To notify you of important account activity or product updates.',
      'To improve our AI models and overall product quality using aggregated, anonymised insights.',
    ],
    footer: 'We do not sell, rent, or share your personal data with advertisers, recruiters, or any third parties for marketing purposes.',
  },
  {
    num: '04',
    title: 'Data Storage & Security',
    content: `All your data is stored securely in Firebase (Google Cloud infrastructure), protected by encryption at rest and in transit, strict access controls, and industry-standard authentication practices. Your uploaded resumes and job descriptions are processed in memory and stored only as needed to serve your account. We never store your documents in publicly accessible locations.`,
  },
  {
    num: '05',
    title: 'Third-Party Services',
    content: 'JobMorph uses a small set of trusted third-party services to operate the platform:',
    list: [
      'Firebase (Google) — authentication, Firestore database, and secure cloud storage.',
      'Google Gemini — AI engine used for resume analysis, skill gap detection, and interview prep.',
      'EmailJS — for sending transactional emails and support responses.',
      'Analytics tools — for understanding usage patterns and improving the product (no personal data is sold).',
    ],
    footer: 'Each of these services is bound by their own privacy policies and our data processing agreements.',
  },
  {
    num: '06',
    title: 'Your Rights & Controls',
    content: 'You are always in control of your data. You have the right to:',
    list: [
      'Access — request a full copy of the data we hold about you.',
      'Correct — update or fix any inaccurate information in your account.',
      'Delete — permanently remove your account and all associated data at any time.',
      'Export — request an export of your scan history and analysis results.',
      'Opt out — withdraw consent for non-essential data processing at any time.',
    ],
    footer: 'To exercise any of these rights, email us at support@jobmorph.ai. We will respond within 7 business days.',
  },
  {
    num: '07',
    title: 'Data Retention',
    content: `We retain your personal data for as long as your account remains active and in use. If your account has been inactive for more than 12 months, we may delete it after sending prior notice to your registered email. You can also request deletion at any time by contacting us directly.`,
  },
  {
    num: '08',
    title: "Children's Privacy",
    content: `JobMorph is designed for professional use and is not intended for individuals under the age of 17. We do not knowingly collect personal data from minors. If we become aware that a minor has created an account, we will delete the account and all associated data immediately.`,
  },
  {
    num: '09',
    title: 'Cookies & Tracking',
    content: 'JobMorph uses minimal cookies and local storage strictly for:',
    list: [
      'Maintaining your login session securely.',
      'Storing your UI preferences (such as sidebar state).',
      'Basic analytics to understand how features are being used.',
    ],
    footer: 'We do not use advertising cookies or cross-site tracking of any kind.',
  },
  {
    num: '10',
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy as the product evolves. When we make material changes, we will notify you via email or an in-app notification before the changes take effect. The "Last updated" date at the top of this page will always reflect the most recent version.`,
  },
  {
    num: '11',
    title: 'Contact Us',
    content: `For privacy questions, data requests, or concerns, please contact our team directly. We are committed to responding promptly and transparently.`,
    footer: 'Email: support@jobmorph.ai — We respond within 7 business days.',
  },
];

export default function PrivacyPolicy() {
  const navigate  = useNavigate();
  const [active, setActive] = useState(null);

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
              <Shield size={15} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
                <span className="hover:text-purple-600 cursor-pointer transition-colors"
                  onClick={() => navigate('/dashboard')}>Dashboard</span>
                <ChevronRight size={10} />
                <span className="text-gray-500 font-medium">Privacy Policy</span>
              </div>
              <h1 className="text-sm font-semibold text-gray-900 leading-none">Privacy Policy</h1>
            </div>
          </div>
          <button onClick={() => navigate('/contact')}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-3 py-2 rounded-lg transition-all">
            Questions? Contact Us
          </button>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="py-16 px-8 text-center border-b border-gray-100"
        style={{ background: 'linear-gradient(160deg,#fdf2f8 0%,#f5f3ff 50%,#eff6ff 100%)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
          <Shield size={24} className="text-white" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#e91e8c' }}>Legal</p>
        <h2 className="text-4xl font-extrabold mb-3" style={{ color: '#1e1b4b' }}>Privacy Policy</h2>
        <p className="text-sm text-gray-400 mb-2">Last updated: July 10, 2025</p>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          We believe privacy is a right, not a feature. This policy explains exactly how JobMorph handles your data — clearly and honestly.
        </p>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-8 py-16 space-y-0">
        {sections.map(({ num, title, content, list, footer }, i) => (
          <div key={num} className="flex gap-8 pb-12 border-b border-gray-100 last:border-0 last:pb-0 mb-12 last:mb-0">

            {/* Number */}
            <div className="flex-shrink-0 pt-1">
              <span className="text-xs font-bold" style={{ color: '#e9d5ff' }}>{num}</span>
            </div>

            {/* Body */}
            <div className="flex-1">
              <h3 className="text-lg font-extrabold mb-3" style={{ color: '#1e1b4b' }}>{title}</h3>

              {content && (
                <p className="text-sm text-gray-500 leading-relaxed mb-3">{content}</p>
              )}

              {list && (
                <ul className="space-y-2 mb-3">
                  {list.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-500 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                        style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {footer && (
                <p className="text-sm leading-relaxed mt-3 px-4 py-3 rounded-xl border"
                  style={{ color: '#7c3aed', background: '#faf5ff', borderColor: '#e9d5ff' }}>
                  {footer}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ──────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-8 pb-16">
        <div className="rounded-2xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5 border border-purple-100"
          style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
          <div>
            <p className="text-base font-extrabold text-gray-900 mb-1">Have a privacy concern?</p>
            <p className="text-xs text-gray-500">Contact our team and we'll respond within 7 business days.</p>
          </div>
          <button onClick={() => navigate('/contact')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
            Contact Us <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: '#0f0a1e' }}>
        <div className="max-w-6xl mx-auto px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">

            <div>
              <button onClick={() => navigate('/')}
                className="flex items-center gap-2.5 mb-4"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
                {['𝕏', 'in', 'gh'].map(s => (
                  <a key={s} href="#" onClick={e => e.preventDefault()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: [['Resume Matcher', '/upload'], ['ATS Checker', '/ats-checker'], ['Batch Matcher', '/batch-matcher'], ['Career Skill Map', '/missing-skills']] },
              { title: 'Company', links: [['About Us', '/about'], ['Help Center', '/help'], ['Contact', '/contact'], ['Privacy Policy', '/privacy']] },
              { title: 'Support', links: [['Help Center', '/help'], ['Privacy Policy', '/privacy'], ['Terms of Service', '#']] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#a78bfa' }}>{title}</p>
                <div className="flex flex-col gap-2.5">
                  {title === 'Support' && (
                    <a href="mailto:support@jobmorph.ai"
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: '#6b7280', textDecoration: 'none' }}>
                      support@jobmorph.ai
                    </a>
                  )}
                  {links.map(([label, path]) => (
                    <button key={label} onClick={() => path !== '#' && navigate(path)}
                      className="text-left text-sm transition-colors hover:text-white"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b7280' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <span className="text-xs" style={{ color: '#4b5563' }}>
              ©️ {new Date().getFullYear()} JobMorph. All rights reserved.
            </span>
            <div className="flex items-center gap-6">
              {['Privacy', 'Terms', 'Cookies'].map(l => (
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