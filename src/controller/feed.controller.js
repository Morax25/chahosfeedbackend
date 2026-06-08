import asyncHandler from "../utils/asynchandler.js"
import { redis } from "../configs/redis.js"
import { deletePostFromRedis } from "../websockets/services/post.service.js"

export const getFeed = asyncHandler(async (req, res) => {
  const { userId } = req.query
  const ids = await redis.zrevrange("feed_global", 0, 50)

  const posts = await Promise.all(
    ids.map(async (id) => {
      const post = await redis.get(`post:${id}`)
      if (!post) return null

      const parsed = JSON.parse(post)

      const likedByMe = userId
        ? (await redis.exists(`like:${id}:${userId}`)) === 1
        : false

      return { ...parsed, likedByMe }
    })
  )

  res.json({
    success: true,
    data: posts.filter(Boolean),
  })
})

export const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { userId } = req.query

  const post = await redis.get(`post:${id}`)

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    })
  }

  const parsed = JSON.parse(post)

  const likedByMe = userId
    ? (await redis.exists(`like:${id}:${userId}`)) === 1
    : false

  res.json({
    success: true,
    data: { ...parsed, likedByMe },
  })
})

export const getModerationQueue = asyncHandler(async (req, res) => {
  console.log("Route ran")
  const keys = await redis.keys("moderation:human_review:*")

  if (!keys.length) {
    return res.json({ success: true, data: [] })
  }

  const items = await Promise.all(
    keys.map(async (key) => {
      const raw = await redis.get(key)
      if (!raw) return null
      return JSON.parse(raw)
    })
  )

  res.json({
    success: true,
    data: items.filter(Boolean),
  })
})

export const deleteModerationPost = asyncHandler(async (req, res) => {
  const { postId } = req.params
  const io = req.app.get("io")

  const reviewKey = `moderation:human_review:${postId}`
  const reviewRaw = await redis.get(reviewKey)

  if (!reviewRaw) {
    return res.status(404).json({
      success: false,
      message: "Post not found in moderation queue",
    })
  }

  const { category, reasoning, reporter } = JSON.parse(reviewRaw)
  const authorId = await redis.get(`post:${postId}:author`)

  await Promise.all([
    redis.del(reviewKey),
    deletePostFromRedis(postId),
  ])

  io.emit("post_removed", { postId })

  if (reporter) {
    const reporterSockets = await redis.smembers(`user:${reporter}:sockets`)
    reporterSockets.forEach((socketId) => {
      io.to(socketId).emit("moderation_notification", {
        variant: "report_resolved",
        category,
        reasoning,
      })
    })
  }

  if (authorId) {
    const authorSockets = await redis.smembers(`user:${authorId}:sockets`)
    authorSockets.forEach((socketId) => {
      io.to(socketId).emit("moderation_notification", {
        variant: "post_removed",
        category,
        reasoning,
      })
    })
  }

  res.json({
    success: true,
    message: "Post removed successfully",
    data: { postId, authorId, category, reasoning },
  })
})
