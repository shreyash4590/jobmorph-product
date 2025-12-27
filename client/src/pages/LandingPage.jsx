import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate, Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const handleGetStarted = () => {
    navigate('/upload');
  };

  return (
    <div className="min-h-screen text-white bg-black overflow-x-hidden scroll-smooth">
      {/* Hero Section */}
      <div
        className="min-h-screen bg-cover bg-center"
        style={{
          backgroundImage: `url('https://repository-images.githubusercontent.com/253975496/2823cee4-4d8d-4d65-8477-b7b67fec9b15')`,
        }}
      >
        <div className="min-h-screen backdrop-blur-sm bg-black/30">
          <Navbar />

          <div className="flex flex-col lg:flex-row justify-between items-center px-10 pt-20 pb-10 max-w-6xl mx-auto">
            {/* Left */}
            <div className="lg:w-1/2 text-center lg:text-left" data-aos="fade-right">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 mt-12">
                "Unlock Your Potential, Find Your Perfect Fit."
              </h1><br></br>
              <p className="text-lg mb-10">
                <h1>JobMorph — Match Better. Get Hired.</h1>
                <i>Your Skills, Our Match....</i> 
              </p>
              <button
                onClick={handleGetStarted}
                className="bg-white text-blue-700 font-bold px-6 py-3 rounded-md hover:bg-gray-100 transition"
              >
                Get Started
              </button>
            </div>

            {/* Right */}
            <div
              className="mt-12 lg:mt-0 lg:w-1/2 flex justify-center items-center relative min-h-[280px]"
              data-aos="fade-left"
            >
              <img
                src="animation_lp.avif"
                alt="Background Document"
                className="w-[500px] md:w-[300px] rounded-lg shadow-md absolute rotate-[-0deg] z-0"
                style={{ left: '200px', top: '30px' }}
              />
              <img
                src="home.jpg"
                alt="Foreground Document"
                className="w-[230px] md:w-[270px] rounded-lg shadow-2xl absolute z-10"
                style={{ left: '380px', top: '200px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-purple-50 to-blue-100 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center" data-aos="fade-up">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-4">🛠️ How It Works</h2>
          <p className="text-lg text-gray-700 mb-12">
            Follow these simple steps to supercharge your job search with JobMorph.
          </p>
        </div>

        <div className="flex flex-col gap-10 items-center max-w-3xl mx-auto">
          {[
            {
              icon: '📤',
              title: 'Step 1: Upload Resume',
              desc: 'Start by uploading your resume (PDF or DOCX formats).',
              color: 'border-blue-500',
            },
            {
              icon: '📑',
              title: 'Step 2: Upload Job Description',
              desc: 'Paste or upload the job description you want to match with.',
              color: 'border-indigo-500',
            },
            {
              icon: '🧠',
              title: 'Step 3: Click Analyze',
              desc: 'Let our AI compare your resume with the job and generate a match score.',
              color: 'border-purple-500',
            },
            {
              icon: '📈',
              title: 'Step 4: View Dashboard',
              desc: 'Track your scan history, and manage your Resume Score progress.',
              color: 'border-green-500',
            },
          ].map((step, index) => (
            <div
              key={index}
              className={`relative bg-white shadow-xl p-6 rounded-2xl w-full hover:scale-[1.02] transition-all duration-300 border-l-4 ${step.color}`}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{step.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14" data-aos="zoom-in">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-full shadow-md transition-all"
          >
            🚀 Let's see
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20 px-6" id="features">
        <div className="max-w-6xl mx-auto text-center" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">✨ Features That Set Us Apart</h2>
          <p className="text-gray-600 text-lg mb-12">
            JobMorph is more than just a resume scanner. It’s your intelligent job-hunting companion.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Matching',
                desc: 'We use advanced AI to compare your resume with job descriptions and highlight what matters.',
              },
              {
                icon: '📊',
                title: 'Instant Match Score',
                desc: 'Get a real-time score and see how well your resume aligns with the role.',
              },
              {
                icon: '📂',
                title: 'Track & Save History',
                desc: 'Access all your previous scans and keep track of improvements over time.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-lg transition-all"
                data-aos="fade-up"
                data-aos-delay={i * 150}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-xl text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gradient-to-b from-blue-50 to-purple-100 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-10 text-gray-800">Frequently Asked Questions</h2>
          <div className="space-y-6 text-left">
            {[
              {
                q: 'Is JobMorph free to use?',
                a: 'Yes! You can upload resumes and job descriptions, analyze matches, and view results without any charge.',
              },
              {
                q: 'Do I need to sign up?',
                a: 'Yes! Signup is required to see the results, also unlocks dashboard and scan history features.',
              },
              {
                q: 'Is my resume data safe?',
                a: 'Absolutely. Your data is never shared and is processed securely using encryption and best practices.',
              },
              {
                q: 'What formats are supported?',
                a: 'PDF and DOCX both are supported.',
              },
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="bg-gray-100 text-gray-900 py-16 px-6" id="about">
        <div className="max-w-6xl mx-auto" data-aos="fade-up">
          <h2 className="text-3xl font-bold mb-6 text-center">About Us</h2>
          <p className="text-lg text-center max-w-3xl mx-auto">
            JobMorph is a platform that helps job seekers improve their resumes by matching their skills to job descriptions.
            We aim to increase your chances of getting interviews by providing insightful suggestions and match scores based on your resume content.
          </p>
        </div>
      </section>

      
        {/*footer section*/}
      <footer className="bg-gray-900 text-gray-400 text-sm">
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">

      {/* Logo + Tagline */}
      <div>
        <h4 className="text-white font-semibold mb-2">JobMorph</h4>
        <p className="text-gray-500 leading-snug">
          AI tools to match your resume to job descriptions with ease and confidence.
        </p>
      </div>

    {/* Company Links */}
    <div>
      <h4 className="text-white font-semibold mb-2">Company</h4>
      <ul className="space-y-1">
        <li><Link to="/about" className="hover:text-white">About Us</Link></li>
        <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
      </ul>
    </div>

    {/* Support Info */}
    <div>
      <h4 className="text-white font-semibold mb-2">Support</h4>
      <ul className="space-y-1">
        <li><a href="mailto:support@resumatch.com" className="hover:text-white">support@jobmorph.com</a></li>
        <li><span>+91 98765 43210</span></li>
        <li><span>Pune, India</span></li>
      </ul>
    </div>
  </div>

  {/* Bottom Bar */}
  <div className="border-t border-gray-700 py-3 px-6 text-center text-xs text-gray-500">
    © {new Date().getFullYear()} JobMorph AI. All rights reserved.
  </div>
  </footer>
  </div>
  );
}

export default LandingPage;
