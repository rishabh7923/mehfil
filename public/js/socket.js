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