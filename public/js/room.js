import { getOrCreateUserId, getRoomCodeFromUrl, getStoredUsername } from "./config.js"
import { getSocket, joinRoom } from "./socket.js"
import { renderUsersList } from "./ui.js"

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

    isHost = user.isHost
    hostId = roomData.hostId
    currentQueue = roomData.queue || []
    currentSong = roomData.currentSong
    currentUsersList = roomData.users || []

    //Show toast "Connected to room ${roomCode}"
    
    renderUsersList(currentUsersList, currentUserId, hostId)

    socket.on("room:users", ({ users, hostId: newHostId }) => {
        hostId = newHostId
        currentUsersList = users || []

        console.log(currentUsersList)

        renderUsersList(currentUsersList, currentUserId, hostId)
    })
}

function setupEventListeners() {
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