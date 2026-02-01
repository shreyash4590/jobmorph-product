// import React, { useEffect, useState } from "react";
// import { auth } from "../firebase";
// import {
//   applyActionCode,
//   reload,
//   updateProfile,
// } from "firebase/auth";
// import { useNavigate } from "react-router-dom";

// const VerifyEmailPage = () => {
//   const [status, setStatus] = useState("verifying");
//   const [message, setMessage] = useState("Verifying your email...");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const oobCode = new URLSearchParams(window.location.search).get("oobCode");

//     if (!oobCode) {
//       setStatus("error");
//       setMessage("Invalid verification link.");
//       return;
//     }

//     const verify = async () => {
//       try {
//         await applyActionCode(auth, oobCode);

//         if (auth.currentUser) {
//           await reload(auth.currentUser);

//           // Set default display name if missing
//           if (!auth.currentUser.displayName) {
//             const name = auth.currentUser.email.split("@")[0];
//             await updateProfile(auth.currentUser, {
//               displayName: name,
//             });
//           }
//         }

//         setStatus("success");
//         setMessage("✅ Email verified successfully!");

//         setTimeout(() => {
//           navigate("/dashboard", { replace: true });
//         }, 2000);
//       } catch {
//         setStatus("error");
//         setMessage(
//           "❌ Verification link is invalid or expired."
//         );
//       }
//     };

//     verify();
//   }, [navigate]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="bg-white p-6 rounded-xl shadow-md text-center">
//         <h2 className="text-xl font-semibold mb-2">Email Verification</h2>
//         <p className={
//           status === "success"
//             ? "text-green-600"
//             : status === "error"
//             ? "text-red-600"
//             : "text-gray-600"
//         }>
//           {message}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default VerifyEmailPage;
























import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  applyActionCode,
  reload,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const VerifyEmailPage = () => {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your email address...");
  const navigate = useNavigate();

  useEffect(() => {
    const oobCode = new URLSearchParams(window.location.search).get("oobCode");

    if (!oobCode) {
      setStatus("error");
      setMessage("Invalid or missing verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        // 1️⃣ Apply verification code
        await applyActionCode(auth, oobCode);

        // 2️⃣ Wait until Firebase restores auth state (important for mobile)
        onAuthStateChanged(auth, async (user) => {
          if (!user) {
            setStatus("error");
            setMessage("Authentication session expired. Please log in again.");
            return;
          }

          // 3️⃣ Reload user to refresh emailVerified
          await reload(user);

          // 4️⃣ Set display name if missing
          if (!user.displayName && user.email) {
            const nameFromEmail = user.email.split("@")[0];
            await updateProfile(user, {
              displayName: nameFromEmail,
            });
          }

          setStatus("success");
          setMessage("Email verified successfully! Redirecting to dashboard...");

          // 5️⃣ Redirect
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
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md text-center">
        <h2 className="text-xl font-semibold mb-2">Email Verification</h2>

        <p
          className={`text-sm ${
            status === "success"
              ? "text-green-600"
              : status === "error"
              ? "text-red-600"
              : "text-gray-600"
          }`}
        >
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
