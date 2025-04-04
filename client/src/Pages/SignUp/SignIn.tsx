import icon from "../../assets/icon.png";
import giticon from "../../assets/github.png";
// import googleicon from "../../assets/google.png";
import ellipse from "../../assets/ellipse.png";
import Button from "./Components/Button";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center font-roboto">
      <div className="w-[280px] sm:h-[456px] sm:w-auto bg-white rounded-2xl flex flex-col items-center justify-center p-6 shadow-xl">
        <img src={icon} alt="App Icon" className="sm:h-24 sm:w-32 h-16 mb-4" />

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              console.log("Google Sign-In Success:", credentialResponse);
              const token = credentialResponse.credential;

              try {
                const res = await fetch(
                  "http://localhost:8080/api/auth/google",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ token }),
                  }
                );
                const data = await res.json();
                console.log("User info from backend:", data);
                localStorage.setItem("token", token ? token : "");
                navigate("/landingpage");
              } catch (error) {
                console.error("Error verifying token:", error);
              }
            }}
            onError={() => {
              console.log("Google Sign-In Failed");
            }}
          />

          <Button link="" imageSrc={giticon} providerName="GitHub" />
        </div>

        <div className="flex my-4 gap-2 items-center  text-sm">
          {[...Array(4)].map((_, i) => (
            <img key={i} src={ellipse} alt="dot" className="h-1 w-1" />
          ))}
          <p className="text-xs sm:text-base text-gray-700">or sign in with</p>
          {[...Array(4)].map((_, i) => (
            <img key={i} src={ellipse} alt="dot" className="h-1 w-1" />
          ))}
        </div>

        <label htmlFor="email-input" className="sr-only">
          Enter your email
        </label>
        <input
          id="email-input"
          type="text"
          className="border border-gray-300 sm:w-[352px] h-8 sm:h-10 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-yellow-200 w-60 text-xs sm:text-base"
          placeholder="Enter your email"
        />

        <Button
          link=""
          providerName="Email"
          className="bg-yellow-400 text-black mt-4 sm:w-[352px] hover:bg-yellow-300 transition"
        />
      </div>
    </div>
  );
}
