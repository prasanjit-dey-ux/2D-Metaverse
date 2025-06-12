// apps/frontend/src/pages/Game/index.tsx
import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { avatars } from "./avatars";
import Map1Scene from "./Scenes/Map1Scene";
import ChatBox from "../../components/ChatBox";
import axios from "axios";

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:4000";
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

type GameProps = object;

const Game: React.FC<GameProps> = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const navigate = useNavigate();
    const { spaceId } = useParams<{ spaceId: string }>();
    const location = useLocation();

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [currentUsername, setCurrentUsername] = useState<string>("");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const avatarIdFromUrl = params.get('avatarId');

        const selectedAvatar = avatars.find(avatar => `avatar${avatars.indexOf(avatar) + 1}` === avatarIdFromUrl);
        const selectedGameSheetFilename = selectedAvatar ? selectedAvatar.gameSheet : 'player1.png';

        const fetchUsername = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("No token found, redirecting to signin.");
                navigate("/signin");
                return;
            }
            try {
                const userRes = await axios.get(`${BACKEND_API_URL}/api/v1/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUsername(userRes.data.user.username);
            } catch (error) {
                console.error("Failed to fetch username:", error);
                setCurrentUsername(`Guest_${Math.floor(Math.random() * 1000)}`);
            }
        };

        if (currentUsername === "") {
            fetchUsername();
        }

        if (!socketRef.current && currentUsername) {
            const socket = io(SOCKET_SERVER_URL, {
                withCredentials: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketRef.current = socket;

            socket.on("connect", () => {
                console.log("Game.tsx: Connected with socket id:", socket.id);
                socket.emit("newPlayer", {
                    username: currentUsername,
                    avatar: selectedGameSheetFilename,
                    spaceId: spaceId ?? "",
                });

                const scene = new Map1Scene(selectedGameSheetFilename, socket, socket.id!);

                const config: Phaser.Types.Core.GameConfig = {
                    type: Phaser.AUTO,
                    parent: gameRef.current!,
                    width: gameRef.current!.clientWidth,
                    height: gameRef.current!.clientHeight,
                    scene,
                    scale: {
                        mode: Phaser.Scale.RESIZE,
                        autoCenter: Phaser.Scale.CENTER_BOTH,
                    },
                    physics: {
                        default: "arcade",
                        arcade: { debug: false },
                    },
                    backgroundColor: "#000000",
                };

                gameInstanceRef.current = new Phaser.Game(config);
            });

            socket.on('disconnect', (reason: string) => {
                console.log(`Game.tsx: Socket disconnected: ${reason}`);
            });
        }

        const handleResize = () => {
            if (gameInstanceRef.current && gameRef.current) {
                gameInstanceRef.current.scale.resize(
                    gameRef.current.clientWidth,
                    gameRef.current.clientHeight
                );
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            gameInstanceRef.current?.destroy(true);
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [spaceId, navigate, location.search, currentUsername]);

    const handleDisconnect = () => {
        gameInstanceRef.current?.destroy(true);
        socketRef.current?.disconnect();
        socketRef.current = null;
        navigate("/dashboard");
    };

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
    };

    return (
        <div style={containerStyle}>
            {/* REMOVED: The inline <style> block has been moved to src/styles/chat.css */}

            <div ref={gameRef} style={gameContainerStyle} />

            <ChatBox
                socket={socketRef.current}
                username={currentUsername}
                isOpen={isChatOpen}
                onClose={toggleChat}
            />

            <div style={bottomNavBarStyle}>
                <button
                    onClick={toggleChat}
                    style={navButtonBasicStyle}
                >
                    <i className="fas fa-comments" style={{ marginRight: '8px' }}></i>
                    Message
                </button>
                <button
                    onClick={handleDisconnect}
                    style={disconnectButtonStyle}
                >
                    Leave Space
                </button>
            </div>
        </div>
    );
};

export default Game;

// --- Inline Styles (unchanged) ---
const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#1a202c',
    overflow: 'hidden',
    position: 'relative',
};

const gameContainerStyle: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    borderRadius: '0',
    boxShadow: 'none',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
};

const bottomNavBarStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    boxShadow: '0 -4px 15px rgba(0,0,0,0.3)',
};

const navButtonBasicStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#3f51b5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.3s ease-in-out',
};

const disconnectButtonStyle: React.CSSProperties = {
    padding: '10px 20px',
    backgroundColor: '#dc2626',
    color: 'white',
    fontWeight: '600',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    zIndex: 50,
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.3s ease-in-out, transform 0.3s ease-in-out',
};
