import React, { useState, useEffect } from 'react';
import { FaHome, FaFileAlt, FaHistory, FaSignOutAlt } from 'react-icons/fa';
import { AiOutlineLink } from 'react-icons/ai';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function ResumeAnalyzer() {
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // Autofill JD after login
  useEffect(() => {
    const pending = localStorage.getItem('pendingResume');
    if (pending) {
      const { jobDesc: savedJD } = JSON.parse(pending);
      if (savedJD) setJobDesc(savedJD);
      localStorage.removeItem('pendingResume');
      alert('Please re-upload your resume to continue analyzing.');
    }
  }, []);

  const handleSubmit = async () => {
    if (!resume || !jobDesc) {
      alert('Please upload resume and enter job description.');
      return;
    }

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userId = localStorage.getItem('userId');
    const accessCount = parseInt(localStorage.getItem('analyzerAccessCount')) || 0;

    if (!isLoggedIn) {
      // Free users: limit and redirect to login
      if (accessCount >= 2) {
        localStorage.setItem('pendingResume', JSON.stringify({
          jobDesc,
          resumeName: resume.name
        }));
        navigate('/login');
        return;
      }

      localStorage.setItem('analyzerAccessCount', accessCount + 1);
      alert('Free analysis used. Please log in for unlimited scans.');
    }

    // Proceed with analysis
    await sendToBackend(resume, jobDesc, userId);
  };

  const sendToBackend = async (resume, jobDesc, userId) => {
    const formData = new FormData();
    formData.append('resume', resume);
    const jdBlob = new Blob([jobDesc], { type: 'text/plain' });
    formData.append('jd', jdBlob, 'jd.txt');
    if (userId) formData.append('user_id', userId);

    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      const data = await res.json();
      console.log('Backend response:', data);

      if (data.valid && data.doc_id) {
        console.log("Received doc_id:", data.doc_id);

        // ✅ Poll Firestore until document exists
        const docRef = doc(db, 'resume_analysis', data.doc_id);
        let attempts = 0;

        const checkDoc = async () => {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            console.log("Document confirmed in Firestore:", data.doc_id);
            navigate(`/resultpage/${data.doc_id}`);
          } else if (attempts < 10) {
            attempts++;
            console.log("Doc not ready yet, retrying...", attempts);
            setTimeout(checkDoc, 1000); // retry every second
          } else {
            alert("Document not ready yet, please try again.");
          }
        };

        checkDoc();
      } else {
        alert(data.message || '❌ Analysis failed. No document ID returned.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('❌ Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('analyzerAccessCount');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="px-6 py-4 text-2xl font-bold text-blue-700 border-b">
          JobMorph
        </div>
        <nav className="flex-1 p-4 space-y-2 text-gray-700">
          <Link to="/dashboard" className="flex items-center p-2 hover:bg-gray-100 rounded">
            <FaHome className="mr-3" />
            Dashboard
          </Link>
          <Link to="/linkedin" className="flex items-center p-2 hover:bg-gray-100 rounded">
            <AiOutlineLink className="mr-3" />
            LinkedIn Scan
          </Link>
          <Link to="/resume" className="flex items-center p-2 hover:bg-gray-100 rounded">
            <FaFileAlt className="mr-3" />
            Resume Upload
          </Link>
          <Link to="/scan-history" className="flex items-center p-2 hover:bg-gray-100 rounded">
            <FaHistory className="mr-3" />
            Scan History
          </Link>
        </nav>
        <button onClick={handleLogout} className="flex items-center p-4 border-t hover:bg-gray-100">
          <FaSignOutAlt className="mr-2" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Resume Analyzer</h1>

        <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl">
          <div className="mb-4">
            <label className="block font-semibold mb-2">Upload Resume</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setResume(e.target.files[0])}
              className="w-full border px-4 py-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Job Description</label>
            <textarea
              rows="6"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              className="w-full border px-4 py-2 rounded"
              placeholder="Paste the job description here..."
            />
          </div>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze Resume'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default ResumeAnalyzer;












// import React, { useState, useEffect } from 'react';
// import { FaHome, FaFileAlt, FaHistory, FaSignOutAlt } from 'react-icons/fa';
// import { AiOutlineLink } from 'react-icons/ai';
// import { useNavigate, Link } from 'react-router-dom';

// function ResumeAnalyzer() {
//   const navigate = useNavigate();
//   const [resume, setResume] = useState(null);
//   const [jobDesc, setJobDesc] = useState('');
//   const [loading, setLoading] = useState(false);

//   // Autofill JD after login
//   useEffect(() => {
//     const pending = localStorage.getItem('pendingResume');
//     if (pending) {
//       const { jobDesc: savedJD } = JSON.parse(pending);
//       if (savedJD) setJobDesc(savedJD);
//       localStorage.removeItem('pendingResume');
//       alert('Please re-upload your resume to continue analyzing.');
//     }
//   }, []);

//   const handleSubmit = async () => {
//     if (!resume || !jobDesc) {
//       alert('Please upload resume and enter job description.');
//       return;
//     }

//     const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
//     const userId = localStorage.getItem('userId');
//     const accessCount = parseInt(localStorage.getItem('analyzerAccessCount')) || 0;

//     if (!isLoggedIn) {
//       // Free users: limit and redirect to login
//       if (accessCount >= 2) {
//         localStorage.setItem('pendingResume', JSON.stringify({
//           jobDesc,
//           resumeName: resume.name
//         }));
//         navigate('/login');
//         return;
//       }

//       localStorage.setItem('analyzerAccessCount', accessCount + 1);
//       alert('Free analysis used. Please log in for unlimited scans.');
//     }

//     // Proceed with analysis
//     await sendToBackend(resume, jobDesc, userId);
//   };

//   const sendToBackend = async (resume, jobDesc, userId) => {
//     const formData = new FormData();
//     formData.append('resume', resume);
//     const jdBlob = new Blob([jobDesc], { type: 'text/plain' });
//     formData.append('jd', jdBlob, 'jd.txt');
//     if (userId) formData.append('user_id', userId);

//     try {
//       setLoading(true);
//       const res = await fetch('http://localhost:5000/upload', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await res.json();
//       if (data.valid && data.doc_id) {
//         navigate(`/resultpage/${data.doc_id}`);
//       } else {
//         alert(data.message || '❌ Analysis failed.');
//       }
//     } catch (err) {
//       console.error('Upload error:', err);
//       alert('❌ Upload failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('isLoggedIn');
//     localStorage.removeItem('userId');
//     localStorage.removeItem('analyzerAccessCount');
//     navigate('/');
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <aside className="w-64 bg-white shadow-md flex flex-col">
//         <div className="px-6 py-4 text-2xl font-bold text-blue-700 border-b">
//           JobMorph
//         </div>
//         <nav className="flex-1 p-4 space-y-2 text-gray-700">
//           <Link to="/dashboard" className="flex items-center p-2 hover:bg-gray-100 rounded">
//             <FaHome className="mr-3" />
//             Dashboard
//           </Link>
//           <Link to="/linkedin" className="flex items-center p-2 hover:bg-gray-100 rounded">
//             <AiOutlineLink className="mr-3" />
//             LinkedIn Scan
//           </Link>
//           <Link to="/resume" className="flex items-center p-2 hover:bg-gray-100 rounded">
//             <FaFileAlt className="mr-3" />
//             Resume Upload
//           </Link>
//           <Link to="/scan-history" className="flex items-center p-2 hover:bg-gray-100 rounded">
//             <FaHistory className="mr-3" />
//             Scan History
//           </Link>
//         </nav>
//         <button onClick={handleLogout} className="flex items-center p-4 border-t hover:bg-gray-100">
//           <FaSignOutAlt className="mr-2" />
//           Logout
//         </button>
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 p-6">
//         <h1 className="text-2xl font-bold mb-6 text-gray-800">Resume Analyzer</h1>

//         <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl">
//           <div className="mb-4">
//             <label className="block font-semibold mb-2">Upload Resume</label>
//             <input
//               type="file"
//               accept=".pdf,.docx"
//               onChange={(e) => setResume(e.target.files[0])}
//               className="w-full border px-4 py-2 rounded"
//             />
//           </div>

//           <div className="mb-4">
//             <label className="block font-semibold mb-2">Job Description</label>
//             <textarea
//               rows="6"
//               value={jobDesc}
//               onChange={(e) => setJobDesc(e.target.value)}
//               className="w-full border px-4 py-2 rounded"
//               placeholder="Paste the job description here..."
//             />
//           </div>

//           <button
//             onClick={handleSubmit}
//             className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
//             disabled={loading}
//           >
//             {loading ? 'Analyzing...' : 'Analyze Resume'}
//           </button>
//         </div>
//       </main>
//     </div>
//   );
// }

// export default ResumeAnalyzer;

