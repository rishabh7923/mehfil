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