// apps/frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { avatars } from "./Game/avatars"; 

// Define backend API URL from environment variables
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// --- INTERFACES ---
interface UserProfile { // Interface for user data fetched for navbar/welcome
    id: string;
    username: string;
    displayName?: string | null; // Allow null or undefined
    profileImageUrl?: string | null; // Allow null or undefined
    isProfileComplete: boolean;
    email: string; // Add email for completeness
    bio?: string | null; // Add bio for completeness
    tag?: string; // Add tag for completeness
}

interface Space {
    id: string;
    name: string;
    width: number;
    height?: number;
    thumbnail?: string; 
    createdAt?: string;
    updatedAt?: string;
}

interface Map {
    id: string;
    name: string;
    width: number;
    height: number;
    thumbnailUrl?: string; 
}

// Update Avatar interface to reflect new properties
interface Avatar {
    id: string; 
    name: string;
    displaySprite: string;
    gameSheet: string; 
    imageUrl: string; 
}

// --- Custom Message Box Function ---
// This function creates and displays a temporary, non-blocking message.
const showTemporaryMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    
    let bgColor = 'bg-blue-500';
    if (type === 'success') bgColor = 'bg-green-500';
    if (type === 'error') bgColor = 'bg-red-500';

    messageDiv.className = `fixed top-5 right-5 ${bgColor} text-white p-3 rounded-md shadow-lg z-[9999] opacity-0 transition-opacity duration-300`;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => { messageDiv.style.opacity = '1'; }, 10); // Fade in
    setTimeout(() => { messageDiv.style.opacity = '0'; }, 3000); // Fade out after 3 seconds
    setTimeout(() => { messageDiv.remove(); }, 3300); // Remove from DOM after fade out
};


