// apps/frontend/src/pages/UserInfo.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ZodError, type ZodIssue } from "zod";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Ensure this interface matches your backend's UserMetadata (from userSchema.ts)
interface UserMetadataInput {
    username: string;
    displayName?: string | null;
    bannerImageUrl?: string | null;
    profileImageUrl?: string | null;
    bio?: string | null;
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

export default function UserInfo() { // Renamed from UserInfoForm
    const navigate = useNavigate();

    const [formData, setFormData] = useState<UserMetadataInput>({
        username: "",
        displayName: "",
        bannerImageUrl: "",
        profileImageUrl: "",
        bio: "",
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({}); 
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    // FIX: Add error state variable
    const [error, setError] = useState<string | null>(null); 

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin", { replace: true });
            return;
        }

        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${BACKEND_API_URL}/api/v1/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const user = res.data.user;

                setFormData({
                    username: user.username ?? "",
                    displayName: user.displayName ?? "",
                    bannerImageUrl: user.bannerImageUrl ?? "",
                    profileImageUrl: user.profileImageUrl ?? "",
                    bio: user.bio ?? "",
                });
                setError(null); // Clear any previous errors on successful fetch
            } catch (err: unknown) {
                console.error("Failed to fetch user data for form pre-population:", err);
                let errorMessage = "Failed to load profile data. Please log in again.";
                if (axios.isAxiosError(err)) {
                    errorMessage = err.response?.data?.error || errorMessage;
                }
                // FIX: Use setError here
                setError(errorMessage); 
                localStorage.removeItem('token');
                navigate("/signin", { replace: true });
            } finally {
                setInitialLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setFieldErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({}); 
        setError(null); // Clear general error on new submission attempt

        const dataToSubmit: UserMetadataInput = {
            username: formData.username.trim(),
            displayName: formData.displayName?.trim() || null, 
            bannerImageUrl: formData.bannerImageUrl?.trim() || null,
            profileImageUrl: formData.profileImageUrl?.trim() || null,
            bio: formData.bio?.trim() || null,
        };

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setFieldErrors({ form: "User not authenticated. Please log in again." });
                setLoading(false); 
                return;
            }

            const res = await axios.put(
                `${BACKEND_API_URL}/api/v1/user/update-profile`,
                dataToSubmit,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.data.success) {
                navigate("/dashboard", { replace: true });
            } else {
                 setFieldErrors({ form: res.data.error || "Profile update failed: Unknown reason." });
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 400 && err.response?.data?.error && Array.isArray(err.response.data.error)) {
                    const newErrors: FieldErrors = {};
                    err.response.data.error.forEach((detail: { path: (string | number)[], message: string }) => {
                        if (detail.path && detail.path.length > 0) {
                            newErrors[detail.path[0] as keyof FieldErrors] = detail.message;
                        }
                    });
                    setFieldErrors(newErrors);
                } else if (err.response?.data?.error) {
                    setFieldErrors({ form: err.response.data.error });
                } else {
                    setFieldErrors({ form: "Something went wrong during profile update." });
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
        return <div className="min-h-screen flex items-center justify-center bg-background-deep text-text-primary p-4">Loading profile data...</div>;
    }

    // --- Live Preview Data ---
    const displayPreviewUsername = formData.username || 'username';
    const displayPreviewName = formData.displayName || 'Your Display Name';
    const displayPreviewBio = formData.bio || 'Your bio will appear here...';
    const displayPreviewProfileImage = formData.profileImageUrl || "https://placehold.co/100x100/aabbcc/ffffff?text=Avatar";
    const displayPreviewBannerImage = formData.bannerImageUrl || "https://placehold.co/600x200/cccccc/000000?text=Banner";

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 font-sans">
            {/* Form Section */}
            <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-white px-8 py-10 lg:px-12 lg:py-16 shadow-lg lg:rounded-r-lg">
                <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-900">
                    Set Up Your Profile
                </h2>
                <p className="text-center text-gray-600 mb-6">
                    Review and customize your identity in the Metaverse.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Display general error at the top of the form if it exists */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a unique username"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        />
                        {fieldErrors.username && <p className="text-red-500 text-sm mt-2">{fieldErrors.username}</p>}
                    </div>

                    {/* Display Name */}
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-2">
                            Display Name (Optional)
                        </label>
                        <input
                            id="displayName"
                            name="displayName"
                            type="text"
                            value={formData.displayName ?? ''} // Ensure input is controlled with string
                            onChange={handleChange}
                            placeholder="How you want to be seen in the metaverse"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        />
                        {fieldErrors.displayName && <p className="text-red-500 text-sm mt-2">{fieldErrors.displayName}</p>}
                    </div>

                    {/* Profile Image URL */}
                    <div>
                        <label htmlFor="profileImageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                            Profile Image URL (Optional)
                        </label>
                        <input
                            id="profileImageUrl"
                            name="profileImageUrl"
                            type="url"
                            value={formData.profileImageUrl ?? ''} // Ensure input is controlled with string
                            onChange={handleChange}
                            placeholder="e.g., https://example.com/my_profile.jpg"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        />
                        {fieldErrors.profileImageUrl && <p className="text-red-500 text-sm mt-2">{fieldErrors.profileImageUrl}</p>}
                    </div>

                    {/* Banner Image URL */}
                    <div>
                        <label htmlFor="bannerImageUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                            Banner Image URL (Optional)
                        </label>
                        <input
                            id="bannerImageUrl"
                            name="bannerImageUrl"
                            type="url"
                            value={formData.bannerImageUrl ?? ''} // Ensure input is controlled with string
                            onChange={handleChange}
                            placeholder="e.g., https://example.com/my_banner.jpg"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        />
                        {fieldErrors.bannerImageUrl && <p className="text-red-500 text-sm mt-2">{fieldErrors.bannerImageUrl}</p>}
                    </div>

                    {/* Bio */}
                    <div>
                        <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-2">
                            Bio (Optional)
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio ?? ''} // Ensure input is controlled with string
                            onChange={handleChange}
                            placeholder="Tell us about yourself (max 160 characters)"
                            maxLength={160}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-y"
                        />
                        {fieldErrors.bio && <p className="text-red-500 text-sm mt-2">{fieldErrors.bio}</p>}
                    </div>

                    {fieldErrors.form && <p className="text-center text-red-600 mt-4">{fieldErrors.form}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Saving Profile..." : "Save Profile & Continue"}
                    </button>
                </form>
            </div>

            {/* Live Preview Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-8 relative overflow-hidden">
                <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden transform transition-transform duration-500 hover:scale-105">
                    {/* Banner Image */}
                    <div className="relative h-40 bg-gray-200 overflow-hidden">
                        {displayPreviewBannerImage && (
                            <img
                                src={displayPreviewBannerImage}
                                alt="Profile Banner Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/600x200/cccccc/000000?text=Banner+Error";
                                }}
                            />
                        )}
                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-30"></div>
                    </div>

                    <div className="p-6 relative">
                        {/* Profile Image */}
                        <img
                            src={displayPreviewProfileImage}
                            alt="Profile Avatar Preview"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg absolute -top-12 left-6"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/100x100/aabbcc/ffffff?text=Avatar+Error";
                            }}
                        />
                        
                        <div className="mt-16"> {/* Space for avatar */}
                            <h3 className="text-2xl font-bold text-gray-900">{displayPreviewName}</h3>
                            <p className="text-md text-gray-600">@{displayPreviewUsername}</p>
                            <p className="mt-4 text-gray-700 text-sm leading-relaxed">
                                {displayPreviewBio}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
