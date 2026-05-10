import asyncHandler from "../utils/asynchandler.js"
import { redis } from "../configs/redis.js"

export const getFeed = asyncHandler(async (req, res) => {
  const ids = await redis.zrevrange("feed_global", 0, 50)

  const posts = await Promise.all(
    ids.map(async (id) => {
      const post = await redis.get(`post:${id}`)
      return post ? JSON.parse(post) : null
    })
  )

  res.json({
    success: true,
    data: posts.filter(Boolean),
  })
})

export const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params

  const post = await redis.get(`post:${id}`)

  if (!post) {
    return res.status(404).json({
      success: false,
      message: "Post not found",
    })
  }

  res.json({
    success: true,
    data: JSON.parse(post),
  })
})