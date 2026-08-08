import { io } from "socket.io-client";

const BACKEND_URL = "http://localhost:5001";

export const socket = io(BACKEND_URL);

export function connectToServer() {
    return new Promise((resolve, reject) => {
        if (socket.connected) {
            resolve();
            return;
        }

        socket.once("connect", () => {
            console.log("Connected to server:", socket.id);
            resolve();
        });

        socket.once("connect_error", (error) => {
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