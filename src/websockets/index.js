import { redis } from "../configs/redis.js"
import crypto from "crypto"
import { registerPostHandler } from "./handlers/post.socket.js"
import { names } from "../constants/names.js"

const getRandomUsername = () => {
  const randomName = names[Math.floor(Math.random() * names.length)]
  return `${randomName.firstName} ${randomName.lastName}`
}

const createUser = async () => {
  const userId = crypto.randomUUID()
  const username = getRandomUsername()
  const pfp = `https://api.dicebear.com/7.x/lorelei/svg?seed=${userId}`

  await redis.set(`user:${userId}:username`, username)
  await redis.set(`user:${userId}:pfp`, pfp)

  return { userId, username, pfp }
}

const initializeSocket = (io) => {
  io.on("connection", async (socket) => {
    try {
      let userId = socket.handshake.auth.userId
      let isNewUser = false

      if (userId) {
        const exists = await redis.exists(`user:${userId}:username`)
        if (!exists) {
          userId = null
        }
      }

      if (!userId) {
        const user = await createUser()
        userId = user.userId
        isNewUser = true
        socket.emit("me", user)
      }

      socket.userId = userId

      await redis.sadd(`user:${userId}:sockets`, socket.id)
      await redis.sadd("online:users", userId)

      registerPostHandler(io, socket)

      const onlineCount = await redis.scard("online:users")
      io.emit("online_users", onlineCount)

      socket.on("disconnect", async () => {
        try {
          const uid = socket.userId
          if (!uid) return

          await redis.srem(`user:${uid}:sockets`, socket.id)

          const remaining = await redis.scard(`user:${uid}:sockets`)

          if (remaining === 0) {
            await redis.srem("online:users", uid)
            await redis.del(`user:${uid}:sockets`)
          }

          const onlineCount = await redis.scard("online:users")
          io.emit("online_users", onlineCount)
        } catch (err) {
          console.error("Socket disconnect error:", err)
        }
      })
    } catch (err) {
      console.error("Socket connection error:", err)
      socket.disconnect(true)
    }
  })
}

export default initializeSocket