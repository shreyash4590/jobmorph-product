import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs
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
  Line,
  Area,
  AreaChart
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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboardTheme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('dashboardTheme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserName(user.displayName || user.email.split('@')[0]);
      fetchMatchScores(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const fetchMatchScores = async (uid) => {
    try {
      const q = query(
        collection(db, 'resume_analysis'),
        where('user_id', '==', uid)
      );

      const snapshot = await getDocs(q);
      const uniqueMap = new Map();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const ts = data.timestamp?.toDate
          ? data.timestamp.toDate()
          : new Date();

        const key = `${data.resume_name}-${data.jd_name}-${data.gemini_score}`;

        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, {
            id: doc.id,
            date: ts.toLocaleDateString('en-IN'),
            timeLabel: ts.toLocaleString('en-IN', { month: 'short', day: 'numeric' }),
            timestamp: ts,
            score: Number(data.gemini_score || 0),
            resume: data.resume_name || 'Unnamed Resume',
            jd: data.jd_name || 'Unnamed JD'
          });
        }
      });

      const scores = Array.from(uniqueMap.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );

      setScoreHistory(scores);
      setFilteredHistory(scores);
      setLatestGemini(scores[0] || null);

    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scoreHistory.length) return;

    if (selectedRange === 'All') {
      setFilteredHistory(scoreHistory);
      return;
    }

    const days = Number(selectedRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    setFilteredHistory(
      scoreHistory.filter(item => item.timestamp >= cutoff)
    );
  }, [selectedRange, scoreHistory]);

  const getPieData = (score) => [
    { name: 'Matched', value: Math.min(score, 100) },
    { name: 'Gap', value: Math.max(0, 100 - score) }
  ];

  const getBestMatch = () => {
    if (!filteredHistory.length) return null;
    return filteredHistory.reduce((best, curr) =>
      curr.score > best.score ? curr : best
    );
  };

  const getAverageScore = () => {
    if (!filteredHistory.length) return 0;
    const sum = filteredHistory.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / filteredHistory.length);
  };

  const getScoreDistribution = () => {
    const buckets = { Great: 0, Decent: 0, 'Needs Improvement': 0 };

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

  const getScoreBadge = (score) => {
    if (score >= 90) return { text: 'Excellent Match', color: 'bg-green-500', emoji: '🎉' };
    if (score >= 75) return { text: 'Good Match', color: 'bg-blue-500', emoji: '👍' };
    if (score >= 60) return { text: 'Fair Match', color: 'bg-yellow-500', emoji: '📝' };
    return { text: 'Needs Work', color: 'bg-red-500', emoji: '💪' };
  };

  const bg = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className={textPrimary}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} p-3 sm:p-4 md:p-6 lg:p-8 transition-colors duration-300`}>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${textPrimary} mb-1 sm:mb-2`}>
              👋 Welcome back, {userName}!
            </h1>
            <p className={`${textSecondary} text-sm sm:text-base`}>Here's your ATS performance overview</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 ${cardBg} ${textPrimary} border ${borderColor} rounded-lg shadow-sm text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 transition`}
            >
              <option value="All">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          
          {/* Total Scans */}
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor} transform hover:scale-105 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs sm:text-sm font-medium ${textSecondary}`}>Total Scans</span>
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>{filteredHistory.length}</div>
            <p className={`text-xs ${textSecondary} mt-1`}>Resume analyses</p>
          </div>

          {/* Average Score */}
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor} transform hover:scale-105 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs sm:text-sm font-medium ${textSecondary}`}>Avg Score</span>
              <span className="text-xl sm:text-2xl">📈</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>{getAverageScore()}%</div>
            <p className={`text-xs ${textSecondary} mt-1`}>Overall performance</p>
          </div>

          {/* Best Score */}
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor} transform hover:scale-105 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs sm:text-sm font-medium ${textSecondary}`}>Best Score</span>
              <span className="text-xl sm:text-2xl">🏆</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold text-green-600`}>
              {getBestMatch()?.score || 0}%
            </div>
            <p className={`text-xs ${textSecondary} mt-1`}>Highest match</p>
          </div>

          {/* Latest Score */}
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor} transform hover:scale-105 transition-all duration-300`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs sm:text-sm font-medium ${textSecondary}`}>Latest Score</span>
              <span className="text-xl sm:text-2xl">🎯</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${textPrimary}`}>
              {latestGemini?.score || 0}%
            </div>
            <p className={`text-xs ${textSecondary} mt-1`}>Recent scan</p>
          </div>
        </div>

        {/* Latest & Best Match - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Latest Match */}
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
              <h2 className={`text-lg sm:text-xl font-bold ${textPrimary}`}>🎯 Latest Match</h2>
              {latestGemini && (
                <span className={`px-3 py-1 ${getScoreBadge(latestGemini.score).color} text-white text-xs font-semibold rounded-full`}>
                  {getScoreBadge(latestGemini.score).emoji} {getScoreBadge(latestGemini.score).text}
                </span>
              )}
            </div>

            {latestGemini ? (
              <div className="space-y-4">
                <div className="relative w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={getPieData(latestGemini.score)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill={darkMode ? '#374151' : '#e5e7eb'} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl sm:text-4xl font-bold ${textPrimary}`}>
                      {latestGemini.score}%
                    </span>
                    <span className={`text-xs sm:text-sm ${textSecondary}`}>Match Rate</span>
                  </div>
                </div>

                <div className={`p-3 sm:p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                  <p className={`text-xs sm:text-sm ${textSecondary} mb-1`}>Resume vs Job Description</p>
                  <p className={`text-xs sm:text-sm font-medium ${textPrimary} break-words`}>
                    {latestGemini.resume} → {latestGemini.jd}
                  </p>
                  <p className={`text-xs ${textSecondary} mt-2`}>{latestGemini.date}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className={textSecondary}>No scans yet. Upload your resume to get started!</p>
              </div>
            )}
          </div>

          {/* Best Match */}
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor} bg-gradient-to-br ${darkMode ? 'from-gray-800 to-gray-900' : 'from-green-50 to-emerald-50'}`}>
            <h2 className={`text-lg sm:text-xl font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
              🏆 Best Match Ever
            </h2>

            {getBestMatch() ? (
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                    {getBestMatch().score}%
                  </div>
                  <div className="absolute -top-2 -right-2 text-2xl sm:text-3xl animate-bounce">🎉</div>
                </div>
                
                <div className={`p-3 sm:p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm`}>
                  <p className={`text-xs sm:text-sm ${textSecondary} mb-1`}>Winning Combination</p>
                  <p className={`text-sm sm:text-base font-semibold ${textPrimary} break-words`}>
                    {getBestMatch().resume}
                  </p>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>matched with</p>
                  <p className={`text-sm sm:text-base font-semibold ${textPrimary} break-words`}>
                    {getBestMatch().jd}
                  </p>
                </div>

                <div className="inline-block px-4 sm:px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg">
                  Keep up the great work! 🚀
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className={textSecondary}>No matches yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Score Trend Chart */}
        {filteredHistory.length > 0 && (
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor}`}>
            <h2 className={`text-lg sm:text-xl font-bold ${textPrimary} mb-4`}>📈 Match Score Trend</h2>
            
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={filteredHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timeLabel" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Score Distribution */}
        {filteredHistory.length > 0 && (
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor}`}>
            <h2 className={`text-lg sm:text-xl font-bold ${textPrimary} mb-4`}>📊 Score Distribution</h2>
            
            <div className="w-full overflow-x-auto">
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getScoreDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Recent Scans */}
        {filteredHistory.length > 0 && (
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border ${borderColor}`}>
            <h2 className={`text-lg sm:text-xl font-bold ${textPrimary} mb-4`}>🕒 Recent Scans</h2>
            
            <div className="space-y-3">
              {filteredHistory.slice(0, 5).map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 sm:p-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-all duration-200 transform hover:scale-[1.02]`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs sm:text-sm font-semibold ${textPrimary}`}>
                          #{index + 1}
                        </span>
                        <span className={`text-xs sm:text-sm ${textPrimary} break-words`}>
                          {item.resume} → {item.jd}
                        </span>
                      </div>
                      <p className={`text-xs ${textSecondary}`}>{item.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`text-xl sm:text-2xl font-bold ${
                        item.score >= 90 ? 'text-green-600' :
                        item.score >= 75 ? 'text-blue-600' :
                        item.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.score}%
                      </div>
                      <span className="text-lg sm:text-xl">
                        {item.score >= 90 ? '' :
                         item.score >= 75 ? '' :
                         item.score >= 60 ? '' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} 

        {/* Empty State */}
        {filteredHistory.length === 0 && (
          <div className={`${cardBg} rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg border ${borderColor} text-center`}>
            <div className="text-5xl sm:text-6xl mb-4">📊</div>
            <h3 className={`text-xl sm:text-2xl font-bold ${textPrimary} mb-2`}>No Data Yet</h3>
            <p className={`${textSecondary} mb-4 sm:mb-6 text-sm sm:text-base`}>
              Upload your resume and job descriptions to see your performance analytics
            </p>
            <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm sm:text-base rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              Get Started →
            </button>
          </div>
        )}
      </div>

      {/* Dark Mode Toggle - Fixed Bottom Right */}
      <button
        onClick={toggleDarkMode}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 sm:p-4 ${cardBg} rounded-full shadow-2xl border-2 ${borderColor} hover:scale-110 transform transition-all duration-300 z-50 group`}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 group-hover:rotate-180 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:rotate-180 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}

export default Dashboard;