import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // adjust this path if needed

function ResumeTemplates() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const snapshot = await getDocs(collection(db, 'resume_templates'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(data);
    };

    fetchTemplates();
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📄 Resume Templates</h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div
            key={template.id}
            className="border rounded-xl shadow p-4 flex flex-col items-center"
          >
            <img
              src={template.preview_url}
              alt={template.name}
              className="w-full h-48 object-cover rounded-md"
            />
            <h3 className="mt-3 text-lg font-semibold">{template.name}</h3>
            <p className="text-gray-600 text-sm text-center">{template.description}</p>
            <a
              href={template.file_url}
              download
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResumeTemplates;
