// apps/frontend/src/pages/GithubCallback.tsx
import { useEffect, useState, useRef } from "react"; // Import useRef
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function GithubCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const hasRun = useRef(false); // Use useRef to track if useEffect has run

    useEffect(() => {
        // Prevent running multiple times, especially during strict mode or fast re-renders
        if (hasRun.current) {
            console.log("GithubCallback useEffect already ran, skipping.");
            return;
        }
        hasRun.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const authError = urlParams.get("error"); // Use a different variable name to avoid conflict with state `error`

        console.log("GitHub callback - Code:", code, "Error:", authError);

        if (authError) {
            console.error("GitHub OAuth error:", authError);
            setError("GitHub authentication was cancelled or failed. Please try again.");
            setLoading(false);
            return;
        }

        if (!code) {
            console.error("No code in callback");
            setError("No authorization code received from GitHub. Please try again.");
            setLoading(false);
            return;
        }

        const loginWithGithub = async () => {
            try {
                console.log("Sending code to backend:", code);
                
                const res = await axios.post(`${BACKEND_API_URL}/api/v1/auth/github`, {
                    code,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log("Backend response:", res.data);
                
                if (res.data.token) {
                    localStorage.setItem("token", res.data.token);
                    // alert("GitHub login success!"); // Consider replacing alert for better UX later
                    
                    if (res.data.profileComplete) {
                        navigate("/dashboard");
                    } else {
                        navigate("/user-info");
                    }
                } else {
                    throw new Error(res.data.error || "No token received from server after successful request.");
                }
            } catch (err) {
                console.error("GitHub login failed", err);
                
                let errorMessage = "GitHub login failed.";
                if (axios.isAxiosError(err)) {
                    console.error("Axios error details:", err.response?.data);
                    // Prioritize specific error message from backend if available
                    errorMessage = err.response?.data?.error || err.message; 
                } else if (err instanceof Error) {
                    errorMessage = err.message;
                }
                
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        loginWithGithub();
    }, [navigate]); // navigate is a stable dependency, no need to include searchParams if not directly used in render

    if (loading) {
        return <div className="text-center p-4">Authenticating with GitHub...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-4 text-red-500">
                <p>Error: {error}</p>
                <button 
                    onClick={() => navigate("/signin")}
                    className="mt-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Back to Sign In
                </button>
            </div>
        );
    }

    // This should ideally not be reached if navigation happens, but as a fallback
    return <div className="text-center p-4 text-green-500">Authentication successful! Redirecting...</div>;
}
