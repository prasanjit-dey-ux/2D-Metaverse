// apps/frontend/src/App.tsx
import { Routes, Route } from "react-router-dom";
import Signin from "./pages/SignIn";
import GithubCallback from "./pages/GithubCallback";
import LandingPage from "./pages/LandingPage/LandingPage"
import UserInfoForm from "./pages/UserInfoForm";
import Dashboard from "./pages/Dashboard"; // Dashboard is now the primary entry for managing spaces
import Game from "./pages/Game";

export default function App() {
  return(
    <Routes>
      {/* Landing page for unauthenticated users (or initial entry) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/github/callback" element={<GithubCallback />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/user-info" element={<UserInfoForm/>}/>
      {/* Dashboard is the central hub for authenticated users */}
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Game route now expects a spaceId parameter and avatarId query param */}
      <Route path="/space/:spaceId" element={<Game/>} />
    </Routes>
  )
}