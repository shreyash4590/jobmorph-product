// src/pages/PrivacyPolicy.jsx
import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="w-full min-h-screen bg-white flex justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-gray-800">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: July 10, 2025</p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
          <p>
            At <strong>JobMorph</strong>, we are committed to protecting your privacy. This Privacy Policy explains how we collect,
            use, store, and protect your data when you use our platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Name and email address (for account access and communication)</li>
            <li>Uploaded resumes and job descriptions</li>
            <li>Scan results and match scores</li>
            <li>User activity logs (e.g., scan history & other things.)</li>
            <li>Device and browser metadata (for analytics and troubleshooting)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To analyze resumes and match them to job descriptions using AI</li>
            <li>To display scan history and personalized recommendations</li>
            <li>To improve our machine learning models and product experience</li>
            <li>To notify you of updates or important account activity</li>
          </ul>
          <p className="mt-2">We do not sell or share your data with advertisers or third parties for marketing.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">4. Data Storage and Security</h2>
          <p>
            We store all data securely in cloud infrastructure (such as Firebase), using encryption, authentication, and access
            control best practices to safeguard your data.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">5. Third-Party Services</h2>
          <p>We may use trusted third-party services to power JobMorph:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Firebase – for authentication, database, and storage</li>
            <li>EmailJS – for user communication</li>
            <li>Analytics tools – for product improvements (usage only)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">6. Your Rights</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Request access to your data</li>
            <li>Correct or update inaccurate information</li>
            <li>Delete your account and related data at any time</li>
          </ul>
          <p className="mt-2">
            To exercise your rights, email us at:{' '}
            <a href="mailto:support@jobmorph.ai" className="text-blue-600 underline">support@jobmorph.ai</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">7. Data Retention</h2>
          <p>
            We retain your data for as long as your account remains active. Inactive accounts for over 12 months may be deleted,
            with prior notice.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">8. Children’s Privacy</h2>
          <p>
            JobMorph is not intended for individuals under 17. We do not knowingly collect personal data from children. If such
            data is discovered, we will delete it immediately.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">9. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Users will be notified of material changes via email or in-app
            notifications.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
          <p>
            For questions, concerns, or data requests, please contact us at:<br />
            <a href="mailto:support@jobmorph.ai" className="text-blue-600 underline">support@jobmorph.ai</a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
