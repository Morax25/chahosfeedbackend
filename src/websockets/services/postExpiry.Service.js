import { redis } from "../../configs/redis.js"

export const expirePost = async ({ postId }) => {
  try {
    const likeKeys = await redis.keys(`like:${postId}:*`)
    if (likeKeys.length > 0) {
      await redis.del(...likeKeys)
    }
    await redis.del(`post:${postId}`)
    await redis.zrem("feed_global", postId)
    return { success: true, postId }
  } catch (err) {
    return { success: false }
  }
}