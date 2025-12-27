import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

function AuthModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('login');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert('Logged in!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-xl font-bold">&times;</button>

        {/* Tabs */}
        <div className="flex justify-around border-b mb-4">
          <button onClick={() => setActiveTab('signup')} className={`px-4 py-2 ${activeTab === 'signup' ? 'border-b-2 border-blue-600 font-bold' : ''}`}>Sign Up</button>
          <button onClick={() => setActiveTab('login')} className={`px-4 py-2 ${activeTab === 'login' ? 'border-b-2 border-blue-600 font-bold' : ''}`}>Log In</button>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Welcome {activeTab === 'signup' ? 'To' : 'Back To'} JobMorph!
          </h2>
          <p className="mb-4">Use one of the options below:</p>

          {/* Google Auth */}
          <button onClick={handleGoogleLogin} className="w-full bg-white border rounded-md p-3 flex items-center justify-center gap-3 shadow-sm mb-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>

          {/* Email (UI only now) */}
          <button className="w-full bg-white border rounded-md p-3 flex items-center justify-center gap-3 shadow-sm">
            <span>@</span>
            <span>Sign in with Email</span>
          </button>

          <p className="text-sm mt-4">
            By {activeTab === 'signup' ? 'signing up' : 'logging in'}, you agree to our&nbsp;
            <a href="/terms" className="text-blue-600">Terms</a> and&nbsp;
            <a href="/privacy" className="text-blue-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
