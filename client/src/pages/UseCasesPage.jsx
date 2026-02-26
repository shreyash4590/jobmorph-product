import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function UseCasesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const useCases = [
    {
      icon: '🎓',
      title: 'Recent Graduates',
      subtitle: 'Landing Your First Job',
      description: 'Starting your career is challenging. JobMorph helps new graduates compete with experienced candidates.',
      challenges: [
        'Limited work experience',
        'Uncertain which skills employers value',
        'Competing with experienced candidates',
        'Not knowing how to format resume'
      ],
      solutions: [
        'Highlight transferable skills from projects',
        'Identify missing keywords from job postings',
        'ATS-optimize your resume format',
        'Learn which skills to emphasize'
      ],
      testimonial: {
        quote: 'JobMorph helped me identify missing keywords I never would have thought of. Got my first interview within 2 weeks!',
        author: 'Sarah M., Computer Science Graduate'
      }
    },
    {
      icon: '🔄',
      title: 'Career Changers',
      subtitle: 'Transitioning to New Industries',
      description: 'Changing careers requires highlighting transferable skills. We help you show what you bring.',
      challenges: [
        'Different industry terminology',
        'Unclear how past experience applies',
        'Gaps in technical requirements',
        'Overcoming bias against career changers'
      ],
      solutions: [
        'Match transferable skills to new role',
        'Identify skills gap and how to close it',
        'Reframe experience for new industry',
        'Show capability despite different background'
      ],
      testimonial: {
        quote: 'Switched from teaching to UX design. JobMorph showed me how to reframe my experience. Landed a role in 3 months!',
        author: 'Michael T., Former Teacher → UX Designer'
      }
    },
    {
      icon: '🚀',
      title: 'Active Job Seekers',
      subtitle: 'Applying Smarter, Not Harder',
      description: 'Stop wasting time on mismatched applications. Focus your energy where you have the best chance.',
      challenges: [
        'Applying to 100+ jobs without results',
        'Generic resume for every application',
        'No feedback on rejections',
        'Burning out from constant applications'
      ],
      solutions: [
        'Batch analyze multiple jobs at once',
        'See which jobs are best matches',
        'Tailor resume for each application',
        'Apply only where you actually fit'
      ],
      testimonial: {
        quote: 'Went from 100 applications with no response to 20 targeted applications with 8 interviews. Game changer!',
        author: 'David K., Software Engineer'
      }
    },
    {
      icon: '💼',
      title: 'HR Professionals',
      subtitle: 'Faster, Smarter Candidate Screening',
      description: 'Screen hundreds of resumes in minutes. Find top candidates without manual review.',
      challenges: [
        'Manually reviewing 100+ resumes per role',
        'Missing qualified candidates',
        'Inconsistent screening criteria',
        'Time-consuming initial screening'
      ],
      solutions: [
        'Auto-rank candidates by match score',
        'Standardized evaluation criteria',
        'Screen 100+ resumes in minutes',
        'Focus on top 10-20% matches'
      ],
      testimonial: {
        quote: 'Cut screening time from 5 hours to 30 minutes per role. Found better candidates faster.',
        author: 'Jennifer L., Recruitment Manager'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">J</div>
            <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">JobMorph</span>
          </Link>
          <Link to="/" className="px-6 py-2.5 text-gray-700 font-semibold hover:text-cyan-600 transition-colors">← Back</Link>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block px-4 py-2 rounded-full bg-purple-100 border border-purple-200 mb-6">
              <span className="text-sm font-bold text-purple-700">USE CASES</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent">Who Benefits from</span><br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">JobMorph?</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Real stories from real users across different career stages</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {useCases.map((useCase, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid md:grid-cols-2 gap-12">
              <div>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 text-5xl mb-6 shadow-lg">
                  {useCase.icon}
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">{useCase.title}</h2>
                <h3 className="text-2xl font-bold text-purple-600 mb-6">{useCase.subtitle}</h3>
                <p className="text-xl text-gray-600 mb-8">{useCase.description}</p>

                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-red-500">❌</span> Challenges
                  </h4>
                  <ul className="space-y-2">
                    {useCase.challenges.map((challenge, i) => (
                      <li key={i} className="text-gray-600 pl-6 border-l-2 border-red-200">{challenge}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-green-500">✓</span> How JobMorph Helps
                  </h4>
                  <ul className="space-y-2">
                    {useCase.solutions.map((solution, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-xl italic text-gray-700 mb-6">"{useCase.testimonial.quote}"</p>
                  <p className="font-bold text-purple-600">— {useCase.testimonial.author}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent">Ready to Get Started?</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of job seekers succeeding with JobMorph</p>
          <Link to="/upload" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all">
            Try It Free Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default UseCasesPage;