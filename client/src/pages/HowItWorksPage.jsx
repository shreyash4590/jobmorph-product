import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';


function HowItWorksPage() {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      number: '01',
      icon: '📤',
      title: 'Upload Your Resume',
      description: 'Simply upload your resume in PDF or DOCX format. Our system accepts all standard formats.',
      details: [
        'Drag and drop or click to upload',
        'Supports PDF and DOCX formats',
        'Maximum file size: 10MB',
        'Secure, encrypted upload',
        'Works with single or multi-page resumes'
      ],
      time: '10 seconds'
    },
    {
      number: '02',
      icon: '📋',
      title: 'Add Job Description',
      description: 'Paste the job description from the posting you want to apply for. Include all requirements and qualifications.',
      details: [
        'Copy job description from posting',
        'Paste directly or upload as file',
        'Include requirements and qualifications',
        'No character limit',
        'Can analyze multiple jobs'
      ],
      time: '15 seconds'
    },
    {
      number: '03',
      icon: '🧠',
      title: 'AI Analysis',
      description: 'Our advanced AI analyzes your resume against the job requirements in real-time.',
      details: [
        'Compares 50+ data points',
        'Identifies keyword matches',
        'Evaluates experience level',
        'Checks skill alignment',
        'Analyzes education fit',
        'Reviews qualifications'
      ],
      time: '30 seconds'
    },
    {
      number: '04',
      icon: '📊',
      title: 'Review Results',
      description: 'Get instant insights including match score, missing keywords, and actionable suggestions.',
      details: [
        'Overall match percentage',
        'Missing keywords list',
        'Improvement suggestions',
        'ATS compatibility score',
        'Learning resources',
        'Download detailed report'
      ],
      time: 'Instant'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
              J
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              JobMorph
            </span>
          </Link>
          <Link to="/" className="px-6 py-2.5 text-gray-700 font-semibold hover:text-cyan-600 transition-colors rounded-lg hover:bg-gray-100">
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
              <span className="text-sm font-bold text-blue-700">HOW IT WORKS</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
                Four Simple Steps to
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Better Job Matches
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From upload to insights in under 60 seconds. No technical knowledge required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative mb-20 last:mb-0"
            >
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-1/2 top-32 w-1 h-32 bg-gradient-to-b from-cyan-300 to-blue-300 transform -translate-x-1/2" />
              )}

              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Number & Icon */}
                <div className={index % 2 === 0 ? 'md:order-1' : 'md:order-2'}>
                  <div className="text-center">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-6xl shadow-2xl mb-6"
                    >
                      {step.icon}
                    </motion.div>
                    <div className="text-8xl font-black text-gray-100">{step.number}</div>
                    <div className="mt-4 px-4 py-2 bg-cyan-100 rounded-full inline-block">
                      <span className="text-sm font-bold text-cyan-700">⏱️ {step.time}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={index % 2 === 0 ? 'md:order-2' : 'md:order-1'}>
                  <h2 className="text-4xl font-black text-gray-900 mb-4">{step.title}</h2>
                  <p className="text-xl text-gray-600 mb-6">{step.description}</p>
                  <ul className="space-y-3">
                    {step.details.map((detail, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <svg className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Total Time Banner */}
      <section className="py-16 px-6 bg-gradient-to-r from-cyan-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h3 className="text-3xl font-black mb-4">Total Time Required</h3>
          <div className="text-7xl font-black mb-2">~60 Seconds</div>
          <p className="text-xl opacity-90">From upload to complete analysis with actionable insights</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
              Ready to See It in Action?
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">Try it yourself in less than a minute</p>
          <Link to="/upload" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all">
            Start Now - It's Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HowItWorksPage;