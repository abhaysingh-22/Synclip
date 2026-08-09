import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import { createRoom, joinRoom, removeSocket, getRoomBySocket } from "./roomManager.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

app.get('/', (req, res) => {
    res.send("SynClip backend is running!");
});

io.on("connection", (socket) => {
    console.log("[Server] Client connected:", socket.id);

    // Desktop creates a room
    socket.on("create-room", ({ roomId } = {}) => {
        const actualRoomId = createRoom(socket.id, roomId);

        socket.join(actualRoomId);

        socket.emit("room-created", { roomId: actualRoomId });

        console.log(`[Server] Room created: ${actualRoomId} by desktop ${socket.id}`);
    });

    // Mobile joins a room using the room code
    socket.on("join-room", ({ roomId }) => {
        const result = joinRoom(roomId, socket.id);

        if (!result.success) {
            socket.emit("room-error", { message: result.message });
            console.warn(`[Server] Join failed for room ${roomId}: ${result.message}`);
            return;
        }

        socket.join(roomId);

        socket.emit("room-joined", { roomId });

        // Notify the desktop that mobile has arrived
        io.to(result.room.desktop).emit("device-connected");

        console.log(`[Server] Mobile ${socket.id} joined room ${roomId}`);
    });

    // Forward clipboard update to the OTHER device in the room
    socket.on("clipboard-update", (data) => {
        const room = getRoomBySocket(socket.id);

        if (!room) {
            console.warn("[Server] clipboard-update from unknown socket, ignoring.");
            return;
        }

        const { clipboardId, content, contentType, source } = data;

        console.log(`[Server] Forwarding clipboard update (${clipboardId}) from ${source} in room ${room.roomId}`);

        // Send only to the other device — not back to the sender
        socket.to(room.roomId).emit("clipboard-update", {
            clipboardId,
            content,
            contentType,
            source,
        });
    });

    // Handle disconnect — notify the partner and clean up room
    socket.on("disconnect", () => {
        console.log("[Server] Client disconnected:", socket.id);

        const room = getRoomBySocket(socket.id);

        if (room) {
            // Notify the remaining partner
            socket.to(room.roomId).emit("device-disconnected");
            console.log(`[Server] Notified room ${room.roomId} of disconnect.`);
        }

        removeSocket(socket.id);
    });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
    console.log(`[Server] SynClip backend running on port ${PORT}`);
});