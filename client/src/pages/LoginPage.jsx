import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
} from "firebase/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const handleLogin = async () => {
    const newErrors = {};
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) newErrors.email = "Email is required";
    if (!trimmedPassword) newErrors.password = "Password is required";

    setErrors(newErrors);
    setLoginError("");
    setInfoMessage("");

    if (Object.keys(newErrors).length) return;

    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        trimmedPassword
      );

      if (!result.user.emailVerified) {
        await signOut(auth);
        setLoginError("Please verify your email before logging in.");
        setInfoMessage(
          "A verification email has been sent. Check inbox or spam."
        );
        return;
      }

      navigate(from, { replace: true });
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setLoginError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setLoginError("Incorrect password.");
          break;
        case "auth/invalid-email":
          setLoginError("Invalid email format.");
          break;
        case "auth/too-many-requests":
          setLoginError("Too many attempts. Try again later.");
          break;
        default:
          setLoginError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      setLoginError("Enter email and password first.");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(auth);
        setInfoMessage("Verification email resent successfully.");
      }
    } catch {
      setLoginError("Unable to resend verification email.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoginError("");
    setInfoMessage("");

    try {
      await signInWithPopup(auth, googleProvider);
      navigate(from, { replace: true });
    } catch {
      setLoginError("Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Page Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-200/40 to-blue-300/40 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/30 to-purple-300/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float-slow"></div>
        
        {/* Decorative circles */}
        <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-blue-400 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Main Content Grid - Full Page Split */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* LEFT SIDE - Brand Section */}
        <div className="relative p-8 lg:p-16 flex flex-col justify-between min-h-[400px] lg:min-h-screen">
          {/* Diagonal Merge Element */}
          <div className="hidden lg:block absolute top-0 -right-32 bottom-0 w-64 bg-gradient-to-r from-transparent via-white/30 to-white/60 backdrop-blur-md transform skew-x-[-12deg]"></div>
          
          <div className="relative z-10">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-3 mb-12 group">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-3xl text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  J
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity"></div>
              </div>
              <span className="text-4xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobMorph
              </span>
            </Link>

            {/* Animated Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/60 backdrop-blur-md border-2 border-cyan-200/50 mb-12 shadow-lg">
              <Sparkles className="w-5 h-5 text-cyan-500 animate-pulse" />
              <span className="text-base font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                AI Career Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-8">
              <span className="block text-gray-800">Welcome Back to</span>
              <span className="block mt-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Future
              </span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed max-w-lg mb-12">
              Continue your journey towards finding the perfect career match with AI-powered insights.
            </p>

            {/* Feature Pills */}
            <div className="space-y-4">
              {[
                { icon: Zap, text: 'Lightning Fast Analysis', color: 'from-cyan-400 to-cyan-500' },
                { icon: Sparkles, text: 'Smart Recommendations', color: 'from-blue-400 to-blue-500' },
                { icon: Shield, text: 'Bank-Level Security', color: 'from-purple-400 to-purple-500' }
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border-2 border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mr-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-gray-700 text-base">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* RIGHT SIDE - Form Section */}
        <div className="relative p-8 lg:p-16 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-4xl font-black text-gray-800 mb-3">
                Log In
              </h2>
              <p className="text-lg text-gray-600">Access your account</p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-base transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-300 shadow-lg hover:shadow-xl mb-8"
            >
              <img src="/goggle.png" className="h-6" alt="Google" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-sm text-gray-500 font-semibold">or sign in with email</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur-md opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                      type="email"
                      className="w-full bg-white border-2 border-gray-300 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all shadow-sm"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-bold text-cyan-600 hover:text-cyan-700 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur-md opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-white border-2 border-gray-300 rounded-2xl py-4 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all shadow-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Error & Info Messages */}
              {loginError && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                  <p className="text-red-600 text-sm flex items-start gap-2 font-medium">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {loginError}
                  </p>
                </div>
              )}

              {infoMessage && (
                <div className="p-4 bg-cyan-50 border-2 border-cyan-200 rounded-2xl">
                  <p className="text-cyan-700 text-sm flex items-start gap-2 font-medium">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {infoMessage}
                  </p>
                </div>
              )}

              {/* Resend Verification */}
              {loginError.includes("verify") && (
                <button
                  onClick={handleResendVerification}
                  className="text-cyan-600 text-sm font-bold hover:text-cyan-700 underline block"
                >
                  Resend verification email
                </button>
              )}

              {/* Submit Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="relative w-full mt-8 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl py-5 font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </div>
              </button>

              {/* Footer */}
              <div className="text-center mt-8">
                <p className="text-base text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/signup" className="font-bold text-cyan-600 hover:text-cyan-700 transition-colors">
                    Sign up for free
                  </Link>
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-10 text-center">
              <Link 
                to="/" 
                className="text-sm text-gray-600 hover:text-cyan-600 transition-colors inline-flex items-center gap-2 font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(-15px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          50% { transform: translateY(-15px) translateX(20px) rotate(5deg); }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: 1s;
        }

        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
          animation-delay: 2s;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;





















// import React, { useState } from "react";
// import { auth, googleProvider } from "../firebase";
// import {
//   signInWithEmailAndPassword,
//   signInWithPopup,
//   signOut,
//   sendEmailVerification,
// } from "firebase/auth";
// import { useNavigate, useLocation, Link } from "react-router-dom";
// import { Mail, Lock, Eye, EyeOff } from "lucide-react";

// // Background image
// import landingBg from "../assets/landing-page.jpeg";

// const LoginPage = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);

//   const [errors, setErrors] = useState({});
//   const [loginError, setLoginError] = useState("");
//   const [infoMessage, setInfoMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const location = useLocation();
//   const from = location.state?.from || "/dashboard";

//   /* ================= EMAIL LOGIN ================= */
//   const handleLogin = async () => {
//     const newErrors = {};
//     const trimmedEmail = email.trim().toLowerCase();
//     const trimmedPassword = password.trim();

//     if (!trimmedEmail) newErrors.email = "Email is required";
//     if (!trimmedPassword) newErrors.password = "Password is required";

//     setErrors(newErrors);
//     setLoginError("");
//     setInfoMessage("");

//     if (Object.keys(newErrors).length) return;

//     setLoading(true);

//     try {
//       const result = await signInWithEmailAndPassword(
//         auth,
//         trimmedEmail,
//         trimmedPassword
//       );

//       // 🔐 Email verification enforcement
//       if (!result.user.emailVerified) {
//         await signOut(auth);
//         setLoginError("Please verify your email before logging in.");
//         setInfoMessage(
//           "A verification email has been sent. Check inbox or spam."
//         );
//         return;
//       }

//       navigate(from, { replace: true });
//     } catch (err) {
//       switch (err.code) {
//         case "auth/user-not-found":
//           setLoginError("No account found with this email.");
//           break;
//         case "auth/wrong-password":
//           setLoginError("Incorrect password.");
//           break;
//         case "auth/invalid-email":
//           setLoginError("Invalid email format.");
//           break;
//         case "auth/too-many-requests":
//           setLoginError("Too many attempts. Try again later.");
//           break;
//         default:
//           setLoginError("Login failed. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= RESEND VERIFICATION ================= */
//   const handleResendVerification = async () => {
//     if (!email || !password) {
//       setLoginError("Enter email and password first.");
//       return;
//     }

//     try {
//       const result = await signInWithEmailAndPassword(
//         auth,
//         email.trim().toLowerCase(),
//         password
//       );

//       if (!result.user.emailVerified) {
//         await sendEmailVerification(result.user);
//         await signOut(auth);
//         setInfoMessage("Verification email resent successfully.");
//       }
//     } catch {
//       setLoginError("Unable to resend verification email.");
//     }
//   };

//   /* ================= GOOGLE LOGIN ================= */
//   const handleGoogleLogin = async () => {
//     setLoading(true);
//     setLoginError("");
//     setInfoMessage("");

//     try {
//       await signInWithPopup(auth, googleProvider);
//       navigate(from, { replace: true });
//     } catch {
//       setLoginError("Google login failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= UI ================= */
//   return (
//     <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

//       {/* LEFT IMAGE SECTION */}
//       <div
//         className="hidden md:flex flex-col justify-between text-white p-12 bg-cover bg-center relative"
//         style={{ backgroundImage: `url(${landingBg})` }}
//       >
//         <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />

//         <div className="relative z-10">
//           <div className="flex items-center gap-2 mb-12">
//             <img src="/logo_img.png" alt="Logo" className="h-8" />
//             <span className="font-semibold">JobMorph</span>
//           </div>

//           <span className="inline-flex bg-white/10 px-4 py-1 rounded-full text-sm mb-6">
//             ⭐ AI-Powered Resume Analysis
//           </span>

//           <h1 className="text-5xl font-bold leading-tight mb-6">
//             Let AI boost your <br />
//             <span className="bg-white/10 px-3 py-1 rounded-lg inline-block mt-2">
//               career growth
//             </span>
//           </h1>

//           <p className="text-gray-300 max-w-md">
//             Analyze resumes, match job roles, and improve your skills with AI.
//           </p>
//         </div>

//         <div className="flex gap-6 text-sm text-gray-300 relative z-10">
//           <span>✔ Smart Matching</span>
//           <span>✔ Skill Insights</span>
//         </div>
//       </div>

//       {/* RIGHT LOGIN FORM */}
//       <div className="flex items-center justify-center bg-white px-6">
//         <div className="w-full max-w-md">

//           <h2 className="text-2xl font-semibold mb-4">
//             Welcome back,
//           </h2>

//           {/* Google */}
//           <button
//             onClick={handleGoogleLogin}
//             disabled={loading}
//             className="w-full border rounded-lg py-3 flex items-center justify-center gap-2 mb-4 hover:bg-gray-50"
//           >
//             <img src="/goggle.png" className="h-5" alt="Google" />
//             Sign in with Google
//           </button>

//           <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
//             <div className="flex-1 h-px bg-gray-200" />
//             or
//             <div className="flex-1 h-px bg-gray-200" />
//           </div>

//           {/* Email */}
//           <div className="mb-4">
//             <label className="text-sm font-medium block mb-1">
//               Email *
//             </label>
//             <div className="relative">
//               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5" />
//               <input
//                 type="email"
//                 className="w-full border rounded-lg py-3 pl-10 pr-3"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />
//             </div>
//             {errors.email && (
//               <p className="text-red-500 text-xs mt-1">{errors.email}</p>
//             )}
//           </div>

//           {/* Password */}
//           <div className="mb-4">
//             <label className="text-sm font-medium block mb-1">
//               Password *
//             </label>
//             <div className="relative">
//               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5" />
//               <input
//                 type={showPassword ? "text" : "password"}
//                 className="w-full border rounded-lg py-3 pl-10 pr-10"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
//               >
//                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>
//             {errors.password && (
//               <p className="text-red-500 text-xs mt-1">{errors.password}</p>
//             )}
//           </div>

//           {/* Messages */}
//           {loginError && (
//             <p className="text-red-600 text-sm mb-2">{loginError}</p>
//           )}
//           {infoMessage && (
//             <p className="text-green-600 text-sm mb-2">{infoMessage}</p>
//           )}

//           {loginError.includes("verify") && (
//             <button
//               onClick={handleResendVerification}
//               className="text-blue-600 text-sm underline mb-3"
//             >
//               Resend verification email
//             </button>
//           )}

//           <button
//             onClick={handleLogin}
//             disabled={loading}
//             className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700"
//           >
//             {loading ? "Signing in..." : "Sign In"}
//           </button>

//           <div className="text-center text-sm mt-4">
//             Don’t have an account?{" "}
//             <Link to="/signup" className="text-blue-600 font-medium">
//               Sign up
//             </Link>
//             {/* Forgot Password */}
//             <div className="text-center mt-3">
//             <Link
//                 to="/forgot-password"
//                 className="text-sm text-blue-600 hover:underline"
//               >
//                 Forgot Password?
//             </Link>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;
