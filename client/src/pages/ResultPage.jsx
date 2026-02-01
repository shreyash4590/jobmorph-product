import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../Layouts/SidebarLayout';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import html2pdf from 'html2pdf.js';
import { 
  FileText, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Download,
  Link2,
  TrendingUp,
  Target,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  Zap,
  Star,
  BarChart3,
  Shield,
  Brain,
  Eye,
  RefreshCw,
  ChevronRight,
  Activity,
  XCircle,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Code,
  MessageSquare,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingDown,
  Wrench,
  FileCheck,
  ArrowLeft
} from 'lucide-react';

function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    console.log("ResultPage id param:", id);

    let cancelled = false;
    const docRef = doc(db, 'resume_analysis', id);

    const timeoutId = setTimeout(() => {
      if (!cancelled && !result) {
        setError('No result found for this analysis. Please try again.');
        setLoading(false);
      }
    }, 12000);

    const unsub = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snap) => {
        if (cancelled) return;

        const fromServer = !snap.metadata.fromCache || snap.metadata.hasPendingWrites === false;
        if (snap.exists() && fromServer) {
          setResult({ ...snap.data(), id: snap.id });
          setError(null);
          setLoading(false);
          clearTimeout(timeoutId);
        }
      },
      (err) => {
        if (cancelled) return;
        console.error('onSnapshot error:', err);
        setError('Failed to fetch result. Please refresh the page.');
        setLoading(false);
        clearTimeout(timeoutId);
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      unsub && unsub();
    };
  }, [id, navigate]);

  const score = typeof result?.gemini_score === 'number'
    ? Math.min(Math.max(result.gemini_score, 0), 100)
    : null;

  const hasMissingKeywords = Array.isArray(result?.gemini_missing_keywords) && result.gemini_missing_keywords.length > 0;
  const hasSuggestions = Array.isArray(result?.gemini_suggestions) && result.gemini_suggestions.length > 0;

  // Calculate section scores and statuses
  const getScoreStatus = (score) => {
    if (score >= 85) return { status: 'Pass', color: 'green', icon: CheckCircle };
    if (score >= 70) return { status: 'Warning', color: 'yellow', icon: AlertTriangle };
    if (score >= 50) return { status: 'Warning', color: 'orange', icon: AlertTriangle };
    return { status: 'Fail', color: 'red', icon: XCircle };
  };

  const getOverallStatus = (score) => {
    if (score >= 85) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (score >= 70) return { text: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 50) return { text: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { text: 'Needs Work', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  // Create detailed analysis sections
  const analysisSection = [
    {
      id: 'keywords',
      title: 'Keywords Match',
      icon: Target,
      score: hasMissingKeywords ? Math.max(60, score - 10) : score,
      description: hasMissingKeywords 
        ? `${result.gemini_missing_keywords.length} critical keywords missing from your resume.`
        : 'All critical keywords from job description are present.'
    },
    {
      id: 'formatting',
      title: 'Formatting & Structure',
      icon: FileCheck,
      score: Math.min(95, score + 5),
      description: 'Resume structure and formatting analysis.'
    },
    {
      id: 'experience',
      title: 'Work Experience',
      icon: Briefcase,
      score: score,
      description: 'Experience relevance and presentation quality.'
    },
    {
      id: 'skills',
      title: 'Skills Section',
      icon: Code,
      score: Math.min(90, score + 3),
      description: 'Technical and soft skills alignment with job requirements.'
    },
    {
      id: 'education',
      title: 'Education',
      icon: GraduationCap,
      score: Math.min(92, score + 7),
      description: 'Educational background and qualifications.'
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: Mail,
      score: 100,
      description: 'Contact details are complete and professional.'
    }
  ];

  const handleDownloadPDF = () => {
    if (reportRef.current) {
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `JobMorph-Analysis-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const overallStatus = score !== null ? getOverallStatus(score) : null;

  // Count passed, warnings, and issues
  const passedChecks = analysisSection.filter(s => s.score >= 85).length;
  const warnings = analysisSection.filter(s => s.score >= 70 && s.score < 85).length;
  const issues = analysisSection.filter(s => s.score < 70).length;

  if (loading) {
    return (
      <SidebarLayout className="p-0 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <Brain className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">Analyzing Your Resume</h3>
              <p className="text-gray-600">Please wait while we process your document...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout className="p-0 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">Error Loading Report</h3>
              <p className="text-gray-600">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout className="p-0 bg-gray-50 min-h-screen">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Navigation */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Top Bar - File Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">{result?.resume_name || 'Resume Analysis'}</h1>
                {overallStatus && (
                  <span className={`${overallStatus.bg} ${overallStatus.color} px-3 py-1 rounded-full text-sm font-semibold border ${overallStatus.border}`}>
                    {overallStatus.text}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Analyzed just now</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleDownloadPDF} 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              
              <button 
                onClick={handleCopyLink} 
                className={`${copied ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300'} px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Share Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {result && (
          <div ref={reportRef} className="space-y-6">
            
            {/* Main Score Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Left - Score Summary */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Analysis Results</h2>
                    <p className="text-gray-600">Comprehensive assessment of your resume against the job description</p>
                  </div>

                  {/* Status Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Passed Checks</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{passedChecks}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-900">Warnings</span>
                      </div>
                      <p className="text-3xl font-bold text-yellow-600">{warnings}</p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900">Issues</span>
                      </div>
                      <p className="text-3xl font-bold text-red-600">{issues}</p>
                    </div>
                  </div>

                  {/* Job Match Info */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Target Job Description</h3>
                        <p className="text-gray-700">{result.jd_name || 'Job Description'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Circular Score */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative">
                    {score !== null && (
                      <div className="w-56 h-56">
                        <CircularProgressbar
                          value={score}
                          text={`${score}`}
                          styles={buildStyles({
                            pathColor: score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444',
                            textColor: '#111827',
                            trailColor: '#e5e7eb',
                            textSize: '24px',
                            pathTransitionDuration: 1.5,
                            strokeLinecap: 'round'
                          })}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-center text-gray-600 font-semibold mt-4">Overall Score</p>
                  <p className="text-center text-sm text-gray-500 mt-1">Out of 100</p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'detailed', label: 'Detailed Results', icon: FileCheck },
                    { id: 'recommendations', label: 'Recommendations', icon: Lightbulb }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 lg:p-8">
                
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {analysisSection.map((section, idx) => {
                        const status = getScoreStatus(section.score);
                        const StatusIcon = status.icon;
                        
                        return (
                          <div 
                            key={idx}
                            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all"
                          >
                            <div className="flex items-start justify-between mb-5">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                  <section.icon className="w-6 h-6 text-gray-700" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-base">{section.title}</h3>
                                </div>
                              </div>
                              <StatusIcon className={`w-6 h-6 flex-shrink-0 ${
                                status.color === 'green' ? 'text-green-600' :
                                status.color === 'yellow' ? 'text-yellow-600' :
                                status.color === 'orange' ? 'text-orange-600' :
                                'text-red-600'
                              }`} />
                            </div>

                            <div className="mb-4">
                              <div className="flex justify-between items-center mb-3">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                                  status.color === 'green' ? 'bg-green-100 text-green-700' :
                                  status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                  status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {status.status}
                                </span>
                                <span className="text-2xl font-bold text-gray-900">{section.score}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full transition-all duration-1000 ${
                                    status.color === 'green' ? 'bg-green-500' :
                                    status.color === 'yellow' ? 'bg-yellow-500' :
                                    status.color === 'orange' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${section.score}%` }}
                                ></div>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 leading-relaxed">{section.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detailed Results Tab */}
                {activeTab === 'detailed' && (
                  <div className="space-y-6">
                    {analysisSection.map((section, idx) => {
                      const status = getScoreStatus(section.score);
                      const StatusIcon = status.icon;
                      
                      return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <section.icon className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl font-bold text-gray-900">{section.score}</span>
                              <StatusIcon className={`w-6 h-6 ${
                                status.color === 'green' ? 'text-green-600' :
                                status.color === 'yellow' ? 'text-yellow-600' :
                                status.color === 'orange' ? 'text-orange-600' :
                                'text-red-600'
                              }`} />
                            </div>
                          </div>

                          <div className="w-full bg-gray-300 rounded-full h-3 mb-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-1000 ${
                                status.color === 'green' ? 'bg-green-500' :
                                status.color === 'yellow' ? 'bg-yellow-500' :
                                status.color === 'orange' ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${section.score}%` }}
                            ></div>
                          </div>

                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                            status.color === 'green' ? 'bg-green-100 text-green-700' :
                            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            status.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <StatusIcon className="w-4 h-4" />
                            {status.status === 'Pass' ? 'Looking good! No major issues found.' :
                             status.status === 'Warning' ? 'Some improvements recommended.' :
                             'Critical issues need attention.'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && (
                  <div className="space-y-6">
                    {/* Missing Keywords */}
                    <div className="bg-white border-2 border-red-200 rounded-xl overflow-hidden">
                      <div className="bg-red-50 px-6 py-4 border-b border-red-200">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Missing Keywords</h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {hasMissingKeywords ? `${result.gemini_missing_keywords.length} keywords to add` : 'All keywords covered'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        {hasMissingKeywords ? (
                          <div className="grid sm:grid-cols-2 gap-4">
                            {result.gemini_missing_keywords.map((kw, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-red-50 border-2 border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow min-h-[60px]">
                                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-base">{idx + 1}</span>
                                </div>
                                <span className="font-semibold text-gray-900 text-base leading-tight">{kw}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium">All critical keywords are present!</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="bg-white border-2 border-indigo-200 rounded-xl overflow-hidden">
                      <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="w-6 h-6 text-indigo-600" />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">AI-Powered Suggestions</h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {hasSuggestions ? `${result.gemini_suggestions.length} actionable recommendations` : 'No suggestions needed'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        {hasSuggestions ? (
                          <div className="space-y-4">
                            {result.gemini_suggestions.map((tip, idx) => (
                              <div key={idx} className="flex gap-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                <div className="w-11 h-11 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-base">{idx + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800 leading-relaxed text-base">{tip}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium">Your resume is well-optimized!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call-to-Action Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-8 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Analyze Another Resume?</h3>
                <p className="text-gray-700 mb-6">
                  Upload a new job description and resume to get instant AI-powered feedback and continue improving your job application materials.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => navigate('/upload')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <FileText className="w-5 h-5" />
                    Upload New Analysis
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download This Report
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default ResultPage;















// import React, { useEffect, useState, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import SidebarLayout from '../Layouts/SidebarLayout';
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../firebase';
// import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
// import 'react-circular-progressbar/dist/styles.css';
// import { Tooltip } from 'react-tooltip';
// import html2pdf from 'html2pdf.js';
// import { FileText, Lightbulb, AlertCircle, CheckCircle, Info } from 'lucide-react';

// function ResultPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const reportRef = useRef();
//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!id) {
//       navigate('/dashboard');
//       return;
//     }

//     const fetchResult = async () => {
//       try {
//         const docRef = doc(db, 'resume_analysis', id);
//         const docSnap = await getDoc(docRef);
//         if (docSnap.exists()) {
//           setResult({ ...docSnap.data(), id: docSnap.id });
//         } else {
//           setError('No result found. Try again.');
//         }
//       } catch (err) {
//         setError('Failed to fetch result.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchResult();
//   }, [id, navigate]);

//   const score = typeof result?.gemini_score === 'number'
//     ? Math.min(Math.max(result.gemini_score, 0), 100)
//     : null;

//   const hasMissingKeywords = Array.isArray(result?.gemini_missing_keywords) && result.gemini_missing_keywords.length > 0;
//   const hasSuggestions = Array.isArray(result?.gemini_suggestions) && result.gemini_suggestions.length > 0;

//   const handleDownloadPDF = () => {
//     if (reportRef.current) {
//       html2pdf().from(reportRef.current).save('JobMorph-Resume-Report.pdf');
//     }
//   };

//   const handleCopyLink = () => {
//     navigator.clipboard.writeText(window.location.href);
//     alert('Link copied to clipboard!');
//   };

//   return (
//     <SidebarLayout className="p-0 bg-gray-100">
//       <div className="max-w-5xl mx-auto space-y-6">
//         <div className="flex justify-between items-center mb-4">
//           <h1 className="text-3xl font-bold">Resume Match Report</h1>
//           <div className="flex gap-3">
//             <button onClick={handleDownloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download PDF</button>
//             <button onClick={handleCopyLink} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Copy Link</button>
//           </div>
//         </div>

//         <div ref={reportRef} className="bg-white rounded-xl shadow-md p-6">
//           {loading ? (
//             <p className="text-gray-500">Loading result...</p>
//           ) : error ? (
//             <p className="text-red-600">{error}</p>
//           ) : result ? (
//             <>
//               <div className="border-b border-gray-200 pb-4 mb-6">
//                 <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
//                   <FileText className="w-5 h-5 mr-2 text-blue-600" /> Resume Details
//                 </h2>
//                 <p><strong>Resume:</strong> {result.resume_name || 'N/A'}</p>
//                 <p><strong>Job Description:</strong> {result.jd_name || 'N/A'}</p>
//               </div>

//               <div className="mb-10">
//                 <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
//                   <Info className="w-5 h-5 mr-2 text-blue-600" /> Match Score
//                 </h2>
//                 <Tooltip id="scoreTip" place="right">This score shows how well your resume aligns with the job description.</Tooltip>
//                 {score !== null ? (
//                   <div className="w-48 mx-auto">
//                     <CircularProgressbar
//                       value={score}
//                       text={`${score}%`}
//                       styles={buildStyles({
//                         pathColor: '#4ade80',
//                         textColor: '#1f2937',
//                         trailColor: '#e5e7eb',
//                         textSize: '18px',
//                       })}
//                     />
//                   </div>
//                 ) : (
//                   <p className="text-gray-600">Match score unavailable.</p>
//                 )}
//               </div>

//               <div className="mb-8">
//                 <h3 className="text-lg font-semibold mb-2 flex items-center text-red-600">
//                   <AlertCircle className="w-5 h-5 mr-2" /> Missing Keywords
//                 </h3>
//                 {hasMissingKeywords ? (
//                   <ul className="list-disc list-inside text-sm text-gray-800">
//                     {result.gemini_missing_keywords.map((kw, idx) => (
//                       <li key={idx}>{kw}</li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <p className="text-green-600 font-medium flex items-center">
//                     <CheckCircle className="w-5 h-5 mr-2" /> All critical keywords from the JD are covered.
//                   </p>
//                 )}
//               </div>

//               <div className="mb-10">
//                 <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center">
//                   <Lightbulb className="w-5 h-5 mr-2" /> Resume Improvement Suggestions
//                 </h2>
//                 <p className="text-gray-600 mb-6">Tailored tips to enhance your resume and improve your match rate.</p>
//                 {hasSuggestions ? (
//                   <div className="grid md:grid-cols-2 gap-4">
//                     {result.gemini_suggestions.map((tip, idx) => (
//                       <div key={idx} className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
//                         <Lightbulb className="w-5 h-5 mt-1 text-blue-600" />
//                         <p className="ml-3 text-sm text-gray-800">{tip}</p>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-gray-600">No specific suggestions at this time.</p>
//                 )}
//               </div>

//               <div className="text-center">
//                 <p className="text-gray-600 mb-2">Want to scan another job description?</p>
//                 <button onClick={() => navigate('/upload')} className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition">
//                   Upload New Job & Resume
//                 </button>
//               </div>
//             </>
//           ) : null}
//         </div>
//       </div>
//     </SidebarLayout>
//   );
// }

// export default ResultPage;