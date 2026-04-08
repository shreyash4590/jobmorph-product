
// src/pages/VerifyEmailPage.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  applyActionCode,
  reload,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate, useSearchParams } from "react-router-dom";

const VerifyEmailPage = () => {
  const [status,  setStatus]  = useState("verifying");
  const [message, setMessage] = useState("Verifying your email address...");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // ✅ FIXED: use useSearchParams instead of window.location.search
    const oobCode = searchParams.get("oobCode");

    if (!oobCode) {
      setStatus("error");
      setMessage("Invalid or missing verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        await applyActionCode(auth, oobCode);

        // ✅ FIXED: store unsubscribe and call it after use (no memory leak)
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            setStatus("error");
            setMessage("Authentication session expired. Please log in again.");
            unsubscribe();
            return;
          }

          await reload(user);

          if (!user.displayName && user.email) {
            await updateProfile(user, {
              displayName: user.email.split("@")[0],
            });
          }

          setStatus("success");
          setMessage("Email verified successfully! Redirecting to dashboard...");
          unsubscribe();

          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 2000);
        });
      } catch (error) {
        console.error("Email verification failed:", error);
        setStatus("error");
        setMessage("This verification link is invalid or has expired.");
      }
    };

    verifyEmail();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md text-center">
        <h2 className="text-xl font-semibold mb-2">Email Verification</h2>

        {status === "verifying" && (
          <div className="flex justify-center mb-4">
            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        <p className={`text-sm ${
          status === "success" ? "text-green-600"
          : status === "error" ? "text-red-600"
          : "text-gray-600"
        }`}>
          {message}
        </p>

        {status === "error" && (
          <button
            onClick={() => navigate("/login")}
            className="mt-5 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;