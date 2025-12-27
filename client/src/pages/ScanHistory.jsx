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
import { Trash2 } from "lucide-react";

const ScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmId, setConfirmId] = useState(null);
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
    return new Date(timestamp.seconds * 1000).toLocaleString("en-IN");
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
    if (!confirmId) return;

    try {
      await deleteDoc(doc(db, "resume_analysis", confirmId));
      setHistory((prev) => prev.filter((h) => h.id !== confirmId));
      setConfirmId(null);
    } catch (err) {
      console.error("❌ Error deleting scan:", err);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading your scan history…</div>;
  }

  if (history.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-lg font-medium">No scans found yet.</p>
        <p className="text-sm mt-2">
          Upload a resume and job description to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">📜 Scan History</h2>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white shadow-sm p-4 rounded-xl text-center">
          <p className="text-sm text-gray-500">Total Scans</p>
          <p className="text-2xl font-bold">{history.length}</p>
        </div>

        <div className="bg-white shadow-sm p-4 rounded-xl text-center">
          <p className="text-sm text-gray-500">Average Match Score</p>
          <p className="text-2xl font-bold">
            {averageScore.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white shadow-sm p-4 rounded-xl text-center">
          <p className="text-sm text-gray-500">Last Scan</p>
          <p className="text-base font-medium">
            {formatDate(history[0].timestamp)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search by Resume or JD name…"
          className="w-full md:w-1/2 p-3 border rounded-xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredHistory.map((entry) => (
          <div
            key={entry.id}
            className="relative p-5 bg-white shadow-md rounded-xl border hover:shadow-lg"
          >
            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmId(entry.id);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>

            {/* Click */}
            <div
              onClick={() => navigate(`/resultpage/${entry.id}`)}
              className="cursor-pointer"
            >
              <h3 className="text-lg font-semibold mb-2">
                📄 {entry.resume_name}
              </h3>

              <p className="text-gray-600 mb-1">
                🧾 JD: {entry.jd_name}
              </p>

              <p className="text-sm text-gray-500 mb-2">
                {formatDate(entry.timestamp)}
              </p>

              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                Match Score: {entry.gemini_score}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Delete */}
      {confirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Delete Scan?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="px-4 py-2 bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
