import React, { useEffect, useState, useMemo, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

const InterviewPrep = () => {
  const [questions, setQuestions] = useState({ hr: [], technical: [], scenario: [] });
  const [interviewProcess, setInterviewProcess] = useState(null);
  const [jobRole, setJobRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("hr");
  const [refreshing, setRefreshing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [practicedQuestions, setPracticedQuestions] = useState(new Set());
  const [showProcessModal, setShowProcessModal] = useState(false);

  const handleCopyQuestion = useCallback((questionText, index) => {
    navigator.clipboard.writeText(questionText).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy question');
    });
  }, []);

  const handleMarkAsPracticed = useCallback((questionKey) => {
    setPracticedQuestions(prev => {
      const newPracticed = new Set(prev);
      if (newPracticed.has(questionKey)) {
        newPracticed.delete(questionKey);
      } else {
        newPracticed.add(questionKey);
      }
      return newPracticed;
    });
  }, []);

  const extractJobRole = useCallback((jdText) => {
    if (!jdText) return "Position";
    
    // Common patterns to extract job title/role
    const patterns = [
      /(?:position|role|title):\s*([^\n]+)/i,
      /(?:job title|job role):\s*([^\n]+)/i,
      /(?:hiring for|looking for|seeking)\s+(?:a\s+)?([^\n,.]+)/i,
      /^([^\n]+?)(?:position|role|opening)/i,
    ];

    for (const pattern of patterns) {
      const match = jdText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: get first line if it looks like a job title (short and capitalized)
    const firstLine = jdText.split('\n')[0].trim();
    if (firstLine.length < 100 && /^[A-Z]/.test(firstLine)) {
      return firstLine;
    }

    return "Position";
  }, []);

  const fetchInterviewPrep = useCallback(async (user) => {
    try {
      setError("");
      
      const q = query(
        collection(db, "resume_analysis"),
        where("user_id", "==", user.uid),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error("Job Description not found. Please analyze a resume first.");
      }

      const latestDoc = snapshot.docs[0].data();
      const jdText = (latestDoc.jd_text || "").trim();

      if (!jdText || jdText.length < 50) {
        throw new Error("Job Description text is missing or too short.");
      }

      // Extract job role from JD
      const extractedRole = extractJobRole(jdText);
      setJobRole(extractedRole);

      const token = await user.getIdToken(true);
      const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

      const res = await fetch(`${apiUrl}/interview-prep`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jd_text: jdText }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to fetch interview questions.");
      }

      if (!json.questions) {
        throw new Error("Invalid response from server.");
      }

      setQuestions({
        hr: json.questions.hr || [],
        technical: json.questions.technical || [],
        scenario: json.questions.scenario || [],
      });

      // Set interview process if available
      if (json.interview_process) {
        setInterviewProcess(json.interview_process);
      }

    } catch (err) {
      console.error("Interview Prep Error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [extractJobRole]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError("You must be logged in to access Interview Prep.");
        setLoading(false);
        return;
      }
      fetchInterviewPrep(user);
    });

    return () => unsubscribe();
  }, [fetchInterviewPrep]);

  const handleRefresh = useCallback(() => {
    const user = auth.currentUser;
    if (user) {
      setRefreshing(true);
      fetchInterviewPrep(user);
    }
  }, [fetchInterviewPrep]);

  const getCategoryIcon = useCallback((type) => {
    const icons = {
      hr: "👥",
      technical: "💻",
      scenario: "🎯"
    };
    return icons[type] || "📝";
  }, []);

  const getCategoryColor = useCallback((type) => {
    const colors = {
      hr: "from-blue-500 to-blue-600",
      technical: "from-purple-500 to-purple-600",
      scenario: "from-green-500 to-green-600"
    };
    return colors[type] || "from-gray-500 to-gray-600";
  }, []);

  const getBorderColor = useCallback((type) => {
    const borders = {
      hr: "border-blue-500",
      technical: "border-purple-500",
      scenario: "border-green-500"
    };
    return borders[type] || "border-gray-500";
  }, []);

  const getTabColor = useCallback((type, isActive) => {
    if (!isActive) return "bg-white text-gray-600 hover:bg-gray-50";
    
    const colors = {
      hr: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      technical: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      scenario: "bg-gradient-to-r from-green-500 to-green-600 text-white"
    };
    return colors[type] || "bg-gray-600 text-white";
  }, []);

  const getStageIcon = useCallback((index) => {
    const icons = ["📝", "💻", "📞", "🎯", "🏗️", "🤝", "🎉"];
    return icons[index] || "✓";
  }, []);

  const getCompanyTypeLabel = useCallback((type) => {
    const labels = {
      tech_giant: "Tech Giant",
      startup: "Startup",
      general: "General Company"
    };
    return labels[type] || "Company";
  }, []);

  const currentQuestions = useMemo(() => questions[activeTab] || [], [questions, activeTab]);
  const totalQuestions = useMemo(() => 
    (questions.hr?.length || 0) + (questions.technical?.length || 0) + (questions.scenario?.length || 0),
    [questions]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Preparing your interview questions...</p>
          <p className="text-gray-500 text-sm mt-2">Analyzing job description and generating personalized questions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-800">Error</h3>
          </div>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/upload'}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Upload Resume & JD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interview Preparation
            </h1>
          </div>
          
          {/* Job Role Display */}
          {jobRole && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300 rounded-full">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span className="text-sm font-semibold text-indigo-800">Preparing for:</span>
                <span className="text-base font-bold text-indigo-900">{jobRole}</span>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 text-lg">
            Practice with AI-generated questions tailored to your job role
          </p>
          
          <div className="flex items-center justify-center gap-6 mt-4 flex-wrap">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span className="font-semibold">{totalQuestions} Questions Generated</span>
            </div>
            
            {/* View Interview Process Button */}
            {interviewProcess && (
              <button
                onClick={() => setShowProcessModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                View Interview Process
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg shadow-md border border-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {["hr", "technical", "scenario"].map((type) => (
            <div
              key={type}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${getBorderColor(type)} transform hover:scale-105 transition cursor-pointer`}
              onClick={() => setActiveTab(type)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`text-4xl bg-gradient-to-r ${getCategoryColor(type)} p-3 rounded-xl shadow-md`}>
                  <span className="filter brightness-150">{getCategoryIcon(type)}</span>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-800">{questions[type]?.length || 0}</div>
                  <div className="text-sm text-gray-500">Questions</div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 capitalize">{type} Round</h3>
              <p className="text-sm text-gray-600 mt-1">
                {type === 'hr' && 'Behavioral and soft skills questions'}
                {type === 'technical' && 'Technical knowledge assessment'}
                {type === 'scenario' && 'Real-world problem solving'}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-3 mb-6 bg-white p-2 rounded-xl shadow-lg">
          {["hr", "technical", "scenario"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all transform ${getTabColor(type, activeTab === type)} ${activeTab === type ? 'shadow-lg scale-105' : ''}`}
            >
              <span className="text-2xl">{getCategoryIcon(type)}</span>
              <span className="capitalize">{type}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${activeTab === type ? 'bg-white/20' : 'bg-gray-200'}`}>
                {questions[type]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Questions Display */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-gradient">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`bg-gradient-to-r ${getCategoryColor(activeTab)} p-3 rounded-xl shadow-md`}>
                <span className="text-3xl filter brightness-150">{getCategoryIcon(activeTab)}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab} Questions</h2>
                <p className="text-sm text-gray-500">Click on any question to expand your answer</p>
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-2 rounded-full">
              <span className="text-sm font-semibold text-gray-700">
                {currentQuestions.length} Questions
              </span>
            </div>
          </div>

          {currentQuestions && currentQuestions.length > 0 ? (
            <div className="space-y-4">
              {currentQuestions.map((q, i) => {
                const questionKey = `${activeTab}-${i}`;
                const isPracticed = practicedQuestions.has(questionKey);
                const isCopied = copiedIndex === i;
                
                return (
                  <div
                    key={i}
                    className={`group bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl shadow-md hover:shadow-xl border-l-4 ${getBorderColor(activeTab)} transition-all transform hover:scale-[1.02] ${isPracticed ? 'bg-green-50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-r ${getCategoryColor(activeTab)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                        {isPracticed ? '✓' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 text-lg leading-relaxed font-medium group-hover:text-gray-900">
                          {q}
                        </p>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                          <button 
                            onClick={() => handleCopyQuestion(q, i)}
                            className={`flex items-center gap-2 text-sm font-semibold transition ${isCopied ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'}`}
                          >
                            {isCopied ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                          <button 
                            onClick={() => handleMarkAsPracticed(questionKey)}
                            className={`flex items-center gap-2 text-sm font-semibold transition ${isPracticed ? 'text-green-700 bg-green-100 px-3 py-1 rounded-full' : 'text-green-600 hover:text-green-800'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {isPracticed ? 'Practiced ✓' : 'Mark as Practiced'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No {activeTab} questions available.</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
              >
                Generate Questions
              </button>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            Interview Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="text-3xl mb-2">💡</div>
              <h4 className="font-bold mb-2">Be Specific</h4>
              <p className="text-sm text-blue-100">Use concrete examples from your experience to support your answers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-bold mb-2">STAR Method</h4>
              <p className="text-sm text-blue-100">Structure answers: Situation, Task, Action, Result</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="text-3xl mb-2">⏱️</div>
              <h4 className="font-bold mb-2">Practice Time</h4>
              <p className="text-sm text-blue-100">Keep answers between 1-2 minutes for better engagement</p>
            </div>
          </div>
        </div>

      </div>

      {/* Interview Process Modal */}
      {showProcessModal && interviewProcess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Interview Process Roadmap</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <p className="text-indigo-100">
                        {interviewProcess.company_name} • {getCompanyTypeLabel(interviewProcess.company_type)}
                      </p>
                      {jobRole && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-sm font-semibold">{jobRole}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Process Timeline */}
            <div className="p-8">
              <div className="mb-6 text-center">
                <p className="text-gray-600 text-lg">
                  Follow this roadmap to navigate the interview process successfully
                </p>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    <span>{interviewProcess.stages.length} Stages</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-200 via-purple-200 to-pink-200"></div>

                {/* Timeline Stages */}
                <div className="space-y-8">
                  {interviewProcess.stages.map((stage, index) => (
                    <div key={index} className="relative flex gap-6">
                      
                      {/* Stage Number/Icon */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                          <span className="text-2xl">{getStageIcon(index)}</span>
                        </div>
                        {index < interviewProcess.stages.length - 1 && (
                          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Stage Content */}
                      <div className="flex-1 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-800">{stage.stage}</h3>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                            {stage.duration}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{stage.description}</p>
                        
                        {/* Tips */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span className="font-semibold text-gray-800">Pro Tips:</span>
                          </div>
                          <ul className="space-y-1">
                            {stage.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-yellow-600 mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Message */}
              <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-500 p-2 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">You've Got This!</h4>
                </div>
                <p className="text-gray-700">
                  Remember, each stage is an opportunity to showcase your skills and learn about the company. 
                  Stay confident, be authentic, and prepare thoroughly for each round.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;


















































































































































// import React, { useEffect, useState } from "react";
// import { auth, db } from "../firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import {
//   collection,
//   query,
//   where,
//   orderBy,
//   limit,
//   getDocs,
// } from "firebase/firestore";

// const InterviewPrep = () => {
//   const [questions, setQuestions] = useState({ hr: [], technical: [], scenario: [] });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchInterviewPrep = async (user) => {
//       try {
//         // 1️⃣ Fetch latest JD text from Firestore
//         const q = query(
//           collection(db, "resume_analysis"),
//           where("user_id", "==", user.uid),
//           orderBy("timestamp", "desc"),
//           limit(1)
//         );

//         const snapshot = await getDocs(q);

//         if (snapshot.empty) {
//           throw new Error("Job Description not found. Please analyze a resume first.");
//         }

//         const latestDoc = snapshot.docs[0].data();
//         const jdText = (latestDoc.jd_text || "").trim();

//         if (!jdText || jdText.length < 50) {
//           throw new Error("Job Description text is missing or too short.");
//         }

//         // 2️⃣ Call Interview Prep API
//         const token = await user.getIdToken(true);
//         const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

//         const res = await fetch(`${apiUrl}/interview-prep`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ jd_text: jdText }),
//         });

//         const json = await res.json();

//         if (!res.ok || json.error) {
//           throw new Error(json.error || "Failed to fetch interview questions.");
//         }

//         if (!json.questions) {
//           throw new Error("Invalid response from server.");
//         }

//         setQuestions({
//           hr: json.questions.hr || [],
//           technical: json.questions.technical || [],
//           scenario: json.questions.scenario || [],
//         });
//       } catch (err) {
//         console.error("Interview Prep Error:", err);
//         setError(err.message || "Something went wrong.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         setError("You must be logged in to access Interview Prep.");
//         setLoading(false);
//         return;
//       }
//       fetchInterviewPrep(user);
//     });

//     return () => unsubscribe();
//   }, []);

//   /* ================= UI STATES ================= */

//   if (loading) {
//     return (
//       <div className="p-6 text-gray-600">
//         ⏳ Preparing interview questions...
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6 text-red-600 font-medium">
//         ❌ {error}
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-3xl font-bold mb-6">🎤 Interview Preparation</h1>

//       {["hr", "technical", "scenario"].map((type) => (
//         <div key={type} className="mb-8">
//           <h2 className="text-xl font-semibold capitalize mb-3">
//             {type} Questions
//           </h2>

//           {questions[type] && questions[type].length > 0 ? (
//             <ul className="space-y-3">
//               {questions[type].map((q, i) => (
//                 <li
//                   key={i}
//                   className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"
//                 >
//                   {q}
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-gray-500 text-sm">
//               No {type} questions available.
//             </p>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default InterviewPrep;

















