import { createPost } from "../services/post.service.js"
import { expirePost } from '../services/postExpiry.Service.js'

export const registerPostHandler = (io, socket) => {
  socket.on("create_post", async (data) => {
    try {
      const post = await createPost({
        userId: socket.userId,
        content: data.content,
      })

      io.emit("post_created", post)
    } catch (err) {
      console.error("create_post error:", err.message)
      socket.emit("post_error", { message: err.message })
    }
  })

  socket.on("post_expired", async ({ postId }) => {
    try {
      const result = await expirePost({ postId })

      if (result.success) {
        io.emit("post_removed", { postId })
      }
    } catch (err) {
      console.error("post_expired error:", err.message)
    }
  })
}