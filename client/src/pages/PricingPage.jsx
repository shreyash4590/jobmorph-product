import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function PricingPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out JobMorph',
      features: [
        'Unlimited resume uploads',
        'AI-powered match scoring',
        'Basic keyword suggestions',
        'Scan history (last 10)',
        'Email support',
        'ATS format checker',
        'Community access'
      ],
      cta: 'Get Started Free',
      popular: false,
      gradient: 'from-gray-600 to-gray-800'
    },
    {
      name: 'Premium',
      price: '$9',
      period: '/ month',
      description: 'For serious job seekers',
      badge: 'COMING SOON',
      features: [
        'Everything in Free',
        'Advanced AI insights',
        'Detailed improvement suggestions',
        'Unlimited scan history',
        'Priority support (24/7)',
        'Export reports (PDF)',
        'ATS optimization tools',
        'Interview prep questions',
        'Company research access',
        'Batch job matcher'
      ],
      cta: 'Coming Soon',
      popular: true,
      gradient: 'from-cyan-500 to-blue-600'
    }
  ];

  const faqs = [
    {
      q: 'Is the free plan really free forever?',
      a: 'Yes! Our free plan is completely free with no time limits. You get core features like resume analysis, match scoring, and ATS checking permanently.'
    },
    {
      q: 'When will Premium launch?',
      a: 'Premium features are coming soon! Sign up for our newsletter to be notified when it launches. Early subscribers will get special launch pricing.'
    },
    {
      q: 'Can I cancel Premium anytime?',
      a: 'Absolutely. When Premium launches, you can cancel anytime with no penalties. No questions asked.'
    },
    {
      q: 'Do you offer refunds?',
      a: 'Yes! When Premium launches, we\'ll offer a 30-day money-back guarantee. Not happy? Get a full refund, no questions asked.'
    },
    {
      q: 'Is my payment information secure?',
      a: 'Yes! We use industry-standard encryption and secure payment processors. We never store your credit card information.'
    },
    {
      q: 'Can I upgrade from Free to Premium later?',
      a: 'Yes! You can upgrade at any time. Your scan history and data will carry over seamlessly.'
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

      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block px-4 py-2 rounded-full bg-green-100 border border-green-200 mb-6">
              <span className="text-sm font-bold text-green-700">PRICING</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">Simple,</span><br />
              <span className="bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">Transparent Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Start free, upgrade when you need more. No hidden fees, no surprises.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className={`relative bg-white rounded-3xl p-8 border-2 shadow-xl ${
                  plan.popular ? 'border-cyan-400 shadow-cyan-100' : 'border-gray-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full shadow-lg">
                    <span className="text-sm font-bold text-white">{plan.badge}</span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-3xl font-black text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-6xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>{plan.price}</span>
                    <span className="text-gray-600 text-lg">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className={`w-6 h-6 ${plan.popular ? 'text-cyan-600' : 'text-gray-600'} flex-shrink-0 mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !plan.badge && navigate('/upload')}
                  disabled={!!plan.badge}
                  className={`w-full px-8 py-4 font-bold text-lg rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-xl hover:shadow-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl overflow-hidden shadow-xl">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-6 py-4 text-left font-bold">Feature</th>
                  <th className="px-6 py-4 text-center font-bold">Free</th>
                  <th className="px-6 py-4 text-center font-bold bg-cyan-50">Premium</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Resume uploads', 'Unlimited', 'Unlimited'],
                  ['Match scoring', '✓', '✓'],
                  ['Keyword suggestions', 'Basic', 'Advanced'],
                  ['Scan history', 'Last 10', 'Unlimited'],
                  ['Support', 'Email', '24/7 Priority'],
                  ['ATS checker', '✓', 'Advanced'],
                  ['Export reports', '✗', 'PDF'],
                  ['Interview prep', '✗', '✓'],
                  ['Company research', '✗', '✓'],
                  ['Batch matcher', '✗', '✓']
                ].map((row, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-6 py-4 font-medium">{row[0]}</td>
                    <td className="px-6 py-4 text-center">{row[1]}</td>
                    <td className="px-6 py-4 text-center bg-cyan-50 font-bold text-cyan-600">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-cyan-400 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">Start Free Today</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">No credit card required. Upgrade anytime.</p>
          <Link to="/upload" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-green-500 to-cyan-600 text-white font-bold text-lg rounded-xl hover:shadow-xl transition-all">
            Get Started Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default PricingPage;