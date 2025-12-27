import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

function MissingSkills() {
  const [learningResources, setLearningResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLearningResources([]);
        setLoading(false);
        return;
      }

      try {
        // 🔥 Fetch ONLY the latest scan
        const q = query(
          collection(db, 'resume_analysis'),
          where('user_id', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();

          // Prefer backend-generated learning resources
          if (
            Array.isArray(data.gemini_learning_resources) &&
            data.gemini_learning_resources.length > 0
          ) {
            setLearningResources(data.gemini_learning_resources);
          } 
          // Fallback if only keywords exist
          else if (
            Array.isArray(data.gemini_missing_keywords) &&
            data.gemini_missing_keywords.length > 0
          ) {
            const enriched = data.gemini_missing_keywords.map((skill) => ({
              skill,
              description: `Learn ${skill} with beginner-friendly tutorials and hands-on projects.`,
              youtubeLink: `https://www.youtube.com/results?search_query=learn+${encodeURIComponent(skill)}`
            }));
            setLearningResources(enriched);
          } else {
            setLearningResources([]);
          }
        } else {
          setLearningResources([]);
        }
      } catch (err) {
        console.error('❌ Failed to load missing skills:', err);
        setLearningResources([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col justify-between py-10 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-10 w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-blue-900">
          🎯 Missing Skills & Learning Resources
        </h1>

        <p className="text-gray-600 text-center mb-8 text-sm sm:text-base">
          These skills are missing from your most recent resume scan.
        </p>

        {loading ? (
          <p className="text-center text-blue-500">🔄 Loading skills...</p>
        ) : learningResources.length === 0 ? (
          <p className="text-center text-gray-500">
            ✅ No missing skills detected from your latest scan.
          </p>
        ) : (
          <div className="space-y-6">
            {learningResources.map((item, idx) => (
              <div
                key={idx}
                className="border border-blue-100 p-5 sm:p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
              >
                <h2 className="text-xl font-semibold text-blue-800">
                  {item.skill}
                </h2>

                <p className="text-gray-700 mt-1">
                  {item.description}
                </p>

                {item.youtubeLink && (
                  <a
                    href={item.youtubeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline mt-3 inline-block"
                  >
                    ▶ Learn on YouTube
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mt-10">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default MissingSkills;
