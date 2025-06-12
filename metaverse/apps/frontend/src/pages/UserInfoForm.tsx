// apps/frontend/src/pages/UserInfoForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ZodError, type ZodIssue } from "zod";

// Define backend API URL from environment variables
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// --- Assuming UserMetadataInput from your userSchema.ts ---
interface UserMetadataInput {
    username: string;
    displayName?: string;
    bannerImageUrl?: string;
    profileImageUrl?: string;
    bio?: string;
}

// Interface for field-specific errors
interface FieldErrors {
    username?: string;
    displayName?: string;
    bannerImageUrl?: string;
    profileImageUrl?: string;
    bio?: string;
    form?: string; // For general form errors
}

export default function UserInfoForm() {
    const navigate = useNavigate();

    // Initialize formData with default empty strings
    const [formData, setFormData] = useState<UserMetadataInput>({
        username: "",
        displayName: "",
        bannerImageUrl: "",
        profileImageUrl: "",
        bio: "",
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({}); // State for field-specific errors
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // New state for initial data fetch

    // --- NEW: Fetch existing user data on component mount ---
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${BACKEND_API_URL}/api/v1/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const user = res.data.user;

                // Pre-populate form with existing user data
                // Use nullish coalescing (?? "") to ensure string type for form inputs
                setFormData({
                    username: user.username ?? "",
                    displayName: user.displayName ?? "",
                    bannerImageUrl: user.bannerImageUrl ?? "",
                    profileImageUrl: user.profileImageUrl ?? "",
                    bio: user.bio ?? "",
                });
            } catch (err: unknown) {
                console.error("Failed to fetch user data for form pre-population:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error for the field being edited
        setFieldErrors(prev => ({ ...prev, [e.target.name]: undefined, form: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({}); // Clear all previous errors

        // --- CRITICAL FIX: Transform formData to send undefined for empty optional strings ---
        const dataToSend: UserMetadataInput = {
            username: formData.username.trim(), // Always trim username
            // For optional fields, if they are empty after trimming, send undefined
            displayName: formData.displayName?.trim() === "" ? undefined : formData.displayName?.trim(),
            bannerImageUrl: formData.bannerImageUrl?.trim() === "" ? undefined : formData.bannerImageUrl?.trim(),
            profileImageUrl: formData.profileImageUrl?.trim() === "" ? undefined : formData.profileImageUrl?.trim(),
            bio: formData.bio?.trim() === "" ? undefined : formData.bio?.trim(),
        };
        // --- END CRITICAL FIX ---


        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setFieldErrors({ form: "User not authenticated. Please log in again." });
                return;
            }

            const res = await axios.post(
                `${BACKEND_API_URL}/api/v1/user/metadata`,
                dataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.data.success) {
                navigate("/dashboard");
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 400 && err.response?.data?.details && Array.isArray(err.response.data.details)) {
                    const newErrors: FieldErrors = {};
                    err.response.data.details.forEach((detail: { path: (string | number)[], message: string }) => {
                        if (detail.path && detail.path.length > 0) {
                            newErrors[detail.path[0] as keyof FieldErrors] = detail.message;
                        }
                    });
                    setFieldErrors(newErrors);
                } else {
                    setFieldErrors({ form: err.response?.data?.error || "Something went wrong" });
                }
            } else if (err instanceof ZodError) {
                const newErrors: FieldErrors = {};
                err.errors.forEach((issue: ZodIssue) => {
                    if (issue.path.length > 0) {
                        newErrors[issue.path[0] as keyof FieldErrors] = issue.message;
                    }
                });
                setFieldErrors(newErrors);
            } else {
                setFieldErrors({ form: (err as Error).message || "An unexpected error occurred." });
            }
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div style={{ ...containerContainerStyle, textAlign: "center", padding: "20px" }}>
                Loading profile data...
            </div>
        );
    }

    return (
        <div style={containerContainerStyle}>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", textAlign: "center" }}>
                Complete Your Profile
            </h2>

            <form onSubmit={handleSubmit} style={formStyle}>
                <div style={inputGroupStyle}>
                    <label htmlFor="username" style={labelStyle}>Username</label>
                    <input
                        id="username"
                        style={inputStyle}
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a unique username"
                        required
                    />
                    {fieldErrors.username && <p style={errorTextStyle}>{fieldErrors.username}</p>}
                </div>

                <div style={inputGroupStyle}>
                    <label htmlFor="displayName" style={labelStyle}>Display Name (Optional)</label>
                    <input
                        id="displayName"
                        style={inputStyle}
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        placeholder="How you want to be seen in the metaverse"
                    />
                    {fieldErrors.displayName && <p style={errorTextStyle}>{fieldErrors.displayName}</p>}
                </div>

                <div style={inputGroupStyle}>
                    <label htmlFor="profileImageUrl" style={labelStyle}>Profile Image URL (Optional)</label>
                    <input
                        id="profileImageUrl"
                        style={inputStyle}
                        type="url"
                        name="profileImageUrl"
                        value={formData.profileImageUrl}
                        onChange={handleChange}
                        placeholder="e.g., https://example.com/my_profile.jpg"
                    />
                    {fieldErrors.profileImageUrl && <p style={errorTextStyle}>{fieldErrors.profileImageUrl}</p>}
                </div>

                <div style={inputGroupStyle}>
                    <label htmlFor="bannerImageUrl" style={labelStyle}>Banner Image URL (Optional)</label>
                    <input
                        id="bannerImageUrl"
                        style={inputStyle}
                        type="url"
                        name="bannerImageUrl"
                        value={formData.bannerImageUrl}
                        onChange={handleChange}
                        placeholder="e.g., https://example.com/my_banner.jpg"
                    />
                    {fieldErrors.bannerImageUrl && <p style={errorTextStyle}>{fieldErrors.bannerImageUrl}</p>}
                </div>

                <div style={inputGroupStyle}>
                    <label htmlFor="bio" style={labelStyle}>Bio (Optional)</label>
                    <textarea
                        id="bio"
                        style={{ ...inputStyle, height: "80px", resize: "vertical" }}
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself (max 160 characters)"
                        maxLength={160}
                    />
                    {fieldErrors.bio && <p style={errorTextStyle}>{fieldErrors.bio}</p>}
                </div>

                {fieldErrors.form && <p style={{ color: "red", marginBottom: "12px", textAlign: "center" }}>{fieldErrors.form}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    style={submitButtonStyle}
                >
                    {loading ? "Submitting..." : "Submit Profile"}
                </button>
            </form>
        </div>
    );
}

// --- STYLES ---
const containerContainerStyle: React.CSSProperties = {
    maxWidth: "500px",
    margin: "60px auto",
    padding: "30px",
    border: "1px solid #e0e0e0",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    backgroundColor: "#ffffff",
};

const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
};

const inputGroupStyle: React.CSSProperties = {
    marginBottom: "5px",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
    fontSize: "15px",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #dcdcdc",
    fontSize: "16px",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease-in-out",
};

const errorTextStyle: React.CSSProperties = {
    color: "#dc3545",
    fontSize: "12px",
    marginTop: "5px",
    marginLeft: "2px",
};

const submitButtonStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "18px",
    marginTop: "15px",
    transition: "background-color 0.2s ease-in-out",
};
