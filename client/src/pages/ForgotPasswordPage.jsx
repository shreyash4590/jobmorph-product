import React, { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setMessage(
        "Password reset link sent successfully! Please check your email and follow the instructions."
      );

      // Redirect user back to login after a short delay
      setTimeout(() => navigate("/login"), 4000);
    } catch (err) {
      console.error("Reset error:", err);

      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Unable to send reset email. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-blue-50 px-4 py-12 relative overflow-hidden">
      
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-10 text-white relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative"
          >
            {/* Logo/Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-black text-center mb-2">
              Forgot Password?
            </h2>
            <p className="text-cyan-100 text-center text-sm">
              No worries! We'll send you reset instructions
            </p>
          </motion.div>
        </div>

        {/* Form Section */}
        <div className="px-8 py-8">
          <form onSubmit={handleReset} className="space-y-6">
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors text-gray-900 placeholder-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm font-medium">{message}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3.5 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Reset Link
                </>
              )}
            </motion.button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-semibold transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Need help?</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    If you don't receive the email within a few minutes, check your spam folder or contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Don't have an account */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-cyan-600 hover:text-cyan-700 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-sm text-gray-500">
          Protected by advanced security • Your data is safe with us
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;






// import React, { useState } from "react";
// import { auth } from "../firebase";
// import { sendPasswordResetEmail } from "firebase/auth";
// import { useNavigate } from "react-router-dom";

// const ForgotPasswordPage = () => {
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleReset = async () => {
//     setError("");
//     setMessage("");

//     const trimmedEmail = email.trim().toLowerCase();
//     if (!trimmedEmail) {
//       setError("Please enter your registered email address.");
//       return;
//     }

//     setLoading(true);
//     try {
//       await sendPasswordResetEmail(auth, trimmedEmail);
//       setMessage(
//         "Password reset link sent. Please check your email and follow the instructions."
//       );

//       // Redirect user back to login after a short delay
//       setTimeout(() => navigate("/login"), 4000);
//     } catch (err) {
//       console.error("Reset error:", err);

//       if (err.code === "auth/user-not-found") {
//         setError("No account found with this email.");
//       } else {
//         setError("Unable to send reset email. Please try again later.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//       <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
//         <h2 className="text-xl font-semibold text-center mb-2">
//           Reset your password
//         </h2>

//         <p className="text-sm text-gray-500 text-center mb-5">
//           Enter your email and we’ll send you a reset link
//         </p>

//         <input
//           type="email"
//           placeholder="Email address"
//           className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />

//         {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
//         {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

//         <button
//           onClick={handleReset}
//           disabled={loading}
//           className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
//         >
//           {loading ? "Sending..." : "Send Reset Link"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ForgotPasswordPage;
