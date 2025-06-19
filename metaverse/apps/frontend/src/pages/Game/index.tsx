import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import Map2Scene from './Scenes/Map2Scene';
import { io, Socket } from 'socket.io-client';
import { avatars } from "./avatars";
import ChatBox from "../../components/ChatBox";
import axios from "axios";
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:4000";
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

type GameProps = object;

const Game: React.FC<GameProps> = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const navigate = useNavigate();
    const { spaceId } = useParams<{ spaceId?: string }>();
    const location = useLocation();

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [currentUsername, setCurrentUsername] = useState<string>("");
    const [selectedGameSheetFilename, setSelectedGameSheetFilename] = useState<string>('');

    const [isMusicMuted, setIsMusicMuted] = useState(false);
    const [_isInPrivateArea, _setIsInPrivateArea] = useState(false);

    const [isLoadingGame, setIsLoadingGame] = useState(true);

    const hangupAllCalls = useCallback(() => {
        console.log("Game.tsx: hangupAllCalls triggered (placeholder for RTC cleanup).");
    }, []);

    const toggleMusic = useCallback(() => {
        setIsMusicMuted(prev => {
            const newState = !prev;
            if (gameInstanceRef.current) {
                gameInstanceRef.current.events.emit('toggleMusicMute');
            }
            return newState;
        });
    }, []);

    // Effect to fetch user data (username and avatar)
    useEffect(() => {
        console.log("Game.tsx: User data fetch useEffect mounted.");
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("Game.tsx: No token found, redirecting to signin.");
                navigate("/signin");
                return;
            }
            try {
                const userRes = await axios.get(`${BACKEND_API_URL}/api/v1/user/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUsername(userRes.data.user.username);
                const params = new URLSearchParams(location.search);
                const avatarIdFromUrl = params.get('avatarId');
                
                // --- DEBUGGING LOGS FOR AVATAR REJOIN ISSUE ---
                console.log("Game.tsx: DEBUG - Avatar ID from URL:", avatarIdFromUrl);

                const selectedAvatarData = avatarIdFromUrl
                    ? avatars.find(avatar => avatar.id === avatarIdFromUrl) 
                    : undefined;
                
                console.log("Game.tsx: DEBUG - Selected Avatar Data:", selectedAvatarData);

                setSelectedGameSheetFilename(selectedAvatarData ? selectedAvatarData.gameSheet : 'player1.png');
                console.log(`Game.tsx: DEBUG - Final gameSheet selected: ${selectedAvatarData ? selectedAvatarData.gameSheet : 'player1.png'}`);

            } catch (error) {
                console.error("Game.tsx: Failed to fetch username or avatar:", error);
                // Fallback to a generic username and default avatar on error
                setCurrentUsername(`Guest_${Math.floor(Math.random() * 1000)}`);
                setSelectedGameSheetFilename('player1.png');
            } finally {
                setIsLoadingGame(false);
                console.log("Game.tsx: Finished fetching user data. isLoadingGame set to false.");
            }
        };

        fetchUserData();
    }, [navigate, location.search]); // Depend on navigate and location.search to re-run if URL changes

    // Effect to initialize Phaser game and Socket.IO
    useEffect(() => {
        console.log("Game.tsx: Running Phaser init useEffect.");
        console.log(`Game.tsx: Current states for Phaser init check -
                     gameRef.current: ${gameRef.current ? 'Assigned' : 'Null'},
                     isLoadingGame: ${isLoadingGame},
                     currentUsername: '${currentUsername}',
                     selectedGameSheetFilename: '${selectedGameSheetFilename}'`);

        // Only proceed if all necessary data is loaded and the DOM element is ready
        if (!gameRef.current || isLoadingGame || !currentUsername || !selectedGameSheetFilename) {
            console.log("Game.tsx: Skipping Phaser init - not all prerequisites met yet.");
            return;
        }

        console.log("Game.tsx: All prerequisites met. Attempting to initialize Phaser game.");

        // Clean up previous game/socket instances if they exist
        if (gameInstanceRef.current) {
            console.log("Game.tsx: Destroying previous Phaser game instance before creating new one.");
            gameInstanceRef.current.destroy(true);
            gameInstanceRef.current = null;
        }
        if (socketRef.current) {
            console.log("Game.tsx: Disconnecting previous socket instance.");
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const currentSpaceId = spaceId || "default_space";
        const newSocket = io(SOCKET_SERVER_URL, {
            withCredentials: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = newSocket;

        newSocket.on("connect", () => {
            console.log("Game.tsx: Socket connected with id:", newSocket.id);

            const config: Phaser.Types.Core.GameConfig = {
                type: Phaser.AUTO,
                parent: gameRef.current!,
                width: gameRef.current!.clientWidth,
                height: gameRef.current!.clientHeight,
                physics: { default: "arcade", arcade: { debug: false } },
                scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
                backgroundColor: "#000000",
                scene: [Map2Scene],
                callbacks: {
                    postBoot: (_game) => {
                        console.log("Game.tsx: Phaser game postBoot callback. Game is fully booted.");
                    },
                },
            };

            gameInstanceRef.current = new Phaser.Game(config);
            console.log("Game.tsx: New Phaser game instance created.");
            console.log(`Phaser v${Phaser.VERSION} (WebGL | Web Audio)`);

            gameInstanceRef.current.scene.start("Map2Scene", {
                avatar: selectedGameSheetFilename,
                socket: newSocket,
                socketId: newSocket.id,
                username: currentUsername,
                spaceId: currentSpaceId,
                gameControlCallback: (control: 'enteredPrivate' | 'exitedPrivate' | 'toggleMute') => {
                    if (control === 'enteredPrivate') {
                        _setIsInPrivateArea(true);
                    } else if (control === 'exitedPrivate') {
                        _setIsInPrivateArea(false);
                        hangupAllCalls();
                    } else if (control === 'toggleMute') {
                        setIsMusicMuted(prev => !prev);
                    }
                }
            });
            console.log("Game.tsx: Map2Scene started with initial data including callback.");
        });

        newSocket.on('disconnect', (reason: string) => {
            console.log(`Game.tsx: Socket disconnected: ${reason}`);
            hangupAllCalls();
        });

        const handleResize = () => {
            if (gameInstanceRef.current && gameRef.current) {
                gameInstanceRef.current.scale.resize(
                    gameRef.current.clientWidth,
                    gameRef.current.clientHeight
                );
            }
        };

        window.addEventListener("resize", handleResize);

        // Cleanup function for this useEffect
        return () => {
            console.log("Game.tsx: useEffect cleanup triggered (component unmounting or dependencies changed).");
            window.removeEventListener("resize", handleResize);
            if (gameInstanceRef.current) {
                console.log("Game.tsx: Destroying Phaser game instance in cleanup.");
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
            if (socketRef.current) {
                console.log("Game.tsx: Disconnecting socket in cleanup.");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            hangupAllCalls();
        };
    }, [spaceId, currentUsername, selectedGameSheetFilename, hangupAllCalls, isLoadingGame]); // Depend on relevant states

    // Render loading UI if data is not yet available
    if (isLoadingGame || !currentUsername || !selectedGameSheetFilename) {
        return (
            <div className="flex flex-col items-center justify-center w-screen h-screen bg-gray-900 text-white">
                <p>Loading game data...</p>
            </div>
        );
    }

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
            {/* Phaser game canvas container */}
            <div ref={gameRef} className="absolute inset-0 w-full h-full z-10" />

            {/* Chat Box UI */}
            <ChatBox
                socket={socketRef.current}
                username={currentUsername}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                className={`fixed top-0 right-0 w-[300px] h-full bg-gray-800 bg-opacity-95 text-gray-200 border-l-2 border-gray-600 shadow-lg z-50 transition-transform duration-300 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
            />

            {/* Bottom Control Bar */}
            <div className="absolute bottom-0 left-0 w-full bg-gray-800 bg-opacity-70 p-4 flex justify-between items-center shadow-lg z-20">
                <button
                    onClick={() => setIsChatOpen(prev => !prev)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 flex items-center"
                >
                    <i className="fas fa-comments mr-2"></i>
                    Message
                </button>

                <button
                    onClick={toggleMusic}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 flex items-center"
                >
                    <i className={`fas mr-2 ${isMusicMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                    {isMusicMuted ? 'Unmute Music' : 'Mute Music'}
                </button>

                {/* Disabled Call and Share Screen Buttons */}
                <button
                    disabled={true}
                    className={`px-4 py-2 bg-gray-500 text-white font-bold rounded-lg shadow-md transition-all duration-300 flex items-center cursor-not-allowed`}
                >
                    <i className={`fas fa-phone mr-2`}></i>
                    Call (Disabled)
                </button>
                <button
                    disabled={true}
                    className={`px-4 py-2 bg-gray-500 text-white font-bold rounded-lg shadow-md transition-all duration-300 flex items-center cursor-not-allowed`}
                >
                    <i className={`fas fa-desktop mr-2`}></i>
                    Share Screen (Disabled)
                </button>

                {/* Leave Space Button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg shadow-md transition-all duration-300"
                >
                    Leave Space
                </button>
            </div>

            {/* Hidden Video Monitor Elements */}
            <video id="monitor-video" className="hidden" controls></video>
            <button id="monitor-close" className="hidden"></button>
        </div>
    );
};

export default Game;