import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BookOpen, ArrowLeft, FileText } from 'lucide-react';

/* ------------------------------------------------
   🔥 BRAND LOGO ROADMAP (OAuth-style buttons)
------------------------------------------------- */
const SKILL_ROADMAP = (skill) => {
  const q = encodeURIComponent(skill);

  return [
    {
      name: 'YouTube',
      link: `https://www.youtube.com/results?search_query=${q}+tutorial`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg',
    },
    {
      name: 'Coursera',
      link: `https://www.coursera.org/search?query=${q}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Coursera-Logo_600x600.svg',
      best: true,
    },
    {
      name: 'Udemy',
      link: `https://www.udemy.com/courses/search/?q=${q}`,
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Udemy_logo.svg',
    },
    {
      name: 'Official Docs',
      link: `https://www.google.com/search?q=${q}+official+documentation`,
      icon: true,
    },
  ];
};

function MissingSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'resume_analysis'),
          where('user_id', '==', user.uid)
        );

        const snap = await getDocs(q);
        if (snap.empty) {
          setLoading(false);
          return;
        }

        let latest = null;
        let latestTime = 0;

        snap.forEach((d) => {
          const data = d.data();
          const t = data.timestamp?.toDate?.().getTime() || 0;
          if (t >= latestTime) {
            latestTime = t;
            latest = data;
          }
        });

        if (!latest?.gemini_missing_keywords?.length) {
          setSkills([]);
          setLoading(false);
          return;
        }

        setSkills(
          latest.gemini_missing_keywords.map((skill) => ({
            skill,
            roadmap: SKILL_ROADMAP(skill),
          }))
        );
      } catch (err) {
        console.error(err);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-100 px-4 py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-3">
            🎯 Missing Skills & Learning Roadmap
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Strengthen the most important missing skills using trusted learning platforms.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-blue-600 font-medium">
            🔄 Building your learning roadmap...
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center text-green-600 font-medium">
            ✅ No critical missing skills found. You’re job-ready!
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {skills.map((item, idx) => (
              <div
                key={idx}
                className="border border-blue-100 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold text-blue-800 mb-5 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  {item.skill}
                </h2>

                {/* OAuth-style buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {item.roadmap.map((r, i) => (
                    <a
                      key={i}
                      href={r.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative flex items-center gap-3 px-4 py-3 border rounded-lg bg-white hover:bg-gray-50 shadow-sm transition"
                    >
                      {r.best && (
                        <span className="absolute -top-2 -right-2 text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold">
                          BEST
                        </span>
                      )}

                      {r.icon ? (
                        <FileText className="w-6 h-6 text-gray-700" />
                      ) : (
                        <img
                          src={r.logo}
                          alt={r.name}
                          className="h-6 w-auto"
                        />
                      )}

                      <span className="text-sm font-semibold text-gray-800">
                        {r.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back */}
        <div className="flex justify-center mt-14">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default MissingSkills;
