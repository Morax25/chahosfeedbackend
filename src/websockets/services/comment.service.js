import { redis } from "../../configs/redis.js";
import crypto from "crypto";

export const createComment = async ({ postId, userId, text }) => {
  const post = await redis.get(`post:${postId}`);
  if (!post) throw new Error("Post not found");
  const parsedPost = JSON.parse(post);
  const username = await redis.get(`user:${userId}:username`);
  const pfp = `https://api.dicebear.com/7.x/lorelei/svg?seed=${userId}`;
  if (!username) throw new Error("User not found");

  const comment = {
    id: crypto.randomUUID(),
    postId,
    text,
    createdAt: Date.now(),
    user: { userId, username, pfp },
  };

  await redis.lpush(`comments:${postId}`, JSON.stringify(comment));

  parsedPost.comments += 1;
  parsedPost.expiresAt = Math.min(parsedPost.expiresAt + 10000, Date.now() + 90000);

  await redis.set(`post:${postId}`, JSON.stringify(parsedPost));

  return {
    comment,
    commentCount: parsedPost.comments,
    expiresAt: parsedPost.expiresAt,
  };
};

export const getComments = async ({ postId }) => {
  const comments = await redis.lrange(`comments:${postId}`, 0, -1);
  return comments.map((c) => JSON.parse(c));
};
