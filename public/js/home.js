document.addEventListener("DOMContentLoaded", () => {
    const createRoomForm = document.querySelector(".room-launcher")
    const createRoomBtn = document.querySelector(".room-launcher > button")
    const roomCodeInput = createRoomForm?.elements.code
    const toastContainer = document.getElementById("toast-container")

    const showToast = (message, type = "error") => {
        if (!toastContainer) return

        toastContainer.replaceChildren()
        if (!message) return

        const toast = document.createElement("div")
        toast.className = `toast toast--${type}`
        toast.setAttribute("role", "alert")
        toast.textContent = message
        toastContainer.append(toast)
    }

    if (createRoomForm && createRoomBtn && roomCodeInput) {
        createRoomForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            const roomCode = roomCodeInput.value.trim()
            roomCodeInput.value = roomCode.toUpperCase()
            showToast("")

            if (!createRoomForm.reportValidity()) return

            try {
                createRoomBtn.disabled = true
                createRoomBtn.textContent = "Launching..."

                const res = await fetch("/api/rooms", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ room_code: roomCode })
                })

                const data = await res.json().catch(() => ({}))

                if (res.ok && data.success) {
                    window.location.assign(data.redirect_url)
                } else {
                    showToast(data.error || "Could not launch the room.")
                }
            } catch(error) {
                showToast("Could not connect to Mehfil. Check your connection and try again.")
            } finally {
                createRoomBtn.disabled = false
                createRoomBtn.textContent = "Launch Room"
            }
        })
    }
})