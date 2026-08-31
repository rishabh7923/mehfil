export class RoomManager {
    constructor() {
        this.rooms = new Map()
    }

    createRoom(roomCode = '') {
        const code = roomCode.trim().toUpperCase()

        const room = {
            code,
            hostId: null,
            users: new Map(),
            queue: [],
            currentSong: null,
            playbackState: {
                videoId: null,
                startedAt: null,
                pausedAt: 0,
                isPlaying: false
            },
            createdAt: new Date()
        }

        this.rooms.set(code, room)

        return room;
    }

    getRoom(roomCode) {
        if (!roomCode) return null
        return this.rooms.get(roomCode.toUpperCase()) || null
    }

    addUser(roomCode, socketId, userId, userName) {
        const room = this.rooms.get(roomCode)
        if (!room) return null

        const isFirstUser = room.users.size === 0
        const cleanName = (userName && userName.trim()) ? userName.trim().slice(0, 25) : `Guest ${room.users.size + 1}`

        const user = {
            socketId,
            id: userId || socketId,
            name: cleanName,
            isHost: isFirstUser,
            joinedAt: Date.now()
        }

        if (isFirstUser) {
            room.hostId = user.id
        }

        room.users.set(socketId, user)
        return user
    }

    removeUser(roomCode, socketId) {
        const room = this.getRoom(roomCode)
        if (!room) return null

        const user = room.users.get(socketId)
        if (!user) return null

        room.users.delete(socketId)

        if (user.isHost && room.users.size > 0) {
            const nextUser = Array.from(room.users.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0]
            nextUser.isHost = true
            room.hostId = nextUser.id
        }
        
        return user
    }

    getCurrentPlaybackPosition(roomCode) {
        const room = this.getRoom(roomCode)
        if (!room || !room.playbackState || !room.currentSong) return 0

        const { isPlaying, startedAt, pausedAt } = room.playbackState

        if (!isPlaying || !startedAt) {
            return pausedAt || 0;
        }

        const elapsedSeconds = (Date.now() - startedAt) / 1000
        return Math.max(0, elapsedSeconds)
    }

    getPublicRoomData(roomCode) {
        const room = this.getRoom(roomCode)
        if (!room) return null

        const currentPosition = this.getCurrentPlaybackPosition(roomCode)

        return {
            code: room.code,
            hostId: room.hostId,
            users: Array.from(room.users.values()),
            queue: room.queue,
            currentSong: room.currentSong,
            playbackState: {
                ...room.playbackState,
                currentPosition
            },
            createdAt: room.createdAt
        }
    }
}

export const roomManager = new RoomManager()