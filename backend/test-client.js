import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit("create-room");
});

socket.on("room-created", ({ roomId }) => {
    console.log("ROOM CREATED:", roomId);
});

socket.on("device-connected", () => {
    console.log("📱 Mobile connected!");
});