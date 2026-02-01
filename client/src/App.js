// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ResultPage from './pages/ResultPage';
import UploadResume from './pages/UploadResume';
import ScanHistory from './pages/ScanHistory';
import SidebarLayout from './Layouts/SidebarLayout';
import MissingSkills from './pages/MissingSkills';
import InterviewPrep from './pages/InterviewPrep';
import CompanyResearchHub from './pages/CompanyResearchHub';// 🆕 NEW!
import ATSChecker from './pages/ATSChecker'; // 🆕 NEW!
import BatchJobMatcher from './pages/BatchJobMatcher';
import AboutPage from './pages/AboutPage';
import HelpCenter from './pages/HelpCenter';

import ForgotPasswordPage from "./pages/ForgotPasswordPage";
// import AccountSettings from "./pages/AccountSettings";
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <Routes>
      {/* ✅ Public routes (No Sidebar) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/upload" element={<UploadResume />} />
      <Route path="/missing-skills" element={<MissingSkills />} />
      <Route path="/interview-prep" element={<InterviewPrep />} /> {/* New!! */}
      <Route path="/ats-checker" element={<ATSChecker />} /> {/* 🆕 NEW! */}
      <Route path="/batch-matcher" element={<BatchJobMatcher />} />{/* 🆕 NEW! */}

      <Route path="/about" element={<AboutPage />} />
      <Route path="/help" element={<HelpCenter />} />

      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      {/* <Route path="/account-settings" element={<AccountSettings />} /> */}
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* ✅ Private routes (With SidebarLayout) */}
      <Route
        path="/dashboard"
        element={
          <SidebarLayout>
            <Dashboard />
          </SidebarLayout>
        }
      />
      <Route
        path="/resultpage/:id"
        element={
          <SidebarLayout>
            <ResultPage />
          </SidebarLayout>
        }
      />
      <Route
        path="/history"
        element={
          <SidebarLayout>
            <ScanHistory />
          </SidebarLayout>
        }
      />
      
      <Route
        path="/company-research"
        element={
          <SidebarLayout>
            <CompanyResearchHub />
          </SidebarLayout>
        }
      />
    </Routes>
  );
}

export default App;














// // src/App.js
// import React from 'react';
// import { Routes, Route } from 'react-router-dom';

// import LandingPage from './pages/LandingPage';
// import ContactPage from './pages/ContactPage';
// import Dashboard from './pages/Dashboard';
// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import ResultPage from './pages/ResultPage';
// import UploadResume from './pages/UploadResume';
// import ScanHistory from './pages/ScanHistory';
// import SidebarLayout from './Layouts/SidebarLayout'; // ✅ fixed casing
// import MissingSkills from './pages/MissingSkills';
// import InterviewPrep from './pages/InterviewPrep';
// import AboutPage from './pages/AboutPage';
// import HelpCenter from './pages/HelpCenter';

// import ForgotPasswordPage from "./pages/ForgotPasswordPage"; // adjust path if needed
// import AccountSettings from "./pages/AccountSettings";
// import PrivacyPolicy from './pages/PrivacyPolicy';

// function App() {
//   return (
//     <Routes>
//       {/* ✅ Public routes (No Sidebar) */}
//       <Route path="/" element={<LandingPage />} />
//       <Route path="/contact" element={<ContactPage />} />
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/signup" element={<SignupPage />} />
//       <Route path="/upload" element={<UploadResume />} />
//       <Route path="/missing-skills" element={<MissingSkills />} />
//       <Route path="/interview-prep" element={<InterviewPrep />} />

//       <Route path="/about" element={<AboutPage />} />
//       <Route path="/help" element={<HelpCenter />} />

//         <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//         <Route path="/account-settings" element={<AccountSettings />} />
//         <Route path="/privacy" element={<PrivacyPolicy />} />

//       {/* ✅ Private routes (With SidebarLayout) */}
//       <Route
//         path="/dashboard"
//         element={
//           <SidebarLayout>
//             <Dashboard />
//           </SidebarLayout>
//         }
//       />
//       <Route
//         path="/resultpage/:id"
//         element={
//           <SidebarLayout>
//             <ResultPage />
//           </SidebarLayout>
//         }
//       />
//       <Route
//         path="/history"
//         element={
//           <SidebarLayout>
//             <ScanHistory />
//           </SidebarLayout>
//         }
//       />
//     </Routes>
//   );
// }

// export default App;
