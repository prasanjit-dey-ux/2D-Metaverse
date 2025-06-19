// apps/frontend/src/pages/SignIn.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const BACKEND_API_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function Signin() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  // Helper function for consistent login success handling
  const handleLoginSuccess = (token: string, profileComplete: boolean) => {
    localStorage.setItem("token", token);
    if (profileComplete) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/user-info", { replace: true });
    }
  };

  const handleGoogleSuccess = async (response: { credential?: string }) => {
    console.log("Google Login Success Response:", response);
    setGoogleLoading(true); // Set Google specific loading
    setErrors([]);
    try {
      if (!response.credential) {
        setErrors(["Google login failed: No credential found."]);
        return;
      }
      const res = await axios.post(`${BACKEND_API_URL}/api/v1/auth/google`, {
        idToken: response.credential,
      });
      console.log("Backend Google Auth Response:", res.data);

      if (res.data.token) {
        handleLoginSuccess(res.data.token, res.data.profileComplete);
      } else {
        setErrors([
          res.data.error || "Google login failed: Unexpected response.",
        ]);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Google Login Failed AxiosError:",
          error.message,
          error.response?.data
        );
        setErrors([error.response?.data?.error || "Google login failed."]);
      } else {
        setErrors(["An unexpected error occurred during Google login."]);
      }
    } finally {
      setGoogleLoading(false); // Reset Google specific loading
    }
  };

  const handleGoogleError = () => {
    console.error("Google Login Error");
    setErrors(["Google login failed. Please try again."]);
  };

  // Determine if any login process is active to disable both buttons
  const isAnyLoading = googleLoading || githubLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white font-sans p-4">
      {/* Main Container Card */}
      <div className=" w-[420px] h-[400px] bg-metaverse-bg rounded-2xl p-8 space-y-14 border border-neon-violet shadow-neon-violet transform transition-all duration-300 hover:scale-[1.01]">
        <div className="text-center">
          <span
            className="font-pixel text-xl tracking-tighter text-white bg-neon-violet shadow-neon-violet p-2 rounded-xl"
            style={{ textShadow: "0 0 3px #fff" }}
          >
            PV
          </span>
          <h2 className="text-3xl font-extrabold text-neon-violet animate-fade-in mt-6 font-pixel">
            Welcome to PixelVerse
          </h2>
          <p className="mt-4 text-md text-white font-pixel text-xs">
            Sign in to explore virtual worlds
          </p>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-900 border border-red-700 text-red-300 p-4 rounded-lg text-sm text-center">
            <ul className="list-none p-0 m-0">
              {errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Social Login Options */}
        <div className="space-y-4">
          {/* Common wrapper for both buttons to ensure consistent width and centering */}
          <div className="flex flex-col items-center gap-4">
            {/* Google Login Button */}
            <div className="w-full max-w-xs mx-auto">
              {" "}
              {/* Adjusted max-w to match GitHub button visual size */}
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with" // More generic text
                shape="pill"
                size="large"
                // The GoogleLogin component does not directly expose a 'disabled' prop
                // that disables the button itself. If you want to visually disable it,
                // you might need to overlay it or use custom rendering of the button
                // if the library supports it, or simply rely on not being able to click it.
                // For now, it will be clickable even if githubLoading is true,
                // but its handler will prevent action.
              />
            </div>

            {/* GitHub Login Button */}
            <button
              type="button"
              onClick={() => {
                if (isAnyLoading) return; // Prevent initiating new actions if any loading is true
                setGithubLoading(true); // Set GitHub specific loading
                window.location.href =
                  `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/github/callback` +
                  `&scope=user:email read:user`;
              }}
              // Adjusted styling to be more like a filled blue Google button, but with GitHub colors
              className="w-full max-w-xs flex items-center justify-center px-4 py-2 border border-gray-600 rounded-full shadow-md text- font-semibold text-white bg-gray-700 hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              disabled={isAnyLoading} // Disable if either Google or GitHub is loading
            >
              <svg
                className="h-6 w-6 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.499.09.679-.217.679-.481 0-.237-.01-1.096-.016-1.936-2.775.604-3.364-1.392-3.364-1.392-.454-1.156-1.11-1.46-1.11-1.46-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.931 0-1.09.39-1.984 1.029-2.682-.107-.253-.448-1.275.097-2.651 0 0 .84-.27 2.75 1.025.79-.22 1.63-.33 2.47-.33.84 0 1.68.11 2.47.33 1.909-1.296 2.747-1.025 2.747-1.025.546 1.376.202 2.398.099 2.651.64.698 1.028 1.592 1.028 2.682 0 3.829-2.339 4.675-4.566 4.922.359.307.678.915.678 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.137 20.207 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              {githubLoading ? "Redirecting..." : "Sign in with GitHub"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}