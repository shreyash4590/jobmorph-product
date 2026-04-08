import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink, CheckSquare, Search, Building2, ChevronRight,
  Star, Users, DollarSign, BarChart2, Rocket, MessageCircle,
  CheckCircle2, Circle, Lightbulb, AlertTriangle, Handshake,
  Sparkles, TrendingUp, RefreshCw,
} from 'lucide-react';

/* ─── Resources config ──────────────────────────────────────── */
const RESOURCES = [
  {
    name: 'Glassdoor',
    url: 'https://www.glassdoor.com',
    Icon: Star,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-200',
    accent: 'border-l-emerald-400',
    description: 'Company reviews, salaries & interview experiences',
    tags: ['Reviews', 'Salaries', 'Interviews'],
    tagColor: 'bg-emerald-50 text-emerald-700',
    searchUrl: (q) => `https://www.glassdoor.com/Search/results.htm?keyword=${q}`,
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com',
    Icon: Users,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-200',
    accent: 'border-l-blue-400',
    description: 'Company profiles, employee insights & connections',
    tags: ['Network', 'Jobs', 'People'],
    tagColor: 'bg-blue-50 text-blue-700',
    searchUrl: (q) => `https://www.linkedin.com/search/results/companies/?keywords=${q}`,
  },
  {
    name: 'Levels.fyi',
    url: 'https://www.levels.fyi',
    Icon: DollarSign,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    iconBorder: 'border-amber-200',
    accent: 'border-l-amber-400',
    description: 'Tech salaries, levels & compensation breakdowns',
    tags: ['Salaries', 'Equity', 'Levels'],
    tagColor: 'bg-amber-50 text-amber-700',
    searchUrl: () => `https://www.levels.fyi/companies`,
  },
  {
    name: 'Indeed',
    url: 'https://www.indeed.com/companies',
    Icon: BarChart2,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    iconBorder: 'border-red-200',
    accent: 'border-l-red-400',
    description: 'Company ratings, culture & work environment',
    tags: ['Reviews', 'Culture', 'Benefits'],
    tagColor: 'bg-red-50 text-red-700',
    searchUrl: (q) => `https://www.indeed.com/cmp/${q}`,
  },
  {
    name: 'Crunchbase',
    url: 'https://www.crunchbase.com',
    Icon: Rocket,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    iconBorder: 'border-violet-200',
    accent: 'border-l-violet-400',
    description: 'Startup funding, investors & company news',
    tags: ['Funding', 'Investors', 'News'],
    tagColor: 'bg-violet-50 text-violet-700',
    searchUrl: (q) => `https://www.crunchbase.com/textsearch?q=${q}`,
  },
  {
    name: 'Blind',
    url: 'https://www.teamblind.com',
    Icon: MessageCircle,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    iconBorder: 'border-gray-200',
    accent: 'border-l-gray-400',
    description: 'Anonymous workplace discussions & honest insights',
    tags: ['Anonymous', 'Honest', 'Real Talk'],
    tagColor: 'bg-gray-100 text-gray-600',
    searchUrl: (q) => `https://www.teamblind.com/search?q=${q}`,
  },
];

const CHECKLIST_ITEMS = [
  { id:1, text:'Check company reviews on Glassdoor (aim for 3.5+ rating)' },
  { id:2, text:'Research salary ranges on Levels.fyi' },
  { id:3, text:'Read interview experiences on Glassdoor' },
  { id:4, text:'Check company LinkedIn page for culture insights' },
  { id:5, text:'Look for red flags (high turnover, negative reviews)' },
  { id:6, text:'Research company funding on Crunchbase (for startups)' },
  { id:7, text:'Read anonymous discussions on Blind' },
  { id:8, text:'Google recent news about the company' },
];

