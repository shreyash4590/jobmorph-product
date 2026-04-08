// src/layouts/SidebarLayout.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

import {
  LayoutDashboard, Map, Mic, Building2, FileCheck2,
  Target, History, HelpCircle, Scan, LogOut, Shield,
  ChevronUp, Phone, ChevronDown, X, Menu,
} from "lucide-react";

const menuGroups = [
  {
    label: "Main",
    key: "main",
    collapsible: false,
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "AI Tools",
    key: "aitools",
    collapsible: true,
    items: [
      { name: "Career Skill Map",  path: "/missing-skills",   icon: Map        },
      { name: "Interview Prep",    path: "/interview-prep",   icon: Mic        },
      { name: "Company Research",  path: "/company-research", icon: Building2  },
      { name: "ATS Checker",       path: "/ats-checker",      icon: FileCheck2 },
      { name: "Batch Job Matcher", path: "/batch-matcher",    icon: Target     },
    ],
  },
  {
    label: "Activity",
    key: "activity",
    collapsible: true,
    items: [
      { name: "Scan History", path: "/history", icon: History },
    ],
  },
];

const helpMenuItems = [
  { name: "Help Center", path: "/help",    icon: HelpCircle },
  { name: "Contact Us",  path: "/contact", icon: Phone      },
];

const helpFooterItems = [
  { name: "About",   path: "/about"   },
  { name: "Privacy", path: "/privacy" },
  { name: "Terms",   path: "/terms"   },
  { name: "Pricing", path: "/pricing" },
];

