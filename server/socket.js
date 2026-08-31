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
            
            if (!room) {
                if (callback) callback({ error: "Room not found" })
                return
            }

            const user = roomManager.addUser(roomCode, socket.id, userId, userName)
            if (!user) {
                if (callback) callback({ error: "Failed to join room" })
                return
            }

            socket.roomCode = room.code
            socket.userId = user.id

            socket.join(room.code)

            const roomData = roomManager.getPublicRoomData(room.code)
            if (callback) callback({ success: true, user, roomData })

            io.to(room.code).emit("room:users", {
                users: roomData.users,
                hostId: roomData.hostId /* why do we need it here */
            })
        })


        socket.on("disconnect", () => {
            console.log(`[Socket] Client diconnected ${socket.id}`)

            if (socket.roomCode) {
                const result = roomManager.removeUser(socket.roomCode, socket.id)
                if (result) {
                    const roomData = roomManager.getPublicRoomData(socket.roomCode)
                    if (roomData) {
                        io.to(socket.roomCode).emit("room:users", {
                            users: roomData.users,
                            hostId: roomData.hostId
                        })
                    }
                }
            }
        })
    })
}