// src/pages/ContactPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import {
  Mail, MapPin, Phone, ChevronRight, MessageCircle,
  Send, CheckCircle2, XCircle, FileText, Briefcase,
  Target, User, ArrowRight,
} from 'lucide-react';

/* ── Floating resume illustration ───────────────────────────── */
function ResumeIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">

      {/* Ambient glow */}
      <div className="absolute w-64 h-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle,#e91e8c,transparent)', top: '10%', left: '10%' }} />
      <div className="absolute w-48 h-48 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle,#7c3aed,transparent)', bottom: '10%', right: '10%' }} />

      {/* Main resume card */}
      <div className="relative z-10 w-64 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>K</div>
          <div>
            <div className="w-24 h-2.5 rounded-full bg-gray-800 mb-1.5" />
            <div className="w-16 h-2 rounded-full bg-gray-300" />
          </div>
        </div>
        {/* Score badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Match Score</span>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full"
            style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)', color: '#7c3aed' }}>87%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: '87%', background: 'linear-gradient(90deg,#e91e8c,#7c3aed)' }} />
        </div>
        {/* Skills */}
        {[['React', true], ['Node.js', true], ['Python', true], ['Docker', false]].map(([skill, match]) => (
          <div key={skill} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-600 font-medium">{skill}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${match ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {match ? '✓ Match' : '✗ Missing'}
            </span>
          </div>
        ))}
      </div>

      {/* Floating JD card */}
      <div className="absolute top-4 -right-4 w-44 bg-white rounded-xl shadow-lg p-3.5 border border-gray-100 z-20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)' }}>
            <Briefcase size={11} className="text-purple-500" />
          </div>
          <span className="text-[10px] font-bold text-gray-700">Job Description</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-1.5">
          <div className="h-full rounded-full bg-purple-200" style={{ width: '70%' }} />
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full mb-1.5">
          <div className="h-full rounded-full bg-pink-200" style={{ width: '90%' }} />
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full">
          <div className="h-full rounded-full bg-purple-100" style={{ width: '55%' }} />
        </div>
      </div>

      {/* Floating score badge */}
      <div className="absolute -bottom-2 -left-4 bg-white rounded-xl shadow-lg px-3.5 py-2.5 border border-gray-100 z-20 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
          <Target size={11} className="text-white" />
        </div>
        <div>
          <p className="text-[9px] text-gray-400 font-medium leading-none">ATS Score</p>
          <p className="text-xs font-extrabold text-gray-800 leading-tight">92 / 100</p>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const navigate = useNavigate();
  const [formData,  setFormData]  = useState({ name: '', email: '', type: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        { from_name: formData.name, from_email: formData.email, query_type: formData.type, message: formData.message },
        'YOUR_PUBLIC_KEY'
      );
      setSubmitted(true);
      setFormData({ name: '', email: '', type: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setError('Failed to send message. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-3 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-50 placeholder-gray-400";

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8"
        style={{ height: '56px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
              <MessageCircle size={15} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
                <span className="hover:text-purple-600 cursor-pointer transition-colors"
                  onClick={() => navigate('/dashboard')}>Dashboard</span>
                <ChevronRight size={10} />
                <span className="text-gray-500 font-medium">Contact Us</span>
              </div>
              <h1 className="text-sm font-semibold text-gray-900 leading-none">Contact Us</h1>
            </div>
          </div>
          <button onClick={() => navigate('/upload')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
            Try JobMorph <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* ── Hero banner ──────────────────────────────────── */}
      <div className="relative overflow-hidden py-20 px-8 text-center"
        style={{ background: 'linear-gradient(160deg,#1e1b4b 0%,#3b1d6e 50%,#1e1b4b 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#e91e8c,transparent)', transform: 'translate(-30%,-30%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#7c3aed,transparent)', transform: 'translate(30%,30%)' }} />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#f472b6' }}>Contact Us</p>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            We're here to help you<br />land your dream job.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: '#a78bfa' }}>
            Have a question, feedback, or need support? Reach out and we'll get back to you within 24 hours.
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* LEFT — Get in touch + illustration */}
          <div>
            <h3 className="text-2xl font-extrabold mb-2" style={{ color: '#1e1b4b' }}>Get in touch</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Whether you need technical support, want to share feedback, or have a partnership idea — we'd love to hear from you.
            </p>

            {/* Contact details */}
            <div className="space-y-4 mb-10">
              {[
                { Icon: Mail,    label: 'Email Us',      value: 'support@jobmorph.ai',     sub: 'We reply within 24 hours'           },
                { Icon: MapPin,  label: 'Our Location',  value: 'Pune, Maharashtra, India', sub: 'India\'s tech capital'             },
                { Icon: Phone,   label: 'Response Time', value: 'Within 24 hours',          sub: 'On all business days'              },
              ].map(({ Icon, label, value, sub }) => (
                <div key={label} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50/20 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#fdf2f8,#f5f3ff)', border: '1px solid #e9d5ff' }}>
                    <Icon size={16} className="text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                    <p className="text-[11px] text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Illustration */}
            <div className="relative h-64 rounded-2xl overflow-visible"
              style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)', border: '1px solid #e9d5ff' }}>
              <ResumeIllustration />
            </div>
          </div>

          {/* RIGHT — Contact form */}
          <div>
            <h3 className="text-2xl font-extrabold mb-2" style={{ color: '#1e1b4b' }}>Send us a message</h3>
            <p className="text-sm text-gray-400 mb-8">Fill out the form below and we'll respond as soon as possible.</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Name</label>
                  <input type="text" name="name" placeholder="Your name"
                    value={formData.name} onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Email</label>
                  <input type="email" name="email" placeholder="your@email.com"
                    value={formData.email} onChange={handleChange} required className={inputCls} />
                </div>
              </div>

              {/* Query type */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Subject</label>
                <select name="type" value={formData.type} onChange={handleChange} required className={inputCls}>
                  <option value="">Select a topic…</option>
                  <option value="support">Technical Support</option>
                  <option value="feedback">Feedback</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Message</label>
                <textarea name="message" placeholder="Tell us how we can help…"
                  rows={6} value={formData.message} onChange={handleChange} required
                  className={inputCls} style={{ resize: 'vertical' }} />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                  : <><Send size={14} /> Send Message</>}
              </button>

              {/* Success */}
              {submitted && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 font-medium">Message sent! We'll get back to you within 24 hours.</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <XCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}
            </form>
          </div>
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