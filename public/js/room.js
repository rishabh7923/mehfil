import { getOrCreateUserId, getRoomCodeFromUrl, getStoredUsername } from "./config.js"
import { addSongToQueue, emitPlayerNext, emitPlayerPause, emitPlayerPlay, emitPlayerSeek, emitRepeatMode, getSocket, joinRoom, removeSongFromQueue, reorderQueue } from "./socket.js"
import { renderQueue, renderSearchResults, renderUsersList } from "./ui.js"
import { getCurrentPlayerTime, getPlayerDuration, getPlayerVolume, initYoutubePlayer, setPlayerVolume, syncPlayerWithServer } from "./player.js"

let roomCode = null
let currentUserId = null
let currentUserName = null
let hostId = null
let currentQueue = []
let currentSong = null
let currentUsersList = []
let repeatMode = "off"

document.addEventListener("DOMContentLoaded", () => {
    roomCode = getRoomCodeFromUrl()

    if (!roomCode) return

    currentUserId = getOrCreateUserId()
    currentUserName = getStoredUsername()

    const roomCodeDisplay = document.getElementById("room-code-display")
    roomCodeDisplay.innerHTML = `mehfil.today/<b>${roomCode}</b>`

    connectAndInitRoom()
    setupEventListeners()
})

async function handleAddSong(song) {
    await addSongToQueue(roomCode, song)
}

async function handleRemoveSong(index, song) {
    try {
        await removeSongFromQueue(roomCode, index, song?.id)
    } catch (error) {
        console.error("Failed to remove song from queue:", error)
    }
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
    console.log("[Room] Joined:", roomData.code)

    hostId = roomData.hostId
    currentQueue = roomData.queue || []
    currentSong = roomData.currentSong
    currentUsersList = roomData.users || []
    repeatMode = roomData.repeatMode || "off"

    await initYoutubePlayer(roomCode, () => {
        emitPlayerNext(roomCode)
    })
    
    renderUsersList(currentUsersList, currentUserId, hostId)
    renderQueue(currentQueue, currentSong, currentUserId, hostId, handleRemoveSong)
    updateRepeatButton()
    syncPlayerWithServer(currentSong, roomData.playbackState)

    socket.on("room:users", ({ users, hostId: newHostId }) => {
        hostId = newHostId
        currentUsersList = users || []

        renderUsersList(currentUsersList, currentUserId, hostId)
    })

    socket.on("queue:update", ({ queue, currentSong: newSong, playbackState }) => {
        currentQueue = queue || []
        currentSong = newSong

        renderQueue(currentQueue, currentSong, currentUserId, hostId, handleRemoveSong)
        syncPlayerWithServer(currentSong, playbackState)
    })

    socket.on("player:state", ({ playbackState, currentSong: newSong }) => {
        currentSong = newSong
        syncPlayerWithServer(currentSong, playbackState)
    })

    socket.on("player:repeat", ({ repeatMode: newRepeatMode }) => {
        repeatMode = newRepeatMode
        updateRepeatButton()
    })
}

function updateRepeatButton() {
    const repeatButton = document.getElementById("btn-repeat")
    const repeatIcon = repeatButton?.querySelector(".material-symbols-outlined")
    if (!repeatButton || !repeatIcon) return

    const labels = {
        off: "Repeat off",
        queue: "Repeat queue",
        song: "Repeat song"
    }
    repeatIcon.textContent = repeatMode === "song" ? "repeat_one" : "repeat"
    repeatButton.setAttribute("aria-label", labels[repeatMode])
    repeatButton.setAttribute("aria-pressed", String(repeatMode !== "off"))
    repeatButton.dataset.active = String(repeatMode !== "off")
}

