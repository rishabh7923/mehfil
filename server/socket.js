import { roomManager } from "./roomManager.js"

export function setupSocketIO(io) {
    io.on("connection", (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on("room:join", ({ roomCode, userId, userName }, callback) => {
            if (!roomCode) {
                if (callback) callback({ error: "Room code is required" })
                return
            }

            const room = roomManager.getRoom(roomCode)
            console.log(room, roomCode)
            
            if (!room) {
                if (callback) callback({ error: "Room not found" })
                return
            }

            const user = roomManager.addUser(roomCode, socket.id, userId, userName)
            if (!user) {
                if (callback) callback({ error: "Failed to join room" })
                return
            }

            socket.roomCode = room.roomCode
            socket.userId = user.id

            socket.join(room.code)

            const roomData = roomManager.getPublicRoomData(room.code)
            if (callback) callback({ success: true, user, roomData })

            io.to(room.code).emit("room:users", {
                users: roomData.users,
                hostId: roomData.hostId /* why do we need it here */
            })
        })
    })
}