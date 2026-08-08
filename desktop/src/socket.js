import { io } from "socket.io-client";
import { writeClipboard } from "./clipboard.js";

const BACKEND_URL = "http://localhost:5001";

export const socket = io(BACKEND_URL, {
    autoConnect: false,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
});

export function connectToServer() {
    return new Promise((resolve, reject) => {
        if (socket.connected) {
            resolve();
            return;
        }

        socket.connect();

        socket.once("connect", () => {
            console.log("[Socket] Connected to server:", socket.id);
            resolve();
        });

        socket.once("connect_error", (error) => {
            console.error("[Socket] Connection error:", error.message);
            reject(error);
        });
    });
}

export function createRoom() {
    return new Promise((resolve, reject) => {
        socket.emit("create-room");

        socket.once("room-created", (data) => {
            resolve(data.roomId);
        });

        socket.once("room-error", (data) => {
            reject(new Error(data.message));
        });
    });
}

// Listen for clipboard updates coming from the mobile device
socket.on("clipboard-update", ({ clipboardId, content, source }) => {
    if (source === "desktop") return; // ignore our own echoes (safety check)
    console.log(`[Socket] Received clipboard update from ${source} (${clipboardId})`);
    writeClipboard(content);
});

socket.on("device-connected", () => {
    console.log("[Socket] Mobile device connected to the room.");
});

socket.on("device-disconnected", () => {
    console.log("[Socket] Mobile device disconnected.");
});

socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
});

socket.on("reconnect", (attempt) => {
    console.log(`[Socket] Reconnected after ${attempt} attempt(s).`);
});