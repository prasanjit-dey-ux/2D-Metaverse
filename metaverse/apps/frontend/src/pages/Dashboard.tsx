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
    id: string;
    name: string;
    displaySprite: string; // New property for UI display image filename
    gameSheet: string;      // New property for in-game spritesheet filename
    imageUrl: string;        // Constructed path for UI display
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
                const mappedAvatars: Avatar[] = avatars.map((avatar, index) => ({
                    id: `avatar${index + 1}`, // Generate consistent IDs like "avatar1", "avatar2" for URL params
                    name: avatar.name,
                    displaySprite: avatar.displaySprite, // Use the specific display sprite
                    gameSheet: avatar.gameSheet,           // Store game sheet for later use
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

            // Set the created space's shareable link including the selected avatar's GAME sprite filename
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

        // Navigate to the space, passing the chosen avatar's GAME sprite filename as a query parameter
        navigate(`/space/${joinSpaceId.trim()}?avatarId=${selectedAvatar.id}`);
    };

    // Function to handle entering an existing space from the list
    const handleEnterSpace = (spaceId: string) => {
        // When entering a listed space, also pass the currently selected avatar's GAME sprite filename
        if (selectedAvatar) {
            navigate(`/space/${spaceId}?avatarId=${selectedAvatar.id}`);
        } else {
            // Fallback if no avatar is selected (shouldn't happen with default selection)
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
                messageDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: #4CAF50;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 9999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    opacity: 0;
                    transition: opacity 0.3s ease-in-out;
                `;
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
                        messageDiv.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background-color: #4CAF50;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 5px;
                            z-index: 9999;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                            opacity: 0;
                            transition: opacity 0.3s ease-in-out;
                        `;
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
        return <div style={containerStyle}>Loading dashboard...</div>;
    }

    // Render error state
    if (error) {
        return (
            <div style={{ ...containerStyle, color: "red" }}>
                Error: {error}
                <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
            </div>
        );
    }

    // Main Dashboard Render
    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2 style={{ margin: 0 }}>Welcome {username || 'User'}!</h2> {/* Display fetched username */}
                <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
            </div>

            {/* Section for Joining a Space by ID */}
            <div style={sectionStyle}>
                <h3>Join Space by ID</h3>
                <form onSubmit={handleJoinSpace} style={joinSpaceFormStyle}>
                    <input
                        type="text"
                        value={joinSpaceId}
                        onChange={(e) => setJoinSpaceId(e.target.value)}
                        placeholder="Enter Space ID"
                        style={inputStyle}
                        required
                    />
                    <button type="submit" style={joinSpaceButtonStyle}>
                        Join Space
                    </button>
                </form>
                {joinSpaceError && <p style={errorTextStyle}>{joinSpaceError}</p>}
                {/* Re-using the avatar selection for Join Space as well (user's current choice) */}
                <label style={labelStyle}>Your Current Avatar for Joining:</label>
                <div style={avatarGridStyle}>
                    {availableAvatars.length === 0 ? (
                        <p>No avatars available.</p>
                    ) : (
                        availableAvatars.map((avatar) => (
                            <div
                                key={avatar.id}
                                style={{
                                    ...avatarItemStyle,
                                    border: selectedAvatar?.id === avatar.id ? '2px solid #007bff' : '1px solid #ccc',
                                }}
                                onClick={() => setSelectedAvatar(avatar)}
                            >
                                <img src={avatar.imageUrl} alt={avatar.name} style={avatarImageStyle} />
                                <span>{avatar.name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Section for Creating a New Space (opens modal) */}
            <div style={sectionStyle}>
                <h3>Create New Space</h3>
                <button onClick={() => {
                    openCreateModal();
                    setJoinSpaceId(""); // Clear join space input if opening create modal
                    setJoinSpaceError(null);
                }} style={createSpaceButtonStyle}>
                    Create New Space
                </button>
            </div>


            {/* Modal for Creating a New Space */}
            {isCreateModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={modalHeaderStyle}>
                            <h3>Create Your New Space</h3>
                            <button onClick={closeCreateModal} style={modalCloseButtonStyle}>X</button>
                        </div>

                        {createdSpaceLink ? ( // Show link if space is created
                            <div style={spaceCreatedMessageStyle}>
                                <p style={successTextStyle}>Space created successfully!</p>
                                <p style={linkDisplayContainerStyle}>
                                    Share this link: <span style={linkTextStyle}>{createdSpaceLink}</span>
                                </p>
                                <button onClick={copyToClipboard} style={copyButtonStyle}>
                                    Copy Link
                                </button>
                                {/* Navigate using slice(window.location.origin.length) to ensure correct relative path */}
                                <button onClick={() => navigate(createdSpaceLink.slice(window.location.origin.length))} style={enterCreatedSpaceButtonStyle}>
                                    Enter Space Now
                                </button>
                                <button onClick={closeCreateModal} style={modalCloseButtonStyle}>
                                    Done
                                </button>
                            </div>
                        ) : ( // Show the creation form
                            <form onSubmit={handleCreateSpace} style={modalFormStyle}>
                                {/* Space Name Input */}
                                <label style={labelStyle}>Space Name:</label>
                                <input
                                    type="text"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    placeholder="Enter space name"
                                    style={inputStyle}
                                    required
                                />

                                {/* Map Selection */}
                                <label style={labelStyle}>Choose a Map:</label>
                                <div style={mapGridStyle}>
                                    {availableMaps.length === 0 ? (
                                        <p>No maps available. Please add maps to your backend.</p>
                                    ) : (
                                        availableMaps.map((map) => (
                                            <div
                                                key={map.id}
                                                style={{
                                                    ...mapItemStyle,
                                                    border: selectedMap?.id === map.id ? '2px solid #007bff' : '1px solid #ccc',
                                                }}
                                                onClick={() => setSelectedMap(map)}
                                            >
                                                <img src={map.thumbnailUrl || 'https://placehold.co/100x75/E0E0E0/333333?text=No+Map'} alt={map.name} style={mapThumbnailStyle} />
                                                <span>{map.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>


                                {/* Avatar Selection (in modal for creation) */}
                                <label style={labelStyle}>Choose Your Avatar:</label>
                                <div style={avatarGridStyle}>
                                    {availableAvatars.length === 0 ? (
                                        <p>No avatars available.</p>
                                    ) : (
                                        availableAvatars.map((avatar) => (
                                            <div
                                                key={avatar.id}
                                                style={{
                                                    ...avatarItemStyle,
                                                    border: selectedAvatar?.id === avatar.id ? '2px solid #007bff' : '1px solid #ccc',
                                                }}
                                                onClick={() => setSelectedAvatar(avatar)}
                                            >
                                                <img src={avatar.imageUrl} alt={avatar.name} style={avatarImageStyle} />
                                                <span>{avatar.name}</span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {createSpaceError && <p style={errorTextStyle}>{createSpaceError}</p>}

                                <button type="submit" disabled={creatingSpace} style={modalCreateButtonStyle}>
                                    {creatingSpace ? "Creating..." : "Create Space"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}


            {/* Section for Listing User's Spaces */}
            <div style={sectionStyle}>
                <h3>Your Spaces</h3>
                {spaces.length === 0 ? (
                    <p>You haven't created any spaces yet. Create one above!</p>
                ) : (
                    <ul style={spaceListStyle}>
                        {spaces.map((space) => (
                            <li key={space.id} style={spaceItemStyle}>
                                <span>{space.name} ({space.width}x{space.height || 'auto'})</span>
                                <div style={spaceActionsStyle}> {/* New div for buttons */}
                                    <button onClick={() => handleEnterSpace(space.id)} style={enterSpaceButtonStyle}>
                                        Enter Space
                                    </button>
                                    <button onClick={() => handleDeleteSpace(space.id)} style={deleteSpaceButtonStyle}> {/* New Delete Button */}
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

// --- STYLES ---
const containerStyle: React.CSSProperties = {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "30px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
};

const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    borderBottom: "1px solid #f0f0f0",
    paddingBottom: "15px",
};

const logoutButtonStyle: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
};

const sectionStyle: React.CSSProperties = {
    marginBottom: "30px",
};

const createSpaceButtonStyle: React.CSSProperties = {
    padding: "12px 24px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold",
    display: 'block',
    width: 'fit-content',
    margin: '0 auto'
};

const errorTextStyle: React.CSSProperties = {
    color: "red",
    fontSize: "14px",
    marginTop: "5px",
};

const spaceListStyle: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
};

const spaceItemStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 15px",
    border: "1px solid #e9e9e9",
    borderRadius: "5px",
    marginBottom: "10px",
    backgroundColor: "#fefefe",
};

const spaceActionsStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px", // Space between Enter and Delete buttons
};

const enterSpaceButtonStyle: React.CSSProperties = {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
};

const deleteSpaceButtonStyle: React.CSSProperties = { // New style for delete button
    padding: "8px 16px",
    backgroundColor: "#ffc107", // Warning yellow
    color: "#333", // Darker text for contrast
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
};

// --- MODAL STYLES ---
const modalOverlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    position: "relative",
};

const modalHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
};

const modalCloseButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#888",
};

const modalFormStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
};

const labelStyle: React.CSSProperties = {
    fontWeight: "bold",
    marginBottom: "5px",
    marginTop: "10px",
    display: "block",
};

const inputStyle: React.CSSProperties = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px",
    width: "100%",
    boxSizing: 'border-box'
};

const modalCreateButtonStyle: React.CSSProperties = {
    padding: "12px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "20px",
};

// --- MAP & AVATAR SELECTION STYLES ---
const mapGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
    padding: "10px",
    border: "1px solid #eee",
    borderRadius: "5px",
};

const mapItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s",
};

const mapThumbnailStyle: React.CSSProperties = {
    width: "100px",
    height: "75px",
    objectFit: "cover",
    borderRadius: "5px",
    marginBottom: "8px",
};

const avatarGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
    gap: "15px",
    marginBottom: "20px",
    padding: "10px",
    border: "1px solid #eee",
    borderRadius: "5px",
};

const avatarItemStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    cursor: "pointer",
    transition: "transform 0.2s, border-color 0.2s",
};

const avatarImageStyle: React.CSSProperties = {
    width: "60px",
    height: "60px",
    objectFit: "contain",
    borderRadius: "50%",
    marginBottom: "5px",
};

// --- STYLES FOR JOIN SPACE SECTION ---
const joinSpaceFormStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
};

const joinSpaceButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
};

// --- NEW STYLES FOR SPACE CREATED MESSAGE IN MODAL ---
const spaceCreatedMessageStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    backgroundColor: "#f0fff0", // Light green background for success
    borderRadius: "8px",
    border: "1px solid #c3e6cb", // Green border
};

const successTextStyle: React.CSSProperties = {
    color: "#28a745",
    fontSize: "1.2em",
    fontWeight: "bold",
    marginBottom: "15px",
    textAlign: "center",
};

const linkDisplayContainerStyle: React.CSSProperties = {
    backgroundColor: "#e9ecef",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    wordBreak: "break-all", // Allows long links to wrap
    textAlign: "center",
    fontSize: "0.9em",
};

const linkTextStyle: React.CSSProperties = {
    fontWeight: "bold",
    color: "#0056b3",
};

const copyButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "#17a2b8", // Info blue
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    marginRight: "10px", // Space from next button
};

const enterCreatedSpaceButtonStyle: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "#007bff", // Primary blue
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
};
