import { Router } from 'express'
import { redis } from '../configs/redis.js'

const router = Router()

router.get('/:id', async (req, res) => {
  try {
    const roomId = req.params.id
    console.log(`Fetching messages for room: ${roomId}`)

    const messageHistory = await redis.lrange(`room:${roomId}:messages`, 0, -1)
    console.log(`Found ${messageHistory.length} messages`)

    const messages = messageHistory.map((msg) => JSON.parse(msg))
    res.json({ messages })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
