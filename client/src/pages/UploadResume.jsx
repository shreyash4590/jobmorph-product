import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Upload, FileText, Briefcase, Sparkles, CheckCircle2, ArrowRight, X, AlertCircle } from 'lucide-react';

function UploadResume() {
  const [resume, setResume] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveJd, setDragActiveJd] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  /* ================= AUTH LOGIC ================= */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  /* ================= ERROR MODAL ================= */
  const ErrorModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-fade-in">
        <div className="flex items-start gap-4">
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
          className="mt-6 w-full bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg py-3 px-4 font-semibold hover:from-red-700 hover:to-red-800 transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );

  /* ================= VALIDATION HELPERS ================= */
  const validateJobDescription = (text) => {
    const trimmed = text.trim();
    
    if (!trimmed) {
      return { valid: false, message: "Job description cannot be empty." };
    }
    
    if (trimmed.length < 100) {
      return { 
        valid: false, 
        message: "Job description is too short. Please paste the complete job posting with responsibilities, requirements, and qualifications (minimum 100 characters)." 
      };
    }
    
    // Check if it's just whitespace or meaningless characters
    const meaningfulChars = trimmed.replace(/[\s\n\r\t]/g, '').length;
    if (meaningfulChars < 50) {
      return { 
        valid: false, 
        message: "Job description doesn't contain enough meaningful content. Please paste the actual job posting." 
      };
    }
    
    return { valid: true };
  };

  /* ================= CORE UPLOAD LOGIC ================= */
  const handleAnalyze = useCallback(async () => {
    // Clear previous errors
    setError(null);

    // Validate resume
    if (!resume) {
      setError('Please upload your resume first.');
      return;
    }

    // Validate job description (text or file)
    if (!jdFile && !jobDesc.trim()) {
      setError('Please provide a job description (paste text or upload file).');
      return;
    }

    // Validate job description text if provided
    if (!jdFile && jobDesc.trim()) {
      const jdValidation = validateJobDescription(jobDesc);
      if (!jdValidation.valid) {
        setError(jdValidation.message);
        return;
      }
    }

    // Check authentication
    if (!currentUser) {
      navigate('/login', {
        state: { from: '/upload', pendingRedirect: true },
      });
      return;
    }

    setLoading(true);

    try {
      const idToken = await currentUser.getIdToken(true);

      const formData = new FormData();
      formData.append('resume', resume);

      if (jdFile) {
        formData.append('jd', jdFile);
      } else {
        const jdBlob = new Blob([jobDesc], { type: 'text/plain' });
        const jdTextFile = new File([jdBlob], 'job_description.txt');
        formData.append('jd', jdTextFile);
      }

      const response = await axios.post(
        '/api/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = response.data;

      if (!data.valid || !data.doc_id) {
        setError(data.message || 'Upload failed. Please try again.');
        return;
      }

      // Success - navigate to results
      navigate(`/resultpage/${data.doc_id}`);
      
    } catch (err) {
      console.error('❌ Upload error:', err);
      
      // Handle different error scenarios
      if (err.response?.data?.message) {
        // Backend returned a specific error message
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError('Invalid file or data. Please check your files and try again.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Something went wrong. Please try again or contact support if the issue persists.');
      }
    } finally {
      setLoading(false);
    }
  }, [resume, jobDesc, jdFile, currentUser, navigate]);

  /* ================= FILE UPLOAD HANDLERS ================= */
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    const allowedExtensions = ['pdf', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError('Invalid resume format. Only PDF and DOCX files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Resume file is too large. Maximum size is 10MB.\n\nTip: Try compressing your PDF or removing unnecessary images.');
      return;
    }

    // Check for minimum file size (likely empty)
    if (file.size < 1024) {
      setError('Resume file is too small or empty. Please upload a valid resume.');
      return;
    }

    // Check if same as JD
    if (jdFile && jdFile.name === file.name && jdFile.size === file.size) {
      setError('Resume and Job Description cannot be the same file. Please upload different files.');
      return;
    }

    setResume(file);
    setStep(2);
  };

  const handleJdFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    const allowedExtensions = ['pdf', 'docx', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setError('Invalid JD format. Only PDF, DOCX, and TXT files are allowed.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Job Description file is too large. Maximum size is 15MB.');
      return;
    }

    // Check for minimum file size
    if (file.size < 100) {
      setError('Job Description file is too small or empty. Please upload a valid job posting.');
      return;
    }

    // Check if same as resume
    if (resume && resume.name === file.name && resume.size === file.size) {
      setError('Resume and Job Description cannot be the same file. Please upload different files.');
      return;
    }

    setJdFile(file);
    setJobDesc(''); // Clear text input when file is uploaded
  };

  const handleJobDescChange = (e) => {
    setJobDesc(e.target.value);
    if (e.target.value.trim()) {
      setJdFile(null); // Clear file when text is entered
    }
    setError(null); // Clear errors when typing
  };

  /* ================= DRAG & DROP HANDLERS ================= */
  const handleDrag = (e, isJd = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      isJd ? setDragActiveJd(true) : setDragActive(true);
    } else if (e.type === "dragleave") {
      isJd ? setDragActiveJd(false) : setDragActive(false);
    }
  };

  const handleDrop = (e, isJd = false) => {
    e.preventDefault();
    e.stopPropagation();
    isJd ? setDragActiveJd(false) : setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fakeEvent = { target: { files: [e.dataTransfer.files[0]] } };
      isJd ? handleJdFileUpload(fakeEvent) : handleResumeUpload(fakeEvent);
    }
  };

  /* ================= UI RENDER ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-cyan-200 shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-semibold text-cyan-700">AI-Powered Analysis</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Upload & Analyze Resume
          </h1>
          <p className="text-gray-600 text-lg">
            Get instant insights on how your resume matches the job requirements
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-10 max-w-2xl mx-auto">
          {[
            { icon: Upload, label: 'Upload Resume', num: 1 },
            { icon: Briefcase, label: 'Job Description', num: 2 },
            { icon: CheckCircle2, label: 'View Results', num: 3 }
          ].map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 relative">
              {/* Connector Line */}
              {index < 2 && (
                <div className="absolute top-5 left-1/2 w-full h-1 -z-10">
                  <div className={`h-full transition-all duration-500 rounded ${
                    step > index + 1 ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gray-200'
                  }`}></div>
                </div>
              )}
              
              {/* Step Circle */}
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 shadow-md ${
                step > index + 1
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : step === index + 1
                  ? 'bg-white text-cyan-600 border-2 border-cyan-500'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                {step > index + 1 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{item.num}</span>
                )}
              </div>
              
              {/* Label */}
              <p className={`mt-2 text-xs md:text-sm font-medium transition-colors ${
                step >= index + 1 ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
          
          {/* Resume Upload Section */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-cyan-600" />
              </div>
              Upload Your Resume
              <span className="text-sm font-normal text-red-500">*</span>
            </label>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                dragActive
                  ? 'border-cyan-500 bg-cyan-50'
                  : resume
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-cyan-400 hover:bg-cyan-50/50'
              }`}
              onDragEnter={(e) => handleDrag(e, false)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDragOver={(e) => handleDrag(e, false)}
              onDrop={(e) => handleDrop(e, false)}
            >
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={handleResumeUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {resume ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{resume.name}</p>
                    <p className="text-sm text-gray-500">
                      {(resume.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResume(null);
                      setStep(1);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-cyan-600" />
                  </div>
                  <p className="text-gray-900 font-semibold mb-2">
                    Drag & drop your resume here
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    or click to browse files
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports PDF and DOCX • Maximum 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Job Description Section */}
          <div className={`transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
            <label className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              Job Description
              <span className="text-sm font-normal text-red-500">*</span>
            </label>

            {/* Textarea */}
            <textarea
              rows="8"
              value={jobDesc}
              onChange={handleJobDescChange}
              disabled={step < 2}
              placeholder="Paste the complete job description here including responsibilities, requirements, and qualifications... (minimum 100 characters)"
              className="w-full bg-gray-50 border-2 border-gray-300 rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-all resize-none disabled:cursor-not-allowed"
            />
            
            {/* Character count */}
            {jobDesc.trim().length > 0 && (
              <p className={`text-xs mt-1 ${
                jobDesc.trim().length >= 100 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {jobDesc.trim().length} / 100 characters minimum
                {jobDesc.trim().length < 100 && ` (${100 - jobDesc.trim().length} more needed)`}
              </p>
            )}

            {/* OR Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-gray-500 text-sm font-medium">
                  or upload as file
                </span>
              </div>
            </div>

            {/* JD File Upload */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 ${
                dragActiveJd
                  ? 'border-cyan-500 bg-cyan-50'
                  : jdFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-cyan-400 hover:bg-cyan-50/50'
              }`}
              onDragEnter={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, true)}
              onDragOver={(e) => handleDrag(e, true)}
              onDrop={(e) => handleDrop(e, true)}
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleJdFileUpload}
                disabled={step < 2}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              
              {jdFile ? (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{jdFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(jdFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setJdFile(null);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                  >
                    <X className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 text-center">
                  <Upload className="w-6 h-6 text-cyan-600" />
                  <div>
                    <p className="text-gray-900 font-medium text-sm">
                      Upload JD file (PDF, DOCX, or TXT)
                    </p>
                    <p className="text-xs text-gray-400">
                      Maximum 15MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !resume || (!(jobDesc.trim()) && !jdFile)}
            className="mt-8 w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl py-4 px-6 font-bold text-lg shadow-lg hover:shadow-xl hover:from-cyan-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-3 group"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Your Resume...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Start AI Analysis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { icon: '⚡', title: 'Fast Results', desc: 'Get analysis in seconds' },
            { icon: '🎯', title: 'Accurate Match', desc: 'AI-powered precision' },
            { icon: '🔒', title: 'Secure & Private', desc: 'Your data is protected' }
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UploadResume;






























// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';

// function UploadResume() {
//   const [resume, setResume] = useState(null);
//   const [jobDesc, setJobDesc] = useState('');
//   const [jdFile, setJdFile] = useState(null);
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [currentUser, setCurrentUser] = useState(null);

//   const navigate = useNavigate();

//   /* ================= AUTH LOGIC (UNCHANGED) ================= */
//   useEffect(() => {
//     const auth = getAuth();
//     const unsub = onAuthStateChanged(auth, (user) => {
//       setCurrentUser(user);
//     });
//     return () => unsub();
//   }, []);

//   /* ================= CORE LOGIC (FIXED) ================= */
//   const handleAnalyze = useCallback(async () => {
//     if (!resume || (!(jobDesc.trim()) && !jdFile)) {
//       alert('❗ Please upload a resume and provide a job description.');
//       return;
//     }

//     if (!currentUser) {
//       navigate('/login', {
//         state: { from: '/upload', pendingRedirect: true },
//       });
//       return;
//     }

//     setLoading(true);

//     try {
//       const idToken = await currentUser.getIdToken(true);

//       const formData = new FormData();
//       formData.append('resume', resume);

//       if (jdFile) {
//         formData.append('jd', jdFile);
//       } else {
//         const jdBlob = new Blob([jobDesc], { type: 'text/plain' });
//         const jdTextFile = new File([jdBlob], 'job_description.txt');
//         formData.append('jd', jdTextFile);
//       }

//       const response = await axios.post(
//         'http://127.0.0.1:5000/upload',
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${idToken}`,
//           },
//         }
//       );

//       const data = response.data;
//       console.log('Backend response:', data);

//       if (!data.valid || !data.doc_id) {
//         alert(data.message || '❌ Upload failed.');
//         return;
//       }

//       // ✅ Backend already saved Firestore
//       navigate(`/resultpage/${data.doc_id}`);
//     } catch (error) {
//       console.error('❌ Upload failed:', error);
//       alert('Something went wrong during upload. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [resume, jobDesc, jdFile, currentUser, navigate]);

//   /* ================= UI HANDLERS (UNCHANGED) ================= */
//   const handleResumeUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const allowedExtensions = ['pdf', 'docx'];
//     const ext = file.name.split('.').pop().toLowerCase();

//     if (!allowedExtensions.includes(ext)) {
//       alert('❌ Invalid file. Only PDF and DOCX are allowed.');
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       alert('❌ Resume file exceeds 10MB limit.');
//       return;
//     }

//     if (jdFile && jdFile.name === file.name && jdFile.size === file.size) {
//       alert('❌ Resume and Job Description cannot be the same file.');
//       return;
//     }

//     setResume(file);
//     setStep(2);
//   };

//   const handleJdFileUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const allowedExtensions = ['pdf', 'docx'];
//     const ext = file.name.split('.').pop().toLowerCase();

//     if (!allowedExtensions.includes(ext)) {
//       alert('❌ Invalid JD file. Only PDF and DOCX are allowed.');
//       return;
//     }

//     if (file.size > 15 * 1024 * 1024) {
//       alert('❌ JD file exceeds 15MB limit.');
//       return;
//     }

//     if (resume && resume.name === file.name && resume.size === file.size) {
//       alert('❌ Resume and Job Description cannot be the same file.');
//       return;
//     }

//     setJdFile(file);
//     setJobDesc('');
//   };

//   const handleJobDescChange = (e) => {
//     setJobDesc(e.target.value);
//     setJdFile(null);
//   };

//   /* ================= UI (UNCHANGED) ================= */
//   return (
//     <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-10">
//       <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-3xl transition-all">

//         {/* Step Indicator */}
//         <div className="flex justify-between mb-10">
//           {['Upload Resume', 'Add Job Description', 'View Results'].map(
//             (label, index) => (
//               <div key={index} className="flex flex-col items-center flex-1">
//                 <div
//                   className={`w-10 h-10 flex items-center justify-center rounded-full font-bold shadow-md transition-all ${
//                     step > index
//                       ? 'bg-blue-600 text-white'
//                       : step === index
//                       ? 'bg-blue-100 text-blue-600'
//                       : 'bg-gray-300 text-gray-700'
//                   }`}
//                 >
//                   {index + 1}
//                 </div>
//                 <p className="mt-2 text-sm text-center text-gray-700">
//                   {label}
//                 </p>
//               </div>
//             )
//           )}
//         </div>

//         {/* Resume Upload */}
//         <div className="mb-8">
//           <label className="block font-semibold mb-2 text-gray-800">
//             Resume (PDF or DOCX)
//           </label>
//           <div className="border-dashed border-2 border-gray-300 rounded-md p-5 hover:border-blue-500 transition">
//             <input
//               type="file"
//               accept=".pdf,.docx"
//               onChange={handleResumeUpload}
//               className="w-full text-gray-700"
//             />
//           </div>
//           <p className="text-xs text-gray-500 mt-2">
//             Resume upload limit: 10MB
//           </p>
//         </div>

//         {/* Job Description */}
//         <div className="mb-8">
//           <label className="block font-semibold mb-2 text-gray-800">
//             Job Description
//           </label>
//           <textarea
//             rows="6"
//             value={jobDesc}
//             onChange={handleJobDescChange}
//             placeholder="Paste job description here..."
//             className="w-full border border-gray-300 p-3 rounded-md focus:outline-blue-400 resize-none transition"
//           />

//           <div className="flex items-center my-4">
//             <div className="flex-grow h-px bg-gray-300" />
//             <span className="px-3 text-sm text-gray-500">or</span>
//             <div className="flex-grow h-px bg-gray-300" />
//           </div>

//           <div className="border-dashed border-2 border-gray-300 rounded-md p-5 hover:border-blue-500 transition">
//             <input
//               type="file"
//               accept=".pdf,.docx"
//               onChange={handleJdFileUpload}
//               className="w-full text-gray-700"
//             />
//           </div>
//           <p className="text-xs text-gray-500 mt-2">
//             JD file upload limit: 15MB
//           </p>
//         </div>

//         {/* Analyze Button WITH SPINNER */}
//         <button
//           onClick={handleAnalyze}
//           disabled={loading}
//           className={`mt-6 w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md shadow-md transition ${
//             loading ? 'opacity-60 cursor-not-allowed' : ''
//           }`}
//         >
//           {loading ? (
//             <>
//               <svg
//                 className="animate-spin h-5 w-5 text-white"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                   fill="none"
//                 />
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8v8z"
//                 />
//               </svg>
//               Analyzing...
//             </>
//           ) : (
//             <>Analyze Resume</>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default UploadResume;













































// // Old Working Code.

// // import React, { useState, useEffect, useCallback } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import axios from 'axios';
// // import { getAuth, onAuthStateChanged } from 'firebase/auth';
// // import { db } from '../firebase';
// // import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// // function UploadResume() {
// //   const [resume, setResume] = useState(null);
// //   const [jobDesc, setJobDesc] = useState('');
// //   const [jdFile, setJdFile] = useState(null);
// //   const [step, setStep] = useState(1);
// //   const [loading, setLoading] = useState(false);
// //   const [currentUser, setCurrentUser] = useState(null);

// //   const navigate = useNavigate();

// //   /* ================= AUTH LOGIC (UNCHANGED) ================= */
// //   useEffect(() => {
// //     const auth = getAuth();
// //     const unsub = onAuthStateChanged(auth, (user) => {
// //       setCurrentUser(user);
// //     });
// //     return () => unsub();
// //   }, []);

// //   /* ================= CORE LOGIC (UNCHANGED) ================= */
// //   const handleAnalyze = useCallback(async () => {
// //     if (!resume || (!(jobDesc.trim()) && !jdFile)) {
// //       alert('❗ Please upload a resume and provide a job description.');
// //       return;
// //     }

// //     if (!currentUser) {
// //       navigate('/login', {
// //         state: { from: '/upload', pendingRedirect: true },
// //       });
// //       return;
// //     }

// //     setLoading(true);

// //     try {
// //       const idToken = await currentUser.getIdToken(true);

// //       const formData = new FormData();
// //       formData.append('resume', resume);

// //       if (jdFile) {
// //         formData.append('jd', jdFile);
// //       } else {
// //         const jdBlob = new Blob([jobDesc], { type: 'text/plain' });
// //         const jdTextFile = new File([jdBlob], 'job_description.txt');
// //         formData.append('jd', jdTextFile);
// //       }

// //       const response = await axios.post(
// //         'http://127.0.0.1:5000/upload',
// //         formData,
// //         {
// //           headers: {
// //             'Content-Type': 'multipart/form-data',
// //             Authorization: `Bearer ${idToken}`,
// //           },
// //         }
// //       );

// //       const data = response.data;

// //       if (!data.valid) {
// //         alert(data.message || '❌ Upload failed.');
// //         return;
// //       }

// //       if (data.jd_text) {
// //         localStorage.setItem("latest_jd_text", data.jd_text);
// //       }

// //       const docRef = await addDoc(collection(db, 'resume_analysis'), {
// //         user_id: currentUser.uid,
// //         resume_name: resume.name,
// //         jd_name: jdFile?.name || 'Pasted JD',
// //         gemini_score: data.gemini_score || 0,
// //         gemini_missing_keywords: data.gemini_missing_keywords || [],
// //         gemini_suggestions: data.gemini_suggestions || [],
// //         gemini_learning_resources: data.gemini_learning_resources || [],
// //         timestamp: serverTimestamp(),
// //       });

// //       navigate(`/resultpage/${docRef.id}`);
// //     } catch (error) {
// //       console.error('❌ Upload failed:', error);
// //       alert('Something went wrong during upload. Please try again.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, [resume, jobDesc, jdFile, currentUser, navigate]);

// //   /* ================= UI HANDLERS (UNCHANGED) ================= */
// //   const handleResumeUpload = (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;

// //     const allowedExtensions = ['pdf', 'docx'];
// //     const ext = file.name.split('.').pop().toLowerCase();

// //     if (!allowedExtensions.includes(ext)) {
// //       alert('❌ Invalid file. Only PDF and DOCX are allowed.');
// //       return;
// //     }

// //     if (file.size > 10 * 1024 * 1024) {
// //       alert('❌ Resume file exceeds 10MB limit.');
// //       return;
// //     }

// //     if (jdFile && jdFile.name === file.name && jdFile.size === file.size) {
// //       alert('❌ Resume and Job Description cannot be the same file.');
// //       return;
// //     }

// //     setResume(file);
// //     setStep(2);
// //   };

// //   const handleJdFileUpload = (e) => {
// //     const file = e.target.files[0];
// //     if (!file) return;

// //     const allowedExtensions = ['pdf', 'docx'];
// //     const ext = file.name.split('.').pop().toLowerCase();

// //     if (!allowedExtensions.includes(ext)) {
// //       alert('❌ Invalid JD file. Only PDF and DOCX are allowed.');
// //       return;
// //     }

// //     if (file.size > 15 * 1024 * 1024) {
// //       alert('❌ JD file exceeds 15MB limit.');
// //       return;
// //     }

// //     if (resume && resume.name === file.name && resume.size === file.size) {
// //       alert('❌ Resume and Job Description cannot be the same file.');
// //       return;
// //     }

// //     setJdFile(file);
// //     setJobDesc('');
// //   };

// //   const handleJobDescChange = (e) => {
// //     setJobDesc(e.target.value);
// //     setJdFile(null);
// //   };

// //   /* ================= UI (OLD UI + LOADING ANIMATION) ================= */
// //   return (
// //     <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-10">
// //       <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-3xl transition-all">

// //         {/* Step Indicator */}
// //         <div className="flex justify-between mb-10">
// //           {['Upload Resume', 'Add Job Description', 'View Results'].map(
// //             (label, index) => (
// //               <div key={index} className="flex flex-col items-center flex-1">
// //                 <div
// //                   className={`w-10 h-10 flex items-center justify-center rounded-full font-bold shadow-md transition-all ${
// //                     step > index
// //                       ? 'bg-blue-600 text-white'
// //                       : step === index
// //                       ? 'bg-blue-100 text-blue-600'
// //                       : 'bg-gray-300 text-gray-700'
// //                   }`}
// //                 >
// //                   {index + 1}
// //                 </div>
// //                 <p className="mt-2 text-sm text-center text-gray-700">
// //                   {label}
// //                 </p>
// //               </div>
// //             )
// //           )}
// //         </div>

// //         {/* Resume Upload */}
// //         <div className="mb-8">
// //           <label className="block font-semibold mb-2 text-gray-800">
// //             Resume (PDF or DOCX)
// //           </label>
// //           <div className="border-dashed border-2 border-gray-300 rounded-md p-5 hover:border-blue-500 transition">
// //             <input
// //               type="file"
// //               accept=".pdf,.docx"
// //               onChange={handleResumeUpload}
// //               className="w-full text-gray-700"
// //             />
// //           </div>
// //           <p className="text-xs text-gray-500 mt-2">
// //             Resume upload limit: 10MB
// //           </p>
// //         </div>

// //         {/* Job Description */}
// //         <div className="mb-8">
// //           <label className="block font-semibold mb-2 text-gray-800">
// //             Job Description
// //           </label>
// //           <textarea
// //             rows="6"
// //             value={jobDesc}
// //             onChange={handleJobDescChange}
// //             placeholder="Paste job description here..."
// //             className="w-full border border-gray-300 p-3 rounded-md focus:outline-blue-400 resize-none transition"
// //           />

// //           <div className="flex items-center my-4">
// //             <div className="flex-grow h-px bg-gray-300" />
// //             <span className="px-3 text-sm text-gray-500">or</span>
// //             <div className="flex-grow h-px bg-gray-300" />
// //           </div>

// //           <div className="border-dashed border-2 border-gray-300 rounded-md p-5 hover:border-blue-500 transition">
// //             <input
// //               type="file"
// //               accept=".pdf,.docx"
// //               onChange={handleJdFileUpload}
// //               className="w-full text-gray-700"
// //             />
// //           </div>
// //           <p className="text-xs text-gray-500 mt-2">
// //             JD file upload limit: 15MB
// //           </p>
// //         </div>

// //         {/* Analyze Button WITH SPINNER */}
// //         <button
// //           onClick={handleAnalyze}
// //           disabled={loading}
// //           className={`mt-6 w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md shadow-md transition ${
// //             loading ? 'opacity-60 cursor-not-allowed' : ''
// //           }`}
// //         >
// //           {loading ? (
// //             <>
// //               <svg
// //                 className="animate-spin h-5 w-5 text-white"
// //                 viewBox="0 0 24 24"
// //               >
// //                 <circle
// //                   className="opacity-25"
// //                   cx="12"
// //                   cy="12"
// //                   r="10"
// //                   stroke="currentColor"
// //                   strokeWidth="4"
// //                   fill="none"
// //                 />
// //                 <path
// //                   className="opacity-75"
// //                   fill="currentColor"
// //                   d="M4 12a8 8 0 018-8v8z"
// //                 />
// //               </svg>
// //               Analyzing...
// //             </>
// //           ) : (
// //             <>Analyze Resume</>
// //           )}
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }

// // export default UploadResume;