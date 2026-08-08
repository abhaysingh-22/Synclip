const rooms = new Map();

export function createRoom(socketId) {
    const roomId = generateRoomId();

    rooms.set(roomId, {
        desktop: socketId,
        mobile: null,
    });

    return roomId;
}

export function joinRoom(roomId, socketId) {
    const room = rooms.get(roomId);

    if (!room) {
        return {
            success: false,
            message: "Room not found",
        };
    }

    if (room.mobile) {
        return {
            success: false,
            message: "Room already has a mobile device",
        };
    }

    room.mobile = socketId;

    return {
        success: true,
        room,
    };
}

export function getRoom(roomId) {
    return rooms.get(roomId);
}

export function removeSocket(socketId) {
    for (const [roomId, room] of rooms.entries()) {
        if (room.desktop === socketId || room.mobile === socketId) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted`);
        }
    }
}

function generateRoomId() {
    return Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
}