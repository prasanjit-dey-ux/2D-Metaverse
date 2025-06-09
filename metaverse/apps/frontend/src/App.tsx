import { Routes, Route } from "react-router-dom";
import Signin from "./pages/SignIn";
import GithubCallback from "./pages/GithubCallback";
import LandingPage from "./pages/LandingPage";
import UserInfoForm from "./pages/UserInfoForm";

function Dashboard() {
  return <h1 style={{ textAlign: "center", marginTop: "100px" }}>Welcome to Dashboard 🎉</h1>;
}

export default function App() {
  return(
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/github/callback" element={<GithubCallback />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/user-info" element={<UserInfoForm/>}/>
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}