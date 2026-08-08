import { connectToServer, createRoom } from "./socket.js";
import { generateQR } from "./qr.js";

async function start() {
    try {
        console.log("Starting SynClip...");

        await connectToServer();

        const roomId = await createRoom();

        console.log("Room created!");
        console.log("Room ID:", roomId);

        await generateQR(roomId);

        console.log("Waiting for mobile device...");

    } catch (error) {
        console.error("Failed to start SynClip:", error.message);
    }
}

start();