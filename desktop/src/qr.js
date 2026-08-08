import QRCode from "qrcode";

export async function generateQR(roomId) {
    const qrData = JSON.stringify({
        room: roomId,
        server: "http://localhost:5001",
    });

    const qr = await QRCode.toString(qrData, {
        type: "terminal",
        small: true,
    });

    console.log("\nScan this QR code with the SynClip mobile app:\n");
    console.log(qr);
}