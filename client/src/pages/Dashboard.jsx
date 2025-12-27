import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const COLORS = {
  matched: '#4ade80',
  decent: '#facc15',
  unmatched: '#f87171'
};

function Dashboard() {
  const [userName, setUserName] = useState('User');
  const [scoreHistory, setScoreHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [latestGemini, setLatestGemini] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState('All');

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setScoreHistory([]);
        setLatestGemini(null);
        setLoading(false);
        return;
      }
      setUserName(user.displayName || 'User');
      fetchMatchScores(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchMatchScores = async (uid) => {
    try {
      const q = query(
        collection(db, 'resume_analysis'),
        where('user_id', '==', uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
    

      const uniqueMap = new Map();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.gemini_score !== undefined && data.timestamp ) {
          const key = `${data.resume_name}-${data.jd_name}-${data.gemini_score}`;


          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, {
            date: data.timestamp.toDate().toLocaleDateString('en-IN'),
            timestamp: data.timestamp.toDate(),
            score: Number(data.gemini_score),
            resume: data.resume_name || 'Unnamed Resume',
            jd: data.jd_name || 'Unnamed JD'
      });
    }
  }
});

      const scores = Array.from(uniqueMap.values())
        .sort((a, b) => b.timestamp - a.timestamp);


      if (scores.length > 0) {
        setLatestGemini(scores[0]);
        setScoreHistory(scores);
      }
    } catch (error) {
      console.error('🔥 Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Filter scores based on selected date range
  useEffect(() => {
    if (!scoreHistory.length) return;

    const now = new Date();
    let cutoff;

    switch (selectedRange) {
      case '7':
        cutoff = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30':
        cutoff = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90':
        cutoff = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        setFilteredHistory(scoreHistory);
        return;
    }

    const filtered = scoreHistory.filter(item => item.timestamp >= cutoff);
    setFilteredHistory(filtered);
  }, [selectedRange, scoreHistory]);

  const getPieData = (score) => {
    const decent = 10;
    const matched = Math.min(score, 100);
    const unmatched = Math.max(0, 100 - matched - decent);
    return [
      { name: 'Matched', value: matched },
      { name: 'Decent', value: decent },
      { name: 'Unmatched', value: unmatched }
    ];
  };

  const getBestMatch = () => {
    if (filteredHistory.length === 0) return null;
    return filteredHistory.reduce((best, curr) => (curr.score > best.score ? curr : best), filteredHistory[0]);
  };

  const getScoreDistribution = () => {
    const buckets = {
      Great: 0,
      Decent: 0,
      'Needs Improvement': 0
    };

    filteredHistory.forEach(({ score }) => {
      if (score >= 90) buckets.Great++;
      else if (score >= 70) buckets.Decent++;
      else buckets['Needs Improvement']++;
    });

    return [
      { name: 'Great (90-100)', count: buckets.Great },
      { name: 'Decent (70-89)', count: buckets.Decent },
      { name: 'Needs Improvement (<70)', count: buckets['Needs Improvement'] }
    ];
  };

  return (
    <div className="p-6 sm:p-11 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          👋 Welcome back, {userName}
        </h1>
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm"
        >
          <option value="All">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* 🎯 Latest Match Score */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-br from-pink-100 to-white rounded-2xl p-6 shadow-xl border border-pink-300">
          <h2 className="text-xl font-bold mb-2 text-pink-700">🎯 Latest Match Score</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : latestGemini ? (
            <>
              <p className="text-sm text-gray-500 mb-2">
                {latestGemini.resume} vs {latestGemini.jd} ({latestGemini.date})
              </p>
              <div className="relative w-full flex justify-center items-center">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={getPieData(latestGemini.score)}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill={COLORS.matched} />
                      <Cell fill={COLORS.decent} />
                      <Cell fill={COLORS.unmatched} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-800">
                    {latestGemini.score}%
                  </span>
                  <span className="text-sm text-gray-500">Match Rate</span>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {Object.entries(COLORS).map(([key, color]) => (
                  <div className="flex items-center gap-2" key={key}>
                    <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }}></span>
                    <span className="text-sm text-gray-600 capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400">No latest match score found.</p>
          )}
        </div>

        {/* 🏆 Best Match */}
<div className="bg-gradient-to-br from-lime-100 to-white rounded-2xl p-6 shadow-xl border border-lime-300">
  <h2 className="text-2xl font-extrabold mb-3 text-yellow-700 flex items-center gap-2">
    🏆 Best Match
  </h2>
  {getBestMatch() ? (
    <div className="text-center">
      <p className="text-md text-gray-700 mb-2 font-medium">
        <span className="font-semibold text-gray-800">{getBestMatch().resume}</span> vs <span className="font-semibold text-gray-800">{getBestMatch().jd}</span>
      </p>
      <div className="text-5xl font-extrabold text-green-600 tracking-tight">
        {getBestMatch().score}%
      </div>
      <p className="mt-2 text-sm text-gray-600 italic">Your highest match so far!</p>
      <div className="mt-4 px-4 py-2 inline-block bg-green-100 text-green-800 text-sm font-semibold rounded-full">
        Keep it up! 🎯
      </div>
    </div>
  ) : (
    <p className="text-gray-400 text-center">No match history yet.</p>
  )}
</div>

      </div>

      {/* 📈 Match Score Trend */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-10">
        <h2 className="text-xl font-bold mb-2 text-blue-700">📈 Match Score Trend</h2>
        {filteredHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Match Score (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No score data to display.</p>
        )}
      </div>

      {/* 📊 Score Distribution */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-10">
        <h2 className="text-xl font-bold mb-2 text-purple-700">📊 Score Distribution</h2>
        {filteredHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getScoreDistribution()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#6366f1" name="Scan Count" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">No data available for distribution.</p>
        )}
      </div>

      {/* 🕒 Recent Scans */}
      {filteredHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-10">
          <h2 className="text-xl font-bold mb-2 text-green-700">🕒 Recent Scans</h2>
          <ul className="space-y-3">
            {filteredHistory.slice(0, 3).map((item, idx) => (

              <li
                key={idx}
                className="border border-gray-200 p-4 rounded-lg bg-gray-50 shadow-sm"
              >
                <div className="font-semibold text-gray-800">
                  {item.resume} <span className="text-gray-500">vs</span> {item.jd}
                </div>
                <div className="text-sm text-gray-500">{item.date}</div>
                <div className="text-sm font-semibold text-blue-600">
                  Score: {item.score}%
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🚀 Call to Action */}
      <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-2 text-indigo-700">🚀 Upgrade for More!</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Unlock resume insights powered by AI</li>
          <li>Track job applications effortlessly</li>
          <li>Access exclusive resume templates</li>
          <li>Get noticed by top companies</li>
        </ul>
      </div>
    </div>

    
  );
  
}

export default Dashboard;
