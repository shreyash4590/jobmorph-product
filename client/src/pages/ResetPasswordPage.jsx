import React, { useState, useEffect } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get("oobCode");
  const mode = params.get("mode");

  /* 🔒 Validate reset link on page load */
  useEffect(() => {
    if (!oobCode || mode !== "resetPassword") {
      setError("❌ Invalid or expired reset link.");
      return;
    }

    verifyPasswordResetCode(auth, oobCode).catch(() => {
      setError("❌ This reset link has expired or already been used.");
    });
  }, [oobCode, mode]);

  const handleReset = async () => {
    setError("");
    setSuccess("");

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);

      setSuccess("✅ Password updated successfully. Redirecting to login…");

      /* ✅ GUARANTEED redirect */
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (err) {
      console.error("Password reset failed:", err);
      setError("❌ Reset link is invalid or expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2">
          Set a New Password
        </h2>

        <p className="text-sm text-center text-gray-500 mb-6">
          Choose a strong password to secure your JobMorph account
        </p>

        <input
          type="password"
          placeholder="New password (min 8 characters)"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Confirm new password"
          className="w-full mb-3 p-2 border rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={loading}
        />

        {error && (
          <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-sm mb-3 text-center">{success}</p>
        )}

        <button
          onClick={handleReset}
          disabled={loading || !!success}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Updating Password…" : "Save New Password"}
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
