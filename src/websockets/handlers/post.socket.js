import { createPost } from "../services/post.service.js"
import { expirePost } from '../services/postExpiry.Service.js'
import { toggleLike } from "../services/like.service.js"
import { createComment, getComments } from "../services/comment.service.js"

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

  socket.on("like_post", async ({ postId }) => {
    try {
      const result = await toggleLike({ postId, userId: socket.userId })
      io.emit("post_liked", result)
    } catch (err) {
      console.error("like_post error:", err.message)
      socket.emit("post_error", { message: err.message })
    }
  })

socket.on("add_comment", async ({ postId, text }) => {
  try {
    const { comment, commentCount, expiresAt } = await createComment({
      postId,
      userId: socket.userId,
      text
    })
    io.emit("comment_added", comment)
    io.emit("post_updated", { postId, comments: commentCount, expiresAt })
  } catch (err) {
    console.error("add_comment error:", err.message)
    socket.emit("post_error", { message: err.message })
  }
})

  socket.on("get_comments", async ({ postId }) => {
    try {
      const comments = await getComments({ postId })
      socket.emit("comments_loaded", comments)
    } catch (err) {
      console.error("get_comments error:", err.message)
    }
  })

socket.on("post_expired", async ({ postId }) => {
  try {
    const result = await expirePost({ postId })
    if (result.success) {
      io.emit("post_removed", { postId, stats: result.stats })
    }
  } catch (err) {
    console.error("post_expired error:", err.message)
  }
})
}
