import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { AlertCircle, X } from 'lucide-react';
import SidebarLayout from '../Layouts/SidebarLayout';

function NewScan() {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), setUser);
    return () => unsubscribe();
  }, []);

  /* ================= ERROR MODAL ================= */
  const ErrorModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Error</h3>
            <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white rounded-lg py-2.5 px-4 font-semibold hover:bg-red-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );

  /* ================= VALIDATION ================= */
  const validateInput = () => {
    // Validate resume
    if (!resumeText && !resumeFile) {
      setError('Please provide a resume (paste text or upload file).');
      return false;
    }

    if (resumeText && resumeText.trim().length < 100) {
      setError('Resume text is too short. Please paste your complete resume (minimum 100 characters).');
      return false;
    }

    // Validate job description
    if (!jdText && !jdFile) {
      setError('Please provide a job description (paste text or upload file).');
      return false;
    }

    if (jdText && jdText.trim().length < 100) {
      setError('Job description is too short. Please paste the complete job posting with responsibilities and requirements (minimum 100 characters).');
      return false;
    }

    return true;
  };

  /* ================= FILE HANDLERS ================= */
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    const allowedExtensions = ['pdf', 'doc', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError('Invalid resume format. Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Resume file is too large. Maximum size is 10MB.');
      return;
    }

    if (file.size < 1024) {
      setError('Resume file is too small or empty. Please upload a valid resume.');
      return;
    }

    setResumeFile(file);
    setResumeText(''); // Clear text when file is uploaded
  };

  const handleJdUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    const allowedExtensions = ['pdf', 'doc', 'docx', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError('Invalid JD format. Only PDF, DOC, DOCX, and TXT files are allowed.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Job Description file is too large. Maximum size is 15MB.');
      return;
    }

    if (file.size < 100) {
      setError('Job Description file is too small or empty. Please upload a valid job posting.');
      return;
    }

    setJdFile(file);
    setJdText(''); // Clear text when file is uploaded
  };

  /* ================= ANALYZE HANDLER ================= */
  const handleAnalyze = async () => {
    setError(null);

    // Validate inputs
    if (!validateInput()) {
      return;
    }

    if (!user) {
      navigate('/login', {
        state: { from: '/newscan', pendingRedirect: true },
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();

    // Add resume
    if (resumeFile) {
      formData.append('resume', resumeFile);
    } else {
      const resumeBlob = new Blob([resumeText], { type: 'text/plain' });
      formData.append('resume', resumeBlob, 'resume.txt');
    }

    // Add job description
    if (jdFile) {
      formData.append('jd', jdFile);
    } else {
      const jdBlob = new Blob([jdText], { type: 'text/plain' });
      formData.append('jd', jdBlob, 'job_description.txt');
    }

    try {
      // Get Firebase auth token
      const idToken = await user.getIdToken(true);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || result.error || !result.valid) {
        // Handle backend errors
        const errorMessage = result.message || result.error || 'Upload failed. Please try again.';
        setError(errorMessage);
        return;
      }

      // Success - navigate to result page
      if (result.doc_id) {
        navigate(`/resultpage/${result.doc_id}`);
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      
      if (err.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Something went wrong. Please try again or contact support if the issue persists.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze = (resumeText.trim() || resumeFile) && (jdText.trim() || jdFile);

  return (
    <SidebarLayout>
      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">New Scan</h1>
        <button className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100 text-sm transition-colors">
          View a Sample Scan
        </button>
      </div>

      <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Resume Box */}
          <div className="border rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-base">Resume</h2>
              <button className="text-blue-600 text-sm hover:underline">★ Saved Resumes</button>
            </div>

            {resumeFile ? (
              <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-gray-800 font-medium mb-1">{resumeFile.name}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setResumeFile(null)}
                  className="text-red-600 text-sm hover:underline font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : resumeText ? (
              <div className="relative bg-white border border-gray-300 rounded p-3 h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                <button
                  onClick={() => setResumeText('')}
                  className="absolute bottom-2 right-2 bg-white border border-gray-400 rounded px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                {resumeText}
              </div>
            ) : (
              <div>
                <textarea
                  className="w-full h-48 p-4 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:border-blue-500 bg-white transition-colors"
                  placeholder="Paste resume text here... (minimum 100 characters)"
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    setError(null);
                  }}
                />
                {resumeText.trim().length > 0 && (
                  <p className={`text-xs mt-1 ${
                    resumeText.trim().length >= 100 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {resumeText.trim().length} / 100 minimum
                  </p>
                )}
              </div>
            )}

            {/* Upload Box */}
            <div className="border border-dashed border-gray-300 mt-4 p-4 text-center text-sm rounded-md bg-white hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer text-blue-600 font-medium">
                ⬆ Drag & Drop or Upload (PDF, DOC, DOCX)
              </label>
              <p className="text-xs text-gray-500 mt-1">Maximum 10MB</p>
            </div>
          </div>

          {/* JD Box */}
          <div className="border rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-base mb-2">Job Description</h2>

            {jdFile ? (
              <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-800 font-medium mb-1">{jdFile.name}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {(jdFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => setJdFile(null)}
                  className="text-red-600 text-sm hover:underline font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : jdText ? (
              <div className="relative bg-white border border-gray-300 rounded p-3 h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                <button
                  onClick={() => setJdText('')}
                  className="absolute bottom-2 right-2 bg-white border border-gray-400 rounded px-3 py-1 text-xs hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                {jdText}
              </div>
            ) : (
              <div>
                <textarea
                  className="w-full h-48 p-4 border border-gray-200 rounded-md text-sm resize-none focus:outline-none focus:border-blue-500 bg-white transition-colors"
                  placeholder="Copy and paste job description here... (minimum 100 characters)"
                  value={jdText}
                  onChange={(e) => {
                    setJdText(e.target.value);
                    setError(null);
                  }}
                />
                {jdText.trim().length > 0 && (
                  <p className={`text-xs mt-1 ${
                    jdText.trim().length >= 100 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {jdText.trim().length} / 100 minimum
                  </p>
                )}
              </div>
            )}

            {/* Upload Box */}
            <div className="border border-dashed border-gray-300 mt-4 p-4 text-center text-sm rounded-md bg-white hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleJdUpload}
                className="hidden"
                id="jd-upload"
              />
              <label htmlFor="jd-upload" className="cursor-pointer text-blue-600 font-medium">
                ⬆ Drag & Drop or Upload (PDF, DOCX, TXT)
              </label>
              <p className="text-xs text-gray-500 mt-1">Maximum 15MB</p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Available scans: Unlimited{' '}
            <button className="text-blue-600 hover:underline ml-1 text-sm font-medium">
              Upgrade for Pro Features
            </button>
          </p>

          <button
            disabled={loading || !canAnalyze}
            onClick={handleAnalyze}
            className={`px-8 py-3 rounded-lg text-white font-semibold transition-all ${
              loading || !canAnalyze
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </span>
            ) : (
              'Scan & Analyze'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-gray-700">
            <strong className="text-blue-700">💡 Tip:</strong> For best results, make sure your resume and job description contain at least 100 characters of meaningful text. Text-based PDFs work best (not scanned images).
          </p>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default NewScan;