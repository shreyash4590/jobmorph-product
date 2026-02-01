import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import SidebarLayout from '../Layouts/SidebarLayout';

function BatchJobMatcher() {
  const [resume, setResume] = useState(null);
  const [jdFiles, setJdFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  // ================= AUTH LOGIC (SAME AS UPLOADRESUME.JSX) =================
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Handle resume upload
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      alert('❌ Invalid file. Only PDF and DOCX are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Resume file exceeds 10MB limit.');
      return;
    }

    setResume(file);
    setError(null);
  };

  // Handle multiple JD uploads - FIX: APPEND instead of REPLACE
  const handleJdUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate each file
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      const isValid = ['pdf', 'docx', 'txt'].includes(ext);
      
      if (!isValid) {
        alert(`❌ ${file.name} has invalid format. Skipping.`);
      }
      
      if (file.size > 15 * 1024 * 1024) {
        alert(`❌ ${file.name} exceeds 15MB. Skipping.`);
        return false;
      }
      
      return isValid;
    });

    // 🔥 FIX: Append to existing files instead of replacing
    setJdFiles(prev => {
      // Avoid duplicates
      const existingNames = prev.map(f => f.name);
      const newFiles = validFiles.filter(f => !existingNames.includes(f.name));
      return [...prev, ...newFiles];
    });
    
    setError(null);
  };

  // Remove a JD file
  const removeJdFile = (index) => {
    setJdFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Analyze batch - FIX: Use REAL auth token
  const handleBatchAnalyze = async () => {
    if (!resume) {
      alert('❗ Please upload your resume first.');
      return;
    }

    if (jdFiles.length === 0) {
      alert('❗ Please upload at least one job description.');
      return;
    }

    // 🔥 FIX: Check auth SAME way as UploadResume.jsx
    if (!currentUser) {
      navigate('/login', {
        state: { from: '/batch-matcher', pendingRedirect: true },
      });
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setResults(null);

    try {
      // 🔥 FIX: Get REAL Firebase token (same as upload.py)
      const idToken = await currentUser.getIdToken(true);

      const formData = new FormData();
      formData.append('resume', resume);

      // Append all JD files
      jdFiles.forEach(file => {
        formData.append('jds', file);
      });

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 500);

      // 🔥 FIX: Use axios same way as UploadResume.jsx
      const response = await axios.post(
        'http://127.0.0.1:5000/batch/analyze',
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      const data = response.data;

      if (!data.success) {
        setError(data.error || 'Analysis failed');
        return;
      }

      setResults(data.results);
      console.log('✅ Batch analysis complete:', data);

    } catch (err) {
      console.error('❌ Batch analysis error:', err);
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900'; // Gold
    if (rank === 2) return 'bg-gray-300 text-gray-800'; // Silver
    if (rank === 3) return 'bg-orange-400 text-orange-900'; // Bronze
    return 'bg-blue-500 text-white';
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎯 Batch Job Matcher</h1>
          <p className="text-gray-600">Upload your resume and multiple job descriptions to get ranked matches instantly</p>
        </div>

        {/* Upload Section */}
        {!results && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            
            {/* Resume Upload */}
            <div className="mb-8">
              <label className="block font-semibold mb-3 text-gray-800 text-lg">
                📄 Your Resume
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resumeInput"
                />
                <label htmlFor="resumeInput" className="cursor-pointer block text-center">
                  {resume ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-600 font-semibold">✓ {resume.name}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setResume(null);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📤</div>
                      <p className="text-gray-600">Click to upload resume (PDF or DOCX, max 10MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Job Descriptions Upload */}
            <div className="mb-8">
              <label className="block font-semibold mb-3 text-gray-800 text-lg">
                📋 Job Descriptions (Multiple Files)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleJdUpload}
                  className="hidden"
                  id="jdInput"
                  multiple
                />
                <label htmlFor="jdInput" className="cursor-pointer block text-center">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-600">Click to upload job descriptions (PDF, DOCX, or TXT, max 15MB each)</p>
                  <p className="text-sm text-gray-500 mt-2">
                    ✅ You can select multiple files at once OR add files one by one
                  </p>
                </label>
              </div>

              {/* Show uploaded JDs */}
              {jdFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    📋 Uploaded: {jdFiles.length} job description{jdFiles.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {jdFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeJdFile(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">❌ {error}</p>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleBatchAnalyze}
              disabled={loading || !resume || jdFiles.length === 0}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                loading || !resume || jdFiles.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing {jdFiles.length} job{jdFiles.length !== 1 ? 's' : ''}... {progress}%
                </span>
              ) : (
                `🚀 Analyze & Rank ${jdFiles.length || 0} Job${jdFiles.length !== 1 ? 's' : ''}`
              )}
            </button>

          </div>
        )}

        {/* Results Section - SAME AS BEFORE */}
        {results && results.length > 0 && (
          <div className="space-y-6">
            
            {/* Results Header */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">📊 Ranked Job Matches</h2>
                  <p className="text-gray-600 mt-1">Showing {results.length} job{results.length !== 1 ? 's' : ''} sorted by match score</p>
                </div>
                <button
                  onClick={() => {
                    setResults(null);
                    setResume(null);
                    setJdFiles([]);
                    setError(null);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  New Analysis
                </button>
              </div>
            </div>

            {/* Job Cards */}
            {results.map((job, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-md p-6 border-2 ${getScoreBg(job.score)}`}>
                
                {/* Rank Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${getRankBadge(job.rank)}`}>
                        {job.rank}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800">{job.jd_name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{job.match_quality} Match • Priority: {job.priority}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(job.score)}`}>
                      {job.score}%
                    </div>
                    <p className="text-xs text-gray-500">Match Score</p>
                  </div>
                </div>

                {/* Missing Skills */}
                {job.missing_keywords && job.missing_keywords.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      ❌ Missing Skills ({job.missing_keywords.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {job.missing_keywords.slice(0, 10).map((skill, idx) => (
                        <span key={idx} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                      {job.missing_keywords.length > 10 && (
                        <span className="text-xs text-gray-500">+{job.missing_keywords.length - 10} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {job.suggestions && job.suggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">💡 AI Recommendations:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {job.suggestions.slice(0, 3).map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                

              </div>
            ))}

          </div>
        )}

        {/* No Results */}
        {results && results.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Matches Found</h3>
            <p className="text-gray-600 mb-6">None of the job descriptions could be processed. Please check file formats and try again.</p>
            <button
              onClick={() => {
                setResults(null);
                setResume(null);
                setJdFiles([]);
                setError(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}

export default BatchJobMatcher;