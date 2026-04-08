import React, { useEffect, useState } from "react";
import {
  collection, query, where, getDocs, deleteDoc, doc, updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  Trash2, FileText, Search, AlertCircle, ArrowUpDown, Archive,
  ArchiveRestore, ChevronLeft, ChevronRight, ChevronDown,
  BarChart2, ScanLine, Info, TrendingUp, CalendarDays, X,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

/* ─── Navbar ─────────────────────────────────────────────────── */
function Navbar({ navigate }) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 sm:px-8"
      style={{ height:'56px', display:'flex', alignItems:'center' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background:'linear-gradient(135deg,#e91e8c,#7c3aed)' }}>
          <ScanLine size={15} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1 text-[11px] text-gray-400 leading-none mb-0.5">
            <span className="hover:text-purple-600 cursor-pointer transition-colors hidden sm:block"
              onClick={() => navigate('/dashboard')}>Dashboard</span>
            <ChevronRight size={10} className="hidden sm:block" />
            <span className="text-gray-500 font-medium">Scan History</span>
          </div>
          <h1 className="text-sm font-semibold text-gray-900 leading-none">Scan History</h1>
        </div>
      </div>
    </div>
  );
}

/* ─── Score badge ─────────────────────────────────────────────── */
const getScoreColors = (score) => {
  if (score >= 80) return { stroke:"#10b981", text:"#065f46", track:"#d1fae5", bg:"bg-emerald-50", textCls:"text-emerald-700" };
  if (score >= 60) return { stroke:"#f59e0b", text:"#78350f", track:"#fef3c7", bg:"bg-amber-50",   textCls:"text-amber-700"   };
  return               { stroke:"#ef4444", text:"#7f1d1d", track:"#fee2e2", bg:"bg-red-50",    textCls:"text-red-700"    };
};

const ScoreBadge = ({ score }) => {
  const { stroke, text, track } = getScoreColors(score);
  const r = 20, circ = 2 * Math.PI * r, fill = (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" className="-rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill={track} stroke={track} strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={stroke} strokeWidth="5"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold tracking-tight" style={{ color: text }}>{score}</span>
    </div>
  );
};

