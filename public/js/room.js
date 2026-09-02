import { getOrCreateUserId, getRoomCodeFromUrl, getStoredUsername } from "./config.js"
import { addSongToQueue, emitPlayerNext, getSocket, joinRoom } from "./socket.js"
import { renderQueue, renderSearchResults, renderUsersList } from "./ui.js"
import { initYoutubePlayer, syncPlayerWithServer } from "./player.js"

let roomCode = null
let currentUserId = null
let currentUserName = null
let isHost = null
let hostId = null
let currentQueue = []
let currentSong = null
let currentUsersList = []

document.addEventListener("DOMContentLoaded", () => {
    roomCode = getRoomCodeFromUrl()

    if (!roomCode) { }

    currentUserId = getOrCreateUserId()
    currentUserName = getStoredUsername()

    const roomCodeDisplay = document.getElementById("room-code-display")
    roomCodeDisplay.innerHTML = `mehfil.today/<b>${roomCode}</b>`

    connectAndInitRoom()
    setupEventListeners()
})

async function handleAddSong(song) {
    const res = await addSongToQueue(roomCode, song)
}

async function connectAndInitRoom() {
    const socket = getSocket()

    const response = await joinRoom({
        roomCode,
        userId: currentUserId,
        userName: currentUserName
    })

    if (!response || !response.success) {
        // Show error Could not join room session
        return
    }

    const { user, roomData } = response
    console.log(roomData)

    isHost = user.isHost
    hostId = roomData.hostId
    currentQueue = roomData.queue || []
    currentSong = roomData.currentSong
    currentUsersList = roomData.users || []

    //Show toast "Connected to room ${roomCode}"

    await initYoutubePlayer(roomCode, () => {
        emitPlayerNext(roomCode)
    })
    
    renderUsersList(currentUsersList, currentUserId, hostId)
    renderQueue(currentQueue, currentSong, currentUserId, hostId)
    syncPlayerWithServer(currentSong, roomData.playbackState)

    socket.on("room:users", ({ users, hostId: newHostId }) => {
        hostId = newHostId
        currentUsersList = users || []

        renderUsersList(currentUsersList, currentUserId, hostId)
    })

    socket.on("queue:update", ({ queue, currentSong: newSong, playbackState }) => {
        currentQueue = queue || []
        currentSong = newSong

        renderQueue(currentQueue, currentSong, currentUserId, hostId) //handleRemoveSong, handleReorderQueue
        syncPlayerWithServer(currentSong, playbackState)
    })

    socket.on("player:state", ({ playbackState, currentSong: newSong }) => {
        currentSong = newSong
        syncPlayerWithServer(currentSong, playbackState)
    })
}

function setupEventListeners() {
    /* Event Listener for Searching */
    const searchYoutube = document.getElementById("search-youtube")

    searchYoutube.addEventListener("submit", async (e) => {
        e.preventDefault()
        const query = searchYoutube.elements.query.value
        if (!query.trim()) return;

        const res = await fetch(`/api/search?q=${query}`, { method: "GET" })
        const data = await res.json()

        renderSearchResults(data.results, handleAddSong)
    })

    const tabs = document.querySelectorAll(".tab-item")
    const tabContents = document.querySelectorAll(".tab-content")

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            tabs.forEach((el) => el.classList.remove("active"))
            tabContents.forEach((el) => { el.hidden = true })

            tab.classList.add("active")

            const content = document.getElementById(`tab-${target}`)
            if (content) content.hidden = false
        })
    })

}