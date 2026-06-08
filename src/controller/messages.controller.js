import { redis } from "../configs/redis.js"
import { randomUUID } from "crypto"

export const getMessages = async (req, res) => {
  try {
    const roomId = req.params.id

    const roomData = await redis.hget("chatrooms", roomId)

    if (!roomData) {
      return res.status(404).json({ error: "Room not found" })
    }

    const messageHistory = await redis.lrange(`room:${roomId}:messages`, 0, -1)

    const messages = messageHistory
      .map((msg) => JSON.parse(msg))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    const room = JSON.parse(roomData)

    res.json({ messages, room })
  } catch (error) {
    console.error("Error fetching messages:", error)
    res.status(500).json({ error: error.message })
  }
}

export const getRooms = async (req, res) => {
  try {
    const data = await redis.hgetall("chatrooms")

    if (!data) return res.json({ rooms: [] })

    const rooms = Object.values(data)
      .map((r) => JSON.parse(r))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    res.json({ rooms })
  } catch (error) {
    console.error("Error fetching rooms:", error)
    res.status(500).json({ error: error.message })
  }
}

export const createRoom = async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: "Room name is required" })
    }

    const room = {
      id: randomUUID(),
      name: name.trim(),
      description: description?.trim() || "",
      onlineUsers: 0,
      createdAt: new Date().toISOString(),
    }

    await redis.hset("chatrooms", room.id, JSON.stringify(room))

    res.status(201).json({ room })
  } catch (error) {
    console.error("Error creating room:", error)
    res.status(500).json({ error: error.message })
  }
}

export const deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params

    const roomData = await redis.hget("chatrooms", roomId)

    if (!roomData) {
      return res.status(404).json({ error: "Room not found" })
    }

    await Promise.all([
      redis.hdel("chatrooms", roomId),
      redis.del(`room:${roomId}:messages`),
    ])

    res.json({ success: true })
  } catch (error) {
    console.error("Error deleting room:", error)
    res.status(500).json({ error: error.message })
  }
}
