const rooms = new Map(); // roomId → { desktop, mobile }

export function createRoom(socketId, requestedRoomId) {
    const roomId = requestedRoomId ? requestedRoomId.toUpperCase() : generateRoomId();

    if (rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.desktop = socketId; // Update desktop socket (e.g. desktop restarted)
        console.log(`[RoomManager] Re-using existing room ${roomId} for desktop ${socketId}`);
    } else {
        rooms.set(roomId, {
            desktop: socketId,
            mobile: null,
        });
        console.log(`[RoomManager] Created new room ${roomId} for desktop ${socketId}`);
    }

    return roomId;
}

export function joinRoom(roomId, socketId) {
    const room = rooms.get(roomId);

    if (!room) {
        return { success: false, message: "Room not found" };
    }

    // Allow new mobile connection to take over (resolves zombie sockets / mobile reconnects)
    room.mobile = socketId;

    return { success: true, room };
}

export function getRoom(roomId) {
    return rooms.get(roomId);
}

export function getRoomBySocket(socketId) {
    for (const [roomId, room] of rooms.entries()) {
        if (room.desktop === socketId || room.mobile === socketId) {
            return { roomId, room };
        }
    }
    return null;
}

export function removeSocket(socketId) {
    for (const [roomId, room] of rooms.entries()) {
        if (room.desktop === socketId) {
            // Desktop disconnected: delete the room completely
            rooms.delete(roomId);
            console.log(`[RoomManager] Room ${roomId} deleted (desktop disconnected).`);
        } else if (room.mobile === socketId) {
            // Mobile disconnected: keep the room alive, just clear mobile slot
            room.mobile = null;
            console.log(`[RoomManager] Mobile left room ${roomId}. Room kept active.`);
        }
    }
}

function generateRoomId() {
    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
}