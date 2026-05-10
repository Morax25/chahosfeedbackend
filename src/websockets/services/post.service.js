import crypto from "crypto"
import { redis } from "../../configs/redis.js"

export const createPost = async ({ userId, content }) => {
  const postId = crypto.randomUUID()

  const user = {
    userId,
    username: `user_${userId.slice(0, 5)}`,
    pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
  }

const post = {
  id: postId,
  content,
  comments: 0,
  likes: 0,
  createdAt: Date.now(),
  expiresAt: Date.now() + 5000,
  user,
}

  await redis.set(`post:${postId}`, JSON.stringify(post))
  await redis.zadd("feed_global", Date.now(), postId)

  return post
}