const PRO_TIPS = [
  {
    Icon: TrendingUp,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    title: 'Be Thorough',
    body: "Check multiple sources for a complete picture. Don't rely on just one review site.",
  },
  {
    Icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    title: 'Watch for Red Flags',
    body: 'High turnover, vague job descriptions, and numerous negative reviews are warning signs.',
  },
  {
    Icon: Handshake,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    title: 'Use Your Network',
    body: 'Connect with current or former employees on LinkedIn for insider perspectives.',
  },
];

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar({ navigate, rightSlot }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-8"
      style={{ height:'56px', display:'flex', alignItems:'center' }}>
      <div className="flex items-center justify-between w-full gap-3">

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
            <Building2 size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            {/* Breadcrumb hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
              <span className="hover:text-purple-600 cursor-pointer transition-colors"
                onClick={() => navigate('/dashboard')}>Dashboard</span>
              <ChevronRight size={10} />
              <span className="text-gray-500 font-medium">Company Research</span>
            </div>
            <h1 className="text-sm font-semibold text-gray-900 leading-none truncate">Company Research Hub</h1>
          </div>
        </div>

        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      </div>
    </div>
  );
}

/* ─── Resource card ─────────────────────────────────────────── */
function ResourceCard({ resource, companyName }) {
  const { name, url, Icon, iconColor, iconBg, iconBorder, accent, description, tags, tagColor, searchUrl } = resource;
  const href = companyName.trim() ? searchUrl(encodeURIComponent(companyName)) : url;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col bg-white border border-gray-200 border-l-4 ${accent} rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:shadow-purple-50 hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg} border ${iconBorder}`}>
          <Icon size={17} className={iconColor} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-gray-900 truncate">{name}</p>
        </div>
        <ExternalLink size={13} className="text-gray-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${tagColor}`}>{t}</span>
        ))}
      </div>
    </a>
  );
}

/* ─── Main component ────────────────────────────────────────── */
export default function CompanyResearchHub() {
  const [company,   setCompany]   = useState('');
  const [checklist, setChecklist] = useState(CHECKLIST_ITEMS.map(i => ({ ...i, done: false })));
  const navigate = useNavigate();

  const doneCount  = checklist.filter(i => i.done).length;
  const totalCount = checklist.length;
  const pct        = Math.round((doneCount / totalCount) * 100);

  const toggle = (id) => setChecklist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));

  const handleResearch = () => {
    if (!company.trim()) return;
    const q = encodeURIComponent(company.trim());
    window.open(`https://www.glassdoor.com/Search/results.htm?keyword=${q}`, '_blank');
    window.open(`https://www.linkedin.com/search/results/companies/?keywords=${q}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar
        navigate={navigate}
        rightSlot={
          doneCount > 0 ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
              <CheckCircle2 size={12} />
              {doneCount}/{totalCount} done
            </div>
          ) : null
        }
      />

      {/* Mobile-safe padding */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">

        {/* Search bar — stacks on mobile */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Research</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all bg-gray-50">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResearch()}
                placeholder="Enter company name…"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-w-0"
              />
            </div>
            <button
              onClick={handleResearch}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background:'linear-gradient(135deg,#e91e8c 0%,#7c3aed 100%)' }}
            >
              <Sparkles size={14} />
              Research
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 ml-1 leading-relaxed">
            💡 Opens Glassdoor & LinkedIn results for the company in new tabs.
          </p>
        </div>

        {/* Resources grid — 1 col mobile, 2 col tablet, 3 col desktop */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Research Platforms</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {RESOURCES.map((r, i) => (
              <ResourceCard key={i} resource={r} companyName={company} />
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 flex items-center gap-3 border-b border-gray-100"
            style={{ background:'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 100%)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
              <CheckSquare size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-gray-900">Research Checklist</p>
              <p className="text-[11px] text-purple-500 font-semibold">{doneCount} of {totalCount} completed</p>
            </div>
            <span className="text-sm font-extrabold flex-shrink-0" style={{ color:'#7c3aed' }}>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100">
            <div className="h-full transition-all duration-500 rounded-full"
              style={{ width:`${pct}%`, background:'linear-gradient(90deg,#e91e8c,#7c3aed)' }} />
          </div>
          {/* Checklist items — 1 col mobile, 2 col sm+ */}
          <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklist.map(item => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 w-full
                  ${item.done
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-gray-50 border-gray-100 hover:border-purple-200 hover:bg-purple-50/30'}`}
              >
                {item.done
                  ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <Circle      size={16} className="text-gray-300 flex-shrink-0 mt-0.5" />
                }
                <span className={`text-xs font-medium leading-relaxed ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Pro tips — 1 col mobile, 3 col sm+ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-amber-500" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pro Research Tips</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {PRO_TIPS.map((tip, i) => {
              const TipIcon = tip.Icon;
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 hover:shadow-md hover:shadow-purple-50 transition-all">
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tip.iconBg}`}>
                    <TipIcon size={16} className={tip.iconColor} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-800 mb-1">{tip.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">Company Research Hub — JobMorph AI</span>
        </div>
      </div>
    </div>
  );
}
