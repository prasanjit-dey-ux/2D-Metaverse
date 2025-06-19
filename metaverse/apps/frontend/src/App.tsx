// apps/frontend/src/App.tsx
import React, { useEffect } from 'react';
// CORRECTED IMPORT: Ensure Routes, Route, and useNavigate are imported properly
import { Routes, Route, useNavigate } from 'react-router-dom'; 

// Import your pages (ensure consistent naming)
import LandingPage from './pages/LandingPage/LandingPage'; // Assuming your path for LandingPage
import SignIn from './pages/SignIn';
// import SignUp from './pages/SignUp'; // COMMENTED OUT: Temporarily disable direct signup route
import Dashboard from './pages/Dashboard';
import GithubCallback from './pages/GithubCallback';
import UserInfo from './pages/UserInfo'; // Renamed from UserInfoForm to UserInfo for consistency
import Map2Scene from './pages/Game'; // Assuming your Game.tsx is for Map2Scene content

// --- AuthWrapper for conditional redirects (CRUCIAL for desired flow) ---
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;

    useEffect(() => {
        // Paths that do NOT require a token (public/auth routes)
        const publicPaths = ['/', '/signin', '/auth/github/callback']; // Removed /signup as it's commented out below

        if (token) {
            // User IS LOGGED IN
            // If they are logged in and try to go to a public/auth path (but NOT /user-info, which is a mandatory step)
            if (publicPaths.includes(currentPath) && currentPath !== '/user-info') {
                navigate('/dashboard', { replace: true }); // Send them to dashboard
            }
        } else {
            // User IS NOT LOGGED IN
            // If they are NOT logged in and try to access a PROTECTED path
            if (!publicPaths.includes(currentPath)) {
                navigate('/', { replace: true }); // Send them to landing page
            }
        }
    }, [token, navigate, currentPath]);

    return <>{children}</>; // Render the actual routes (either public or protected after checks)
};

export default function App() {
    return (
        // Removed <Router> tag here. It is correctly provided by BrowserRouter in main.tsx
        <AuthWrapper> {/* <--- This wraps all your routes for auth management */}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<SignIn />} />
                {/* <Route path="/signup" element={<SignUp />} /> COMMENTED OUT: Temporarily disable direct signup route */}

                {/* OAuth Callbacks - these now always redirect to /user-info */}
                <Route path="/auth/github/callback" element={<GithubCallback />} />
                
                {/* User profile setup is now a mandatory first stop after any login */}
                <Route path="/user-info" element={<UserInfo />} />

                {/* Protected routes - only accessible if logged in (and implicitly after user-info is completed/saved) */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/space/:spaceId" element={<Map2Scene />} /> 

                {/* Fallback for unknown routes */}
                <Route path="*" element={<div className="min-h-screen flex items-center justify-center bg-background-deep text-text-primary"><h1>404 - Not Found</h1><p className="mt-2 text-text-secondary">The page you are looking for does not exist.</p></div>} />
            </Routes>
        </AuthWrapper>
    );
}