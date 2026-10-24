document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const openModalBtn = document.getElementById("openRoomModalBtn")
    const closeModalBtn = document.getElementById("closeRoomModalBtn")
    const modalBackdrop = document.getElementById("roomModalBackdrop")
    const roomModal = document.getElementById("roomModal")
    const randomRoomBtn = document.getElementById("randomRoomBtn")

    const createRoomForm = document.querySelector(".room-launcher")
    const createRoomBtn = document.querySelector(".room-launcher > button")
    const roomCodeInput = createRoomForm?.elements.code
    const toastContainer = document.getElementById("toast-container")

    // Toast Notification helper
    const showToast = (message, type = "error") => {
        if (!toastContainer) return

        toastContainer.replaceChildren()
        if (!message) return

        const toast = document.createElement("div")
        toast.className = `toast toast--${type}`
        toast.setAttribute("role", "alert")
        toast.textContent = message
        toastContainer.append(toast)

        setTimeout(() => {
            if (toast.isConnected) {
                toast.remove()
            }
        }, 5000)
    }

    // Modal Handling
    const openModal = () => {
        if (!roomModal) return
        roomModal.setAttribute("aria-hidden", "false")
        document.body.style.overflow = "hidden"
        setTimeout(() => {
            roomCodeInput?.focus()
        }, 80)
    }

    const closeModal = () => {
        if (!roomModal) return
        roomModal.setAttribute("aria-hidden", "true")
        document.body.style.overflow = ""
    }

    openModalBtn?.addEventListener("click", openModal)
    closeModalBtn?.addEventListener("click", closeModal)
    modalBackdrop?.addEventListener("click", closeModal)

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && roomModal?.getAttribute("aria-hidden") === "false") {
            closeModal()
        }
    })

    // Random Room Code Generator
    const sampleWords = ["MEHFIL", "SUR", "TAAL", "DHUN", "RAAG", "CHAI", "SHAAM", "SUFI"]
    const getRandomCode = () => {
        const prefix = sampleWords[Math.floor(Math.random() * sampleWords.length)]
        const randomNum = Math.floor(100 + Math.random() * 900)
        return `${prefix}-${randomNum}`
    }

    randomRoomBtn?.addEventListener("click", () => {
        if (!roomCodeInput) return
        roomCodeInput.value = getRandomCode()
        createRoomForm?.requestSubmit()
    })

    // Form Submission
    if (createRoomForm && createRoomBtn && roomCodeInput) {
        createRoomForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            const roomCode = roomCodeInput.value.trim().toUpperCase()
            roomCodeInput.value = roomCode
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
            } catch (error) {
                showToast("Could not connect to Mehfil. Check your connection and try again.")
            } finally {
                createRoomBtn.disabled = false
                createRoomBtn.textContent = "LAUNCH ROOM"
            }
        })
    }

    // Pixel Cat Mascot Interaction
    const pixelCat = document.querySelector(".mockup-pixel-cat")
    if (pixelCat) {
        pixelCat.addEventListener("click", () => {
            pixelCat.classList.remove("is-bouncing")
            void pixelCat.offsetWidth
            pixelCat.classList.add("is-bouncing")
        })
    }
})