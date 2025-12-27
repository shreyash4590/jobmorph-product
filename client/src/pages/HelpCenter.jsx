// src/pages/HelpCenter.jsx
import React, { useState } from 'react';

const faqs = [
  {
    question: 'How does JobMorph analyze my resume?',
    answer: 'JobMorph uses AI to compare your resume against a job description and identifies match score, missing skills, and areas for improvement.',
  },
  {
    question: 'Can I save and view my previous scans?',
    answer: 'Yes, all your past scans are saved under the Scan History page. You can revisit, delete, or improve each scan anytime.',
  },
  {
    question: 'Can I edit my resume directly on JobMorph?',
    answer: 'Not yet—but we are working on a feature to let you modify and optimize your resume with AI-generated suggestions directly inside the platform.',
  },
  {
    question: 'Is my resume data secure?',
    answer: 'Absolutely. Your resume and personal information are stored securely and are never shared with third parties or recruiters.',
  },
  {
    question: 'How do I reset my password using my security question?',
    answer: 'Click “Forgot Password” on the login page, enter your email, answer your security question, and set a new password.',
  },
];


function HelpCenter() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white px-6 md:px-12 lg:px-24 py-16 text-gray-800">
      {/* Intro */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-2">Welcome to the JobMorph Help Center</h1>
        <p className="text-lg text-gray-600">
          We're here to help you make the most of JobMorph. Whether it’s about scans, technical support—this is the place or other query.
        </p>
      </div>

      {/* How We Help */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">How We Support You</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>Fast and friendly email support (reply within 24 hours)</li>
          <li>Extensive FAQs and support. </li>
          <li>Step-by-step guides to help you scan, build, and immediately solve your problem.</li>
          
        </ul>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 p-6 rounded-md mb-16 shadow">
        <h2 className="text-2xl font-semibold mb-2 text-blue-700">Need Direct Help?</h2>
        <p className="mb-3">
          If your question isn't covered here, feel free to email us anytime.
        </p>
        <a
          href="mailto:support@jobmorph.ai"
          className="inline-block bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
        >
          Contact Support
        </a>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-blue-700">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-4">
              <button
                className="text-left w-full text-lg font-medium text-gray-800 hover:text-blue-700"
                onClick={() => toggleFAQ(index)}
              >
                {faq.question}
              </button>
              {openIndex === index && (
                <p className="mt-2 text-gray-600 transition-all">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HelpCenter;
