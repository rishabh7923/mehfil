document.addEventListener("DOMContentLoaded", () => {
    const createRoomForm = document.querySelector(".room-launcher")
    const createRoomBtn = document.querySelector(".room-launcher > button")

    if (createRoomForm) {
        createRoomForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            const roomCodeInput = createRoomForm.elements.code
            const roomCode = roomCodeInput ? roomCodeInput.value.trim() : ""

            try {
                createRoomBtn.disabled = true

                const res = await fetch("/api/rooms", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ room_code: roomCode })
                })

                const data = await res.json()

                if (res.ok && data.success) {
                    setTimeout(() => { window.location.href = data.redirect_url}, 400)
                } else {
                    createRoomBtn.disabled = false
                }
            } catch(error) {
                createRoomBtn.disabled = false
            }
        })
    }
})