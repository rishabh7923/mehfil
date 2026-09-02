import { emitPlayerNext, emitPlayerPlay, emitPlayerPause } from "./socket.js"

let ytPlayer = null
let currentRoomCode = null
let currentSongId = null
let ignoreNextStateChange = false
let isPlayerReady = true

let onTrackEndedCallback = null

export function initYoutubePlayer(roomCode, onEndCallback) {
    currentRoomCode = roomCode
    onTrackEndedCallback = onEndCallback

    return createPlayer()
}

function createPlayer() {
    return new Promise((resolve) => {
        ytPlayer = new window.YT.Player('youtube-player-container', {
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                enablejsapi: 1,
                origin: window.location.origin
            },
            events: {
                onReady: () => {
                    isPlayerReady = true
                    // startProgressUpdater
                    resolve(ytPlayer)
                },
                onStateChange: handlePlayerStateChange
            }
        })
    })
}

function handlePlayerStateChange(event) {
    if (ignoreNextStateChange) {
        ignoreNextStateChange = false
        return
    }

    if (event.data === window.YT.PlayerState.ENDED) {
        if (onTrackEndedCallback) onTrackEndedCallback()
        else if (currentRoomCode) {
            emitPlayerNext(currentRoomCode)  
        }
    }

    if (event.data === window.YT.PlayerState.PLAYING) {
        const pos = ytPlayer.getCurrentTime()
        emitPlayerPlay(currentRoomCode, pos);
    }

    if (event.data === window.YT.PlayerState.PAUSED) {
        const pos = ytPlayer.getCurrentTime()
        emitPlayerPause(currentRoomCode, pos);
    }
}

export function syncPlayerWithServer(currentSong, playbackState) {
    const songTitleEl = document.getElementById("current-song-title")
    const songArtistEl = document.getElementById("current-song-artist")

    if (!currentSong || !currentSong.videoId) {


        currentSongId = null
        return
    }

    songTitleEl.textContent = currentSong.title
    songArtistEl.textContent = currentSong.channelTitle

    const { videoId, isPlaying, startedAt, pausedAt } = playbackState || {}

    if (!ytPlayer) return

    let targetSeconds = 0
    if (isPlaying && startedAt) {
        targetSeconds = Math.max(0, (Date.now() - startedAt) / 1000)
    } else {
        targetSeconds = pausedAt || 0
    }

    const isNewVideo = currentSongId !== currentSong.videoId
    currentSongId = currentSong.videoId

    if (isNewVideo) {
        if (isPlaying) {
            ytPlayer.loadVideoById(currentSong.videoId, targetSeconds)
        } else {
            ytPlayer.cueVideoById(currentSong.videoId, targetSeconds)
        }
        return
    }

    const currentSeconds = ytPlayer.getCurrentTime()
    if (Math.abs(currentSeconds - targetSeconds) > 2.5) {
        ytPlayer.seekTo(targetSeconds, true)
    }

    const playerState = ytPlayer.getPlayerState()
    if (isPlaying && playerState != window.YT.PlayerState.PLAYING && playerState !== window.YT.PlayerState.BUFFERING) {
        ytPlayer.playVideo()
    } else if (!isPlaying && playerState === window.YT.PlayerState.PLAYING) {
        ytPlayer.pauseVideo()
    }

}
