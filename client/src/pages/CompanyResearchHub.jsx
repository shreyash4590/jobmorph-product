import React, { useState } from 'react';
import { ExternalLink, CheckSquare, Search } from 'lucide-react';

export default function CompanyResearchHub() {
  const [companyName, setCompanyName] = useState('');
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Check company reviews on Glassdoor (aim for 3.5+ rating)', done: false },
    { id: 2, text: 'Research salary ranges on Levels.fyi', done: false },
    { id: 3, text: 'Read interview experiences on Glassdoor', done: false },
    { id: 4, text: 'Check company LinkedIn page for culture insights', done: false },
    { id: 5, text: 'Look for red flags (high turnover, negative reviews)', done: false },
    { id: 6, text: 'Research company funding on Crunchbase (for startups)', done: false },
    { id: 7, text: 'Read anonymous discussions on Blind', done: false },
    { id: 8, text: 'Google recent news about the company', done: false }
  ]);

  const resources = [
    {
      name: 'Glassdoor',
      url: 'https://www.glassdoor.com',
      icon: '⭐',
      color: 'from-green-400 to-green-600',
      description: 'Company reviews, salaries, and interview experiences',
      tags: ['Reviews', 'Salaries', 'Interviews']
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com',
      icon: '💼',
      color: 'from-blue-400 to-blue-600',
      description: 'Company profiles, employee insights, and connections',
      tags: ['Network', 'Jobs', 'People']
    },
    {
      name: 'Levels.fyi',
      url: 'https://www.levels.fyi',
      icon: '💰',
      color: 'from-yellow-400 to-orange-600',
      description: 'Tech salaries, levels, and compensation data',
      tags: ['Salaries', 'Levels', 'Equity']
    },
    {
      name: 'Indeed',
      url: 'https://www.indeed.com/companies',
      icon: '📊',
      color: 'from-red-400 to-pink-600',
      description: 'Company reviews, ratings, and work environment',
      tags: ['Reviews', 'Culture', 'Benefits']
    },
    {
      name: 'Crunchbase',
      url: 'https://www.crunchbase.com',
      icon: '🚀',
      color: 'from-indigo-400 to-purple-600',
      description: 'Startup funding, investors, and company news',
      tags: ['Funding', 'Investors', 'News']
    },
    {
      name: 'Blind',
      url: 'https://www.teamblind.com',
      icon: '💬',
      color: 'from-gray-600 to-gray-800',
      description: 'Anonymous workplace discussions and insights',
      tags: ['Anonymous', 'Honest', 'Real']
    }
  ];

  const handleResearchAll = () => {
    if (companyName.trim()) {
      const searchTerm = encodeURIComponent(companyName);
      window.open(`https://www.glassdoor.com/Search/results.htm?keyword=${searchTerm}`, '_blank');
      window.open(`https://www.linkedin.com/search/results/companies/?keywords=${searchTerm}`, '_blank');
      window.open(`https://www.levels.fyi/companies`, '_blank');
    } else {
      alert('Please enter a company name to research');
    }
  };

  const toggleChecklistItem = (id) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Search className="w-16 h-16 text-purple-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Company Research Hub
            </h1>
          </div>
          <p className="text-gray-600 text-xl">
            Everything you need to research companies before applying
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12">
          <div className="flex gap-4">
            <input 
              type="text" 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name to start researching..."
              className="flex-1 p-5 border-2 border-gray-200 rounded-xl text-lg focus:border-purple-500 focus:outline-none"
            />
            <button 
              onClick={handleResearchAll}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold px-8 rounded-xl transition shadow-lg flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Research
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">💡 We'll open all relevant resources for you in new tabs</p>
        </div>

        {/* Main Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {resources.map((resource, idx) => (
            <a 
              key={idx}
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group"
            >
              <div className={`bg-gradient-to-br ${resource.color} rounded-2xl shadow-xl p-8 transform hover:scale-105 transition-all h-full`}>
                <div className="text-white">
                  <div className="text-6xl mb-4">{resource.icon}</div>
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    {resource.name}
                    <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition" />
                  </h3>
                  <p className="text-white/90 mb-4">{resource.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {resource.tags.map((tag, i) => (
                      <span key={i} className="bg-white/20 px-3 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Research Checklist */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-purple-600" />
            Company Research Checklist
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {checklist.map((item) => (
              <label 
                key={item.id}
                className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition ${
                  item.done ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input 
                  type="checkbox" 
                  checked={item.done}
                  onChange={() => toggleChecklistItem(item.id)}
                  className="mt-1 w-5 h-5 text-purple-600"
                />
                <span className={`text-gray-700 ${item.done ? 'line-through text-gray-400' : ''}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            💡 Pro Research Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-bold text-lg mb-2">Be Thorough</h4>
              <p className="text-purple-100 text-sm">Check multiple sources for a complete picture. Don't rely on just one review site.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h4 className="font-bold text-lg mb-2">Watch for Red Flags</h4>
              <p className="text-purple-100 text-sm">High turnover, vague job descriptions, and numerous negative reviews are warning signs.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="text-4xl mb-3">🤝</div>
              <h4 className="font-bold text-lg mb-2">Use Your Network</h4>
              <p className="text-purple-100 text-sm">Connect with current/former employees on LinkedIn for insider perspectives.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}