/* ─── Stat card ───────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, iconClass }) => (
  <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4">
    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
    <div>
      <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  </div>
);

/* ─── Mobile scan card ────────────────────────────────────────── */
const ScanCard = ({ entry, showArchived, onView, onArchive, onRestore, onDelete, formatDate }) => {
  const colors = getScoreColors(entry.gemini_score);
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
      onClick={() => onView(entry.id)}
    >
      {/* Top row: score + file info */}
      <div className="flex items-start gap-3 mb-3">
        <ScoreBadge score={entry.gemini_score} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-indigo-600 text-sm leading-tight truncate">{entry.resume_name}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.jd_name}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.textCls}`}>
              {entry.gemini_score}% match
            </span>
            <span className="text-[11px] text-gray-400">{formatDate(entry.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* JD preview */}
      {entry.jd_text && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
          {entry.jd_text.slice(0, 120)}{entry.jd_text.length > 120 ? "…" : ""}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100" onClick={e => e.stopPropagation()}>
        {showArchived ? (
          <>
            <button onClick={() => onRestore(entry)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
              <ArchiveRestore size={12} /> Restore
            </button>
            <button onClick={() => onDelete(entry.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onView(entry.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <FileText size={12} /> View Results
            </button>
            <button onClick={() => onArchive(entry)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
              <Archive size={12} /> Archive
            </button>
            <button onClick={() => onDelete(entry.id)}
              className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Main ────────────────────────────────────────────────────── */
const ScanHistory = () => {
  const [allHistory, setAllHistory] = useState([]);
  const [archived,   setArchived]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  const [searchTerm,     setSearchTerm]     = useState("");
  const [sortField,      setSortField]      = useState("date");
  const [sortOrder,      setSortOrder]      = useState("desc");
  const [showSortMenu,   setShowSortMenu]   = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [dateFilter,     setDateFilter]     = useState("all");
  const [showArchived,   setShowArchived]   = useState(false);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [confirmId,      setConfirmId]      = useState(null);
  const [deleting,       setDeleting]       = useState(false);
  const [errorMessage,   setErrorMessage]   = useState("");
  const [showSearch,     setShowSearch]     = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate("/login"); return; }
      try {
        const q = query(collection(db, "resume_analysis"), where("user_id", "==", user.uid));
        const snapshot = await getDocs(q);
        const uniqueMap = new Map();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (!d.timestamp || d.gemini_score == null) return;
          const key = `${d.resume_name}-${d.jd_name}-${d.gemini_score}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
              id: docSnap.id, resume_name: d.resume_name, jd_name: d.jd_name,
              jd_text: d.jd_text || "", gemini_score: Number(d.gemini_score),
              timestamp: d.timestamp, isArchived: d.isArchived || false,
            });
          }
        });
        const all = Array.from(uniqueMap.values());
        setAllHistory(all.filter((h) => !h.isArchived));
        setArchived(all.filter((h) => h.isArchived));
      } catch (err) { console.error("Error loading scan history:", err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, [navigate]);

  const formatDate = (ts) =>
    ts ? new Date(ts.seconds * 1000).toLocaleDateString("en-IN", { year:"numeric", month:"short", day:"numeric" }) : "—";

  const activeList = showArchived ? archived : allHistory;
  const DATE_FILTER_DAYS = { all:null, today:1, "7days":7, "30days":30, "3months":90, "6months":180 };

  const dateFiltered = activeList.filter((e) => {
    const days = DATE_FILTER_DAYS[dateFilter];
    if (!days) return true;
    return e.timestamp.seconds * 1000 >= Date.now() - days * 24 * 60 * 60 * 1000;
  });

  const filtered = dateFiltered.filter((e) =>
    `${e.resume_name} ${e.jd_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) =>
    sortField === "score"
      ? sortOrder === "desc" ? b.gemini_score - a.gemini_score : a.gemini_score - b.gemini_score
      : sortOrder === "desc" ? b.timestamp.seconds - a.timestamp.seconds : a.timestamp.seconds - b.timestamp.seconds
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const startIdx   = (safePage - 1) * ITEMS_PER_PAGE;
  const paginated  = sorted.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  const showFrom   = sorted.length === 0 ? 0 : startIdx + 1;
  const showTo     = Math.min(startIdx + ITEMS_PER_PAGE, sorted.length);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortField, sortOrder, showArchived, dateFilter]);

  const handleArchive = async (entry) => {
    try {
      await updateDoc(doc(db, "resume_analysis", entry.id), { isArchived: true });
      setAllHistory((prev) => prev.filter((h) => h.id !== entry.id));
      setArchived((prev) => [...prev, { ...entry, isArchived: true }]);
    } catch { setErrorMessage("Failed to archive. Please try again."); setTimeout(() => setErrorMessage(""), 4000); }
  };

  const handleRestore = async (entry) => {
    try {
      await updateDoc(doc(db, "resume_analysis", entry.id), { isArchived: false });
      setArchived((prev) => prev.filter((h) => h.id !== entry.id));
      setAllHistory((prev) => [...prev, { ...entry, isArchived: false }]);
    } catch { setErrorMessage("Failed to restore. Please try again."); setTimeout(() => setErrorMessage(""), 4000); }
  };

  const confirmDelete = async () => {
    if (!confirmId || deleting) return;
    setDeleting(true); setErrorMessage("");
    try {
      await deleteDoc(doc(db, "resume_analysis", confirmId));
      setAllHistory((prev) => prev.filter((h) => h.id !== confirmId));
      setArchived((prev)   => prev.filter((h) => h.id !== confirmId));
      setConfirmId(null);
    } catch (err) {
      const msg = err.code === "permission-denied" ? "You do not have permission to delete this scan."
        : err.code === "not-found" ? "Scan not found. It may have already been deleted."
        : "Failed to delete. Please check your connection and try again.";
      setErrorMessage(msg); setTimeout(() => setErrorMessage(""), 5000);
    } finally { setDeleting(false); }
  };

  const averageScore = allHistory.length > 0 ? allHistory.reduce((s, h) => s + h.gemini_score, 0) / allHistory.length : 0;
  const bestScore    = allHistory.length > 0 ? Math.max(...allHistory.map((h) => h.gemini_score)) : 0;

  /* ── Loading ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading scan history…</p>
      </div>
    </div>
  );

  /* ── Empty ── */
  if (allHistory.length === 0 && archived.length === 0) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} />
      <div className="flex items-center justify-center py-32 px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ScanLine className="w-10 h-10 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No scans yet</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Upload a resume and job description to start analyzing how well you match a role.
          </p>
          <button onClick={() => navigate("/upload")}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Upload Resume
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar navigate={navigate} />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* Stat cards — 1 col on mobile, 3 on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          <StatCard icon={FileText}   label="Total Scans"   value={allHistory.length}              iconClass="bg-indigo-50 text-indigo-600"  />
          <StatCard icon={BarChart2}  label="Average Score" value={`${averageScore.toFixed(1)}%`}  iconClass="bg-emerald-50 text-emerald-600" />
          <StatCard icon={TrendingUp} label="Best Score"    value={`${bestScore}%`}                iconClass="bg-amber-50 text-amber-600"    />
        </div>

        {/* ── Toolbar ── */}
        <div className="mb-4">

          {/* Row 1: Tabs + mobile search/sort icons */}
          <div className="flex items-center justify-between gap-3 mb-3">

            {/* Active / Archived tabs */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 gap-1">
              <button onClick={() => setShowArchived(false)}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${!showArchived ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                Active
              </button>
              <button onClick={() => setShowArchived(true)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${showArchived ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Archive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Archived
                {archived.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold leading-none ${showArchived ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {archived.length}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop: full toolbar inline. Mobile: icon buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search scans…" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 w-48 placeholder-gray-400 text-gray-800" />
              </div>
              {/* Sort */}
              <div className="relative">
                <button onClick={() => { setShowSortMenu(v => !v); setShowFilterMenu(false); }}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" /> Sort <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-48 py-1.5 overflow-hidden">
                      {[
                        { label:"Newest first",  field:"date",  order:"desc" },
                        { label:"Oldest first",  field:"date",  order:"asc"  },
                        { label:"Highest score", field:"score", order:"desc" },
                        { label:"Lowest score",  field:"score", order:"asc"  },
                      ].map((opt) => {
                        const active = sortField === opt.field && sortOrder === opt.order;
                        return (
                          <button key={opt.label}
                            onClick={() => { setSortField(opt.field); setSortOrder(opt.order); setShowSortMenu(false); }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${active ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              {/* Date filter */}
              <div className="relative">
                <button onClick={() => { setShowFilterMenu(v => !v); setShowSortMenu(false); }}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${dateFilter !== "all" ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
                  <CalendarDays className="w-4 h-4" />
                  {dateFilter === "all" ? "All time" : dateFilter === "today" ? "Today" : dateFilter === "7days" ? "Last 7 days" : dateFilter === "30days" ? "Last 30 days" : dateFilter === "3months" ? "Last 3 months" : "Last 6 months"}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44 py-1.5 overflow-hidden">
                      {[
                        { label:"All time",      value:"all"      },
                        { label:"Today",         value:"today"    },
                        { label:"Last 7 days",   value:"7days"    },
                        { label:"Last 30 days",  value:"30days"   },
                        { label:"Last 3 months", value:"3months"  },
                        { label:"Last 6 months", value:"6months"  },
                      ].map((opt) => (
                        <button key={opt.value} onClick={() => { setDateFilter(opt.value); setShowFilterMenu(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${dateFilter === opt.value ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile: icon buttons */}
            <div className="flex sm:hidden items-center gap-2">
              <button onClick={() => setShowSearch(v => !v)}
                className={`p-2 rounded-lg border transition-colors ${showSearch ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-white text-gray-500'}`}>
                <Search size={16} />
              </button>
              <div className="relative">
                <button onClick={() => { setShowSortMenu(v => !v); setShowFilterMenu(false); }}
                  className={`p-2 rounded-lg border transition-colors ${sortField !== 'date' || sortOrder !== 'desc' ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-white text-gray-500'}`}>
                  <ArrowUpDown size={16} />
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44 py-1.5 overflow-hidden">
                      {[
                        { label:"Newest first",  field:"date",  order:"desc" },
                        { label:"Oldest first",  field:"date",  order:"asc"  },
                        { label:"Highest score", field:"score", order:"desc" },
                        { label:"Lowest score",  field:"score", order:"asc"  },
                      ].map((opt) => {
                        const active = sortField === opt.field && sortOrder === opt.order;
                        return (
                          <button key={opt.label}
                            onClick={() => { setSortField(opt.field); setSortOrder(opt.order); setShowSortMenu(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${active ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"}`}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="relative">
                <button onClick={() => { setShowFilterMenu(v => !v); setShowSortMenu(false); }}
                  className={`p-2 rounded-lg border transition-colors ${dateFilter !== 'all' ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-gray-200 bg-white text-gray-500'}`}>
                  <CalendarDays size={16} />
                </button>
                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 w-44 py-1.5 overflow-hidden">
                      {[
                        { label:"All time",      value:"all"      },
                        { label:"Today",         value:"today"    },
                        { label:"Last 7 days",   value:"7days"    },
                        { label:"Last 30 days",  value:"30days"   },
                        { label:"Last 3 months", value:"3months"  },
                        { label:"Last 6 months", value:"6months"  },
                      ].map((opt) => (
                        <button key={opt.value} onClick={() => { setDateFilter(opt.value); setShowFilterMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${dateFilter === opt.value ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile search bar — expands when toggled */}
          {showSearch && (
            <div className="flex sm:hidden items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input autoFocus type="text" placeholder="Search scans…" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder-gray-400 text-gray-800" />
              </div>
              {searchTerm && (
                <button onClick={() => setSearchTerm("")}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-400">
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── DESKTOP: Table ── */}
        <div className="hidden sm:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm table-fixed">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-16">Score</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-56">Resume / Job title</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-72">Job description</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-36">Scan date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                          {searchTerm ? `No results for "${searchTerm}"` : "Nothing here yet"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/resultpage/${entry.id}`)}>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <ScoreBadge score={entry.gemini_score} />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors leading-tight max-w-[220px] truncate">{entry.resume_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 max-w-[220px] truncate">{entry.jd_name}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-500 text-xs leading-relaxed max-w-xs line-clamp-2">
                          {entry.jd_text ? entry.jd_text.slice(0, 130) + (entry.jd_text.length > 130 ? "…" : "") : entry.jd_name}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(entry.timestamp)}</span>
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {showArchived ? (
                            <>
                              <button onClick={() => handleRestore(entry)} title="Restore to active"
                                className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                <ArchiveRestore className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirmId(entry.id)} title="Delete permanently"
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleArchive(entry)} title="Archive this scan"
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                <Archive className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirmId(entry.id)} title="Delete this scan"
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop pagination */}
          {sorted.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{showFrom}</span> – <span className="font-semibold text-gray-700">{showTo}</span> of <span className="font-semibold text-gray-700">{sorted.length}</span>
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push("ellipsis-" + i);
                    acc.push(p); return acc;
                  }, [])
                  .map(item =>
                    typeof item === "string" ? (
                      <span key={item} className="w-8 text-center text-gray-400 text-xs">…</span>
                    ) : (
                      <button key={item} onClick={() => setCurrentPage(item)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${safePage === item ? "bg-indigo-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"}`}>
                        {item}
                      </button>
                    )
                  )}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── MOBILE: Card list ── */}
        <div className="sm:hidden">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                {searchTerm ? `No results for "${searchTerm}"` : "Nothing here yet"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paginated.map((entry) => (
                <ScanCard
                  key={entry.id}
                  entry={entry}
                  showArchived={showArchived}
                  onView={(id) => navigate(`/resultpage/${id}`)}
                  onArchive={handleArchive}
                  onRestore={handleRestore}
                  onDelete={(id) => setConfirmId(id)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Mobile pagination */}
          {sorted.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {showFrom}–{showTo} of {sorted.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-xs text-gray-500 font-medium">{safePage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed">
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {showArchived && archived.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Archived scans are hidden from your main history. Use the restore button to move them back.
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Delete this scan?</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">Are you sure you want to delete this scan?<br/>This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmId(null)} disabled={deleting}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
                  No
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting…</> : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {errorMessage && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50">
          <div className="bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 sm:max-w-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">Something went wrong</p>
              <p className="text-xs text-red-200">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage("")} className="text-red-200 hover:text-white transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
    </div>
  );
};

export default ScanHistory;