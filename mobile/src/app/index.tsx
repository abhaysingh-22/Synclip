import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  AppState,
  AppStateStatus,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  connectToServer,
  emitClipboardUpdate,
  joinRoom,
  setServerUrl,
  socket,
} from "../socket";

type Status = "disconnected" | "connecting" | "connected";


// Main Screen
export default function HomeScreen() {
  const [roomCode, setRoomCode] = useState("");
  const [status, setStatus] = useState<Status>("disconnected");
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const isSyncingRef = useRef(false);
  const lastClipboardRef = useRef<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenerRef = useRef<{ remove: () => void } | null>(null);

  // Clipboard helpers
  function sendIfNew(content: string) {
    if (!content || isSyncingRef.current) return;
    if (content === lastClipboardRef.current) return;
    lastClipboardRef.current = content;
    console.log("[Clipboard] Phone→Mac:", content.slice(0, 40));
    emitClipboardUpdate(content);
  }

  function startClipboardMonitor() {
    console.log("[Clipboard] Monitor started.");
    listenerRef.current = Clipboard.addClipboardListener(({ content }) => {
      sendIfNew(content ?? "");
    });
    pollRef.current = setInterval(async () => {
      try {
        const current = await Clipboard.getStringAsync();
        sendIfNew(current);
      } catch (err) {
        console.error("[Clipboard] Poll error:", err);
      }
    }, 2000);
  }

  function stopClipboardMonitor() {
    listenerRef.current?.remove();
    listenerRef.current = null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    console.log("[Clipboard] Monitor stopped.");
  }

  // Socket listeners
  useEffect(() => {
    socket.on("clipboard-update", async ({ clipboardId, content, source }) => {
      if (source === "mobile") return;
      console.log(`[Clipboard] Mac→Phone (${clipboardId}): ${content?.slice(0, 40)}`);
      isSyncingRef.current = true;
      lastClipboardRef.current = content;
      try {
        await Clipboard.setStringAsync(content);
        console.log("[Clipboard] Mac→Phone: written ✓");
      } catch (err) {
        console.error("[Clipboard] Write error:", err);
      }
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 2500);
    });

    socket.on("device-disconnected", () => {
      setStatus("disconnected");
      stopClipboardMonitor();
      Alert.alert("Disconnected", "The desktop has disconnected.");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
      stopClipboardMonitor();
    });

    return () => {
      socket.off("clipboard-update");
      socket.off("device-disconnected");
      socket.off("disconnect");
      stopClipboardMonitor();
    };
  }, []);

  // QR scan handler
  const handleQRScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);

    try {
      const parsed = JSON.parse(data) as { room?: string; server?: string };

      if (!parsed.room || !parsed.server) {
        Alert.alert("Invalid QR", "This QR code is not from SynClip desktop.");
        setScanned(false);
        return;
      }
      setServerUrl(parsed.server);
      setRoomCode(parsed.room);
      handleConnect(parsed.room, parsed.server);
    } catch {
      Alert.alert("Invalid QR", "Could not read QR code data.");
      setScanned(false);
    }
  };

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera Permission",
          "Camera access is required to scan the SynClip QR code."
        );
        return;
      }
    }
    setScanned(false);
    setScanning(true);
  };


  // Load saved credentials & setup AppState listener
  useEffect(() => {
    async function loadSavedCredentials() {
      try {
        const savedRoom = await AsyncStorage.getItem("last_room_code");
        const savedServer = await AsyncStorage.getItem("last_server_url");
        if (savedRoom) {
          console.log("[Storage] Found saved room:", savedRoom, "server:", savedServer);
          setRoomCode(savedRoom);
          if (savedServer) {
            setServerUrl(savedServer);
          }
          // Auto-connect on startup
          handleConnect(savedRoom, savedServer || undefined);
        }
      } catch (err) {
        console.error("[Storage] Load error:", err);
      }
    }
    loadSavedCredentials();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log("[AppState] Transitioned to:", nextAppState);
      if (nextAppState === "active") {
        try {
          const savedRoom = await AsyncStorage.getItem("last_room_code");
          const savedServer = await AsyncStorage.getItem("last_server_url");
          
          if (savedRoom) {
            console.log("[AppState] App active, auto-rejoining room:", savedRoom);
            handleConnect(savedRoom, savedServer || undefined);
          }
        } catch (err) {
          console.error("[AppState] Reconnect load error:", err);
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Connect
  const handleConnect = async (code?: string, server?: string) => {
    const roomId = (code ?? roomCode).trim().toUpperCase();

    if (!roomId || roomId.length < 4) {
      Alert.alert("Error", "Enter a valid room code.");
      return;
    }

    if (server) setServerUrl(server);

    setStatus("connecting");

    try {
      await connectToServer();

      socket.once("room-joined", async ({ roomId: joinedId }) => {
        console.log("[Room] Joined:", joinedId);
        setStatus("connected");
        startClipboardMonitor();

        // Persist room details for background/suspend re-connect
        try {
          await AsyncStorage.setItem("last_room_code", joinedId);
          if (server) {
            await AsyncStorage.setItem("last_server_url", server);
          }
        } catch (storageErr) {
          console.error("[Storage] Save error:", storageErr);
        }

        Alert.alert("Connected ✅", `Syncing with room ${joinedId}`);
      });

      socket.once("room-error", ({ message }) => {
        console.error("[Room] Error:", message);
        setStatus("disconnected");
        Alert.alert("Failed", message);
        setScanned(false);
      });

      joinRoom(roomId);
    } catch (err) {
      console.error("[Connect] Error:", err);
      setStatus("disconnected");
      Alert.alert("Server Error", "Could not connect to SynClip backend.");
      setScanned(false);
    }
  };


  // Status helpers
  const statusColor: Record<Status, string> = {
    disconnected: "#e74c3c",
    connecting: "#e67e22",
    connected: "#27ae60",
  };
  const statusLabel: Record<Status, string> = {
    disconnected: "● Disconnected",
    connecting: "● Connecting…",
    connected: "● Connected",
  };

  // Render
  return (
    <View style={styles.container}>
      {/* ---- QR Scanner Modal ---- */}
      <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleQRScanned}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setScanning(false)}>
            <Text style={styles.closeButtonText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.scanHint}>Point at the QR code on your Mac</Text>
        </View>
      </Modal>

      {/* ---- Main UI ---- */}
      <Text style={styles.title}>SynClip</Text>
      <Text style={styles.tagline}>Clipboard sync for your devices</Text>

      <View style={[styles.statusPill, { borderColor: statusColor[status] }]}>
        <Text style={[styles.statusText, { color: statusColor[status] }]}>
          {statusLabel[status]}
        </Text>
      </View>

      {/* QR Scan button (primary action) */}
      {status === "disconnected" && (
        <TouchableOpacity style={styles.scanButton} onPress={openScanner} activeOpacity={0.85}>
          <Text style={styles.scanButtonText}>📷  Scan Desktop QR</Text>
        </TouchableOpacity>
      )}

      {/* Manual room code input (fallback) */}
      {status !== "connected" && (
        <>
          <Text style={styles.orDivider}>— or enter code manually —</Text>

          <TextInput
            style={[styles.input, status === "connecting" && styles.inputDisabled]}
            placeholder="Room Code"
            placeholderTextColor="#aaa"
            value={roomCode}
            onChangeText={setRoomCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            editable={status === "disconnected"}
          />

          <TouchableOpacity
            style={[styles.button, status !== "disconnected" && styles.buttonDisabled]}
            onPress={() => handleConnect()}
            disabled={status !== "disconnected"}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {status === "connecting" ? "Connecting…" : "Connect"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {status === "connected" && (
        <Text style={styles.hint}>
          ✓ Sync active — copy anything on either device.{"\n"}
          Keep this app open for phone→Mac direction.
        </Text>
      )}
    </View>
  );
}


// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    color: "#1a1a2e",
    marginBottom: 4,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    marginBottom: 28,
  },
  statusPill: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 28,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  // QR scan button
  scanButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#1a1a2e",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#1a1a2e",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  orDivider: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 6,
    color: "#1a1a2e",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  inputDisabled: {
    backgroundColor: "#f0f0f0",
    color: "#888",
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: "#555",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#bbb",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  hint: {
    marginTop: 24,
    fontSize: 13,
    color: "#27ae60",
    textAlign: "center",
    lineHeight: 22,
  },
  // Camera / Scanner modal
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "flex-end",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    margin: 24,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 30,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scanHint: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 40,
  },
});
