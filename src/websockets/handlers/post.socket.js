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
    } catch (err) {}
  })

  socket.on("post_expired", async ({ postId }) => {
    const result = await expirePost({ postId })

    if (result.success) {
      io.emit("post_removed", { postId })
    }
  })
}