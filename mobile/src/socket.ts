import Constants from "expo-constants";
import { io, Socket } from "socket.io-client";

let _serverUrl: string | null = null;

export function setServerUrl(url: string) {
  _serverUrl = url;
  console.log("[Socket] Server URL set from QR:", url);
}

function resolveServerUrl(): string {
  if (_serverUrl) return _serverUrl;

  console.log("[Socket] No QR scanned yet, falling back to production server.");
  return "https://synclip-ytio.onrender.com";
}

let _socket: ReturnType<typeof io> | null = null;

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
