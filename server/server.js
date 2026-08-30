import express from "express"
import path from "path"
import dotenv from "dotenv"

import { roomManager } from "./roomManager.js"
import { fileURLToPath } from 'url'
import { createServer } from "node:http"
import { Server } from "socket.io"
import { setupSocketIO } from "./socket.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

const app = express()
const server = createServer(app)
const io = new Server(server)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(path.join(rootDir, 'public')))
setupSocketIO(io)

/**
 * POST /api/rooms
 * Create a new room
 */
app.post("/api/rooms", (req, res) => {
    const { room_code: roomCode } = req.body;
    const room = roomManager.createRoom(roomCode)

    console.log(`[API]: Room created with code (${room.code})`)

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
server.listen(PORT, () => {
    console.log(`\n🎵 =================================================== 🎵`);
    console.log(`   Mehfil Collaborative Jukebox Server is Running!`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`🎵 =================================================== 🎵\n`);
})
