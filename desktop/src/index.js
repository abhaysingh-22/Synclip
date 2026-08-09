import { connectToServer, createRoom } from "./socket.js";
import { generateQR } from "./qr.js";
import { startClipboardMonitor } from "./clipboard.js";
import { socket } from "./socket.js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

async function start() {
    try {
        console.log("Starting SynClip desktop...");

        await connectToServer();

        // Read requested room ID from environment (falls back to ABHAY1)
        const customRoomId = process.env.ROOM_ID || "ABHAY1";
        const roomId = await createRoom(customRoomId);

        console.log("Room ID:", roomId);

        await generateQR(roomId);

        console.log("Waiting for mobile device to join...");

        // Once mobile joins, begin monitoring clipboard
        socket.once("device-connected", () => {
            console.log("[Main] Mobile connected. Starting clipboard sync.");
            startClipboardMonitor();
        });

    } catch (error) {
        console.error("Failed to start SynClip:", error.message);
        process.exit(1);
    }
}

start();