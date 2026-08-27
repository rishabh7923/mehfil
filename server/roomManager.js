export class RoomManager {
    constructor() {
        this.rooms = new Map()
    }

    createRoom(roomCode = '') {
        const code = roomCode.trim()

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
}

export const roomManager = new RoomManager()