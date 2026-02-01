import React, { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle, User, Sparkles, Zap, Shield } from "lucide-react";

const SignupPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isPasswordStrong = (value) => {
    return (
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[0-9]/.test(value) &&
      /[^A-Za-z0-9]/.test(value)
    );
  };

  const handleSignup = async () => {
    const newErrors = {};
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedName) newErrors.fullName = "Full name is required";
    if (!trimmedEmail) newErrors.email = "Email is required";

    if (!isPasswordStrong(password)) {
      newErrors.password =
        "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: trimmedName,
        email: trimmedEmail,
        provider: "password",
        emailVerified: false,
        createdAt: serverTimestamp(),
      });

      alert(
        "Verification email sent. Please check your inbox and verify before logging in."
      );

      navigate("/login");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setErrors({ email: "Email already exists. Please login." });
      } else {
        alert("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);

      await setDoc(
        userRef,
        {
          fullName: user.displayName || "User",
          email: user.email,
          provider: "google",
          emailVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/dashboard");
    } catch (error) {
      alert("Google signup failed");
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
            <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
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
                AI-Powered Career Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-8">
              <span className="block text-gray-800">Transform Your</span>
              <span className="block mt-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Career Journey
              </span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed max-w-lg mb-12">
              Join thousands of professionals using AI to match their skills with perfect opportunities.
            </p>

            {/* Feature Pills */}
            <div className="space-y-4">
              {[
                { icon: Zap, text: 'Instant AI Analysis', color: 'from-cyan-400 to-cyan-500' },
                { icon: Sparkles, text: 'Smart Job Matching', color: 'from-blue-400 to-blue-500' },
                { icon: Shield, text: '100% Secure & Private', color: 'from-purple-400 to-purple-500' }
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
                Get Started Free
              </h2>
              <p className="text-lg text-gray-600">Create your account in seconds</p>
            </div>

            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-base transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-300 shadow-lg hover:shadow-xl mb-8"
            >
              <img src="/goggle.png" className="h-6" alt="Google" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-sm text-gray-500 font-semibold">or sign up with email</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur-md opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                      type="text"
                      className="w-full bg-white border-2 border-gray-300 rounded-2xl py-4 pl-12 pr-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all shadow-sm"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setErrors((prev) => ({ ...prev, fullName: "" }));
                      }}
                    />
                  </div>
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.fullName}
                  </p>
                )}
              </div>

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
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur-md opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-white border-2 border-gray-300 rounded-2xl py-4 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all shadow-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }}
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
                  <p className="text-red-500 text-sm mt-2 flex items-start gap-1 font-medium">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}

                {password && isPasswordStrong(password) && !errors.password && (
                  <p className="text-green-600 text-sm mt-2 flex items-center gap-1 font-semibold">
                    <CheckCircle size={16} />
                    Strong password!
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur-md opacity-0 group-focus-within:opacity-30 transition-opacity"></div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full bg-white border-2 border-gray-300 rounded-2xl py-4 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all shadow-sm"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSignup}
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
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <Sparkles className="w-5 h-5" />
                    </span>
                  )}
                </div>
              </button>

              {/* Footer */}
              <div className="text-center mt-8">
                <p className="text-base text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-cyan-600 hover:text-cyan-700 transition-colors">
                    Sign in
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

export default SignupPage;























// import React, { useState } from "react";
// import { auth, googleProvider, db } from "../firebase";
// import {
//   createUserWithEmailAndPassword,
//   sendEmailVerification,
//   signInWithPopup,
//   getAdditionalUserInfo,
// } from "firebase/auth";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// import { Link } from "react-router-dom";
// import { Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

// import landingBg from "../assets/landing-page.jpeg";

// const SignupPage = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [successMessage, setSuccessMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   /* ================= PASSWORD RULE ================= */
//   const isPasswordStrong = (value) => {
//     return (
//       value.length >= 8 &&
//       /[A-Z]/.test(value) &&
//       /[0-9]/.test(value) &&
//       /[^A-Za-z0-9]/.test(value)
//     );
//   };

//   /* ================= EMAIL SIGNUP ================= */
//   const handleSignup = async () => {
//     const newErrors = {};
//     const trimmedEmail = email.trim().toLowerCase();

//     if (!trimmedEmail) newErrors.email = "Email is required";

//     if (!isPasswordStrong(password)) {
//       newErrors.password =
//         "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.";
//     }

//     if (password !== confirmPassword) {
//       newErrors.confirmPassword = "Passwords do not match";
//     }

//     setErrors(newErrors);
//     setSuccessMessage("");
//     if (Object.keys(newErrors).length > 0) return;

//     setLoading(true);

//     try {
//       const userCredential = await createUserWithEmailAndPassword(
//         auth,
//         trimmedEmail,
//         password
//       );

//       const user = userCredential.user;

//       await sendEmailVerification(user, {
//         url: `${window.location.origin}/verify-email`,
//       });

//       await setDoc(
//         doc(db, "users", user.uid),
//         {
//           email: trimmedEmail,
//           provider: "password",
//           emailVerified: false,
//           createdAt: serverTimestamp(),
//         },
//         { merge: true }
//       );

