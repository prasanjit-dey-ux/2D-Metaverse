import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function UserInfoForm () {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        displayName: "",
        bannerImageUrl: "",
        profileImageUrl: "",
        bio: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token"); // 🟡 get JWT

            if (!token) {
                setError("User not authenticated. Please log in again.");
                return;
            }

            const res = await axios.post(
                "http://localhost:5000/api/v1/user/metadata",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // ✅ Send token
                    },
                }
            );

            if (res.data.success) {
                navigate("/dashboard");
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || "Something went wrong");
            } else {
                setError("Unexpected error occurred");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: "500px",
                margin: "60px auto",
                padding: "24px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxShadow: "0 0 8px rgba(0,0,0,0.1)",
            }}
        >
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
                Complete Your Profile
            </h2>

            <form onSubmit={handleSubmit}>
                <input
                    style={inputStyle}
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    required
                />

                <input
                    style={inputStyle}
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Display Name"
                />

                <input
                    style={inputStyle}
                    type="url"
                    name="bannerImageUrl"
                    value={formData.bannerImageUrl}
                    onChange={handleChange}
                    placeholder="Banner Image URL"
                />

                <input
                    style={inputStyle}
                    type="url"
                    name="profileImageUrl"
                    value={formData.profileImageUrl}
                    onChange={handleChange}
                    placeholder="Profile Image URL"
                />

                <textarea
                    style={{ ...inputStyle, height: "80px", resize: "vertical" }}
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Bio"
                />

                {error && <p style={{ color: "red", marginBottom: "12px" }}>{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </form>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
};
