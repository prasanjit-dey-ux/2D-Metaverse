    // apps/socket/src/index.ts
    import express from 'express';
    import { createServer } from 'http';
    import { Server, Socket } from 'socket.io';
    import cors from 'cors';
    import dotenv from 'dotenv';

    // Load environment variables from .env file
    dotenv.config();

    const app = express();
    const httpServer = createServer(app); // Create an HTTP server instance from Express app

    // Configure CORS for Socket.IO
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    const PORT = process.env.PORT || 4000;

    // In-memory store for players.
    interface Player {
      id: string;      // Socket ID
      username: string;
      x: number;
      y: number;
      direction: string;
      avatar: string;
      spaceId: string; // The ID of the space (room) the player is in
    }

    interface ChatMessage {
      senderId: string;
      senderUsername: string;
      message: string;
      timestamp: number; // for sorting and display
    }

    // Structure: { [spaceId: string]: { [socketId: string]: PlayerData } }
    const activeSpaces: { [spaceId: string]: { [socketId: string]: Player } } = {};
    const chatHistory : { [spaceId: string]: ChatMessage[] } = {} // NEW: chat history per space

    // Socket.IO event handling
    io.on('connection', (socket: Socket) => {
      console.log(`Socket Connected: ${socket.id}`);

      // Event fired by the frontend when a new player joins a specific space
      socket.on('newPlayer', (data: { username: string; avatar: string; spaceId: string }) => {
        const { username, avatar, spaceId } = data;

        if (!spaceId) {
          console.error(`Socket ${socket.id} tried to join without a spaceId. Disconnecting.`);
          socket.disconnect(true);
          return;
        }

        if (!activeSpaces[spaceId]) {
          activeSpaces[spaceId] = {};
        }

        if(!chatHistory[spaceId]) {
          chatHistory[spaceId] = [];
          console.log(`(WS) Initialized chat history for space: ${spaceId}`); // Debug log
        }

        const newPlayer: Player = {
          id: socket.id,
          username: username,
          x: Math.floor(Math.random() * 1920),
          y: Math.floor(Math.random() * 1200),
          direction: 'down',
          avatar: avatar,
          spaceId: spaceId
        };
        activeSpaces[spaceId][socket.id] = newPlayer;

        socket.join(spaceId);
        console.log(`Player ${socket.id} (${username}) joined space: ${spaceId}`);

        io.to(spaceId).emit('playersUpdate', activeSpaces[spaceId]);
      });

      // Event fired by the frontend when a player moves
      socket.on('move', (data: { x: number; y: number; direction: string; avatar: string }) => {
        let playerSpaceId: string | null = null;
        for (const sId in activeSpaces) {
          if (activeSpaces[sId][socket.id]) {
            playerSpaceId = sId;
            break;
          }
        }

        if (playerSpaceId && activeSpaces[playerSpaceId][socket.id]) {
          const player = activeSpaces[playerSpaceId][socket.id];
          player.x = data.x;
          player.y = data.y;
          player.direction = data.direction;
          player.avatar = data.avatar;

          io.to(playerSpaceId).emit('playersUpdate', activeSpaces[playerSpaceId]);
        } else {
          console.warn(`Move event received from unknown or un-assigned player: ${socket.id}.`);
        }
      });
      
      // Handle incoming chat message
      socket.on('chatMessage', (data:  {message: string}) => {
        let senderSpaceId: string | null = null;
        let senderUsername : string = "Anonymous";

        // Find sender space and username
        for (const sId in activeSpaces) {
          if (activeSpaces[sId][socket.id]) {
            senderSpaceId = sId;
            senderUsername = activeSpaces[sId][socket.id].username;
            break;
          }
        }

        if (senderSpaceId) {
          if (!chatHistory[senderSpaceId]) {
            chatHistory[senderSpaceId] = [];
            console.warn(`chatHistory for space ${senderSpaceId} was undefined, initialized on message recipt.`)
          }

          const newChatMessage: ChatMessage = {
            senderId: socket.id,
            senderUsername: senderUsername,
            message: data.message,
            timestamp: Date.now()
          };

          // Add to History (Simple in memory)
          chatHistory[senderSpaceId].push(newChatMessage);
          // limit history to certain no. of message
          if (chatHistory[senderSpaceId].length > 100) {
            chatHistory[senderSpaceId].shift() // Remove oldest message
          }

          // Broadcast the message to all clients in the same space
          io.to(senderSpaceId).emit('chatMessage', newChatMessage);
          console.log(`Chat message in ${senderSpaceId} from ${senderUsername} (${socket.id}): ${data.message}`);
        } else {
          console.warn(`Chat message from unwknown or un-assigned player: ${socket.id}. Message: ${data.message}`)
        }
      }); 

      // Event fired when a client disconnects
      socket.on('disconnect', () => {
        console.log(`Socket Disconnected: ${socket.id}`);
        let disconnectedPlayerSpaceId: string | null = null;

        for (const spaceId in activeSpaces) {
          if (activeSpaces[spaceId][socket.id]) {
            disconnectedPlayerSpaceId = spaceId;
            delete activeSpaces[spaceId][socket.id];
            console.log(`Player ${socket.id} removed from space: ${spaceId}`);
            break;
          }
        }

        if (disconnectedPlayerSpaceId && Object.keys(activeSpaces[disconnectedPlayerSpaceId]).length === 0) {
          console.log(`Space ${disconnectedPlayerSpaceId} is now empty, cleaning up.`);
          // Optionally clear chat history if space is truly empty
          // delete chatHistory[disconnectedPlayerSpaceId];
          delete activeSpaces[disconnectedPlayerSpaceId];
        } 
        else if (disconnectedPlayerSpaceId) {
          io.to(disconnectedPlayerSpaceId).emit('playersUpdate', activeSpaces[disconnectedPlayerSpaceId]);
        }
      });
    });

    // Start the HTTP server that Socket.IO uses
    httpServer.listen(PORT, () => {
      console.log(`Socket.IO server running on port ${PORT}`);
      console.log(`Frontend CORS origin allowed: ${process.env.CORS_ORIGIN}`);
    });
    