import asyncHandler from "../utils/asynchandler.js"
import { redis } from "../configs/redis.js"

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