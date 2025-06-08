import { useNavigate } from "react-router-dom";

export default function Landing() {
    const nav = useNavigate();
    return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
                onClick={() => nav("/signin")}
                style={{
                    padding: "12px 24px",
                    fontSize: "16px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#fcba03",
                    color: "#fff"
                }}
            >
                Get Started
            </button>
        </div>
    );
}