export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null); // State for current user data
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // States for Create Space Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState("");
    const [selectedMap, setSelectedMap] = useState<Map | null>(null);
    const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
    const [availableMaps, setAvailableMaps] = useState<Map[]>([]);
    const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);

    const [creatingSpace, setCreatingSpace] = useState(false);
    const [createSpaceError, setCreateSpaceError] = useState<string | null>(null);
    
    // Correct state variable for sharing (only Space ID)
    const [sharedSpaceIdOnly, setSharedSpaceIdOnly] = useState<string | null>(null);

    // States for Join Space by ID
    const [joinSpaceId, setJoinSpaceId] = useState<string>("");
    const [joinSpaceError, setJoinSpaceError] = useState<string | null>(null);


    // useEffect to fetch dashboard data (user, spaces, maps, avatars)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin", { replace: true }); // Redirect if not authenticated
            return;
        }

        const fetchDashboardData = async () => {
            setLoading(true); // Start loading at the beginning of the fetch
            try {
                // --- Fetch User Data (for "Welcome Username" and Navbar) ---
                const userRes = await axios.get(`${BACKEND_API_URL}/api/v1/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUser(userRes.data.user); // Set the full user object

                // --- Fetch Spaces (for "Your Spaces" list) ---
                const spacesRes = await axios.get(`${BACKEND_API_URL}/api/v1/space/all`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSpaces(spacesRes.data.sessions || []); // Backend sends 'sessions' or empty array

                // --- Fetch Available Maps (for "Create Space" modal) ---
                const mapsRes = await axios.get(`${BACKEND_API_URL}/api/v1/map/all`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAvailableMaps(mapsRes.data.maps || []);
                // Set initial selected map if available and nothing is selected yet
                setSelectedMap(prev => prev || (mapsRes.data.maps && mapsRes.data.maps.length > 0 ? mapsRes.data.maps[0] : null));

                // --- Define/Fetch Available Avatars (for selection) ---
                const mappedAvatars: Avatar[] = avatars.map((avatar) => ({
                    id: avatar.id, 
                    name: avatar.name,
                    displaySprite: avatar.displaySprite,
                    gameSheet: avatar.gameSheet,
                    imageUrl: `/images/avatar_ui/${avatar.displaySprite}`, // Assuming this path
                }));
                setAvailableAvatars(mappedAvatars);
                // Set initial selected avatar if available and nothing is selected yet
                setSelectedAvatar(prev => prev || (mappedAvatars.length > 0 ? mappedAvatars[0] : null));

            } catch (err: unknown) {
                console.error("Failed to load dashboard data:", err);
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.error || "Failed to load dashboard data.");
                } else {
                    setError("An unexpected error occurred while loading dashboard data.");
                }
                // If dashboard data fails to load, it's often an auth issue, so redirect to signin.
                localStorage.removeItem("token");
                navigate("/signin", { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // ESLint fix: Include selectedMap and selectedAvatar in dependencies because they are used in the initial selection logic
        // Also include navigate for consistency, though it's stable.
    }, [navigate]);

    useEffect(() => {
        if (!selectedAvatar && availableAvatars.length > 0) {
            setSelectedAvatar(availableAvatars[0]);
        }
    }, [selectedAvatar, availableAvatars]);


    // Function to handle creating a new space
    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingSpace(true);
        setCreateSpaceError(null);
        
        // Clear the raw Space ID state
        setSharedSpaceIdOnly(null);

        // Input validation
        if (!newSpaceName.trim()) {
            setCreateSpaceError("Space name cannot be empty.");
            setCreatingSpace(false);
            return;
        }
        if (!selectedMap) {
            setCreateSpaceError("Please select a map.");
            setCreatingSpace(false);
            return;
        }
        if (!selectedAvatar) {
            setCreateSpaceError("Please select an avatar.");
            setCreatingSpace(false);
            return;
        }


        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin", { replace: true });
            return;
        }

        try {
            const res = await axios.post(
                `${BACKEND_API_URL}/api/v1/space`,
                {
                    name: newSpaceName,
                    mapId: selectedMap.id, 
                    width: selectedMap.width, 
                    height: selectedMap.height,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const createdSpace = res.data.space;
            
            setSpaces((prevSpaces) => [...prevSpaces, {
                id: createdSpace.id,
                name: createdSpace.name,
                width: createdSpace.width,
                height: createdSpace.height,
                thumbnail: selectedMap.thumbnailUrl, 
                createdAt: createdSpace.createdAt,
                updatedAt: createdSpace.updatedAt,
            }]);

            // Set only the raw Space ID
            setSharedSpaceIdOnly(createdSpace.id);

            // Reset modal form fields
            setNewSpaceName("");
            setSelectedMap(availableMaps.length > 0 ? availableMaps[0] : null); 
            setSelectedAvatar(availableAvatars.length > 0 ? availableAvatars[0] : null); 
            
            showTemporaryMessage("Space created successfully!", 'success'); // Show success message

        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setCreateSpaceError(err.response?.data?.error || "Failed to create space.");
            } else {
                setCreateSpaceError("An unexpected error occurred while creating space.");
            }
            console.error("Failed to create space:", err);
        } finally {
            setCreatingSpace(false);
        }
    };

    // Function to handle joining a space by ID
    const handleJoinSpace = (e: React.FormEvent) => {
        e.preventDefault();
        setJoinSpaceError(null);

        if (!joinSpaceId.trim()) {
            setJoinSpaceError("Please enter a Space ID.");
            return;
        }
        if (!selectedAvatar) {
            setJoinSpaceError("Please select an avatar before joining.");
            return;
        }

        // Navigate to the space, passing the chosen avatar's ID as a query parameter
        navigate(`/space/${joinSpaceId.trim()}?avatarId=${selectedAvatar.id}`);
    };

    // Function to handle entering an existing space from the list
    const handleEnterSpace = (spaceId: string) => {
        // When entering a listed space, also pass the currently selected avatar's ID
        if (selectedAvatar) {
            navigate(`/space/${spaceId}?avatarId=${selectedAvatar.id}`);
        } else {
            // Fallback if no avatar is selected (shouldn't happen with default selection)
            showTemporaryMessage("Please select an avatar before entering a space.", 'error');
        }
    };

    // handleDeleteSpace function (for deleting spaces)
    const handleDeleteSpace = async (spaceId: string) => {
        // Using custom modal for confirmation
        const confirmed = window.confirm("Are you sure you want to delete this space? This action cannot be undone.");
        if (!confirmed) {
            return; // User cancelled
        }

        const token = localStorage.getItem("token");
        if (!token) {
            showTemporaryMessage("User not authenticated. Please log in again.", 'error');
            navigate("/signin", { replace: true });
            return;
        }

        try {
            await axios.delete(`${BACKEND_API_URL}/api/v1/space/${spaceId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Filter out the deleted space from the state to update the UI
            setSpaces((prevSpaces) => prevSpaces.filter((space) => space.id !== spaceId));
            showTemporaryMessage("Space deleted successfully!", 'success');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showTemporaryMessage(err.response?.data?.error || "Failed to delete space.", 'error');
            } else {
                showTemporaryMessage("An unexpected error occurred while deleting space.", 'error');
            }
            console.error("Failed to delete space:", err);
        }
    };


    // Function to open the Create Space modal
    const openCreateModal = () => {
        setNewSpaceName(""); 
        setSelectedMap(availableMaps.length > 0 ? availableMaps[0] : null); 
        setSelectedAvatar(availableAvatars.length > 0 ? availableAvatars[0] : null); 
        setCreateSpaceError(null); 
        // Only clear the raw Space ID state
        setSharedSpaceIdOnly(null);
        setIsCreateModalOpen(true);
    };

    // Function to close the Create Space modal
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        // Only clear the raw Space ID state
        setSharedSpaceIdOnly(null);
    };

    // Function to copy text to clipboard (general purpose)
    // This function is correctly defined and called now.
    const copyToClipboard = (textToCopy: string, successMessage: string) => {
        if (!textToCopy) return;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy)
                    .then(() => showTemporaryMessage(successMessage, 'success'))
                    .catch(e => {
                        console.error("Failed to copy link with navigator.clipboard: ", e);
                        fallbackCopyTextToClipboard(textToCopy, successMessage);
                    });
            } else {
                fallbackCopyTextToClipboard(textToCopy, successMessage);
            }
        } catch (err) {
            console.error("Error setting up copy to clipboard: ", err);
            showTemporaryMessage("Failed to copy text.", 'error'); // More generic message
        }
    };

    // Fallback for copying text to clipboard (document.execCommand is deprecated but more compatible in iframes)
    const fallbackCopyTextToClipboard = (text: string, successMessage: string) => {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            showTemporaryMessage(successMessage, 'success');
        } catch (err) {
            console.error("Failed to copy text using document.execCommand: ", err);
            showTemporaryMessage("Failed to copy text (execCommand fallback).", 'error');
        } finally {
            document.body.removeChild(tempInput);
        }
    };

    // Function to handle user logout
    const handleLogout = () => {
        localStorage.removeItem("token"); // Clear JWT token
        navigate("/signin", { replace: true }); // Redirect to sign-in page, replacing history
    };

    // Render loading state
     if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-pixel">
                <div className="text-xl font-semibold">Loading dashboard...</div>
                <div className="mt-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
            </div>
        );
    } 

    // Render error state
    if (error) {
        return (
            <div className="max-w-screen-md mx-auto my-10 p-8 border border-gray-200 rounded-lg shadow-md bg-white text-red-600">
                Error: {error}
                <button onClick={handleLogout} className="ml-4 px-4 py-2 bg-red-600 text-white font-bold rounded-md cursor-pointer text-sm hover:bg-red-700 transition-colors">Logout</button>
            </div>
        );
    }

    const displayUserName = user?.displayName || user?.username || 'User';
    const profileImage = user?.profileImageUrl || 'https://placehold.co/40x40/aabbcc/ffffff?text=U'; // Default avatar

    // Main Dashboard Render
    return (
        <div className="min-h-screen bg-metaverse-bg flex flex-col font-pixel">
            {/* Top Navbar */}
            <nav className="fixed top-0 left-0 w-full shadow-md p-4 flex justify-between items-center z-40 bg-metaverse-bg border-b border-[#a259ff] drop-shadow-[0_0_16px_#a259ff]">
                <div className="flex items-center gap-3">
                    <span
                        className="font-pixel text-xl tracking-tighter text-white bg-neon-violet shadow-neon-violet p-2 rounded-xl"
                        style={{ textShadow: "0 0 3px #fff" }}
                    >
                        PV
                    </span>
                    <span 
                    className="text-xl font-bold text-white font-pixel ">
                        Pixelverse
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate("/user-info")}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <img
                            src={profileImage}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                    "https://placehold.co/40x40/aabbcc/ffffff?text=U";
                            }}
                        />
                        {/* Removed: <span className="text-neon-green font-semibold hidden sm:inline ">{displayUserName}</span> */}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-3 py-2 bg-white font-bold rounded-md cursor-pointer text-neon-violet text-sm hover-bg-neon-violet transition-colors hover:text-white"
                    >
                        Logout
                    </button>
                </div>
            </nav>
    
            {/* Main Content Area (with padding to clear fixed navbar) */}
            <div className="flex-grow w-[800px] mx-auto my-10 p-8 pt-24 rounded-lg shadow-md bg-metaverse-bg">
                {" "}
                <h2 className="text-2xl font-bold text-white mb-8 text-center">
                    Welcome {displayUserName}!
                </h2>
                {/* Section for Joining a Space by ID */}
                <div className="mb-8 p-6 border border-[#a259ff] rounded-lg bg-gray-900 drop-shadow-[0_0_16px_#a259ff]">
                    <h3 className="text-xl font-semibold mb-4 text-white">
                        Join Existing Space
                    </h3>
                    <form
                        onSubmit={handleJoinSpace}
                        className="flex flex-col sm:flex-row gap-4 mb-4"
                    >
                        <input
                            type="text"
                            value={joinSpaceId}
                            onChange={(e) => setJoinSpaceId(e.target.value)}
                            placeholder="Enter Space ID"
                            className="flex-grow p-3 border border-gray-500 bg-gray-800 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-[#a259ff] placeholder-gray-400 text-white"
                            required
                        />
                        <button
                            type="submit"
                            className="px-5 py-3 text-white font-bold rounded-md cursor-pointer text-base hover:bg-[#ff65c3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-neon-violet drop-shadow-[0_0_16px_#a259ff]"
                            disabled={!selectedAvatar}
                        >
                            Join Space
                        </button>
                    </form>
                    {joinSpaceError && (
                        <p className="text-red-500 text-sm mt-1">{joinSpaceError}</p>
                    )}
            
                    <label className="font-semibold mb-2 block mt-8 text-white">
                        Select Your Avatar for Joining:
                    </label>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-10 p-2 border border-gray-500 rounded-md bg-gray-800 mt-4">
                        {availableAvatars.length === 0 ? (
                            <p className="text-gray-500 text-center col-span-full">
                                No avatars available.
                            </p>
                        ) : (
                            availableAvatars.map((avatar) => (
                                <div
                                    key={avatar.id}
                                    className={`flex w-24 flex-col items-center p-2 rounded-lg  cursor-pointer transition-transform duration-200 hover:scale-105 
                                        ${selectedAvatar?.id === avatar.id ? "border-2 border-[#a259ff] drop-shadow-[0_0_16px_#a259ff] bg-neon-violet" : "border border-gray-500 "}`}
                                    onClick={() => setSelectedAvatar(avatar)}
                                >
                                    <img
                                        src={avatar.imageUrl}
                                        alt={avatar.name}
                                        className="w-16 h-16 object-contain rounded-full mb-1.5"
                                    />
                                    <span className="text-xs font-medium text-white">
                                        {avatar.name}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {/* Section for Creating a New Space (opens modal) */}
                <div className="mb-8 p-4 pt-6 px-8 border border-[#a259ff] rounded-lg shadow-xl  items-center justify-between bg-metaverse-bg shadow-neon-violet">
                    <h3 className="text-xl font-semibod text-white font-pixel">
                        Create New Space
                    </h3>
                    <p className="text-gray-500 text-xs py-2">Start your own metaverse room</p>
                    <button
                        onClick={() => {
                            openCreateModal();
                            setJoinSpaceId("");
                            setJoinSpaceError(null);
                        }}
                        className="my-6 px-2 py-2 bg-neon-violet text-white font-bold rounded-md cursor-pointer text-lg block transition-colors shadow-neon-violet hover:bg-[#ff65c3] w-full"
                    >
                        Create Space
                    </button>
                </div>
                {/* Modal for Creating a New Space */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/70 bg-opacity-60 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-8 rounded-lg shadow-2xl w-[560px] overflow-y-auto relative bg-metaverse-bg">
                            <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-200 ">
                                <h3 className="text-xl font-bold text-white">
                                    Create Your New Space
                                </h3>
                                <button
                                    onClick={closeCreateModal}
                                    className="bg-transparent border-none text-neon-pink text-xl cursor-pointer hover:text-gray-800 transition-colors"
                                >
                                    X
                                </button>
                            </div>
                    
                            {sharedSpaceIdOnly ? ( // This condition now correctly checks sharedSpaceIdOnly
                                <div className="flex flex-col items-center gap-4 p-5 bg-metaverse-bg rounded-lg border border-[#a259ff] ">
                                    <p className="text-neon-violet text-lg font-bold text-center mb-4">
                                        Space created successfully!
                                    </p>
                                    <div className="w-full text-center">
                                        <p className="font-semibold text-gray-400 mb-2">Share this Space ID:</p>
                                        <div className="flex items-center bg-gray-800 p-3 rounded-lg break-all text-sm">
                                            <span className="flex-grow text-white text-left">
                                                {sharedSpaceIdOnly} {/* Correctly displays sharedSpaceIdOnly */}
                                            </span>
                                            <button
                                                // Correctly calls copyToClipboard with arguments
                                                onClick={() => copyToClipboard(sharedSpaceIdOnly, "Space ID copied!")}
                                                className="ml-3 w-24 h-12 px-2 py-1 bg-neon-pink shadow-neon-pink text-white rounded-md hover:bg-[#a259ff] transition-colors text-xs cursor-pointer"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                    
                                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-5">
                                        <button
                                            onClick={() => {
                                                // Creator enters with their selected avatar
                                                if (sharedSpaceIdOnly && selectedAvatar) {
                                                    navigate(`/space/${sharedSpaceIdOnly}?avatarId=${selectedAvatar.id}`, { replace: true });
                                                } else {
                                                    showTemporaryMessage("Error: Cannot enter space (missing ID or avatar).", 'error');
                                                }
                                            }}
                                            className="px-5 py-2 bg-neon-violet shadow-neon-violet text-white font-bold rounded-md cursor-pointer text-base border border-neon-violet transition-colors flex-1 hover:bg-[#ff65c3]"
                                        >
                                            Enter 
                                        </button>
                                        {/* <button
                                            onClick={closeCreateModal}
                                            className="px-5 py-2 bg-gray-500 text-white font-bold rounded-md cursor-pointer text-base hover:bg-gray-600 transition-colors flex-1"
                                        >
                                            Done
                                        </button> */}
                                    </div>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleCreateSpace}
                                    className="flex flex-col gap-4"
                                >
                                    <label className="font-semibold mb-1 block mt-2 text-white">
                                        Space Name:
                                    </label>
                                    <input
                                        type="text"
                                        value={newSpaceName}
                                        onChange={(e) => setNewSpaceName(e.target.value)}
                                        placeholder="Enter space name"
                                        className="p-3 rounded-md border border-gray-500 placeholder-gray-500 text-base w-full box-border text-white focus:outline-none focus:ring-2 focus:ring-[#a259ff]"
                                        required
                                    />
                    
                                    <label className="font-semibold mb-1 block mt-2 text-white">
                                        Choose a Map:
                                    </label>
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 mb-5 p-2 border  rounded-md bg-gray-800 border-gray-500">
                                        {availableMaps.length === 0 ? (
                                            <p className="text-gray-500 col-span-full text-center">
                                                No maps available. Please add maps to your backend.
                                            </p>
                                        ) : (
                                            availableMaps.map((map) => (
                                                <div
                                                    key={map.id}
                                                    className={`flex flex-col items-center p-2 rounded-lg bg-gray-800 cursor-pointer transition-transform duration-200 hover:scale-105 
                                                                ${selectedMap?.id === map.id ? "border-2 border-[#a259ff]" : "border-2 border-gray-300"}`}
                                                    onClick={() => setSelectedMap(map)}
                                                >
                                                    <img
                                                        src={
                                                            map.thumbnailUrl ||
                                                            "https://placehold.co/100x75/E0E0E0/333333?text=No+Map"
                                                        }
                                                        alt={map.name}
                                                        className="w-24 h-16 object-cover rounded-md mb-2"
                                                    />
                                                    <span className="text-xs font-medium text-white text-center">
                                                        {map.name}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                    
                                    <label className="font-semibold mb-1 block mt-2 text-white">
                                        Choose Your Avatar:
                                    </label>
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4 mb-5 p-2 border border-gray-200 rounded-md bg-metaverse-bg">
                                        {availableAvatars.length === 0 ? (
                                            <p className="text-gray-500 col-span-full text-center">
                                                No avatars available.
                                            </p>
                                        ) : (
                                            availableAvatars.map((avatar) => (
                                                <div
                                                    key={avatar.id}
                                                    className={`flex flex-col items-center p-2 rounded-lg bg-gray-50 cursor-pointer transition-transform duration-200 hover:scale-105 
                                                                ${selectedAvatar?.id === avatar.id ? "border-2 border-[#a259ff] shadow-neon-violet bg-neon-violet" : "border border-gray-300 bg-gray-800"}`}
                                                    onClick={() => setSelectedAvatar(avatar)}
                                                >
                                                    <img
                                                        src={avatar.imageUrl}
                                                        alt={avatar.name}
                                                        className="w-16 h-16 object-contain rounded-full mb-1.5"
                                                    />
                                                    <span className="font-medium text-white text-center text-xs">
                                                        {avatar.name}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                    
                                    {createSpaceError && (
                                        <p className="text-red-500 text-sm mt-1 text-center">
                                            {createSpaceError}
                                        </p>
                                    )}
                    
                                    <button
                                        type="submit"
                                        disabled={creatingSpace || !selectedMap || !selectedAvatar}
                                        className="px-5 py-3 bg-neon-violet text-white font-bold rounded-md cursor-pointer text-base mt-5 hover:bg-[#ff65c3] shadow-neon-violet transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {creatingSpace ? "Creating..." : "Create Space"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
                {/* Section for Listing User's Spaces */}
                <div className="mb-8 p-6 border rounded-lg bg-metaverse-bg shadow-neon-violet border-[#a259ff]">
                    <h3 className="text-xl font-semibold mb-4 text-white">
                        Your Spaces
                    </h3>
                    {spaces.length === 0 ? (
                        <p className="text-gray-500 text-center">
                            You haven't created any spaces yet. Create one above!
                        </p>
                    ) : (
                        <ul className="list-none p-0">
                            {spaces.map((space) => (
                                <li
                                    key={space.id}
                                    className="flex flex-col sm:flex-row justify-between items-center p-3 border border-gray-500 rounded-md mb-2 bg-gray-800 shadow-sm"
                                >
                                    <div className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
                                        {space.thumbnail && (
                                            <img
                                                src={space.thumbnail}
                                                alt={space.name}
                                                className="w-16 h-12 object-cover rounded-md"
                                            />
                                        )}
                                        <span className="text-white font-medium">
                                            {space.name}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                                        <button
                                            onClick={() => handleEnterSpace(space.id)}
                                            className="px-3 py-1.5 bg-neon-violet shadow-neon-violet text-white font-bold rounded-md cursor-pointer text-sm hover:bg-[#ff65c3] transition-colors"
                                        >
                                            Enter Space
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSpace(space.id)}
                                            className="px-3 py-1.5 bg-white text-gray-800 font-bold rounded-md cursor-pointer text-sm hover:bg-red-500 transition-colors hover:text-white"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
