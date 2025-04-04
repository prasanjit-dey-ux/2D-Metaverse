// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    {/* <StrictMode> */}
    <GoogleOAuthProvider clientId="524219771877-d4ecbbpc8khdvj32323t1bfpq9bvnasn.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
    {/* </StrictMode> */}
  </BrowserRouter>
);
