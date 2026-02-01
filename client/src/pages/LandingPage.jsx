import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView, useScroll} from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });

  useEffect(() => {
    AOS.init({ duration: 1000, once: true, easing: 'ease-out-cubic' });
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleGetStarted = () => {
    // Navigate to upload page - upload page will handle auth check
    navigate('/upload');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      console.log('Email submitted:', email);
      setEmailSubmitted(true);
      setTimeout(() => {
        setEmailSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  // Counter component
  const Counter = ({ end, suffix = '' }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      if (statsInView) {
        let start = 0;
        const duration = 2000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(Math.floor(start));
          }
        }, 16);
        return () => clearInterval(timer);
      }
    }, [end, statsInView]);

    return <span>{count}{suffix}</span>;
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 origin-left z-[100]"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Custom Cursor Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6, 182, 212, 0.08), transparent 80%)`,
        }}
      />

      {/* Fixed Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg"
              >
                J
              </motion.div>
              <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                JobMorph
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {['Features', 'How It Works', 'Use Cases', 'Pricing'].map((item, i) => (
                <motion.a
                  key={i}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-gray-700 hover:text-cyan-600 transition-colors font-medium relative group"
                  whileHover={{ scale: 1.05 }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-600 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-6 py-2.5 text-gray-700 font-semibold hover:text-cyan-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                Log In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signup"
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 relative overflow-hidden group"
                >
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-900 hover:text-cyan-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4"
            >
              <div className="flex flex-col space-y-3">
                {['Features', 'How It Works', 'Use Cases', 'Pricing'].map((item, i) => (
                  <a 
                    key={i}
                    href={`#${item.toLowerCase().replace(' ', '-')}`} 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="text-gray-700 hover:text-cyan-600 transition-colors font-medium py-2"
                  >
                    {item}
                  </a>
                ))}
                <div className="border-t border-gray-200 pt-3 mt-2 space-y-3">
                  <Link
                    to="/login"
                    className="block text-center px-6 py-2.5 text-gray-900 font-semibold hover:text-cyan-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="block text-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Subtle Grid Background */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}></div>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30">
        {/* Floating Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[130px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 12, repeat: Infinity, delay: 2 }}
            className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-purple-400/8 rounded-full blur-[120px]"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left space-y-10">
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm"
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </div>
                <span className="text-sm font-bold text-cyan-700">AI-Powered Resume Analysis</span>
              </motion.div>

              {/* Main Headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-8">
                  <span className="block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Your Resume.
                  </span>
                  <span className="block bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mt-2 animate-gradient">
                    Perfectly Matched.
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
                  Transform your job search with AI-powered resume analysis. 
                  Get instant insights on how well your resume matches any job description.
                </p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-6"
              >
                <motion.button
                  onClick={handleGetStarted}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_20px_50px_rgba(6,182,212,0.4)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started Free
                    <motion.svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500"
                    initial={{ x: '100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.button>

                <motion.button
                  onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-cyan-500 transition-all duration-300 shadow-lg"
                >
                  How It Works
                </motion.button>
              </motion.div>

              {/* Trust Badges */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-8"
              >
                {[
                  { icon: '🔒', text: 'SSL Encrypted' },
                  { icon: '⚡', text: 'Lightning Fast' },
                  { icon: '🎯', text: '95% Accuracy' },
                  { icon: '🔐', text: 'GDPR Compliant' },
                ].map((badge, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="font-semibold text-gray-700 text-sm">{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right: Floating Resume Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, type: "spring" }}
              className="relative hidden lg:block"
            >
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 2, 0, -2, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                {/* Resume Card Mockup */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-gray-100">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b-2 border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                      JD
                    </div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                    </div>
                  </div>
                  
                  {/* Content Lines */}
                  <div className="space-y-4">
                    <div>
                      <div className="h-3 w-20 bg-cyan-100 rounded mb-2" />
                      <div className="h-2 w-full bg-gray-100 rounded mb-1" />
                      <div className="h-2 w-5/6 bg-gray-100 rounded mb-1" />
                      <div className="h-2 w-4/6 bg-gray-100 rounded" />
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-blue-100 rounded mb-2" />
                      <div className="h-2 w-full bg-gray-100 rounded mb-1" />
                      <div className="h-2 w-3/4 bg-gray-100 rounded" />
                    </div>
                    <div>
                      <div className="h-3 w-16 bg-purple-100 rounded mb-2" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-cyan-50 border border-cyan-200 rounded" />
                        <div className="h-6 w-16 bg-blue-50 border border-blue-200 rounded" />
                        <div className="h-6 w-20 bg-purple-50 border border-purple-200 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-4 -right-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl px-6 py-3 shadow-xl"
                  >
                    <div className="text-white text-center">
                      <div className="text-3xl font-black">87%</div>
                      <div className="text-xs font-semibold">Match</div>
                    </div>
                  </motion.div>
                </div>

                {/* Floating Check Icons */}
                {[
                  { delay: 0, position: '-top-8 -left-8' },
                  { delay: 0.5, position: 'top-1/3 -right-12' },
                  { delay: 1, position: 'bottom-8 -left-12' }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: item.delay + 1.5, type: "spring" }}
                    className={`absolute ${item.position} w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg`}
                  >
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="relative py-20 px-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate={statsInView ? "visible" : "hidden"}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { value: 0, suffix: '+', label: 'Resumes Analyzed' },
              { value: 95, suffix: '%', label: 'Accuracy Rate' },
              { value: 59, suffix: 's', label: 'Avg. Analysis Time' },
              { value: 0, suffix: '+', label: 'Happy Users' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="text-5xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  <Counter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Problem */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-4 py-2 rounded-full bg-red-50 border border-red-200 mb-6">
                <span className="text-sm font-bold text-red-600">THE PROBLEM</span>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-6">
                Job Searching is <span className="text-red-500">Frustrating</span>
              </h3>
              <div className="space-y-4">
                {[
                  'Spending hours customizing resumes for each job',
                  'No idea if your resume will pass ATS systems',
                  'Guessing which keywords to include',
                  'Wasting time on mismatched applications',
                  'Never knowing why you got rejected',
                ].map((problem, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-100"
                  >
                    <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <p className="text-gray-700">{problem}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Solution */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-6">
                <span className="text-sm font-bold text-cyan-600">THE SOLUTION</span>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-6">
                JobMorph Makes it <span className="text-cyan-600">Simple</span>
              </h3>
              <div className="space-y-4">
                {[
                  'AI analyzes your resume in 30 seconds',
                  'Know exactly how well you match before applying',
                  'Get specific keyword recommendations',
                  'Focus only on jobs that fit your profile',
                  'Understand what to improve for better results',
                ].map((solution, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ x: -5 }}
                    className="flex items-start gap-3 p-4 rounded-lg bg-cyan-50 border border-cyan-100"
                  >
                    <svg className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-gray-700">{solution}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section id="demo" className="relative py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-200 mb-6">
              <span className="text-sm font-bold text-cyan-600">SEE IT IN ACTION</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">
                Watch JobMorph Work
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how easy it is to analyze your resume and get instant match scores
            </p>
          </motion.div>

          {/* Demo Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border-2 border-gray-200 shadow-2xl">
              {/* Browser Header */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <div className="flex gap-2">
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="w-3 h-3 rounded-full bg-red-400 cursor-pointer"
                  />
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="w-3 h-3 rounded-full bg-yellow-400 cursor-pointer"
                  />
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="w-3 h-3 rounded-full bg-green-400 cursor-pointer"
                  />
                </div>
                <div className="flex-1 ml-4 bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  jobmorph.com/analyze
                </div>
              </div>

              {/* Demo Content */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-4">
                  <motion.div 
                    whileHover={{ scale: 1.02, rotate: 1 }}
                    className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-dashed border-cyan-300 rounded-xl text-center cursor-pointer"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-5xl mb-4"
                    >
                      📄
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Resume Uploaded</h3>
                    <p className="text-sm text-gray-600">John_Doe_Resume.pdf</p>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.02, rotate: -1 }}
                    className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-xl text-center cursor-pointer"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      className="text-5xl mb-4"
                    >
                      💼
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Job Description Added</h3>
                    <p className="text-sm text-gray-600">Senior Software Engineer</p>
                  </motion.div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Match Score</h3>
                      <motion.span 
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, type: "spring" }}
                        className="text-4xl font-black text-green-600"
                      >
                        87%
                      </motion.span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '87%' }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 }}
                    className="p-4 bg-white border border-gray-200 rounded-xl space-y-2 shadow-sm"
                  >
                    {[
                      { icon: 'check', text: 'Strong technical skills match', color: 'green' },
                      { icon: 'check', text: 'Experience level aligned', color: 'green' },
                      { icon: 'warning', text: 'Add "Kubernetes" keyword', color: 'yellow' }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <svg className={`w-5 h-5 text-${item.color}-600`} fill="currentColor" viewBox="0 0 20 20">
                          {item.icon === 'check' ? (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          )}
                        </svg>
                        <span className="text-sm text-gray-700">{item.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Floating particles around demo */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four simple steps to transform your job search
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                number: '1',
                icon: '📤',
                title: 'Upload Resume',
                desc: 'Upload your resume in PDF or DOCX format',
                gradient: 'from-cyan-500 to-blue-600',
              },
              {
                number: '2',
                icon: '📋',
                title: 'Add Job Description',
                desc: 'Paste the job description you want to apply for',
                gradient: 'from-blue-500 to-indigo-600',
              },
              {
                number: '3',
                icon: '🧠',
                title: 'AI Analysis',
                desc: 'Our AI analyzes the match in seconds',
                gradient: 'from-indigo-500 to-purple-600',
              },
              {
                number: '4',
                icon: '📊',
                title: 'Get Results',
                desc: 'Review your match score and actionable insights',
                gradient: 'from-purple-500 to-pink-600',
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl">
                  {/* Number Badge */}
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`absolute -top-4 -right-4 w-12 h-12 rounded-xl bg-gradient-to-r ${step.gradient} flex items-center justify-center font-black text-xl text-white shadow-lg`}
                  >
                    {step.number}
                  </motion.div>

                  {/* Icon */}
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="text-6xl mb-6"
                  >
                    {step.icon}
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.desc}
                  </p>

                  {/* Connecting line for desktop */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="relative py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">
                Why Choose JobMorph?
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              See how we compare to traditional resume review methods
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-xl"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="px-6 py-4 text-left text-gray-700 font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-gray-700 font-semibold">Manual Review</th>
                  <th className="px-6 py-4 text-center bg-cyan-50 border-l-2 border-r-2 border-cyan-200">
                    <span className="text-cyan-600 font-bold">JobMorph AI</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  { feature: 'Analysis Time', manual: '30+ minutes', jobmorph: '30 seconds', icon: '⚡' },
                  { feature: 'Accuracy', manual: 'Subjective guess', jobmorph: '95% AI accuracy', icon: '🎯' },
                  { feature: 'Match Score', manual: 'No scoring', jobmorph: 'Detailed %', icon: '📊' },
                  { feature: 'Keyword Suggestions', manual: 'Manual research', jobmorph: 'Auto-generated', icon: '💡' },
                  { feature: 'History Tracking', manual: 'None', jobmorph: 'Full history', icon: '📂' },
                  { feature: 'Cost', manual: 'Time = money', jobmorph: 'Free', icon: '💰' },
                ].map((row, i) => (
                  <motion.tr 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                    className="border-t border-gray-200 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-900 font-medium flex items-center gap-2">
                      <span className="text-2xl">{row.icon}</span>
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">{row.manual}</td>
                    <td className="px-6 py-4 text-center font-bold text-cyan-600 bg-cyan-50 border-l-2 border-r-2 border-cyan-100">
                      {row.jobmorph}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">
                Who Is JobMorph For?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're just starting out or making a career change, JobMorph helps everyone
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: '🎓',
                title: 'Recent Graduates',
                desc: 'Land your first job with confidence by knowing exactly how your resume stacks up',
                gradient: 'from-cyan-500 to-blue-600',
              },
              {
                icon: '🔄',
                title: 'Career Changers',
                desc: 'Transition smoothly by highlighting transferable skills that match new roles',
                gradient: 'from-blue-500 to-indigo-600',
              },
              {
                icon: '🚀',
                title: 'Active Job Seekers',
                desc: 'Apply smarter, not harder, by focusing on jobs where you have the best match',
                gradient: 'from-indigo-500 to-purple-600',
              },
              {
                icon: '💼',
                title: 'HR Professionals',
                desc: 'Screen candidates faster with AI-powered resume analysis and matching',
                gradient: 'from-purple-500 to-pink-600',
              },
            ].map((useCase, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -10, rotate: 2 }}
              >
                <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl">
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${useCase.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}
                  >
                    {useCase.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-cyan-600 transition-colors">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {useCase.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6 bg-white">
        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to optimize your resume and land your dream job
            </p>
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Analysis',
                desc: 'Advanced algorithms analyze your resume against job descriptions with precision and speed.',
                gradient: 'from-cyan-500 to-blue-600',
              },
              {
                icon: '📊',
                title: 'Match Score',
                desc: 'Get an instant percentage score showing how well your resume matches the job requirements.',
                gradient: 'from-blue-500 to-indigo-600',
              },
              {
                icon: '💡',
                title: 'Smart Insights',
                desc: 'Receive actionable recommendations to improve your resume for better job matches.',
                gradient: 'from-indigo-500 to-purple-600',
              },
              {
                icon: '📂',
                title: 'History Tracking',
                desc: 'Keep track of all your resume scans and monitor improvements over time.',
                gradient: 'from-purple-500 to-pink-600',
              },
              {
                icon: '⚡',
                title: 'Fast Processing',
                desc: 'Get results in seconds, not hours. Our AI works at lightning speed.',
                gradient: 'from-pink-500 to-rose-600',
              },
              {
                icon: '🔒',
                title: 'Secure & Private',
                desc: 'Your data is encrypted and never shared. Complete privacy guaranteed.',
                gradient: 'from-rose-500 to-orange-600',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="relative h-full bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-500 hover:shadow-xl group">
                  {/* Icon */}
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-3xl mb-6 shadow-lg`}
                  >
                    {feature.icon}
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-cyan-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Start for free, upgrade when you need more
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="relative bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-xl"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-gray-900">$0</span>
                  <span className="text-gray-600">/ forever</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited resume uploads',
                  'AI-powered matching',
                  'Basic match scores',
                  'Scan history (last 10)',
                  'Email support',
                ].map((feature, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <svg className="w-6 h-6 text-cyan-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Get Started Free
              </motion.button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border-2 border-cyan-300 shadow-xl"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg"
              >
                <span className="text-sm font-bold text-white">COMING SOON</span>
              </motion.div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">$9</span>
                  <span className="text-gray-600">/ month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  'Everything in Free',
                  'Advanced AI insights',
                  'Detailed improvement suggestions',
                  'Unlimited scan history',
                  'Priority support',
                  'Export reports (PDF)',
                  'ATS optimization tools',
                ].map((feature, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <svg className="w-6 h-6 text-cyan-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <button
                disabled
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-lg cursor-not-allowed opacity-60"
              >
                Coming Soon
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-cyan-700 bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: 'Is JobMorph completely free?',
                a: 'Yes! Our core features are completely free. You can upload resumes, analyze matches, and get detailed results without any cost. We plan to introduce premium features in the future for advanced users.',
              },
              {
                q: 'Do I need to create an account?',
                a: 'Yes, creating a free account allows you to access your personalized dashboard, view scan history, track progress over time, and save your results.',
              },
              {
                q: 'How secure is my data?',
                a: 'We take security seriously. All data is encrypted using industry-standard SSL encryption. Your resume and personal information are never shared with third parties and remain completely private.',
              },
              {
                q: 'What file formats are supported?',
                a: 'We currently support PDF and DOCX formats for resume uploads. These are the most common formats used by job seekers and ATS systems.',
              },
              {
                q: 'How does the AI matching algorithm work?',
                a: 'Our AI analyzes multiple factors including keywords, skills, experience level, education, and qualifications. It compares these against job requirements to provide an accurate match percentage and specific recommendations.',
              },
              {
                q: 'Can I use JobMorph for multiple job applications?',
                a: 'Absolutely! You can analyze your resume against unlimited job descriptions. We recommend creating tailored versions of your resume for different job types and testing each one.',
              },
              {
                q: 'Will this help me pass ATS systems?',
                a: 'Yes! Our AI is trained to understand ATS requirements. We provide keyword suggestions and formatting tips to help your resume pass automated screening systems.',
              },
              {
                q: 'How long does the analysis take?',
                a: 'Analysis is nearly instant! Most results are ready in 30 seconds or less. The AI processes your resume and job description in real-time.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-cyan-400 transition-all duration-300 shadow-md hover:shadow-xl"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors flex items-start gap-3">
                  <span className="text-cyan-600 flex-shrink-0">Q:</span>
                  {item.q}
                </h3>
                <p className="text-gray-600 leading-relaxed pl-8">
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-12 border-2 border-cyan-200 overflow-hidden shadow-xl"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl" />

            <div className="relative text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
              >
                Stay Updated
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto"
              >
                Get resume tips, job search advice, and be the first to know about new features
              </motion.p>

              {!emailSubmitted ? (
                <motion.form 
                  onSubmit={handleEmailSubmit}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-sm"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300"
                  >
                    Subscribe
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-xl max-w-md mx-auto"
                >
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-600 font-semibold">Thanks for subscribing!</span>
                </motion.div>
              )}

              <p className="text-sm text-gray-600 mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black mb-8">
              <span className="bg-gradient-to-r from-gray-900 via-cyan-700 to-gray-900 bg-clip-text text-transparent">
                Ready to Get Started?
              </span>
            </h2>
            <p className="text-2xl text-gray-700 mb-12 max-w-2xl mx-auto">
              Join job seekers who are landing more interviews with AI-powered resume analysis
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={handleGetStarted}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-[0_20px_60px_rgba(6,182,212,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Analyzing Free
                  <motion.svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </span>
              </motion.button>

              <motion.button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-white text-gray-900 font-semibold text-xl rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-cyan-500 transition-all duration-300 shadow-lg"
              >
                Learn More
              </motion.button>
            </div>

            <p className="text-gray-600 mt-8">
              No credit card required • Free forever • Get started in 60 seconds
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-50 border-t-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg">
                  J
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  JobMorph
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                AI-powered resume analysis platform helping job seekers match their skills with perfect opportunities.
              </p>
              <div className="flex gap-4">
                {['T', 'L', 'G'].map((social, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    className="w-10 h-10 rounded-lg bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-cyan-50 hover:border-cyan-500 transition-all shadow-sm"
                  >
                    <span className="text-cyan-600 text-xs font-bold">{social}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-gray-900 font-bold mb-4 text-lg">Product</h4>
              <ul className="space-y-3">
                {['Features', 'How It Works', 'Pricing', 'Demo'].map((item, i) => (
                  <li key={i}>
                    <a href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-gray-600 hover:text-cyan-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-gray-900 font-bold mb-4 text-lg">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: 'About Us', to: '/about' },
                  { label: 'Contact', to: '/contact' },
                  { label: 'Blog', to: '#' },
                  { label: 'Careers', to: '#' }
                ].map((item, i) => (
                  <li key={i}>
                    <Link to={item.to} className="text-gray-600 hover:text-cyan-600 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-gray-900 font-bold mb-4 text-lg">Support</h4>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="mailto:support@jobmorph.com" className="hover:text-cyan-600 transition-colors">
                    support@jobmorph.com
                  </a>
                </li>
                {['Help Center', 'Privacy Policy', 'Terms of Service'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-cyan-600 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t-2 border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>©️ {new Date().getFullYear()} JobMorph. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">Made with ❤️ for job seekers</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;

























































// import React, { useEffect } from 'react';
// import Navbar from '../components/Navbar';
// import { useNavigate, Link } from 'react-router-dom';
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// function LandingPage() {
//   const navigate = useNavigate();

//   useEffect(() => {
//     AOS.init({ duration: 1000, once: true });
//   }, []);

//   const handleGetStarted = () => {
//     navigate('/upload');
//   };

//   return (
//     <div className="min-h-screen text-white bg-black overflow-x-hidden scroll-smooth">
//       {/* Hero Section */}
//       <div
//         className="min-h-screen bg-cover bg-center"
//         style={{
//           backgroundImage: `url('https://repository-images.githubusercontent.com/253975496/2823cee4-4d8d-4d65-8477-b7b67fec9b15')`,
//         }}
//       >
//         <div className="min-h-screen backdrop-blur-sm bg-black/30">
//           <Navbar />

//           <div className="flex flex-col lg:flex-row justify-between items-center px-10 pt-20 pb-10 max-w-6xl mx-auto">
//             {/* Left */}
//             <div className="lg:w-1/2 text-center lg:text-left" data-aos="fade-right">
//               <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 mt-12">
//                 "Unlock Your Potential, Find Your Perfect Fit."
//               </h1><br></br>
//               <p className="text-lg mb-10">
//                 <h1>JobMorph — Match Better. Get Hired.</h1>
//                 <i>Your Skills, Our Match....</i> 
//               </p>
//               <button
//                 onClick={handleGetStarted}
//                 className="bg-white text-blue-700 font-bold px-6 py-3 rounded-md hover:bg-gray-100 transition"
//               >
//                 Get Started
//               </button>
//             </div>

//             {/* Right */}
//             <div
//               className="mt-12 lg:mt-0 lg:w-1/2 flex justify-center items-center relative min-h-[280px]"
//               data-aos="fade-left"
//             >
//               <img
//                 src="animation_lp.avif"
//                 alt="Background Document"
//                 className="w-[500px] md:w-[300px] rounded-lg shadow-md absolute rotate-[-0deg] z-0"
//                 style={{ left: '200px', top: '30px' }}
//               />
//               <img
//                 src="home.jpg"
//                 alt="Foreground Document"
//                 className="w-[230px] md:w-[270px] rounded-lg shadow-2xl absolute z-10"
//                 style={{ left: '380px', top: '200px' }}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* How It Works Section */}
//       <section className="bg-gradient-to-b from-purple-50 to-blue-100 py-20 px-4">
//         <div className="max-w-4xl mx-auto text-center" data-aos="fade-up">
//           <h2 className="text-4xl font-extrabold text-gray-800 mb-4">🛠️ How It Works</h2>
//           <p className="text-lg text-gray-700 mb-12">
//             Follow these simple steps to supercharge your job search with JobMorph.
//           </p>
//         </div>

//         <div className="flex flex-col gap-10 items-center max-w-3xl mx-auto">
//           {[
//             {
//               icon: '📤',
//               title: 'Step 1: Upload Resume',
//               desc: 'Start by uploading your resume (PDF or DOCX formats).',
//               color: 'border-blue-500',
//             },
//             {
//               icon: '📑',
//               title: 'Step 2: Upload Job Description',
//               desc: 'Paste or upload the job description you want to match with.',
//               color: 'border-indigo-500',
//             },
//             {
//               icon: '🧠',
//               title: 'Step 3: Click Analyze',
//               desc: 'Let our AI compare your resume with the job and generate a match score.',
//               color: 'border-purple-500',
//             },
//             {
//               icon: '📈',
//               title: 'Step 4: View Dashboard',
//               desc: 'Track your scan history, and manage your Resume Score progress.',
//               color: 'border-green-500',
//             },
//           ].map((step, index) => (
//             <div
//               key={index}
//               className={`relative bg-white shadow-xl p-6 rounded-2xl w-full hover:scale-[1.02] transition-all duration-300 border-l-4 ${step.color}`}
//               data-aos="fade-up"
//               data-aos-delay={index * 100}
//             >
//               <div className="flex items-center gap-4">
//                 <div className="text-4xl">{step.icon}</div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-800 mb-1">{step.title}</h3>
//                   <p className="text-gray-600 text-sm">{step.desc}</p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="text-center mt-14" data-aos="zoom-in">
//           <button
//             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//             className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-full shadow-md transition-all"
//           >
//             🚀 Let's see
//           </button>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section className="bg-white py-20 px-6" id="features">
//         <div className="max-w-6xl mx-auto text-center" data-aos="fade-up">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">✨ Features That Set Us Apart</h2>
//           <p className="text-gray-600 text-lg mb-12">
//             JobMorph is more than just a resume scanner. It’s your intelligent job-hunting companion.
//           </p>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
//             {[
//               {
//                 icon: '🤖',
//                 title: 'AI-Powered Matching',
//                 desc: 'We use advanced AI to compare your resume with job descriptions and highlight what matters.',
//               },
//               {
//                 icon: '📊',
//                 title: 'Instant Match Score',
//                 desc: 'Get a real-time score and see how well your resume aligns with the role.',
//               },
//               {
//                 icon: '📂',
//                 title: 'Track & Save History',
//                 desc: 'Access all your previous scans and keep track of improvements over time.',
//               },
//             ].map((feature, i) => (
//               <div
//                 key={i}
//                 className="p-6 bg-gray-50 rounded-xl shadow hover:shadow-lg transition-all"
//                 data-aos="fade-up"
//                 data-aos-delay={i * 150}
//               >
//                 <div className="text-3xl mb-4">{feature.icon}</div>
//                 <h3 className="font-semibold text-xl text-gray-800 mb-2">{feature.title}</h3>
//                 <p className="text-gray-600">{feature.desc}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* FAQ Section */}
//       <section className="bg-gradient-to-b from-blue-50 to-purple-100 py-20 px-6">
//         <div className="max-w-4xl mx-auto text-center">
//           <h2 className="text-3xl font-bold mb-10 text-gray-800">Frequently Asked Questions</h2>
//           <div className="space-y-6 text-left">
//             {[
//               {
//                 q: 'Is JobMorph free to use?',
//                 a: 'Yes! You can upload resumes and job descriptions, analyze matches, and view results without any charge.',
//               },
//               {
//                 q: 'Do I need to sign up?',
//                 a: 'Yes! Signup is required to see the results, also unlocks dashboard and scan history features.',
//               },
//               {
//                 q: 'Is my resume data safe?',
//                 a: 'Absolutely. Your data is never shared and is processed securely using encryption and best practices.',
//               },
//               {
//                 q: 'What formats are supported?',
//                 a: 'PDF and DOCX both are supported.',
//               },
//             ].map((item, index) => (
//               <div key={index} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
//                 <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.q}</h3>
//                 <p className="text-gray-600">{item.a}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* About Us Section */}
//       <section className="bg-gray-100 text-gray-900 py-16 px-6" id="about">
//         <div className="max-w-6xl mx-auto" data-aos="fade-up">
//           <h2 className="text-3xl font-bold mb-6 text-center">About Us</h2>
//           <p className="text-lg text-center max-w-3xl mx-auto">
//             JobMorph is a platform that helps job seekers improve their resumes by matching their skills to job descriptions.
//             We aim to increase your chances of getting interviews by providing insightful suggestions and match scores based on your resume content.
//           </p>
//         </div>
//       </section>

      
//         {/*footer section*/}
//       <footer className="bg-gray-900 text-gray-400 text-sm">
//       <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-start">

//       {/* Logo + Tagline */}
//       <div>
//         <h4 className="text-white font-semibold mb-2">JobMorph</h4>
//         <p className="text-gray-500 leading-snug">
//           AI tools to match your resume to job descriptions with ease and confidence.
//         </p>
//       </div>

//     {/* Company Links */}
//     <div>
//       <h4 className="text-white font-semibold mb-2">Company</h4>
//       <ul className="space-y-1">
//         <li><Link to="/about" className="hover:text-white">About Us</Link></li>
//         <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
//       </ul>
//     </div>

//     {/* Support Info */}
//     <div>
//       <h4 className="text-white font-semibold mb-2">Support</h4>
//       <ul className="space-y-1">
//         <li><a href="mailto:support@resumatch.com" className="hover:text-white">support@jobmorph.com</a></li>
//         <li><span>+91 98765 43210</span></li>
//         <li><span>Pune, India</span></li>
//       </ul>
//     </div>
//   </div>

//   {/* Bottom Bar */}
//   <div className="border-t border-gray-700 py-3 px-6 text-center text-xs text-gray-500">
//     © {new Date().getFullYear()} JobMorph AI. All rights reserved.
//   </div>
//   </footer>
//   </div>
//   );
// }

// export default LandingPage;
