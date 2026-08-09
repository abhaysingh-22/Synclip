import Constants from "expo-constants";
import { io, Socket } from "socket.io-client";

let _serverUrl: string | null = null;
let _socket: ReturnType<typeof io> | null = null;

export function setServerUrl(url: string) {
  if (_serverUrl !== url) {
    _serverUrl = url;
    console.log("[Socket] Server URL updated to:", url);
    if (_socket) {
      console.log("[Socket] Disconnecting old socket to connect to new URL...");
      _socket.disconnect();
      _socket = null; // Recreated on next getSocket()
    }
  }
}

function resolveServerUrl(): string {
  if (_serverUrl) return _serverUrl;

  // Auto-detect from Expo Metro bundler host (Expo Go dev only)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    console.log("[Socket] Auto-detected host from Expo:", host);
    return `http://${host}:5001`;
  }

  console.log("[Socket] No QR scanned and no Expo host found. Using default fallback.");
  return "https://synclip-ytio.onrender.com";
}



export function getSocket() {
  if (!_socket) {
    const url = resolveServerUrl();
    console.log("[Socket] Connecting to:", url);
    _socket = io(url, {
      autoConnect: false,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
  }
  return _socket;
}

export const socket = {
  get connected() { return getSocket().connected; },
  connect() { return getSocket().connect(); },
  disconnect() { return getSocket().disconnect(); },
  emit(ev: string, ...args: any[]) { return getSocket().emit(ev, ...args); },
  on(ev: string, cb: (...args: any[]) => void) { return getSocket().on(ev, cb); },
  once(ev: string, cb: (...args: any[]) => void) { return getSocket().once(ev, cb); },
  off(ev: string, cb?: (...args: any[]) => void) { return getSocket().off(ev, cb); },
};

export function connectToServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = getSocket();

    if (s.connected) {
      resolve();
      return;
    }

    s.connect();

    s.once("connect", () => {
      console.log("[Socket] Connected to backend:", s.id);
      resolve();
    });

    s.once("connect_error", (error: Error) => {
      console.error("[Socket] Connection error:", error.message);
      reject(error);
    });
  });
}

export function joinRoom(roomId: string) {
  getSocket().emit("join-room", { roomId });
}

export function emitClipboardUpdate(content: string) {
  const update = {
    clipboardId: Math.random().toString(36).slice(2),
    content,
    contentType: "text",
    source: "mobile",
  };
  console.log("[Socket] Sending clipboard update:", update.clipboardId);
  getSocket().emit("clipboard-update", update);
}
