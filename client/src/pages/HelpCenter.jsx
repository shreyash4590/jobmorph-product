// src/pages/HelpCenter.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, ChevronRight, ChevronDown, ChevronUp,
  Mail, Search, Zap, Shield, FileText, BarChart2,
  BookOpen, Star, MessageCircle, Phone,
} from 'lucide-react';

/* ── Categories ─────────────────────────────────────────────── */
const categories = [
  {
    key: 'started',
    label: 'Getting Started',
    Icon: Zap,
    faqs: [
      {
        q: 'How does JobMorph analyse my resume?',
        a: "JobMorph uses advanced AI to compare your resume against a job description. It identifies your match score, missing keywords, skill gaps, and gives you specific suggestions to improve your chances of getting shortlisted by recruiters and ATS systems.",
      },
      {
        q: 'What file formats are supported?',
        a: 'Resumes can be uploaded as PDF or DOCX (max 10 MB). Job descriptions support PDF, DOCX, and TXT formats (max 15 MB). We recommend PDF for the most accurate text extraction.',
      },
      {
        q: 'Do I need to create an account to use JobMorph?',
        a: 'Yes, a free account is required so we can save your scan history and personalise your experience. Sign up takes less than 30 seconds with your email or Google account.',
      },
      {
        q: 'How long does a scan take?',
        a: "Most scans complete in under 30 seconds. You'll get your full match score, missing skills, and AI recommendations almost instantly.",
      },
    ],
  },
  {
    key: 'features',
    label: 'Features & Tools',
    Icon: BarChart2,
    faqs: [
      {
        q: 'What is the Batch Job Matcher?',
        a: 'Batch Job Matcher lets you upload one resume against multiple job descriptions at once. JobMorph analyses all of them simultaneously and ranks each job by match score — so you immediately know where to focus your energy.',
      },
      {
        q: 'What does the ATS Checker do?',
        a: 'The ATS Checker scans your resume for formatting problems that prevent Applicant Tracking Systems from reading it correctly — tables, graphics, non-standard fonts, multi-column layouts. It can auto-fix all issues and return a clean, optimised version.',
      },
      {
        q: 'What is the Career Skill Map?',
        a: 'Career Skill Map shows exactly which skills are missing from your resume based on your latest scan. Each skill shows difficulty, time to learn, market demand, and direct links to the best learning resources.',
      },
      {
        q: 'Can I save and revisit my previous scans?',
        a: 'Yes. All scans are automatically saved to your Scan History page. You can search, filter by date or score, archive old scans, or delete them at any time.',
      },
      {
        q: 'How does Interview Prep work?',
        a: "Interview Prep generates tailored interview questions based on your resume and the specific role you're applying for — helping you prepare for both technical and behavioural rounds.",
      },
    ],
  },
  {
    key: 'account',
    label: 'Account & Privacy',
    Icon: Shield,
    faqs: [
      {
        q: 'Is my resume data secure?',
        a: 'Yes. Your resume and all personal data are stored securely using Firebase and are never shared with third parties, recruiters, or employers. You have complete control over your data at all times.',
      },
      {
        q: 'How do I reset my password?',
        a: "Click 'Forgot Password' on the login page, enter your registered email address, and follow the reset link sent to your inbox. The link expires after 24 hours.",
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes. Contact us at support@jobmorph.ai and we will permanently delete your account and all associated data within 7 business days.',
      },
      {
        q: 'Does JobMorph share my data with recruiters?',
        a: 'Never. Your resume and data are strictly private. JobMorph is a tool for you — we do not share, sell, or expose your information to any third parties.',
      },
    ],
  },
  {
    key: 'scan',
    label: 'Scan History',
    Icon: FileText,
    faqs: [
      {
        q: 'Where can I find my past scans?',
        a: "All your previous scans are saved under the 'Scan History' page in the sidebar. You can search by resume name, filter by date range or score, and sort by newest or highest match.",
      },
      {
        q: 'Can I archive old scans?',
        a: 'Yes. Click the archive icon on any scan row to move it to the Archived tab. Archived scans are hidden from your main history but can be restored or permanently deleted at any time.',
      },
      {
        q: 'How do I delete a scan?',
        a: "Click the trash icon on any scan row, confirm the deletion in the popup, and the scan will be permanently removed. This action cannot be undone.",
      },
    ],
  },
];

