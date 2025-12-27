import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function UploadResume() {
  const [resume, setResume] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  /* ================= AUTH LOGIC (UNCHANGED) ================= */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  /* ================= CORE LOGIC (UNCHANGED) ================= */
  const handleAnalyze = useCallback(async () => {
    if (!resume || (!(jobDesc.trim()) && !jdFile)) {
      alert('❗ Please upload a resume and provide a job description.');
      return;
    }

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
        'http://127.0.0.1:5000/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = response.data;

      if (!data.valid) {
        alert(data.message || '❌ Upload failed.');
        return;
      }

      const docRef = await addDoc(collection(db, 'resume_analysis'), {
        user_id: currentUser.uid,
        resume_name: resume.name,
        jd_name: jdFile?.name || 'Pasted JD',
        gemini_score: data.gemini_score || 0,
        gemini_missing_keywords: data.gemini_missing_keywords || [],
        gemini_suggestions: data.gemini_suggestions || [],
        gemini_learning_resources: data.gemini_learning_resources || [],
        timestamp: serverTimestamp(),
      });

      navigate(`/resultpage/${docRef.id}`);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert('Something went wrong during upload. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [resume, jobDesc, jdFile, currentUser, navigate]);

  /* ================= UI HANDLERS (UNCHANGED) ================= */
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

    if (jdFile && jdFile.name === file.name && jdFile.size === file.size) {
      alert('❌ Resume and Job Description cannot be the same file.');
      return;
    }

    setResume(file);
    setStep(2);
  };

  const handleJdFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      alert('❌ Invalid JD file. Only PDF and DOCX are allowed.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('❌ JD file exceeds 15MB limit.');
      return;
    }

    if (resume && resume.name === file.name && resume.size === file.size) {
      alert('❌ Resume and Job Description cannot be the same file.');
      return;
    }

    setJdFile(file);
    setJobDesc('');
  };

  const handleJobDescChange = (e) => {
    setJobDesc(e.target.value);
    setJdFile(null);
  };

  /* ================= UI (OLD UI + LOADING ANIMATION) ================= */
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl w-full max-w-3xl transition-all">

        {/* Step Indicator */}
        <div className="flex justify-between mb-10">
          {['Upload Resume', 'Add Job Description', 'View Results'].map(
            (label, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-full font-bold shadow-md transition-all ${
                    step > index
                      ? 'bg-blue-600 text-white'
                      : step === index
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {index + 1}
                </div>
                <p className="mt-2 text-sm text-center text-gray-700">
                  {label}
                </p>
              </div>
            )
          )}
        </div>

        {/* Resume Upload */}
        <div className="mb-8">
          <label className="block font-semibold mb-2 text-gray-800">
            Resume (PDF or DOCX)
          </label>
          <div className="border-dashed border-2 border-gray-300 rounded-md p-5 hover:border-blue-500 transition">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleResumeUpload}
              className="w-full text-gray-700"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Resume upload limit: 10MB
          </p>
        </div>

        {/* Job Description */}
        <div className="mb-8">
          <label className="block font-semibold mb-2 text-gray-800">
            Job Description
          </label>
          <textarea
            rows="6"
            value={jobDesc}
            onChange={handleJobDescChange}
            placeholder="Paste job description here..."
            className="w-full border border-gray-300 p-3 rounded-md focus:outline-blue-400 resize-none transition"
          />

          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-grow h-px bg-gray-300" />
          </div>

          <div className="border-dashed border-2 border-gray-300 rounded-md p-5 hover:border-blue-500 transition">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleJdFileUpload}
              className="w-full text-gray-700"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            JD file upload limit: 15MB
          </p>
        </div>

        {/* Analyze Button WITH SPINNER */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`mt-6 w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md shadow-md transition ${
            loading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            <>Analyze Resume</>
          )}
        </button>
      </div>
    </div>
  );
}

export default UploadResume;