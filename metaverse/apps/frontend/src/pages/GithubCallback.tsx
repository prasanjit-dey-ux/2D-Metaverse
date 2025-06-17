// apps/frontend/src/pages/GithubCallback.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function GithubCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const hasRun = useRef(false); 

    // Helper function for consistent login success handling
    // NOW takes profileComplete flag to decide navigation
    const handleLoginSuccess = (token: string, profileComplete: boolean) => {
        localStorage.setItem("token", token);
        if (profileComplete) {
            navigate("/dashboard", { replace: true }); 
        } else {
            navigate("/user-info", { replace: true }); 
        }
    };

    useEffect(() => {
        if (hasRun.current) {
            console.log("GithubCallback useEffect already ran, skipping.");
            return;
        }
        hasRun.current = true;

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const authError = urlParams.get("error");

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
                    headers: { 'Content-Type': 'application/json' },
                });

                console.log("Backend response:", res.data);
                
                if (res.data.token) {
                    // Pass the profileComplete flag from the backend response
                    handleLoginSuccess(res.data.token, res.data.profileComplete); 
                } else {
                    throw new Error(res.data.error || "No token received from server after successful request.");
                }
            } catch (err) {
                console.error("GitHub login failed", err);
                let errorMessage = "GitHub login failed.";
                if (axios.isAxiosError(err)) {
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
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background-deep text-text-primary p-4">Authenticating with GitHub...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-deep text-red-500 p-4">
                <div className="text-center">
                    <p className="text-xl font-bold mb-4">Error: {error}</p>
                    <button 
                        onClick={() => navigate("/signin", { replace: true })}
                        className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Back to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return <div className="min-h-screen flex items-center justify-center bg-background-deep text-text-primary p-4">Authentication successful! Redirecting...</div>;
}
