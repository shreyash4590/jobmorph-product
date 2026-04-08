// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './index.css'

// Layout
import SidebarLayout from './Layouts/SidebarLayout';

// Public / Auth pages
import LandingPage        from './pages/LandingPage';
import ContactPage        from './pages/ContactPage';
import LoginPage          from './pages/LoginPage';
import SignupPage         from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmailPage    from './pages/VerifyEmailPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import PrivacyPolicy      from './pages/PrivacyPolicy';
import UploadResume       from './pages/UploadResume';

// Marketing pages
import FeatureDetail  from './pages/features/FeatureDetail';
import HowItWorksPage from './pages/HowItWorks';
import UseCasesPage   from './pages/UseCasesPage';
import PricingPage    from './pages/PricingPage';

// Sidebar pages
import Dashboard          from './pages/Dashboard';
import ResultPage         from './pages/ResultPage';
import ScanHistory        from './pages/ScanHistory';
import MissingSkills      from './pages/MissingSkills';
import InterviewPrep      from './pages/InterviewPrep';
import CompanyResearchHub from './pages/CompanyResearchHub';
import ATSChecker         from './pages/ATSChecker';
import BatchJobMatcher    from './pages/BatchJobMatcher';

// Standalone pages (no sidebar)
import HelpCenter from './pages/HelpCenter';
import AboutPage  from './pages/AboutPage';

function App() {
  return (
    <Routes>

      {/* ── Public / Auth ──────────────────────────────── */}
      <Route path="/"                element={<LandingPage />} />
      <Route path="/contact"         element={<ContactPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/signup"          element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/privacy"         element={<PrivacyPolicy />} />
      <Route path="/upload"          element={<UploadResume />} />

      {/* ── Marketing ──────────────────────────────────── */}
      <Route path="/features"       element={<FeatureDetail />} />
      <Route path="/features/:slug" element={<FeatureDetail />} />
      <Route path="/how-it-works"   element={<HowItWorksPage />} />
      <Route path="/use-cases"      element={<UseCasesPage />} />
      <Route path="/pricing"        element={<PricingPage />} />

      {/* ── Standalone pages (no sidebar) ─────────────── */}
      <Route path="/help"  element={<HelpCenter />} />
      <Route path="/about" element={<AboutPage />} />

      {/* ── Sidebar pages ──────────────────────────────── */}
      <Route element={<SidebarLayout />}>
        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/resultpage/:id"   element={<ResultPage />} />
        <Route path="/history"          element={<ScanHistory />} />
        <Route path="/missing-skills"   element={<MissingSkills />} />
        <Route path="/interview-prep"   element={<InterviewPrep />} />
        <Route path="/company-research" element={<CompanyResearchHub />} />
        <Route path="/ats-checker"      element={<ATSChecker />} />
        <Route path="/batch-matcher"    element={<BatchJobMatcher />} />
      </Route>

    </Routes>
  );
}

export default App;