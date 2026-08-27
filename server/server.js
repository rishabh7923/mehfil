import express from "express"
import path from "path"
import dotenv from "dotenv"

import { roomManager } from "./roomManager.js"
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(rootDir, 'public')))

/**
 * POST /api/rooms
 * Create a new room
 */
app.post("/api/rooms", (req, res) => {
    const { room_code: roomCode } = req.body;
    const room = roomManager.createRoom(roomCode)

    return res.status(201).json({
        success: true,
        room_code: room.code,
        redirect_url: `/room/${room.code}`
    })
})

app.get('/room/:roomCode', (req, res) => {
    res.sendFile(path.join(rootDir, 'public', 'room.html'))
});

app.get("/", (req, res) => {
    res.sendFile(path.join(rootDir, 'public', 'index.html'))
})


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`\n🎵 =================================================== 🎵`);
    console.log(`   Mehfil Collaborative Jukebox Server is Running!`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`🎵 =================================================== 🎵\n`);
})
