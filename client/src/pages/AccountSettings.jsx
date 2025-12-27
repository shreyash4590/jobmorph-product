import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, onAuthStateChanged } from "firebase/auth";
import CryptoJS from "crypto-js";

const AccountSettings = () => {
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Wait for auth properly
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      setUser(currentUser);
      setEmail(currentUser.email || "");

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setSecurityQuestion(snap.data().securityQuestion || "");
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
        setError("Failed to load account data.");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = async () => {
    setError("");
    setMessage("");

    if (!user) {
      setError("User not logged in.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    if (!securityQuestion || !securityAnswer.trim()) {
      setError("Please select and answer the security question.");
      return;
    }

    setLoading(true);

    try {
      // ✅ Update password ONLY for email/password users
      if (newPassword && user.providerData[0]?.providerId === "password") {
        await updatePassword(user, newPassword);
      }

      const saltedAnswer = `${securityAnswer.trim().toLowerCase()}:${email}`;
      const hashedAnswer = CryptoJS.SHA256(saltedAnswer).toString();

      await updateDoc(doc(db, "users", user.uid), {
        securityQuestion,
        securityAnswer: hashedAnswer,
      });

      setMessage("✅ Account settings updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setSecurityAnswer("");
    } catch (err) {
      console.error("Update failed:", err);
      setError("Update failed. Please re-login and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-10 flex justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Account Settings
        </h2>

        {/* Account Info */}
        <div className="border rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Account Information
          </h3>
          <label className="block text-sm mb-1">Email (read-only)</label>
          <input
            type="email"
            className="w-full mb-2 p-2 border rounded bg-gray-100"
            value={email}
            disabled
          />
        </div>

        {/* Change Password */}
        <div className="border rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Change Password
          </h3>

          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 border rounded pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-500 text-sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>

          <input
            type="password"
            className="w-full mb-2 p-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
          />
        </div>

        {/* Security Question */}
        <div className="border rounded-lg p-5">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Security Question
          </h3>

          <select
            className="w-full mb-3 p-2 border rounded"
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="pet">What is your pet's name?</option>
            <option value="school">What is your school's name?</option>
            <option value="city">In what city were you born?</option>
          </select>

          <input
            type="text"
            className="w-full p-2 border rounded"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            placeholder="Answer (stored securely)"
          />
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        {message && <p className="text-center text-sm text-green-600">{message}</p>}
      </div>
    </div>
  );
};

export default AccountSettings;
