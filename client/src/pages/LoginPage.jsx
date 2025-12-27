import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const handleLogin = async () => {
    const newErrors = {};
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) newErrors.email = "Please enter your email address.";
    if (!trimmedPassword) newErrors.password = "Please enter your password.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    setLoginError("");

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      navigate(from);
    } catch (err) {
      console.error("Login error:", err);

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
        case "auth/invalid-credential":
          setLoginError("Invalid email or password.");
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate(from);
    } catch (err) {
      console.error("Google login error:", err);
      alert("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = () => {
    alert("LinkedIn login coming soon...");
  };

  return (
    <div className="min-h-screen bg-[#f5f9fc] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <div className="flex justify-center mb-4">
          <img src="/logo_img.png" alt="JobMorph Logo" className="h-8" />
        </div>

        <h2 className="text-2xl font-semibold text-center mb-2">
          Sign in to your account
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6">
          Start optimizing your job applications
        </p>

        {/* Social Login */}
        <div className="flex justify-between gap-2 mb-6">
          <button
            onClick={handleLinkedInLogin}
            className="border w-full py-2 rounded-lg font-medium flex items-center justify-center hover:bg-gray-100 transition"
          >
            <img src="/linkedin.png" className="h-5 mr-2" alt="LinkedIn" />
            LinkedIn
          </button>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="border w-full py-2 rounded-lg font-medium flex items-center justify-center hover:bg-gray-100 transition"
          >
            <img src="/goggle.png" className="h-5 mr-2" alt="Google" />
            Google
          </button>

          <button
            onClick={() => alert("Facebook login coming soon...")}
            className="border w-full py-2 rounded-lg font-medium flex items-center justify-center hover:bg-gray-100 transition"
          >
            <img src="/facebook.png" className="h-5 mr-2" alt="Facebook" />
            Facebook
          </button>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email *</label>
          <input
            className={`w-full border p-2 rounded ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Password *</label>
          <input
            className={`w-full border p-2 rounded ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
        </div>

        {loginError && (
          <p className="text-red-600 text-sm mb-4 text-center">{loginError}</p>
        )}

        <div className="text-right mb-4">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-sm text-center mt-4">
          Not registered?{" "}
          <Link to="/signup" className="text-blue-600 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
