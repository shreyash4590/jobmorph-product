import React, { useState } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import CryptoJS from "crypto-js";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* ================= EMAIL SIGNUP ================= */
  const handleSignup = async () => {
    const newErrors = {};
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedAnswer = securityAnswer.trim().toLowerCase();

    if (!trimmedEmail) newErrors.email = "Enter your email.";
    if (!password || password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!securityQuestion)
      newErrors.securityQuestion = "Choose a security question.";
    if (!trimmedAnswer)
      newErrors.securityAnswer = "Answer the security question.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      const user = userCredential.user;

      const saltedAnswer = `${trimmedAnswer}:${trimmedEmail}`;
      const hashedAnswer = CryptoJS.SHA256(saltedAnswer).toString();

      await setDoc(
        doc(db, "users", user.uid),
        {
          email: trimmedEmail,
          provider: "password",
          securityQuestion,
          securityAnswer: hashedAnswer,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Signup error:", err);

      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login.");
      } else {
        alert("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ================= GOOGLE SIGNUP / LOGIN ================= */
  const handleGoogleSignup = async () => {
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const info = getAdditionalUserInfo(result);

      // Create Firestore user only if new
      if (info?.isNewUser) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            email: user.email,
            provider: "google",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("❌ Google signup failed:", err);
      alert("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[#f5f9fc] flex items-center justify-center px-4">
      <div className="bg-pink rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Create an account</h2>

        {/* Social Signup Buttons */}
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-5">
          <button
            onClick={() =>
              alert(
                "LinkedIn login is not yet available. Please use Google or Email signup."
              )
            }
            className="flex-1 border p-2 mx-1 rounded text-sm flex justify-center items-center gap-2"
          >
            <img src="/linkedin.png" alt="LinkedIn" className="w-5 h-5" />
            LinkedIn
          </button>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="flex-1 border p-2 mx-1 rounded text-sm flex justify-center items-center gap-2"
          >
            <img src="/goggle.png" alt="Google" className="w-5 h-5" />
            Google
          </button>

          <button
            className="flex-1 border p-2 mx-1 rounded text-sm flex justify-center items-center gap-2 opacity-60 cursor-not-allowed"
          >
            <img src="/facebook.png" alt="Facebook" className="w-5 h-5" />
            Facebook
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mb-4">
          or sign up with email
        </p>

        {/* Email */}
        <div className="mb-3">
          <label className="text-sm font-medium">Email *</label>
          <input
            type="email"
            value={email}
            className="w-full border p-2 rounded text-sm mt-1"
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="text-sm font-medium">
            Password (8+ characters) *
          </label>
          <input
            type="password"
            value={password}
            className="w-full border p-2 rounded text-sm mt-1"
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && (
            <p className="text-red-500 text-xs">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-3">
          <label className="text-sm font-medium">Confirm Password *</label>
          <input
            type="password"
            value={confirmPassword}
            className="w-full border p-2 rounded text-sm mt-1"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Security Question */}
        <div className="mb-3">
          <label className="text-sm font-medium">Security Question *</label>
          <select
            value={securityQuestion}
            className="w-full border p-2 rounded text-sm mt-1"
            onChange={(e) => setSecurityQuestion(e.target.value)}
          >
            <option value="">-- Select a question --</option>
            <option value="pet">What is your pet's name?</option>
            <option value="school">What is your school's name?</option>
            <option value="city">In what city were you born?</option>
          </select>
          {errors.securityQuestion && (
            <p className="text-red-500 text-xs">
              {errors.securityQuestion}
            </p>
          )}
        </div>

        {/* Security Answer */}
        <div className="mb-4">
          <label className="text-sm font-medium">Answer *</label>
          <input
            type="text"
            value={securityAnswer}
            className="w-full border p-2 rounded text-sm mt-1"
            onChange={(e) => setSecurityAnswer(e.target.value)}
          />
          {errors.securityAnswer && (
            <p className="text-red-500 text-xs">
              {errors.securityAnswer}
            </p>
          )}
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="text-xs text-center text-gray-500 mt-3">
          By creating an account, you agree to the{" "}
          <Link to="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
