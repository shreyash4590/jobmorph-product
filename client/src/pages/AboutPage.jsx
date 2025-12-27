import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const AboutPage = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const coreValues = [
    {
      title: "Help people get more interviews",
      description:
        "Start with customers and work backward. Job seekers are in pain and frustrated. What are we doing to make their job search easier? What have you learned from our job seekers lately?",
    },
    {
      title: "Measure your impact",
      description:
        "Just like resumes should be measurable, so should our work. What quantifiable results are you driving for job seekers and for JobMorph?",
    },
    {
      title: "Sense of urgency",
      description:
        "Speed matters in business. Many decisions are reversible and don’t need extensive study. We value calculated risk-taking and experimentation. Failures are encouraged as long as we learn from them.",
    },
    {
      title: "Experiment",
      description:
        "None of us have a magic pill. We only have best guesses — and we’d be wrong at least 50% of the time. That’s okay. That’s why we need more experiments across departments. Faster experimentation yields results faster.",
    },
    {
      title: "Be efficient",
      description:
        "ROI-focused. Accomplish more with less time or cost. How can we reduce time or cost with quality results?",
    },
    {
      title: "Reach for the impossible",
      description:
        "Never say “that’s impossible.” Most things are possible if we try hard enough. We’re building the future and will challenge conventional thinking.",
    },
    {
      title: "Communicate proactively",
      description:
        "We’re privileged to work remotely, but the trade-off is communication. More proactive communication is needed to ensure we continue to execute at a great pace.",
    },
    {
      title: "Trustworthy",
      description:
        "Trust is the foundation — between us and our customers, and among team members. We must be honest and keep our word.",
    },
    {
      title: "Set high bars",
      description:
        "Always raise the bar. Think about how we can improve. Are we doing the best we can?",
    },
  ];

  return (
    <div className="bg-gradient-to-b from-blue-50 to-purple-100 text-gray-800 min-h-screen px-6 py-16">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Intro */}
        <section className="text-center">
          <motion.h1
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            About JobMorph
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            JobMorph is an AI-powered resume matcher that helps job seekers align their resumes with job descriptions, improving their chances of getting shortlisted.
          </motion.p>
        </section>

        {/* Mission */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
          <p className="text-gray-700 text-base leading-relaxed">
            We aim to empower job seekers with smart tools that simplify the application process. JobMorph helps candidates understand how well their resume fits a role — so they can apply with more confidence and clarity.
          </p>
        </motion.section>

        {/* Why We Created It */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold mb-2">Why We Created JobMorph</h2>
          <p className="text-gray-700 text-base leading-relaxed">
            Many talented candidates are filtered out by automated systems simply because their resumes don't match job descriptions closely — even if they're a great fit. We created JobMorph to fix that.
            <br /><br />
            Using advanced language models, JobMorph analyzes your resume against job descriptions and provides insights to help you get noticed by recruiters and pass ATS filters.
          </p>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold mb-2">What JobMorph Offers</h2>
          <ul className="list-disc list-inside text-gray-700 leading-loose mt-4">
            <li><strong>Resume Matching:</strong> See how well your resume matches a specific job description.</li>
            <li><strong>Job Description Analysis:</strong> Breaks down the job requirements and identifies key skills and gaps.</li>
            <li><strong>Match Score:</strong> Provides a clear score and feedback based on resume-job alignment.</li>
            <li><strong>Dashboard:</strong> Save scan history and track your resume optimization progress over time.</li>
          </ul>
        </motion.section>

        {/* Vision */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-semibold mb-2">Our Vision</h2>
          <p className="text-gray-700 text-base leading-relaxed">
            We want to make the job application process smarter, fairer, and more personalized. Whether you're a student applying for your first internship or a professional making a career move, JobMorph is built to support your journey.
          </p>
        </motion.section>

        {/* Core Values */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-center">Our Core Values</h2>
          <div className="space-y-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={index}
                className="border-l-4 border-blue-600 pl-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-semibold mb-1">{value.title}</h3>
                <p className="text-gray-700">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default AboutPage;