export default function HelpCenter() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('started');
  const [openFaq,        setOpenFaq]        = useState(null);
  const [search,         setSearch]         = useState('');

  const currentCat = categories.find(c => c.key === activeCategory);

  const visibleFaqs = currentCat.faqs.filter(f =>
    !search.trim() ||
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (i) => setOpenFaq(openFaq === i ? null : i);

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fb' }}>

      {/* ── Navbar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8"
        style={{ height: '56px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
              <HelpCircle size={15} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
                <span className="hover:text-purple-600 cursor-pointer transition-colors"
                  onClick={() => navigate('/dashboard')}>Dashboard</span>
                <ChevronRight size={10} />
                <span className="text-gray-500 font-medium">Help Center</span>
              </div>
              <h1 className="text-sm font-semibold text-gray-900 leading-none">Help Center</h1>
            </div>
          </div>
                <button
                  onClick={() => navigate('/contact')}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-3 py-2 rounded-lg transition-all">
                  <Mail size={12} /> Submit a Request
                </button>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="py-16 text-center px-8"
        style={{ background: 'linear-gradient(160deg,#fdf2f8 0%,#f5f3ff 50%,#eff6ff 100%)' }}>
        <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#1e1b4b' }}>
          Hello, how can we help?
        </h2>
        <p className="text-sm text-gray-400 mb-8">Search our help articles or choose a category below.</p>

        {/* Search bar */}
        <div className="max-w-xl mx-auto flex items-center gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 flex-1 px-4 py-3">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenFaq(null); }}
              placeholder="Ask a question…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>
          <button
            className="px-5 py-3 text-xs font-bold text-white flex-shrink-0 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}
          >
            Search
          </button>
        </div>
      </div>

      {/* ── Category tabs ────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-8">
        <div className="max-w-3xl mx-auto flex items-center gap-1 overflow-x-auto py-1">
          {categories.map(({ key, label, Icon }) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveCategory(key); setOpenFaq(null); setSearch(''); }}
                className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-xl transition-all flex-shrink-0 text-center"
                style={{
                  background: isActive ? 'linear-gradient(135deg,#fdf2f8,#f5f3ff)' : 'transparent',
                  border: isActive ? '1px solid #e9d5ff' : '1px solid transparent',
                  color: isActive ? '#7c3aed' : '#9ca3af',
                }}
              >
                <Icon size={20} />
                <span className="text-xs font-semibold whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FAQ Section ──────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-8 py-12">

        {/* Category heading */}
        <h3 className="text-2xl font-extrabold text-center mb-2" style={{ color: '#1e1b4b' }}>
          {currentCat.label}
        </h3>
        <p className="text-sm text-gray-400 text-center mb-10">
          {visibleFaqs.length} article{visibleFaqs.length !== 1 ? 's' : ''} in this section
        </p>

        {/* FAQ list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {visibleFaqs.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-1">No results for "{search}"</p>
              <p className="text-xs text-gray-400 mb-4">Try different keywords or contact our support team.</p>
              <button onClick={() => setSearch('')}
                className="text-xs font-semibold hover:underline"
                style={{ color: '#7c3aed' }}>
                Clear search
              </button>
            </div>
          ) : (
            visibleFaqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }} />
                      <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                    </div>
                    <div className="flex-shrink-0 text-gray-300">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5">
                      <p className="text-sm text-gray-500 leading-relaxed pl-4 border-l-2 border-purple-100">
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Still have a question ─────────────────────────── */}
      <div className="max-w-3xl mx-auto px-8 pb-16">
        <h3 className="text-2xl font-extrabold text-center mb-2" style={{ color: '#1e1b4b' }}>
          You still have a question?
        </h3>
        <p className="text-sm text-gray-400 text-center mb-8">
          If you cannot find an answer in our FAQ, you can always contact us. We will answer shortly!
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Email */}
          <a href="mailto:support@jobmorph.ai"
            className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-purple-200 hover:shadow-md transition-all text-center group"
            style={{ textDecoration: 'none' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)', border: '1px solid #e9d5ff' }}>
              <Mail size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 mb-1 group-hover:text-purple-700 transition-colors">
                support@jobmorph.ai
              </p>
              <p className="text-xs text-gray-400">The best way to get an answer faster.</p>
            </div>
          </a>

          {/* Response time */}
          <div className="flex flex-col items-center gap-3 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)', border: '1px solid #e9d5ff' }}>
              <MessageCircle size={20} className="text-pink-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 mb-1">Response within 24 hours</p>
              <p className="text-xs text-gray-400">We are always happy to help.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ background: '#0f0a1e' }}>
        <div className="max-w-6xl mx-auto px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">

            {/* Brand */}
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
                {['𝕏', 'in', 'gh'].map((s) => (
                  <a key={s} href="#" onClick={e => e.preventDefault()}
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
                  <button key={label} onClick={() => navigate(path)}
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
                  <button key={label} onClick={() => navigate(path)}
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
                  <button key={label} onClick={() => path !== '#' && navigate(path)}
                    className="text-left text-sm transition-colors hover:text-white"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6b7280' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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