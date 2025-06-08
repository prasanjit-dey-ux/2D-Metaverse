import { Routes, Route } from "react-router-dom";
import Signin from "./pages/SignIn";
import GithubCallback from "./pages/GithubCallback";
import LandingPage from "./pages/LandingPage";

export default function App() {
  return(
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/github/callback" element={<GithubCallback />} />
      <Route path="/signin" element={<Signin />} />
    </Routes>
  )
}