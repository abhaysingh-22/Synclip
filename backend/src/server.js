import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import { createRoom, joinRoom, removeSocket } from "./roomManager.js";

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
    res.send("SynClip backend is running!!");
})

io.on("connection", (socket) => {
    console.log("Client Connected: ", socket.id);

    //desktop creates a room
    socket.on('create-room', () => {
        const roomId = createRoom(socket.id);

        socket.join(roomId);

        socket.emit("room-created", {
            roomId,
        });

        console.log('Room created with id:', roomId);
    });

    //mobile joining room
    socket.on("join-room", ({ roomId }) => {
        const result = joinRoom(roomId, socket.id);

        if (!result.success) {
            socket.emit("room-error", {
                message: result.message,
            });

            return;
        }

        socket.join(roomId);

        socket.emit("room-joined", {
            roomId,
        });

        io.to(result.room.desktop).emit("device-connected");

        console.log("Mobile joined room: ", roomId);
    });

    //cli
    socket.on("disconnect", () => {
        console.log("Client disconnected: ", socket.id);

        removeSocket(socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});