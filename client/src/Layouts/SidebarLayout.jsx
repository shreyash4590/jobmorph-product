// src/layouts/SidebarLayout.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

import {
  LayoutDashboard,
  Map,
  Mic,
  Building2,
  FileCheck2,
  Target,
  History,
  HelpCircle,
  Info,
  Scan,
  User
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Career Skill Map", path: "/missing-skills", icon: Map },
  { name: "Interview Prep", path: "/interview-prep", icon: Mic },
  { name: "Company Research", path: "/company-research", icon: Building2 },
  { name: "ATS Format Checker", path: "/ats-checker", icon: FileCheck2 },
  { name: "Batch Job Matcher", path: "/batch-matcher", icon: Target },
  { name: "Scan History", path: "/history", icon: History },
  { name: "Help Center", path: "/help", icon: HelpCircle },
  { name: "About Us", path: "/about", icon: Info },
];

function SidebarLayout({ children, className = "py-8 px-6" }) {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col fixed top-0 bottom-0 left-0 z-40">
        
        {/* Logo */}
        <div className="p-6 border-b">
          <img src="/jobmorph_logo.png" alt="JobMorph Logo" className="h-10" />
        </div>

        {/* New Scan Button */}
        <div className="px-4 mt-4">
          <button
            onClick={() => navigate("/upload")}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            <Scan size={18} />
            New Scan
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition
                  ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="relative p-4 border-t bg-gray-50">
          <div
            className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800"
            onClick={() => setShowMenu(!showMenu)}
          >
            <User size={18} />
            {userEmail?.split("@")[0] || "Account"}
          </div>

          {showMenu && (
            <div className="absolute bottom-16 left-4 w-56 bg-white border rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 text-xs text-gray-500 border-b">
                {userEmail || "Not Signed In"}
              </div>

              <button
                onClick={() => {
                  navigate("/privacy");
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                Privacy Policy
              </button>

              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pl-64 flex-1 ${className}`}>
        {children}
      </main>
    </div>
  );
}

export default SidebarLayout;







// // src/layouts/SidebarLayout.jsx
// import React, { useEffect, useState } from 'react';
// import { useNavigate, NavLink } from 'react-router-dom';
// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { auth } from '../firebase';

// const menuItems = [
//   { name: 'Dashboard', path: '/dashboard' },
//   { name: 'Career Skill Map', path: '/missing-skills' },
//   { name: "Interview Prep", path: "/interview-prep", icon: "🎤"},
//   { name: 'Company Research', path: '/company-research', icon: '🏢'}, // 🆕 NEW!
//   { name: 'ATS Format Checker', path: '/ats-checker', icon: '✅'}, // 🆕 NEW!
//   { name: 'Batch Job Matcher', path: '/batch-matcher', icon: '🎯'}, // 🆕 NEW!
//   { name: 'Scan History', path: '/history' },
//   { name: 'Help Center', path: '/help' },
//   { name: 'About Us', path: '/about' },
// ];

// function SidebarLayout({ children, className = "py-8 px-4" }) {
//   const navigate = useNavigate();
//   const [userEmail, setUserEmail] = useState('');
//   const [showMenu, setShowMenu] = useState(false);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) setUserEmail(user.email);
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleLogout = async () => {
//     await signOut(auth);
//     sessionStorage.clear();
//     navigate('/login');
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <aside className="w-64 bg-white shadow-md flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40">
//         <div>
//           <div className="p-6 border-b">
//             <img src="/jobmorph_logo.png" alt="Logo" className="h-10" />
//           </div>

//           <div className="flex justify-center mt-4">
//             <button
//               onClick={() => navigate('/upload')}
//               className="w-52 bg-blue-600 text-white py-3 px-4 rounded-md text-lg font-semibold hover:bg-blue-700 transition-all"
//             >
//               + New Scan
//             </button>
//           </div>

//           <nav className="flex flex-col gap-1 px-4 mt-4">
//             {menuItems.map((item) => (
//               <NavLink
//                 key={item.name}
//                 to={item.path}
//                 className={({ isActive }) =>
//                   `block text-left px-4 py-2 rounded transition-all ${
//                     isActive
//                       ? 'bg-blue-100 text-blue-700 font-bold'
//                       : 'text-gray-700 hover:bg-gray-200'
//                   }`
//                 }
//               >
//                 {item.icon && <span className="mr-2">{item.icon}</span>}
//                 {item.name}
//               </NavLink>
//             ))}
//           </nav>
//         </div>

//         {/* User Dropdown */}
//         <div className="relative p-4 border-t bg-gray-50">
//           <div
//             className="cursor-pointer text-sm font-medium text-gray-800"
//             onClick={() => setShowMenu(!showMenu)}
//           >
//             👤 {userEmail?.split('@')[0] || 'Account'}
//           </div>

//           {showMenu && (
//             <div className="absolute bottom-16 left-4 w-52 bg-white shadow-lg rounded-md border z-50">
//               <div className="p-3 text-sm text-gray-600 border-b">
//                 {userEmail || 'Not Signed In'}
//               </div>



//               {/* ✅ Privacy Policy Option */}
//               <button
//                 onClick={() => {
//                   navigate('/privacy');
//                   setShowMenu(false);
//                 }}
//                 className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
//               >
//                 Privacy Policy
//               </button>

//               {/* ✅ Logout Option */}
//               <button
//                 onClick={handleLogout}
//                 className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//               >
//                 Logout
//               </button>
//             </div>
//           )}
//         </div>
//       </aside>

//       {/* Main Content */}
//       <main className={`pl-60 flex-1 ${className}`}>
//         {children}
//       </main>
//     </div>
//   );
// }

// export default SidebarLayout;




