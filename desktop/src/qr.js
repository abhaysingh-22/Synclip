import QRCode from "qrcode";
import os from "os";

function getLocalIP() {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
        for (const iface of ifaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return "127.0.0.1";
}

export async function generateQR(roomId) {
    const localIP = getLocalIP();
    const serverUrl = `http://${localIP}:5001`;

    const qrData = JSON.stringify({
        room: roomId,
        server: serverUrl,
    });

    const qr = await QRCode.toString(qrData, {
        type: "terminal",
        small: true,
    });

    console.log(`\nServer: ${serverUrl}`);
    console.log(`Room ID: ${roomId}`);
    console.log("\nScan this QR code with the SynClip mobile app:\n");
    console.log(qr);

    return serverUrl;
}