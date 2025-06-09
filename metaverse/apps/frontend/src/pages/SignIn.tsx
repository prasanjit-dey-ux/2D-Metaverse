import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
    const BACKEND = import.meta.env.VITE_BACKEND_URL!;
    // const GOOGLEID = import.meta.env.VITE_GOOGLE_CLIENT_ID!;
    const GITHUBID = import.meta.env.VITE_GITHUB_CLIENT_ID!;

    const navigate = useNavigate();

    // ------ Google OAuth ------
    const handleGoogleSuccess = async (res: { credential?: string }) => {
        const idToken = res.credential;
        if (!idToken) return alert("No Google token returned");
        const r = await fetch(`${BACKEND}/api/v1/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        });
        const data = await r.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            alert("Google login success!");
            
            if(data.profileComplete){
                navigate("/dashboard")
            }else {
                navigate("/user-info")
            }

        } else {
            alert("Google login failed");
        }
    };

    // ------ GitHub OAuth ------
    const handleGithubLogin = () => {
        // GitHub will redirect *back* to our frontend callback
        const redirectUri = `${window.location.origin}/github/callback`;
        const url =
            `https://github.com/login/oauth/authorize` +
            `?client_id=${GITHUBID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=user:email`;
        window.location.href = url;
    };

    return (
        <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
            <h2>Sign In</h2>

            {/* Google */}
           
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => alert("Google login error")}
                />
            

            <div style={{ textAlign: "center", margin: "16px 0" }}>— or —</div>

            {/* GitHub */}
            <button onClick={handleGithubLogin} style={{ width: "100%", padding: 8 }}>
                Continue with GitHub
            </button>
        </div>
    );
}
