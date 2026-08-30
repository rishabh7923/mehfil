export const STORAGE_KEYS = {
    USER_ID: "mehfil_user_id",
    USER_NAME: "mehfil_user_name"
}

export function getOrCreateUserId() {
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID)
    if (!userId) {
        userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
    }

    return userId
}

export function getStoredUsername() {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'USER'
}

export function setStoredUserName(name) {
    if (name && name.trim()) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, name.trim().slice(0, 25))
    }
}

export function getRoomCodeFromUrl() {
    const pathParts = window.location.pathname.split("/").filter(Boolean)
    if (pathParts.length >= 2 && pathParts[0] == "room") {
        return pathParts[1].toUpperCase()
    }

    return null
}