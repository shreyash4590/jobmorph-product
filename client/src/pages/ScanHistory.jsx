import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { Trash2, FileText, Calendar, TrendingUp, Search, AlertCircle, CheckCircle } from "lucide-react";

const ScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const q = query(
          collection(db, "resume_analysis"),
          where("user_id", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        /**
         * 🔑 De-duplicate logic
         * Same resume + JD + score = same scan
         */
        const uniqueMap = new Map();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.timestamp || data.gemini_score == null) return;

          const key = `${data.resume_name}-${data.jd_name}-${data.gemini_score}`;

          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
              id: docSnap.id,
              resume_name: data.resume_name,
              jd_name: data.jd_name,
              gemini_score: Number(data.gemini_score),
              timestamp: data.timestamp
            });
          }
        });

        const cleanedHistory = Array.from(uniqueMap.values()).sort(
          (a, b) => b.timestamp.seconds - a.timestamp.seconds
        );

        setHistory(cleanedHistory);
      } catch (err) {
        console.error("🔥 Error loading scan history:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp.seconds * 1000).toLocaleString("en-IN", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = history.filter((entry) =>
    `${entry.resume_name} ${entry.jd_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const averageScore =
    history.length > 0
      ? history.reduce((sum, h) => sum + h.gemini_score, 0) / history.length
      : 0;

  const confirmDelete = async () => {
    if (!confirmId || deleting) return;

    setDeleting(true);
    setErrorMessage(""); // Clear any previous errors
    
    try {
      // Delete from Firestore
      const docRef = doc(db, "resume_analysis", confirmId);
      await deleteDoc(docRef);
      
      // Update local state immediately
      setHistory((prev) => prev.filter((h) => h.id !== confirmId));
      
      // Close modal
      setConfirmId(null);
      
      console.log("✅ Scan deleted successfully");
    } catch (err) {
      console.error("❌ Error deleting scan:", err);
      
      // Show user-friendly error message
      const errorMsg = err.code === 'permission-denied' 
        ? 'You do not have permission to delete this scan.'
        : err.code === 'not-found'
        ? 'Scan not found. It may have already been deleted.'
        : 'Failed to delete scan. Please check your connection and try again.';
      
      setErrorMessage(errorMsg);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setDeleting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading your scan history...</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Scans Yet</h2>
          <p className="text-gray-600 mb-6">
            Upload a resume and job description to start analyzing matches and building your scan history.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all"
          >
            Upload Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">
            📜 Scan History
          </h1>
          <p className="text-gray-600">View and manage all your resume analysis results</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Scans</p>
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{history.length}</p>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Avg Score</p>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{averageScore.toFixed(1)}%</p>
          </div>

          <div className="bg-white shadow-sm border border-gray-200 p-6 rounded-2xl hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Last Scan</p>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-base font-semibold text-gray-900">
              {formatDate(history[0].timestamp)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by resume or job description..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        {searchTerm && (
          <p className="text-sm text-gray-600 mb-4">
            Found {filteredHistory.length} result{filteredHistory.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Cards Grid */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No results found for "{searchTerm}"</p>
            <p className="text-sm text-gray-500 mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredHistory.map((entry) => (
              <div
                key={entry.id}
                className="group relative bg-white shadow-sm border-2 border-gray-200 rounded-2xl hover:shadow-lg hover:border-indigo-300 transition-all duration-300"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmId(entry.id);
                  }}
                  className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  title="Delete scan"
                >
                  <Trash2 size={18} />
                </button>

                {/* Clickable Card Content */}
                <div
                  onClick={() => navigate(`/resultpage/${entry.id}`)}
                  className="p-6 cursor-pointer"
                >
                  {/* Resume Name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                        {entry.resume_name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        📋 {entry.jd_name}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4" />
                    {formatDate(entry.timestamp)}
                  </div>

                  {/* Score Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border-2 ${getScoreColor(entry.gemini_score)}`}>
                      <TrendingUp className="w-4 h-4" />
                      Match: {entry.gemini_score}%
                    </span>
                    <span className="text-indigo-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Delete Scan?
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete this scan? This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmId(null);
                    setErrorMessage("");
                  }}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">Delete Failed</p>
              <p className="text-sm text-red-100">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="text-white hover:text-red-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ScanHistory;














// import React, { useEffect, useState } from "react";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   deleteDoc,
//   doc
// } from "firebase/firestore";
// import { auth, db } from "../firebase";
// import { useNavigate } from "react-router-dom";
// import { onAuthStateChanged } from "firebase/auth";
// import { Trash2 } from "lucide-react";

