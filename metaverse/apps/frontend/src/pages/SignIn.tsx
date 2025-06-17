// apps/frontend/src/pages/Signin.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function Signin() {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const navigate = useNavigate(); // Initialize useNavigate

    const handleGoogleSuccess = async (response: { credential?: string }) => {
        console.log("Google Login Success Response:", response);
        setLoading(true);
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
                localStorage.setItem("token", res.data.token);
                alert("Google login success!");
                
                if(res.data.profileComplete){ // Note: assuming profileComplete is directly on res.data
                    navigate("/dashboard");
                } else {
                    navigate("/user-info");
                }
            } else {
                setErrors([res.data.error || "Google login failed: Unexpected response."]);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Google Login Failed AxiosError:", error.message, error.response?.data);
                setErrors([error.response?.data?.error || "Google login failed."]);
            } else {
                setErrors(["An unexpected error occurred during Google login."]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        console.error("Google Login Error");
        setErrors(["Google login failed. Please try again."]);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background-deep px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-8 bg-ui-background rounded-xl shadow-2xl animate-fade-in-up">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary animate-fade-in">
                        Sign In to ConnectVerse
                    </h2>
                    <p className="mt-2 text-center text-sm text-text-secondary">
                        Or {" "}
                        <Link to="/signin" className="font-medium text-primary-accent hover:text-secondary-accent transition-colors duration-200">
                            create an account
                        </Link>
                    </p>
                    <div className="text-center p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md mt-4">
                        <p className="font-semibold mb-2">Email/OTP login is temporarily disabled.</p>
                        <p className="text-sm">Please use Google or GitHub to sign in for now.</p>
                    </div>
                </div>
                
                {errors.length > 0 && (
                    <div className="bg-error-background p-3 rounded-md">
                        <ul className="list-disc list-inside text-error-color text-sm">
                            {errors.map((err, index) => (
                                <li key={index}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border-color" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-ui-background text-text-secondary">Continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-3">
                        {/* Google Login Button (disabled prop removed, it's not supported by this component) */}
                        <div className="w-full max-w-[240px]">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                            />
                        </div>

                        {/* GitHub Login Button (disabled prop retained) */}
                        <button
                            type="button"
                            onClick={() => {
                                if (loading) return;
                                setLoading(true);
                                window.location.href = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${window.location.origin}/auth/github/callback` +
                                    // --- ADDED read:user SCOPE HERE ---
                                    `&scope=user:email read:user`; // IMPORTANT: Add read:user scope
                                // ------------------------------------
                            }}
                            className="w-full max-w-[240px] flex items-center justify-center px-4 py-2 border border-border-color rounded-md shadow-sm text-sm font-medium text-text-primary bg-ui-secondary-background hover:bg-ui-background transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="h-5 w-5 mr-2" />
                            {loading ? "Redirecting..." : "GitHub"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