function setupEventListeners() {
    /* Event Listener for Searching */
    const searchYoutube = document.getElementById("search-youtube")
    const searchButton = document.getElementById("btn-search-youtube")

    searchYoutube?.addEventListener("submit", async (e) => {
        e.preventDefault()
        const query = searchYoutube.elements.query.value.trim()
        if (!query || !searchButton) return

        const originalIcon = searchButton.innerHTML
        searchButton.disabled = true
        searchButton.setAttribute("aria-busy", "true")
        searchButton.innerHTML = '<span class="material-symbols-outlined">progress_activity</span>'

        try {
            const params = new URLSearchParams({ q: query })
            const res = await fetch(`/api/search?${params}`, { method: "GET" })
            const data = await res.json()

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Could not search YouTube")
            }

            renderSearchResults(data.results || [], handleAddSong)
        } catch (error) {
            console.error("YouTube search failed:", error)
        } finally {
            searchButton.disabled = false
            searchButton.removeAttribute("aria-busy")
            searchButton.innerHTML = originalIcon
        }
    })


    /* Play/Pause */
    const playButton = document.querySelector(".btn-player-play")
    playButton?.addEventListener("click", () => {
        if (!currentSong) return;

        const pos = getCurrentPlayerTime()

        if (playButton.innerText == "pause") emitPlayerPause(roomCode, pos)
        else emitPlayerPlay(roomCode, pos)
    })

    /* Skip */
    const skipButton = document.getElementById("btn-player-next")
    skipButton?.addEventListener("click", async () => {
        await emitPlayerNext(roomCode)
    })

    /* Prev */
    const prevButton = document.getElementById("btn-player-prev")
    prevButton?.addEventListener("click", () => {
        emitPlayerSeek(roomCode, 0)
    })

    /* Repeat */
    const repeatButton = document.getElementById("btn-repeat")
    repeatButton?.addEventListener("click", () => {
        const modes = ["off", "queue", "song"]
        const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length]
        emitRepeatMode(roomCode, nextMode)
    })

    /* Volume */
    const volumeButton = document.getElementById("btn-volume")
    const volumeIcon = document.getElementById("volume-icon")
    const volumeSlider = document.getElementById("volume-slider")
    let volumeBeforeMute = getPlayerVolume()

    const updateVolumeIcon = (volume, muted = volume === 0) => {
        volumeIcon.textContent = muted ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"
        volumeButton.setAttribute("aria-label", muted ? "Unmute audio" : "Mute audio")
        volumeButton.setAttribute("aria-pressed", String(muted))
    }

    volumeSlider?.addEventListener("input", (event) => {
        const volume = setPlayerVolume(event.target.value)
        if (volume > 0) volumeBeforeMute = volume
        volumeSlider.setAttribute("aria-valuetext", `${volume}%`)
        updateVolumeIcon(volume)
    })

    volumeButton?.addEventListener("click", () => {
        const currentVolume = getPlayerVolume()
        if (currentVolume > 0) {
            volumeBeforeMute = currentVolume
            setPlayerVolume(0)
            volumeSlider.value = "0"
            volumeSlider.setAttribute("aria-valuetext", "0%")
            updateVolumeIcon(0, true)
        } else {
            const restoredVolume = setPlayerVolume(volumeBeforeMute || 100)
            volumeSlider.value = String(restoredVolume)
            volumeSlider.setAttribute("aria-valuetext", `${restoredVolume}%`)
            updateVolumeIcon(restoredVolume)
        }
    })

    /* Global Progress Bar Seek */
    const globalProgress = document.getElementById("global-progress-bar")
    globalProgress?.addEventListener("click", (e) => {
        const rect = globalProgress.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const ratio = Math.max(0, Math.min(1, clickX / rect.width))
        const duration = getPlayerDuration()

        if (duration > 0) {
            const targetSec = ratio * duration
            emitPlayerSeek(roomCode, targetSec)
        }
    })

    /* Reorder Queue */
    const queueContainer = document.getElementById("queue-list")
    let draggedItem = null

    queueContainer.addEventListener("dragstart", (e) => {
        draggedItem = e.target
    })

    queueContainer.addEventListener("dragover", (e) => {
        e.preventDefault()

        const target = e.target.closest(".queue-item:not(.active)")
        if (!target || target == draggedItem) return

        const rect = target.getBoundingClientRect();
        const mouseY = e.clientY;

        if (mouseY < rect.top + rect.height / 2) {
            target.after(draggedItem)
        } else {
            target.before(draggedItem)
        }
    })


    queueContainer.addEventListener("drop", () => {
        const items = [...document.querySelectorAll(".queue-item:not(.active)")]
        
        const fromIndex = draggedItem.dataset.index
        const toIndex = items.indexOf(draggedItem)

        if (fromIndex == toIndex) return

        reorderQueue(roomCode, fromIndex, toIndex)
    })

    queueContainer.addEventListener("dragend", () => {
        draggedItem = null
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