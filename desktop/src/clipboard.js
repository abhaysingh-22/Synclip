import clipboard from "clipboardy";
import { nanoid } from "nanoid";
import { socket } from "./socket.js";

let lastClipboardContent = "";
let isSyncingFromRemote = false;
let pollingInterval = null;

// Emits `clipboard-update` to the backend when a change is detected.

export function startClipboardMonitor() {
    console.log("[Clipboard] Starting monitor...");

    try {
        lastClipboardContent = clipboard.readSync();
    } catch {
        lastClipboardContent = "";
    }

    pollingInterval = setInterval(async () => {
        if (isSyncingFromRemote) return;

        try {
            const current = clipboard.readSync();

            if (current && current !== lastClipboardContent) {
                lastClipboardContent = current;

                const update = {
                    clipboardId: nanoid(),
                    content: current,
                    contentType: "text",
                    source: "desktop",
                };

                console.log("[Clipboard] Change detected, sending to backend:", update.clipboardId);
                socket.emit("clipboard-update", update);
            }
        } catch (err) {
            console.error("[Clipboard] Read error:", err.message);
        }
    }, 500);
    // poll every 500ms
}

export function stopClipboardMonitor() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log("[Clipboard] Monitor stopped.");
    }
}

export function writeClipboard(content) {
    try {
        isSyncingFromRemote = true;
        clipboard.writeSync(content);
        lastClipboardContent = content;
        console.log("[Clipboard] Written from remote:", content.slice(0, 60));
    } catch (err) {
        console.error("[Clipboard] Write error:", err.message);
    } finally {
        setTimeout(() => {
            isSyncingFromRemote = false;
        }, 600);
    }
}
