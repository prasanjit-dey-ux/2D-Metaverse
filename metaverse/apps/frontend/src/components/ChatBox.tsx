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
}

const ChatBox: React.FC<ChatBoxProps> = ({ socket, username, isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!socket) return;

        // Listen for new chat message
        const handleNewChatMessage = (msg: ChatMessage) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        };

        // Listend for initial chat history when joining
        const handleChatHistory = (history: ChatMessage[]) => {
            setMessages(history);
        };

        socket.on('chatMessage', handleNewChatMessage);
        socket.on('chatHistory', handleChatHistory);

        // Clean up socket listeners on component amount
        return () => {
            socket.off('chatMessage', handleNewChatMessage);
            socket.off('chatHistory', handleChatHistory);
        };
    }, [socket]); // Re-run effect if socket instance changes

    // Scroll to the latest message whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    },[messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            socket.emit('chatMessage', { message: newMessage.trim() });
            setNewMessage(''); // Clear input field
        }
    };

    // Add a class for sliding animation based on isOpen prop
    const chatBoxClasses = `chat-box ${ isOpen ? 'open' : ''}`;

    return (
        <div style={chatBoxStyle} className={chatBoxClasses}>
            <div style={chatHeaderStyle}>
                <h3>Global Chat</h3>
                <button onClick={onClose} style={closeButtonStyle}>X</button>
            </div>
            <div style={messagesContainerStyle} className='scrollbar-hide'>
                {messages.length === 0 ? (
                    <p style={noMessagesStyle}>No messages yet. Say hello!</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} style={messageStyle(msg.senderId === socket?.id)}>
                            <span style={messageSenderStyle(msg.senderId === socket?.id)}>{msg.senderId === socket?.id ? username : msg.senderUsername}:</span>
                            <span style={messageContentStyle}>{msg.message}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} /> {/* Scroll target */}
            </div>
            <form onSubmit={handleSendMessage} style={chatInputFormStyle}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={inputStyle}
                    disabled={!socket || !socket.connected} // Disable if socket not connected
                />
                <button type="submit" style={sendButtonStyle} disabled={!socket || !socket.connected}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatBox;

// --- Inline Styles for ChatBox ---
const chatBoxStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    // left: '-320px', // Hidden by default, slides in
    width: '300px',
    height: '100%', // Take full height of the game container
    backgroundColor: 'rgba(30, 30, 30, 0.95)', // Darker, semi-transparent background
    color: '#e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '2px solid #555',
    boxShadow: '5px 0 15px rgba(0,0,0,0.5)',
    zIndex: 1000, // Above Phaser canvas
    // transition: 'left 0.3s ease-in-out', // Smooth slide animation
};

// Styles for the 'open' class will be added in a <style> tag in Game/index.tsx

const chatHeaderStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #444',
    flexShrink: 0,
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#e0e0e0',
    fontSize: '1.2rem',
    cursor: 'pointer',
};

const messagesContainerStyle: React.CSSProperties = {
    flexGrow: 1, // Takes up available space
    overflowY: 'auto',
    padding: '0 15px',
    marginBottom: '10px',
    wordBreak: 'break-word', // Break long words
    overflowWrap: 'break-word', // Modern equivalent for word-break
    boxSizing: 'border-box', // Ensure padding is included in the element's total width
    // No padding-right here as the main chatbox padding handles it
};

const noMessagesStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#888',
    marginTop: '20px',
};

const messageStyle = (isSender: boolean): React.CSSProperties => ({
    marginBottom: '8px',
    padding: '5px 8px',
    borderRadius: '8px',
    backgroundColor: isSender ? '#007bff33' : '#333333', // Lighter blue for sender, dark gray for others
    marginLeft: isSender ? 'auto' : '0', // Align sender messages right
    marginRight: isSender ? '0' : 'auto', // Align other messages left
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
});

const messageSenderStyle = (isSender: boolean): React.CSSProperties => ({
    fontWeight: 'bold',
    color: isSender ? '#88ccff' : '#cccccc', // Differentiate sender's name color
    fontSize: '0.8em',
    marginBottom: '2px',
});

const messageContentStyle: React.CSSProperties = {
    fontSize: '0.9em',
};

const chatInputFormStyle: React.CSSProperties = {
    display: 'flex',
    marginTop: '10px',
    padding: '0 15px 15px 15px', // Padding for the input form
    flexShrink: 0, // Prevent shrinking
    width: '100%', // Ensure the form takes full available width
    boxSizing: 'border-box', // Importan
};

const inputStyle: React.CSSProperties = {
    flexGrow: 1,
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #555',
    backgroundColor: '#444',
    color: '#e0e0e0',
    marginRight: '10px',
    boxSizing: 'border-box',
    minWidth: '0',
};

const sendButtonStyle: React.CSSProperties = {
    padding: '8px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    flexShrink: 0, // Prevent send button from shrinking
};
    

