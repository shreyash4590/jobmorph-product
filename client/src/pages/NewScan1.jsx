import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import SidebarLayout from '../Layouts/SidebarLayout';

function NewScan() {
  const navigate = useNavigate();
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), setUser);
    return () => unsubscribe();
  }, []);

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeText('');
    }
  };

  const handleJdUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setJdFile(file);
      setJdText('');
    }
  };

  const handleAnalyze = async () => {
    if ((!resumeText && !resumeFile) || (!jdText && !jdFile)) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('user_id', user?.uid || 'guest');

    if (resumeFile) {
      formData.append('resume', resumeFile);
    } else {
      formData.append('resume', new Blob([resumeText], { type: 'text/plain' }), 'resume.txt');
    }

    if (jdFile) {
      formData.append('jd', jdFile);
    } else {
      formData.append('jd', new Blob([jdText], { type: 'text/plain' }), 'jd.txt');
    }

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.error) alert('Error: ' + result.error);
      else navigate('/dashboard');
    } catch (error) {
      alert('Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">New scan</h1>
        <button className="border border-gray-300 rounded px-4 py-2 hover:bg-gray-100 text-sm">
          View a Sample Scan
        </button>
      </div>

      <div className="bg-white border border-blue-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Resume Box */}
          <div className="border rounded-lg bg-gray-50 p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-base">Resume</h2>
              <button className="text-blue-600 text-sm hover:underline">★ Saved Resumes</button>
            </div>

            {resumeFile ? (
              <div className="text-center py-8">
                <p className="text-gray-800 font-medium">{resumeFile.name}</p>
                <button
                  onClick={() => setResumeFile(null)}
                  className="text-red-500 text-sm mt-1 hover:underline"
                >
                  Remove selected file
                </button>
              </div>
            ) : resumeText ? (
              <div className="relative bg-white border border-gray-300 rounded p-3 h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                <button
                  onClick={() => setResumeText('')}
                  className="absolute bottom-2 right-2 bg-white border border-gray-400 rounded px-2 py-1 text-xs"
                >
                  Clear
                </button>
                {resumeText}
              </div>
            ) : (
              <textarea
                className="w-full h-48 p-4 border border-gray-200 rounded-md text-sm resize-none focus:outline-none bg-white"
                placeholder="Paste resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            )}

            {/* Upload Box */}
            <div className="border border-dashed border-gray-300 mt-4 p-4 text-center text-sm rounded-md bg-white">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer text-blue-600">
                ⬆ Drag & Drop or Upload
              </label>
            </div>
          </div>

          {/* JD Box */}
          <div className="border rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-base mb-2">Job Description</h2>

            {jdFile ? (
              <div className="text-center py-8">
                <p className="text-gray-800 font-medium">{jdFile.name}</p>
                <button
                  onClick={() => setJdFile(null)}
                  className="text-red-500 text-sm mt-1 hover:underline"
                >
                  Remove selected file
                </button>
              </div>
            ) : jdText ? (
              <div className="relative bg-white border border-gray-300 rounded p-3 h-48 overflow-y-auto text-sm whitespace-pre-wrap">
                <button
                  onClick={() => setJdText('')}
                  className="absolute bottom-2 right-2 bg-white border border-gray-400 rounded px-2 py-1 text-xs"
                >
                  Clear
                </button>
                {jdText}
              </div>
            ) : (
              <textarea
                className="w-full h-48 p-4 border border-gray-200 rounded-md text-sm resize-none focus:outline-none bg-white"
                placeholder="Copy and paste job description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            )}

            {/* Upload Box */}
            <div className="border border-dashed border-gray-300 mt-4 p-4 text-center text-sm rounded-md bg-white">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleJdUpload}
                className="hidden"
                id="jd-upload"
              />
              <label htmlFor="jd-upload" className="cursor-pointer text-blue-600">
                ⬆ Drag & Drop or Upload
              </label>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Available scans: 0{' '}
            <button className="text-blue-600 hover:underline ml-1 text-sm">
              Upgrade
            </button>
          </p>

          <button
            disabled={loading || (!resumeText && !resumeFile) || (!jdText && !jdFile)}
            onClick={handleAnalyze}
            className={`px-6 py-2 rounded text-white font-medium ${
              loading || (!resumeText && !resumeFile) || (!jdText && !jdFile)
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Analyzing...' : 'Scan'}
          </button>
        </div>
      </div>
    </SidebarLayout>
  );
}

export default NewScan;