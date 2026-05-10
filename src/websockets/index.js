import { redis } from "../configs/redis.js"
import crypto from "crypto"
import { registerPostHandler } from "./handlers/post.socket.js"
import { names } from "../constants/names.js"

const initializeSocket = (io) => {
  io.on("connection", async (socket) => {
    let userId = socket.handshake.auth.userId

    if (!userId) {
      userId = crypto.randomUUID()
    }

    let username = await redis.get(`user:${userId}:username`)

    if (!username) {
      const randomName = names[Math.floor(Math.random() * names.length)]
      username = `${randomName.firstName} ${randomName.lastName}`

      await redis.set(`user:${userId}:username`, username)
    }

    const user = {
      userId,
      username,
      pfp: `https://api.dicebear.com/7.x/lorelei/svg?seed=${userId}`
    }

    socket.userId = userId

    await redis.sadd(`user:${userId}:sockets`, socket.id)
    await redis.sadd("online:users", userId)

    socket.emit("me", user)
    registerPostHandler(io, socket)

    const onlineCount = await redis.scard("online:users")
    io.emit("online_users", onlineCount)

    socket.on("disconnect", async () => {
      const uid = socket.userId
      if (!uid) return

      await redis.srem(`user:${uid}:sockets`, socket.id)

      const remaining = await redis.scard(`user:${uid}:sockets`)

      if (remaining === 0) {
        await redis.srem("online:users", uid)
      }

      const onlineCount = await redis.scard("online:users")
      io.emit("online_users", onlineCount)
    })
  })
}

export default initializeSocket