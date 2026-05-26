import { redis } from "../configs/redis.js"

export const getMessages = async (req, res) => {
  try {
    const roomId = req.params.id
    console.log(`Fetching messages for room: ${roomId}`)

    const messageHistory = await redis.lrange(`room:${roomId}:messages`, 0, -1)
    console.log(`Found ${messageHistory.length} messages`)

    const messages = messageHistory
      .map((msg) => JSON.parse(msg))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

    res.json({ messages })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
}