// const ScanHistory = () => {
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [confirmId, setConfirmId] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (!user) {
//         navigate("/login");
//         return;
//       }

//       try {
//         const q = query(
//           collection(db, "resume_analysis"),
//           where("user_id", "==", user.uid)
//         );

//         const snapshot = await getDocs(q);

//         /**
//          * 🔑 De-duplicate logic
//          * Same resume + JD + score = same scan
//          */
//         const uniqueMap = new Map();

//         snapshot.forEach((docSnap) => {
//           const data = docSnap.data();
//           if (!data.timestamp || data.gemini_score == null) return;

//           const key = `${data.resume_name}-${data.jd_name}-${data.gemini_score}`;

//           if (!uniqueMap.has(key)) {
//             uniqueMap.set(key, {
//               id: docSnap.id,
//               resume_name: data.resume_name,
//               jd_name: data.jd_name,
//               gemini_score: Number(data.gemini_score),
//               timestamp: data.timestamp
//             });
//           }
//         });

//         const cleanedHistory = Array.from(uniqueMap.values()).sort(
//           (a, b) => b.timestamp.seconds - a.timestamp.seconds
//         );

//         setHistory(cleanedHistory);
//       } catch (err) {
//         console.error("🔥 Error loading scan history:", err);
//       } finally {
//         setLoading(false);
//       }
//     });

//     return () => unsubscribe();
//   }, [navigate]);

//   const formatDate = (timestamp) => {
//     if (!timestamp) return "—";
//     return new Date(timestamp.seconds * 1000).toLocaleString("en-IN");
//   };

//   const filteredHistory = history.filter((entry) =>
//     `${entry.resume_name} ${entry.jd_name}`
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase())
//   );

//   const averageScore =
//     history.length > 0
//       ? history.reduce((sum, h) => sum + h.gemini_score, 0) / history.length
//       : 0;

//   const confirmDelete = async () => {
//     if (!confirmId) return;

//     try {
//       await deleteDoc(doc(db, "resume_analysis", confirmId));
//       setHistory((prev) => prev.filter((h) => h.id !== confirmId));
//       setConfirmId(null);
//     } catch (err) {
//       console.error("❌ Error deleting scan:", err);
//     }
//   };

//   if (loading) {
//     return <div className="p-6 text-gray-600">Loading your scan history…</div>;
//   }

//   if (history.length === 0) {
//     return (
//       <div className="p-6 text-center text-gray-500">
//         <p className="text-lg font-medium">No scans found yet.</p>
//         <p className="text-sm mt-2">
//           Upload a resume and job description to get started.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <h2 className="text-3xl font-bold mb-6">📜 Scan History</h2>

//       {/* Summary */}
//       <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white shadow-sm p-4 rounded-xl text-center">
//           <p className="text-sm text-gray-500">Total Scans</p>
//           <p className="text-2xl font-bold">{history.length}</p>
//         </div>

//         <div className="bg-white shadow-sm p-4 rounded-xl text-center">
//           <p className="text-sm text-gray-500">Average Match Score</p>
//           <p className="text-2xl font-bold">
//             {averageScore.toFixed(2)}%
//           </p>
//         </div>

//         <div className="bg-white shadow-sm p-4 rounded-xl text-center">
//           <p className="text-sm text-gray-500">Last Scan</p>
//           <p className="text-base font-medium">
//             {formatDate(history[0].timestamp)}
//           </p>
//         </div>
//       </div>

//       {/* Search */}
//       <div className="mb-6">
//         <input
//           type="text"
//           placeholder="🔍 Search by Resume or JD name…"
//           className="w-full md:w-1/2 p-3 border rounded-xl"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {filteredHistory.map((entry) => (
//           <div
//             key={entry.id}
//             className="relative p-5 bg-white shadow-md rounded-xl border hover:shadow-lg"
//           >
//             {/* Delete */}
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setConfirmId(entry.id);
//               }}
//               className="absolute top-4 right-4 text-gray-400 hover:text-red-600"
//             >
//               <Trash2 size={18} />
//             </button>

//             {/* Click */}
//             <div
//               onClick={() => navigate(`/resultpage/${entry.id}`)}
//               className="cursor-pointer"
//             >
//               <h3 className="text-lg font-semibold mb-2">
//                 📄 {entry.resume_name}
//               </h3>

//               <p className="text-gray-600 mb-1">
//                 🧾 JD: {entry.jd_name}
//               </p>

//               <p className="text-sm text-gray-500 mb-2">
//                 {formatDate(entry.timestamp)}
//               </p>

//               <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
//                 Match Score: {entry.gemini_score}%
//               </span>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Confirm Delete */}
//       {confirmId && (
//         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-80">
//             <h2 className="text-lg font-semibold mb-4">Delete Scan?</h2>
//             <p className="text-sm text-gray-600 mb-6">
//               This action cannot be undone.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setConfirmId(null)}
//                 className="px-4 py-2 bg-gray-100 rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDelete}
//                 className="px-4 py-2 bg-red-600 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ScanHistory;
