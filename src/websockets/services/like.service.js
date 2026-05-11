import { redis } from "../../configs/redis.js";

export const toggleLike = async ({ postId, userId }) => {
  const likeKey = `like:${postId}:${userId}`;
  const postKey = `post:${postId}`;
  const post = await redis.get(postKey);
  if (!post) throw new Error("Post not found");
  const parsedPost = JSON.parse(post);
  const alreadyLiked = await redis.exists(likeKey);
  if (alreadyLiked) {
    await redis.del(likeKey);
    parsedPost.likes = Math.max(0, parsedPost.likes - 1);
  } else {
    await redis.set(likeKey, "1");
    parsedPost.likes += 1;
  }
  await redis.set(postKey, JSON.stringify(parsedPost));
  return {
    postId,
    likes: parsedPost.likes,
    likedByMe: !alreadyLiked,
    userId
  };
};
