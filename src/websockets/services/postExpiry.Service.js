import { redis } from "../../configs/redis.js"

export const expirePost = async ({ postId }) => {
  try {
    const postRaw = await redis.get(`post:${postId}`)
    const post = postRaw ? JSON.parse(postRaw) : null

    const likeKeys = await redis.keys(`like:${postId}:*`)
    if (likeKeys.length > 0) {
      await redis.del(...likeKeys)
    }
    await redis.del(`post:${postId}`)
    await redis.zrem("feed_global", postId)

    return {
      success: true,
      postId,
      stats: post ? {
        duration: Date.now() - post.createdAt,
        comments: post.comments,
        likes: post.likes,
      } : null
    }
  } catch (err) {
    return { success: false }
  }
}
