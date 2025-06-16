// apps/frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { avatars } from "./Game/avatars"; // IMPORTANT: Import the actual avatars array

// Define backend API URL from environment variables
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// --- INTERFACES ---
interface Space {
    id: string;
    name: string;
    width: number;
    height?: number;
    thumbnail?: string; // This will now be populated from Map.thumbnailUrl
    createdAt?: string;
    updatedAt?: string;
}

interface Map {
    id: string;
    name: string;
    width: number;
    height: number;
    thumbnailUrl?: string; // Assumes your Map model has this field for images
}

// Update Avatar interface to reflect new properties
interface Avatar {
    id: string; // Ensure this matches what's in avatars.ts (e.g., "avatar1", "avatar2")
    name: string;
    displaySprite: string; // New property for UI display image filename
    gameSheet: string;     // New property for in-game spritesheet filename
    imageUrl: string;      // Constructed path for UI display
}

export default function Dashboard() {
    const navigate = useNavigate();
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
    const [createdSpaceLink, setCreatedSpaceLink] = useState<string | null>(null); // State for the created space's shareable link

    // State for Welcome Username
    const [username, setUsername] = useState<string | null>(null);

    // States for Join Space by ID
    const [joinSpaceId, setJoinSpaceId] = useState<string>("");
    const [joinSpaceError, setJoinSpaceError] = useState<string | null>(null);


    // useEffect to fetch dashboard data (user, spaces, maps, avatars)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/signin"); // Redirect if not authenticated
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // --- Fetch User Data (for "Welcome Username") ---
                try {
                    const userRes = await axios.get(`${BACKEND_API_URL}/api/v1/user/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setUsername(userRes.data.user.username);
                } catch (userErr: unknown) {
                    console.error("Failed to fetch user data:", userErr);
                    // Handle user data fetch failure (e.g., show a generic welcome message or error)
                }

                // --- Fetch Spaces (for "Your Spaces" list) ---
                const spacesRes = await axios.get(`${BACKEND_API_URL}/api/v1/space/all`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setSpaces(spacesRes.data.sessions); // Corrected: Backend sends 'sessions' (as transformed by service)

                // --- Fetch Available Maps (for "Create Space" modal) ---
                // Ensure your backend has the /api/v1/map/all endpoint and data for this to work
                const mapsRes = await axios.get(`${BACKEND_API_URL}/api/v1/map/all`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAvailableMaps(mapsRes.data.maps);
                // Set initial selected map if available and nothing is selected yet
                if (mapsRes.data.maps.length > 0 && selectedMap === null) {
                    setSelectedMap(mapsRes.data.maps[0]);
                }

                // --- Define/Fetch Available Avatars (for selection) ---
                // Now using the imported 'avatars' array from Game/avatars.ts
                const mappedAvatars: Avatar[] = avatars.map((avatar) => ({
                    id: avatar.id, // Use the pre-defined ID from avatars.ts
                    name: avatar.name,
                    displaySprite: avatar.displaySprite,
                    gameSheet: avatar.gameSheet,
                    imageUrl: `/images/avatar_ui/${avatar.displaySprite}`,
                }));
                setAvailableAvatars(mappedAvatars);
                // Set initial selected avatar if available and nothing is selected yet
                if (selectedAvatar === null && mappedAvatars.length > 0) {
                    setSelectedAvatar(mappedAvatars[0]);
                }

            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.error || "Failed to load dashboard data.");
                } else {
                    setError("An unexpected error occurred while loading dashboard data.");
                }
                console.error("Failed to load dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // ESLint fix: Include selectedMap and selectedAvatar in dependencies because they are used in the initial selection logic
    }, [navigate, selectedMap, selectedAvatar]);


    // Function to handle creating a new space
    const handleCreateSpace = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingSpace(true);
        setCreateSpaceError(null);
        setCreatedSpaceLink(null); // Reset created link on new attempt

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
            navigate("/signin");
            return;
        }

        try {
            const res = await axios.post(
                `${BACKEND_API_URL}/api/v1/space`,
                {
                    name: newSpaceName,
                    mapId: selectedMap.id, // Send selected map ID to backend
                    width: selectedMap.width, // Pass dimensions from selected map
                    height: selectedMap.height,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const createdSpace = res.data.space;
            // Add the newly created space (with its thumbnail from the service) to the list
            setSpaces((prevSpaces) => [...prevSpaces, {
                id: createdSpace.id,
                name: createdSpace.name,
                width: createdSpace.width,
                height: createdSpace.height,
                thumbnail: createdSpace.thumbnail, // This should come from the service response
                createdAt: createdSpace.createdAt,
                updatedAt: createdSpace.updatedAt,
            }]);

            // Reset modal form fields
            setNewSpaceName("");
            setSelectedMap(availableMaps.length > 0 ? availableMaps[0] : null); // Reset to first available map
            setSelectedAvatar(availableAvatars.length > 0 ? availableAvatars[0] : null); // Reset to first available avatar

            // Set the created space's shareable link including the selected avatar's ID
            setCreatedSpaceLink(`${window.location.origin}/space/${createdSpace.id}?avatarId=${selectedAvatar.id}`);

            // Keep the modal open to show the link to the user
            // setIsCreateModalOpen(false); // Do NOT uncomment this line here
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
            // This might lead to 'player1.png' if no avatarId is provided
            navigate(`/space/${spaceId}`);
        }
    };

    // handleDeleteSpace function (for deleting spaces)
    const handleDeleteSpace = async (spaceId: string) => {
        // Using window.confirm for simplicity, replace with custom modal for better UX
        if (!window.confirm("Are you sure you want to delete this space? This action cannot be undone.")) {
            return; // User cancelled
        }

        const token = localStorage.getItem("token");
        if (!token) {
            // Using alert, replace with custom message box
            alert("User not authenticated. Please log in again.");
            navigate("/signin");
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
            // Using alert, replace with custom message box
            alert("Space deleted successfully!");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                // Using alert, replace with custom message box
                alert(err.response?.data?.error || "Failed to delete space.");
            } else {
                // Using alert, replace with custom message box
                alert("An unexpected error occurred while deleting space.");
            }
            console.error("Failed to delete space:", err);
        }
    };


    // Function to open the Create Space modal
    const openCreateModal = () => {
        setNewSpaceName(""); // Clear previous name
        setSelectedMap(availableMaps.length > 0 ? availableMaps[0] : null); // Reset to first map
        setSelectedAvatar(availableAvatars.length > 0 ? availableAvatars[0] : null); // Reset to first avatar
        setCreateSpaceError(null); // Clear previous errors
        setCreatedSpaceLink(null); // Ensure link is cleared when opening modal
        setIsCreateModalOpen(true);
    };

    // Function to close the Create Space modal
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreatedSpaceLink(null); // Clear link when closing
    };

    // Function to copy text to clipboard (using document.execCommand for broader iframe compatibility)
    const copyToClipboard = () => {
        if (createdSpaceLink) {
            try {
                const tempInput = document.createElement('input');
                tempInput.value = createdSpaceLink;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                // Basic custom message box implementation
                const messageDiv = document.createElement('div');
                messageDiv.textContent = "Link copied to clipboard!";
                messageDiv.className = "fixed top-5 right-5 bg-green-500 text-white p-3 rounded-md shadow-lg z-[9999] opacity-0 transition-opacity duration-300";
                document.body.appendChild(messageDiv);
                setTimeout(() => { messageDiv.style.opacity = '1'; }, 10);
                setTimeout(() => { messageDiv.style.opacity = '0'; }, 2000);
                setTimeout(() => { messageDiv.remove(); }, 2300);

            } catch (err) {
                console.error("Failed to copy link using document.execCommand: ", err);
                // Fallback to navigator.clipboard (might not work in all iframe contexts)
                navigator.clipboard.writeText(createdSpaceLink)
                    .then(() => {
                        const messageDiv = document.createElement('div');
                        messageDiv.textContent = "Link copied to clipboard!";
                        messageDiv.className = "fixed top-5 right-5 bg-green-500 text-white p-3 rounded-md shadow-lg z-[9999] opacity-0 transition-opacity duration-300";
                        document.body.appendChild(messageDiv);
                        setTimeout(() => { messageDiv.style.opacity = '1'; }, 10);
                        setTimeout(() => { messageDiv.style.opacity = '0'; }, 2000);
                        setTimeout(() => { messageDiv.remove(); }, 2300);
                    })
                    .catch(e => console.error("Failed to copy link with navigator.clipboard: ", e));
            }
        }
    };

    // Function to handle user logout
    const handleLogout = () => {
        localStorage.removeItem("token"); // Clear JWT token
        navigate("/signin"); // Redirect to sign-in page
    };

    // Render loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-xl font-semibold">Loading dashboard...</div>
                <div className="mt-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="max-w-screen-md mx-auto my-10 p-8 border border-gray-200 rounded-lg shadow-md bg-white text-red-600">
                Error: {error}
                <button onClick={handleLogout} className="ml-4 px-4 py-2 bg-red-600 text-white font-bold rounded-md cursor-pointer text-sm">Logout</button>
            </div>
        );
    }

    // Main Dashboard Render
    return (
        <div className="max-w-screen-md mx-auto my-10 p-8 border border-gray-200 rounded-lg shadow-md bg-white">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Welcome {username || 'User'}!</h2>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white font-bold rounded-md cursor-pointer text-sm hover:bg-red-700 transition-colors">Logout</button>
            </div>

            {/* Section for Joining a Space by ID */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Join Space by ID</h3>
                <form onSubmit={handleJoinSpace} className="flex gap-4 mb-4">
                    <input
                        type="text"
                        value={joinSpaceId}
                        onChange={(e) => setJoinSpaceId(e.target.value)}
                        placeholder="Enter Space ID"
                        className="flex-grow p-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button type="submit" className="px-5 py-2 bg-gray-600 text-white font-bold rounded-md cursor-pointer text-base hover:bg-gray-700 transition-colors">
                        Join Space
                    </button>
                </form>
                {joinSpaceError && <p className="text-red-500 text-sm mt-1">{joinSpaceError}</p>}
                
                <label className="font-bold mb-1 block mt-4 text-gray-700">Your Current Avatar for Joining:</label>
                {/* Tailwind v4 arbitrary value for grid-cols */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4 mb-5 p-2 border border-gray-200 rounded-md">
                    {availableAvatars.length === 0 ? (
                        <p className="text-gray-500">No avatars available.</p>
                    ) : (
                        availableAvatars.map((avatar) => (
                            <div
                                key={avatar.id}
                                className={`flex flex-col items-center p-2 rounded-lg bg-gray-50 cursor-pointer transition-transform duration-200 hover:scale-105 
                                    ${selectedAvatar?.id === avatar.id ? 'border-2 border-blue-500' : 'border border-gray-300'}`}
                                onClick={() => setSelectedAvatar(avatar)}
                            >
                                <img src={avatar.imageUrl} alt={avatar.name} className="w-16 h-16 object-contain rounded-full mb-1.5" />
                                <span className="text-sm font-medium text-gray-700">{avatar.name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Section for Creating a New Space (opens modal) */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Create New Space</h3>
                <button onClick={() => {
                    openCreateModal();
                    setJoinSpaceId("");
                    setJoinSpaceError(null);
                }} className="px-6 py-3 bg-green-600 text-white font-bold rounded-md cursor-pointer text-lg block mx-auto hover:bg-green-700 transition-colors">
                    Create New Space
                </button>
            </div>


            {/* Modal for Creating a New Space */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-11/12 max-w-lg max-h-4/5 overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800">Create Your New Space</h3>
                            <button onClick={closeCreateModal} className="bg-transparent border-none text-gray-500 text-xl cursor-pointer hover:text-gray-800 transition-colors">X</button>
                        </div>

                        {createdSpaceLink ? (
                            <div className="flex flex-col items-center gap-4 p-5 bg-green-50 rounded-lg border border-green-300">
                                <p className="text-green-700 text-lg font-bold text-center mb-4">Space created successfully!</p>
                                <p className="bg-gray-100 p-4 rounded-lg mb-5 break-all text-center text-sm">
                                    Share this link: <span className="font-bold text-blue-700">{createdSpaceLink}</span>
                                </p>
                                <button onClick={copyToClipboard} className="px-5 py-2 bg-teal-600 text-white font-bold rounded-md cursor-pointer text-base mr-2 hover:bg-teal-700 transition-colors">
                                    Copy Link
                                </button>
                                <button onClick={() => navigate(createdSpaceLink.slice(window.location.origin.length))} className="px-5 py-2 bg-blue-600 text-white font-bold rounded-md cursor-pointer text-base hover:bg-blue-700 transition-colors">
                                    Enter Space Now
                                </button>
                                <button onClick={closeCreateModal} className="mt-4 px-5 py-2 bg-gray-500 text-white font-bold rounded-md cursor-pointer text-base hover:bg-gray-600 transition-colors">
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateSpace} className="flex flex-col gap-4">
                                <label className="font-bold mb-1 block mt-2 text-gray-700">Space Name:</label>
                                <input
                                    type="text"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    placeholder="Enter space name"
                                    className="p-2 rounded-md border border-gray-300 text-base w-full box-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />

                                <label className="font-bold mb-1 block mt-2 text-gray-700">Choose a Map:</label>
                                {/* Tailwind v4 arbitrary value for grid-cols */}
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4 mb-5 p-2 border border-gray-200 rounded-md">
                                    {availableMaps.length === 0 ? (
                                        <p className="text-gray-500">No maps available. Please add maps to your backend.</p>
                                    ) : (
                                        availableMaps.map((map) => (
                                            <div
                                                key={map.id}
                                                className={`flex flex-col items-center p-2 rounded-lg bg-gray-50 cursor-pointer transition-transform duration-200 hover:scale-105 
                                                    ${selectedMap?.id === map.id ? 'border-2 border-blue-500' : 'border border-gray-300'}`}
                                                onClick={() => setSelectedMap(map)}
                                            >
                                                <img src={map.thumbnailUrl || 'https://placehold.co/100x75/E0E0E0/333333?text=No+Map'} alt={map.name} className="w-24 h-16 object-cover rounded-md mb-2" />
                                                <span className="text-sm font-medium text-gray-700">{map.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>


                                <label className="font-bold mb-1 block mt-2 text-gray-700">Choose Your Avatar:</label>
                                {/* Tailwind v4 arbitrary value for grid-cols */}
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-4 mb-5 p-2 border border-gray-200 rounded-md">
                                    {availableAvatars.length === 0 ? (
                                        <p className="text-gray-500">No avatars available.</p>
                                    ) : (
                                        availableAvatars.map((avatar) => (
                                            <div
                                                key={avatar.id}
                                                className={`flex flex-col items-center p-2 rounded-lg bg-gray-50 cursor-pointer transition-transform duration-200 hover:scale-105 
                                                    ${selectedAvatar?.id === avatar.id ? 'border-2 border-blue-500' : 'border border-gray-300'}`}
                                                onClick={() => setSelectedAvatar(avatar)}
                                            >
                                                <img src={avatar.imageUrl} alt={avatar.name} className="w-16 h-16 object-contain rounded-full mb-1.5" />
                                                <span className="text-sm font-medium text-gray-700">{avatar.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {createSpaceError && <p className="text-red-500 text-sm mt-1">{createSpaceError}</p>}

                                <button type="submit" disabled={creatingSpace} className="px-5 py-3 bg-blue-600 text-white font-bold rounded-md cursor-pointer text-base mt-5 hover:bg-blue-700 transition-colors">
                                    {creatingSpace ? "Creating..." : "Create Space"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}


            {/* Section for Listing User's Spaces */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Your Spaces</h3>
                {spaces.length === 0 ? (
                    <p className="text-gray-500">You haven't created any spaces yet. Create one above!</p>
                ) : (
                    <ul className="list-none p-0">
                        {spaces.map((space) => (
                            <li key={space.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-md mb-2 bg-gray-50">
                                <span className="text-gray-800">{space.name} ({space.width}x{space.height || 'auto'})</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEnterSpace(space.id)} className="px-3 py-1.5 bg-blue-500 text-white font-bold rounded-md cursor-pointer text-sm hover:bg-blue-600 transition-colors">
                                        Enter Space
                                    </button>
                                    <button onClick={() => handleDeleteSpace(space.id)} className="px-3 py-1.5 bg-yellow-500 text-gray-800 font-bold rounded-md cursor-pointer text-sm hover:bg-yellow-600 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
