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
import CompanyResearchHub from './pages/CompanyResearchHub';
import ATSChecker from './pages/ATSChecker';
import BatchJobMatcher from './pages/BatchJobMatcher';
import AboutPage from './pages/AboutPage';
import HelpCenter from './pages/HelpCenter';
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PrivacyPolicy from './pages/PrivacyPolicy';

// Dedicated landing pages
import FeaturesPage from './pages/features/FeatureDetail';
import HowItWorksPage from './pages/HowItWorks';       // ← updated to new file
import UseCasesPage from './pages/UseCasesPage';
import PricingPage from './pages/PricingPage';

// ✅ NEW: Feature detail pages (one component handles all 5 features)
import FeatureDetail from './pages/features/FeatureDetail';

function App() {
  return (
    <Routes>

      {/* ─── Public Routes (No Sidebar) ─────────────────────────── */}
      <Route path="/"                 element={<LandingPage />} />
      <Route path="/contact"          element={<ContactPage />} />
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/signup"           element={<SignupPage />} />
      <Route path="/upload"           element={<UploadResume />} />
      <Route path="/missing-skills"   element={<MissingSkills />} />
      <Route path="/interview-prep"   element={<InterviewPrep />} />
      <Route path="/ats-checker"      element={<ATSChecker />} />
      <Route path="/batch-matcher"    element={<BatchJobMatcher />} />
      <Route path="/about"            element={<AboutPage />} />
      <Route path="/help"             element={<HelpCenter />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/privacy"          element={<PrivacyPolicy />} />

      {/* ─── Info / Marketing Pages ──────────────────────────────── */}
      <Route path="/features"         element={<FeaturesPage />} />
      <Route path="/how-it-works"     element={<HowItWorksPage />} />
      <Route path="/use-cases"        element={<UseCasesPage />} />
      <Route path="/pricing"          element={<PricingPage />} />

      {/* ✅ NEW: Individual feature detail pages                     */}
      {/* Handles all 5 features via :slug param:                    */}
      {/* /features/match-score      → Match Score detail            */}
      {/* /features/ats-checker      → ATS Checker detail            */}
      {/* /features/interview-prep   → Interview Prep detail         */}
      {/* /features/company-research → Company Research detail       */}
      {/* /features/job-ranking      → Job Ranking detail            */}
      <Route path="/features/:slug"   element={<FeatureDetail />} />

      {/* ─── Private Routes (With SidebarLayout) ────────────────── */}
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
// // ✅ COMPLETE FILE - Just replace your entire App.jsx with this

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
// import SidebarLayout from './Layouts/SidebarLayout';
// import MissingSkills from './pages/MissingSkills';
// import InterviewPrep from './pages/InterviewPrep';
// import CompanyResearchHub from './pages/CompanyResearchHub';
// import ATSChecker from './pages/ATSChecker';
// import BatchJobMatcher from './pages/BatchJobMatcher';
// import AboutPage from './pages/AboutPage';
// import HelpCenter from './pages/HelpCenter';
// import ForgotPasswordPage from "./pages/ForgotPasswordPage";
// import PrivacyPolicy from './pages/PrivacyPolicy';

// // ✅ NEW: Import the 4 new pages
// import FeaturesPage from './pages/FeaturesPage';
// import HowItWorksPage from './pages/HowItWorksPage';
// import UseCasesPage from './pages/UseCasesPage';
// import PricingPage from './pages/PricingPage';

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
//       <Route path="/ats-checker" element={<ATSChecker />} />
//       <Route path="/batch-matcher" element={<BatchJobMatcher />} />
//       <Route path="/about" element={<AboutPage />} />
//       <Route path="/help" element={<HelpCenter />} />
//       <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//       <Route path="/privacy" element={<PrivacyPolicy />} />

//       {/* ✅ NEW: 4 dedicated pages */}
//       <Route path="/features" element={<FeaturesPage />} />
//       <Route path="/how-it-works" element={<HowItWorksPage />} />
//       <Route path="/use-cases" element={<UseCasesPage />} />
//       <Route path="/pricing" element={<PricingPage />} />

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
      
//       <Route
//         path="/company-research"
//         element={
//           <SidebarLayout>
//             <CompanyResearchHub />
//           </SidebarLayout>
//         }
//       />
//     </Routes>
//   );
// }

// export default App;




// src/App.js
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
// import SidebarLayout from './Layouts/SidebarLayout';
// import MissingSkills from './pages/MissingSkills';
// import InterviewPrep from './pages/InterviewPrep';
// import CompanyResearchHub from './pages/CompanyResearchHub';// 🆕 NEW!
// import ATSChecker from './pages/ATSChecker'; // 🆕 NEW!
// import BatchJobMatcher from './pages/BatchJobMatcher';
// import AboutPage from './pages/AboutPage';
// import HelpCenter from './pages/HelpCenter';

// import ForgotPasswordPage from "./pages/ForgotPasswordPage";
// // import AccountSettings from "./pages/AccountSettings";
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
//       <Route path="/interview-prep" element={<InterviewPrep />} /> {/* New!! */}
//       <Route path="/ats-checker" element={<ATSChecker />} /> {/* 🆕 NEW! */}
//       <Route path="/batch-matcher" element={<BatchJobMatcher />} />{/* 🆕 NEW! */}

//       <Route path="/about" element={<AboutPage />} />
//       <Route path="/help" element={<HelpCenter />} />

//       <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//       {/* <Route path="/account-settings" element={<AccountSettings />} /> */}
//       <Route path="/privacy" element={<PrivacyPolicy />} />

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
      
//       <Route
//         path="/company-research"
//         element={
//           <SidebarLayout>
//             <CompanyResearchHub />
//           </SidebarLayout>
//         }
//       />
//     </Routes>
//   );
// }

// export default App;














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
