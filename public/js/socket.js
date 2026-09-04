let socket = null

export function getSocket() {
    if (!socket) socket = window.io();
    return socket;
}

export function joinRoom({ roomCode, userId, userName}) {
    return new Promise((resolve, reject) => {
        socket.emit("room:join", { roomCode, userId, userName }, (response) => {
            if (response && response.error) {
                reject(new Error(response.error))
            } else {
                resolve(response)
            }
        })
    })
}

export function addSongToQueue(roomCode, song) {
    return new Promise((resolve, reject) => {
        if (!socket) return reject(new Error("Socket not initialized"))

        socket.emit("queue:add", { roomCode, song }, (response) => {
            if (response && response.error) {
                reject(new Error(response.error))
            } else {
                resolve(response)
            }
        })
    })
}

export function reorderQueue(roomCode, fromIndex, toIndex) {
    return new Promise((resolve, reject) => {
        socket.emit('queue:reorder', { roomCode, fromIndex, toIndex }, (response) => {
            if (response && response.error) {
                reject(new Error(response.error));
            } else {
                resolve(response);
            }
        });
    })
}

export function emitPlayerPlay(roomCode, position) {
    socket?.emit("player:play", { roomCode, position })
}

export function emitPlayerPause(roomCode, position) {
    socket?.emit("player:pause", { roomCode, position })
}

export function emitPlayerSeek(roomCode, position) {
    console.log("PLAY THE SONG")
    socket?.emit("player:seek", { roomCode, position })
}

export function emitPlayerNext(roomCode) {
    return new Promise((resolve) => {
        socket?.emit("player:next", { roomCode }, (res) => resolve(res))
    })
}