function SidebarLayout() {
  const navigate = useNavigate();
  const [userEmail,    setUserEmail]    = useState("");
  const [displayName,  setDisplayName]  = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [collapsed,    setCollapsed]    = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [openGroups,   setOpenGroups]   = useState({ main: true, aitools: true, activity: true });

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || "");
        try {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setDisplayName(data.fullName || user.displayName || user.email?.split("@")[0] || "Account");
          } else {
            setDisplayName(user.displayName || user.email?.split("@")[0] || "Account");
          }
        } catch {
          setDisplayName(user.displayName || user.email?.split("@")[0] || "Account");
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("#sidebar-user-root")) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    navigate("/login");
  };

  const toggleGroup = (key) => {
    if (collapsed) return;
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const initials = displayName.charAt(0).toUpperCase();

  /* ── Sidebar inner content (shared between desktop + mobile drawer) ── */
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">

      {/* Logo row */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 flex-shrink-0">
        <div
          className="overflow-hidden transition-all duration-300 flex-shrink-0"
          style={{ width: (collapsed && !isMobile) ? "0px" : "auto", opacity: (collapsed && !isMobile) ? 0 : 1 }}
        >
          <img src="/jobmorph_logo.png" alt="JobMorph" className="h-9 w-auto" />
        </div>

        {isMobile ? (
          /* Mobile: close button */
          <button
            onClick={() => setMobileOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all ml-auto"
          >
            <X size={18} />
          </button>
        ) : (
          /* Desktop: collapse toggle */
          <div className="relative group/toggle flex-shrink-0">
            <button
              onClick={() => { setCollapsed(v => !v); setShowUserMenu(false); }}
              className="w-8 h-8 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
            >
              <span className="w-4 h-0.5 bg-current rounded-full" />
              <span className="w-4 h-0.5 bg-current rounded-full" />
              <span className="w-4 h-0.5 bg-current rounded-full" />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover/toggle:opacity-100 transition-opacity pointer-events-none z-50">
              {collapsed ? "Expand menu" : "Collapse menu"}
            </div>
          </div>
        )}
      </div>

      {/* Analyse Resume button */}
      <div className={`pb-3 flex justify-center ${(collapsed && !isMobile) ? "px-2" : "px-4"}`}>
        {(collapsed && !isMobile) ? (
          <div className="relative group/scan">
            <button
              onClick={() => navigate("/upload")}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#e91e8c,#7c3aed)" }}
            >
              <Scan size={15} />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover/scan:opacity-100 transition-opacity pointer-events-none z-50">
              Analyse Resume
            </div>
          </div>
        ) : (
          <button
            onClick={() => { navigate("/upload"); if (isMobile) setMobileOpen(false); }}
            className="flex items-center justify-center gap-2 py-2 px-8 rounded-lg text-xs font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-lg hover:shadow-pink-200 active:scale-95 w-full"
            style={{ background: "linear-gradient(135deg,#e91e8c,#7c3aed)" }}
          >
            <Scan size={13} />
            Analyse Resume
          </button>
        )}
      </div>

      <div className="mx-3 h-px bg-gray-100 mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto pb-3">
        {menuGroups.map((group) => {
          const isOpen = openGroups[group.key];
          return (
            <div key={group.label} className="mb-1">
              {!(collapsed && !isMobile) && (
                <div
                  className={`flex items-center justify-between px-3 py-1.5 ${group.collapsible ? "cursor-pointer select-none" : ""}`}
                  onClick={() => group.collapsible && toggleGroup(group.key)}
                >
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                    {group.label}
                  </p>
                  {group.collapsible && (
                    <ChevronDown
                      size={12}
                      className="text-gray-300 transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                    />
                  )}
                </div>
              )}

              <div
                className="space-y-0.5 overflow-hidden transition-all duration-200"
                style={{
                  maxHeight: (collapsed && !isMobile) || isOpen ? "500px" : "0px",
                  opacity:   (collapsed && !isMobile) || isOpen ? 1 : 0,
                }}
              >
                {group.items.map(({ name, path, icon: Icon }) => (
                  <div key={name} className="relative group/navitem">
                    <NavLink
                      to={path}
                      onClick={() => isMobile && setMobileOpen(false)}
                      className={({ isActive }) =>
                        `relative flex items-center rounded-xl text-sm font-medium transition-all duration-150 group
                        ${(collapsed && !isMobile) ? "justify-center py-2 px-0" : "gap-3 px-3 py-2.5"}
                        ${isActive ? "shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`
                      }
                      style={({ isActive }) =>
                        isActive
                          ? { background: "linear-gradient(135deg,#fce7f3,#ede9fe)", color: "#9333ea" }
                          : {}
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && !(collapsed && !isMobile) && (
                            <span
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                              style={{ background: "linear-gradient(180deg,#e91e8c,#7c3aed)" }}
                            />
                          )}
                          <span
                            className={`flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-all duration-150 ${
                              isActive ? "shadow-sm" : "bg-gray-100 group-hover:bg-gray-200"
                            }`}
                            style={isActive ? { background: "linear-gradient(135deg,#fce7f3,#ede9fe)" } : {}}
                          >
                            <Icon
                              size={14}
                              style={isActive ? { color: "#9333ea" } : {}}
                              className={!isActive ? "text-gray-400 group-hover:text-gray-600" : ""}
                            />
                          </span>
                          {!(collapsed && !isMobile) && (
                            <span
                              className={`truncate ${isActive ? "font-semibold" : ""}`}
                              style={isActive ? { color: "#7c3aed" } : {}}
                            >
                              {name}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>

                    {/* Tooltip — only when desktop collapsed */}
                    {(collapsed && !isMobile) && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover/navitem:opacity-100 transition-opacity pointer-events-none z-50">
                        {name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mx-3 h-px bg-gray-100" />

      {/* User section */}
      <div id="sidebar-user-root" className="relative p-2 flex-shrink-0">
        <div className="relative group/user">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className={`w-full flex items-center rounded-xl hover:bg-gray-50 transition-colors group
              ${(collapsed && !isMobile) ? "justify-center p-2" : "gap-3 px-3 py-2.5"}`}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm"
              style={{ background: "linear-gradient(135deg,#e91e8c,#7c3aed)" }}
            >
              {initials}
            </div>
            {!(collapsed && !isMobile) && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-semibold text-gray-800 truncate leading-none mb-0.5">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate leading-none">{userEmail}</p>
                </div>
                <ChevronUp
                  size={14}
                  className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${showUserMenu ? "rotate-0" : "rotate-180"}`}
                />
              </>
            )}
          </button>

          {(collapsed && !isMobile) && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover/user:opacity-100 transition-opacity pointer-events-none z-50">
              {displayName}
            </div>
          )}
        </div>

        {/* User popup menu */}
        {showUserMenu && (
          <div
            className="absolute bottom-full mb-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50"
            style={{
              minWidth: "200px",
              left: (collapsed && !isMobile) ? "60px" : "8px",
              right: (collapsed && !isMobile) ? "auto" : "8px",
              bottom: "100%",
            }}
          >
            <div className="px-4 py-3" style={{ background: "linear-gradient(135deg,#fce7f3,#ede9fe)" }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#e91e8c,#7c3aed)" }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
              </div>
            </div>

            {helpMenuItems.map(({ name, path, icon: Icon }) => (
              <button
                key={name}
                onClick={() => { setShowUserMenu(false); window.location.href = path; }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Icon size={13} className="text-gray-400 flex-shrink-0" />
                {name}
              </button>
            ))}

            <div className="mx-3 h-px bg-gray-100" />

            <div className="p-1.5 space-y-0.5">
              <button
                onClick={() => { navigate("/privacy"); setShowUserMenu(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Shield size={13} className="text-gray-400" />
                Privacy Policy
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>

            <div className="mx-3 h-px bg-gray-100" />

            <div className="p-2 flex flex-wrap gap-x-3 gap-y-1">
              {helpFooterItems.map(({ name, path }) => (
                <button
                  key={name}
                  onClick={() => { navigate(path); setShowUserMenu(false); }}
                  className="text-xs text-gray-400 hover:text-purple-600 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ═══ MOBILE OVERLAY ══════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═══ MOBILE DRAWER ═══════════════════════════════════════ */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col md:hidden transition-transform duration-300 ease-in-out"
        style={{
          width: "260px",
          background: "#fff",
          borderRight: "1px solid #f3f4f6",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* ═══ DESKTOP SIDEBAR ═════════════════════════════════════ */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 z-40 relative transition-all duration-300"
        style={{
          width: collapsed ? "64px" : "240px",
          background: "#fff",
          borderRight: "1px solid #f3f4f6",
        }}
      >
        <SidebarContent isMobile={false} />
      </aside>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
          >
            <Menu size={20} />
          </button>

          <img src="/jobmorph_logo.png" alt="JobMorph" className="h-7 w-auto" />

          <button
            onClick={() => navigate("/upload")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#e91e8c,#7c3aed)" }}
          >
            <Scan size={15} />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default SidebarLayout;