//       setSuccessMessage(
//         "Account created successfully. Please check your email to verify your account."
//       );

//       setEmail("");
//       setPassword("");
//       setConfirmPassword("");
//     } catch (err) {
//       console.error("Signup error:", err);

//       if (err.code === "auth/email-already-in-use") {
//         setErrors({ email: "This email is already registered." });
//       } else {
//         setErrors({ general: "Signup failed. Please try again." });
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= GOOGLE SIGNUP ================= */
//   const handleGoogleSignup = async () => {
//     setLoading(true);
//     setErrors({});
//     setSuccessMessage("");

//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       const user = result.user;
//       const info = getAdditionalUserInfo(result);

//       if (info?.isNewUser) {
//         await setDoc(
//           doc(db, "users", user.uid),
//           {
//             email: user.email,
//             provider: "google",
//             emailVerified: true,
//             createdAt: serverTimestamp(),
//           },
//           { merge: true }
//         );
//       }

//       window.location.href = "/dashboard";
//     } catch {
//       setErrors({ general: "Google signup failed. Please try again." });
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= UI ================= */
//   return (
//     <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

//       {/* LEFT SIDE */}
//       <div
//         className="hidden md:flex flex-col justify-between text-white p-12 bg-cover bg-center relative"
//         style={{ backgroundImage: `url(${landingBg})` }}
//       >
//         <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

//         <div className="relative z-10">
//           <img src="/logo_img.png" alt="JobMorph" className="h-8 mb-10" />

//           <span className="inline-block bg-white/10 px-4 py-1 rounded-full text-sm mb-6">
//             🚀 Secure Signup
//           </span>

//           <h1 className="text-5xl font-bold leading-tight mb-6">
//             Build your <br />
//             <span className="bg-white/10 px-3 py-1 rounded-lg inline-block mt-2">
//               future today
//             </span>
//           </h1>

//           <p className="text-gray-300 max-w-md">
//             Strong password protection and verified accounts.
//           </p>
//         </div>
//       </div>

//       {/* RIGHT SIDE */}
//       <div className="flex items-center justify-center bg-white px-6">
//         <div className="w-full max-w-md">

//           <h2 className="text-2xl font-semibold mb-4">
//             Create your account
//           </h2>

//           {/* SUCCESS */}
//           {successMessage && (
//             <div className="mb-4 p-3 rounded bg-green-100 text-green-700 text-sm">
//               ✅ {successMessage}
//             </div>
//           )}

//           {/* ERROR */}
//           {errors.general && (
//             <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
//               ❌ {errors.general}
//             </div>
//           )}

//           {/* GOOGLE */}
//           <button
//             onClick={handleGoogleSignup}
//             disabled={loading}
//             className="w-full border rounded-lg py-3 flex items-center justify-center gap-2 mb-6 hover:bg-gray-50"
//           >
//             <img src="/goggle.png" className="h-5" alt="Google" />
//             Sign up with Google
//           </button>

//           <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
//             <div className="flex-1 h-px bg-gray-200" />
//             or sign up with email
//             <div className="flex-1 h-px bg-gray-200" />
//           </div>

//           {/* EMAIL */}
//           <div className="mb-4">
//             <label className="text-sm font-medium block mb-1">
//               Email Address *
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

//           {/* PASSWORD */}
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
//                 onChange={(e) => {
//                   setPassword(e.target.value);
//                   setErrors((prev) => ({ ...prev, password: "" }));
//                 }}
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-3 top-1/2 -translate-y-1/2"
//               >
//                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>

//             {errors.password && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.password}
//               </p>
//             )}

//             {password && isPasswordStrong(password) && !errors.password && (
//               <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
//                 <CheckCircle size={14} />
//                 Strong password
//               </p>
//             )}
//           </div>

//           {/* CONFIRM PASSWORD */}
//           <div className="mb-6">
//             <label className="text-sm font-medium block mb-1">
//               Confirm Password *
//             </label>
//             <div className="relative">
//               <input
//                 type={showConfirmPassword ? "text" : "password"}
//                 className="w-full border rounded-lg py-3 pr-10 px-3"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//               <button
//                 type="button"
//                 onClick={() =>
//                   setShowConfirmPassword(!showConfirmPassword)
//                 }
//                 className="absolute right-3 top-1/2 -translate-y-1/2"
//               >
//                 {showConfirmPassword ? (
//                   <EyeOff size={18} />
//                 ) : (
//                   <Eye size={18} />
//                 )}
//               </button>
//             </div>

//             {errors.confirmPassword && (
//               <p className="text-red-500 text-xs mt-1">
//                 {errors.confirmPassword}
//               </p>
//             )}
//           </div>

//           {/* SUBMIT */}
//           <button
//             onClick={handleSignup}
//             disabled={loading}
//             className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700"
//           >
//             {loading ? "Creating account..." : "Create Account"}
//           </button>

//           <div className="text-center text-sm mt-4">
//             Already have an account?{" "}
//             <Link to="/login" className="text-blue-600 font-medium">
//               Sign in
//             </Link>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default SignupPage;
