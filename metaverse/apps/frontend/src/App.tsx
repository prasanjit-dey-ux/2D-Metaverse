import { Routes, Route } from "react-router-dom";
import Signin from "./pages/SignIn";
import GithubCallback from "./pages/GithubCallback";
import LandingPage from "./pages/LandingPage";
import UserInfoForm from "./pages/UserInfoForm";
import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";



export default function App() {
  return(
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/github/callback" element={<GithubCallback />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/user-info" element={<UserInfoForm/>}/>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/space/:spaceId" element={<Game/>} />
    </Routes>
  )
}