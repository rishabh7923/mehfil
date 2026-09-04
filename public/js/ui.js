export function renderQueue(queue, currentSong, currentUserId, hostId, onRemoveCallback) {    
    const createQueueItem = (song, index, active = false) => {
        const item = document.createElement("div")
        item.classList.add("queue-item")
        
        if (active) item.classList.add("active")
        else {
            item.draggable = true
            item.setAttribute("data-index", index)
        }
        
        item.innerHTML = `
            <span class="material-symbols-outlined queue-row-icon">music_note</span>
                <div class="queue-item-title">
                    ${song.title}
                </div>
            <div class="queue-item-time">${song.durationFormatted}</div> 
        `

        return item
    }
    
    const queueContainer = document.getElementById("queue-list")
    queueContainer.innerHTML = ''

    if (currentSong) queueContainer.append(createQueueItem(currentSong, -1, true))

    queue.forEach((song, index) => {
        queueContainer.append(createQueueItem(song, index))
    })
}


export function renderUsersList(users, currentUserId, hostId) {
    const userListContainer = document.querySelector(".users-list")
    userListContainer.innerHTML = ''

    users.forEach((user) => {
        const userRow = document.createElement("div")
        userRow.className = "user-row"

        const isMe = user.id == currentUserId
        const isHost = user.isHost || user.id == hostId

        userRow.innerHTML = `
            <div class="user-row__left" style="display: flex; gap: 5px;">
                <span class="material-symbols-outlined">person</span>
                <div class="user-name">${user.name} ${isMe ? '(You)' : ''}</div>
            </div>

            <div class="user-row__right">
                <span class="user-role">${isHost ? "HOST" : "USER"}</span>
            </div>
        `

        userListContainer.append(userRow)
    })
}

export function renderSearchResults(results, onAddCallback) {
    const searchResultsContainer = document.getElementById("search-results")
    const initialPlaceholder = document.getElementById("youtube-initial-placeholder")

    initialPlaceholder.hidden = true
    searchResultsContainer.hidden = false

    searchResultsContainer.innerHTML = ''

    results.forEach((video) => {
        const item = document.createElement("div")
        item.classList.add("result-item")

        item.innerHTML = `
            <button class="btn-add-track">
                <span class="material-symbols-outlined">add</span>
            </button>

            <img class="result-item__thumb" src="${video.thumbnail}" alt="Banjaare - Bairan (Lyrics)" loading="lazy">

            <div class="result-item__info">
                <div class="result-item__title">
                    ${video.title}
                </div>
                                    
                <div class="result-item__channel">${video.channelTitle}</div>
            </div>

            <div class="result-item__duration">
                ${video.durationFormatted}
            </div>
        `

        const btn = item.querySelector(".btn-add-track")
        btn.addEventListener("click", () => {
            if (onAddCallback) onAddCallback(video)
        })

        searchResultsContainer.append(item)
    })
}