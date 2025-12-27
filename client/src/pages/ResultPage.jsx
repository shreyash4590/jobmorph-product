import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '../Layouts/SidebarLayout';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import html2pdf from 'html2pdf.js';
import { FileText, Lightbulb, AlertCircle, CheckCircle, Info } from 'lucide-react';

function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportRef = useRef();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    const fetchResult = async () => {
      try {
        const docRef = doc(db, 'resume_analysis', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResult({ ...docSnap.data(), id: docSnap.id });
        } else {
          setError('No result found. Try again.');
        }
      } catch (err) {
        setError('Failed to fetch result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, navigate]);

  const score = typeof result?.gemini_score === 'number'
    ? Math.min(Math.max(result.gemini_score, 0), 100)
    : null;

  const hasMissingKeywords = Array.isArray(result?.gemini_missing_keywords) && result.gemini_missing_keywords.length > 0;
  const hasSuggestions = Array.isArray(result?.gemini_suggestions) && result.gemini_suggestions.length > 0;

  const handleDownloadPDF = () => {
    if (reportRef.current) {
      html2pdf().from(reportRef.current).save('JobMorph-Resume-Report.pdf');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <SidebarLayout className="p-0 bg-gray-100">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Resume Match Report</h1>
          <div className="flex gap-3">
            <button onClick={handleDownloadPDF} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Download PDF</button>
            <button onClick={handleCopyLink} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Copy Link</button>
          </div>
        </div>

        <div ref={reportRef} className="bg-white rounded-xl shadow-md p-6">
          {loading ? (
            <p className="text-gray-500">Loading result...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : result ? (
            <>
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" /> Resume Details
                </h2>
                <p><strong>Resume:</strong> {result.resume_name || 'N/A'}</p>
                <p><strong>Job Description:</strong> {result.jd_name || 'N/A'}</p>
              </div>

              <div className="mb-10">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" /> Match Score
                </h2>
                <Tooltip id="scoreTip" place="right">This score shows how well your resume aligns with the job description.</Tooltip>
                {score !== null ? (
                  <div className="w-48 mx-auto">
                    <CircularProgressbar
                      value={score}
                      text={`${score}%`}
                      styles={buildStyles({
                        pathColor: '#4ade80',
                        textColor: '#1f2937',
                        trailColor: '#e5e7eb',
                        textSize: '18px',
                      })}
                    />
                  </div>
                ) : (
                  <p className="text-gray-600">Match score unavailable.</p>
                )}
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2 flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" /> Missing Keywords
                </h3>
                {hasMissingKeywords ? (
                  <ul className="list-disc list-inside text-sm text-gray-800">
                    {result.gemini_missing_keywords.map((kw, idx) => (
                      <li key={idx}>{kw}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-green-600 font-medium flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" /> All critical keywords from the JD are covered.
                  </p>
                )}
              </div>

              <div className="mb-10">
                <h2 className="text-xl font-semibold text-blue-800 mb-2 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" /> Resume Improvement Suggestions
                </h2>
                <p className="text-gray-600 mb-6">Tailored tips to enhance your resume and improve your match rate.</p>
                {hasSuggestions ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.gemini_suggestions.map((tip, idx) => (
                      <div key={idx} className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all">
                        <Lightbulb className="w-5 h-5 mt-1 text-blue-600" />
                        <p className="ml-3 text-sm text-gray-800">{tip}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specific suggestions at this time.</p>
                )}
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-2">Want to scan another job description?</p>
                <button onClick={() => navigate('/upload')} className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 transition">
                  Upload New Job & Resume
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </SidebarLayout>
  );
}

export default ResultPage;
