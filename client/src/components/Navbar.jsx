import React from 'react';


import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('analyzerAccessCount'); // optional: reset usage
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md px-6 py-1 flex justify-between items-center">
      {/* 🔁 Replace text with logo image */}
      <Link to="/">
        <img
          src="/jobmorph_logo.png" // ✅ Replace this with your own hosted logo image URL
          alt="JobMorph Logo"
          className="h-12 w-100 object-contain"
        />
      </Link>

      <div className="space-x-4">
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="text-white bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md font-semibold"
          >
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">
              <button className="text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-md font-semibold">
                Log In
              </button>
            </Link>
            <Link to="/signup">
              <button className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold">
                Sign Up
              </button>
            </Link>
            
            
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
