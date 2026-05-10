import { redis } from "../../configs/redis.js"

export const expirePost = async ({ postId }) => {
  try {
    await redis.del(`post:${postId}`)
    await redis.zrem("feed_global", postId)
    return { success: true, postId }
  } catch (err) {
    return { success: false }
  }
}