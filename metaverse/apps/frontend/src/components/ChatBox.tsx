import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
    senderId: string;
    senderUsername: string;
    message: string;
    timestamp: number;
}

interface ChatBoxProps { 
    socket: Socket | null;
    username: string; // The current user's username
    isOpen: boolean; // to control visibility
    onClose: () => void; // Callback to close the chat box
    className?: string; // Now accepts a className prop for external styling (like positioning)
}

const ChatBox: React.FC<ChatBoxProps> = ({ socket, username, isOpen, onClose, className }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

    useEffect(() => {
        if (!socket) return;

        const handleNewChatMessage = (msg: ChatMessage) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        };

        const handleChatHistory = (history: ChatMessage[]) => {
            setMessages(history);
        };

        socket.on('chatMessage', handleNewChatMessage);
        socket.on('chatHistory', handleChatHistory);

        return () => {
            socket.off('chatMessage', handleNewChatMessage);
            socket.off('chatHistory', handleChatHistory);
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    },[messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            socket.emit('chatMessage', { message: newMessage.trim() });
            setNewMessage('');
            // After sending, refocus the input if chatbox is open
            if (isOpen && inputRef.current) {
                inputRef.current.focus();
            }
        }
    };

    const handleInputFocus = () => {
        if (socket) {
            socket.emit('chatInputFocused');
            console.log("ChatBox: Emitted 'chatInputFocused'");
        }
    };

    const handleInputBlur = () => {
        if (socket) {
            socket.emit('chatInputBlurred');
            console.log("ChatBox: Emitted 'chatInputBlurred'");
        }
    };

    // Combine external className with internal Tailwind classes
    const finalChatBoxClasses = `flex flex-col bg-gray-800 text-gray-200 border-r-2 border-gray-600 shadow-lg z-50 p-4 ${className || ''}`;

    return (
        <div className={finalChatBoxClasses}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold">Global Chat</h3>
                <button onClick={onClose} className="bg-transparent border-none text-gray-400 text-xl cursor-pointer hover:text-white transition-colors">
                    X
                </button>
            </div>
            <div className="flex-grow overflow-y-auto mb-2 break-words scrollbar-hide">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-500 mt-5">No messages yet. Say hello!</p>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`mb-2 p-2 rounded-lg max-w-full flex flex-col ${msg.senderId === socket?.id ? 'ml-auto mr-0 bg-blue-700 bg-opacity-20' : 'ml-0 mr-auto bg-gray-700'}`}
                        >
                            <span className={`font-bold text-xs mb-0.5 ${msg.senderId === socket?.id ? 'text-blue-300' : 'text-gray-400'}`}>
                                {msg.senderId === socket?.id ? username : msg.senderUsername}:
                            </span>
                            <span className="text-sm">{msg.message}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="flex mt-2 flex-shrink-0 w-full box-border">
                <input
                    ref={inputRef} // Attach ref here
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onFocus={handleInputFocus} // New: Emit focus event
                    onBlur={handleInputBlur}   // New: Emit blur event
                    placeholder="Type a message..."
                    className="flex-grow p-2 rounded-md border border-gray-600 bg-gray-700 text-gray-200 mr-2 box-border min-w-0 focus:outline-none focus:border-blue-500 transition-colors"
                    disabled={!socket || !socket.connected}
                />
                <button 
                    type="submit" 
                    className="px-4 py-2 bg-green-600 text-white font-bold rounded-md cursor-pointer hover:bg-green-700 transition-colors flex-shrink-0" 
                    disabled={!socket || !socket.connected || newMessage.trim() === ''}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
