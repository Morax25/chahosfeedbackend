import crypto from "crypto"
import { redis } from "../../configs/redis.js"

export const createPost = async ({ userId, content }) => {
  const postId = crypto.randomUUID()

  const username = await redis.get(`user:${userId}:username`)
  const pfp = `https://api.dicebear.com/7.x/lorelei/svg?seed=${userId}`

  if (!username) {
    throw new Error("User not found")
  }

  const user = {
    userId,
    username,
    pfp,
  }

  const post = {
    id: postId,
    content,
    comments: 0,
    likes: 0,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30000,
    user,
  }

  await redis.set(`post:${postId}`, JSON.stringify(post))
  await redis.zadd("feed_global", Date.now(), postId)

  return post
}

export const deletePostFromRedis = async (postId) => {
  const postKey = `post:${postId}`

  // 1. Get post (needed for cleanup reference if required later)
  const postRaw = await redis.get(postKey)
  if (!postRaw) return null

  const post = JSON.parse(postRaw)

  // 2. Remove post data
  await redis.del(postKey)

  // 3. Remove from feed index
  await redis.zrem("feed_global", postId)

  return post
}
