// frontend/src/pages/GithubCallback.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function GithubCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (!code) {
            console.error("No code in callback");
            return;
        }

        const loginWithGithub = async () => {
            try {
                const res = await axios.post("http://localhost:5000/api/v1/auth/github", {
                    code,
                });

                console.log("Login success:", res.data);
                // save token, redirect user, etc
                localStorage.setItem("token", res.data.token)
                navigate("/user-info");
            } catch (err) {
                console.error("GitHub login failed", err);
            }
        };

        loginWithGithub();
    }, [navigate]);

    return <div>Authenticating with GitHub...</div>;
}
