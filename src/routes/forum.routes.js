import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// GET /api/forum — All posts (paginated)
// ═══════════════════════════════════════════════════════
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 9 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const collection = getCollection("forumPosts");

    const [posts, totalItems] = await Promise.all([
      collection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(),
      collection.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      data: posts.map((p) => ({ ...p, _id: p._id.toString() })),
      pagination: { currentPage: pageNum, totalPages, totalItems },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/forum/latest — Latest 4 posts
// ═══════════════════════════════════════════════════════
router.get("/latest", async (req, res, next) => {
  try {
    const collection = getCollection("forumPosts");
    const posts = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray();

    res.json({
      success: true,
      data: posts.map((p) => ({ ...p, _id: p._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/forum/:id — Single post
// ═══════════════════════════════════════════════════════
router.get("/:id", async (req, res, next) => {
  try {
    const collection = getCollection("forumPosts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!post) throw new ApiError(404, "Post not found");

    res.json({ success: true, data: { ...post, _id: post._id.toString() } });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/forum — Create post (trainer/admin only)
// ═══════════════════════════════════════════════════════
router.post(
  "/",
  verifyToken,
  verifyRole("trainer", "admin"),
  async (req, res, next) => {
    try {
      const { title, image, description } = req.body;

      if (!title || !image || !description) {
        throw new ApiError(400, "Title, image, and description required");
      }

      const newPost = {
        title,
        image,
        description,
        excerpt: description.substring(0, 140) + "...",
        author: req.user.name,
        authorId: req.user.id,
        authorImage: req.user.image || "",
        likes: [],
        dislikes: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const collection = getCollection("forumPosts");
      const result = await collection.insertOne(newPost);

      res.status(201).json({
        success: true,
        data: { ...newPost, _id: result.insertedId.toString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// POST /api/forum/:id/like — Toggle like
// ═══════════════════════════════════════════════════════
router.post("/:id/like", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("forumPosts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!post) throw new ApiError(404, "Post not found");

    const userId = req.user.id;
    const likes = post.likes || [];
    const dislikes = post.dislikes || [];

    const newLikes = likes.includes(userId)
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];
    const newDislikes = dislikes.filter((id) => id !== userId);

    await collection.updateOne(
      { _id: post._id },
      { $set: { likes: newLikes, dislikes: newDislikes, updatedAt: new Date() } }
    );

    const updated = await collection.findOne({ _id: post._id });

    res.json({
      success: true,
      data: { ...updated, _id: updated._id.toString() },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/forum/:id/dislike — Toggle dislike
// ═══════════════════════════════════════════════════════
router.post("/:id/dislike", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("forumPosts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });

    if (!post) throw new ApiError(404, "Post not found");

    const userId = req.user.id;
    const likes = post.likes || [];
    const dislikes = post.dislikes || [];

    const newDislikes = dislikes.includes(userId)
      ? dislikes.filter((id) => id !== userId)
      : [...dislikes, userId];
    const newLikes = likes.filter((id) => id !== userId);

    await collection.updateOne(
      { _id: post._id },
      { $set: { likes: newLikes, dislikes: newDislikes, updatedAt: new Date() } }
    );

    const updated = await collection.findOne({ _id: post._id });

    res.json({
      success: true,
      data: { ...updated, _id: updated._id.toString() },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/forum/:id/comments — Add comment
// ═══════════════════════════════════════════════════════
router.post("/:id/comments", verifyToken, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) throw new ApiError(400, "Comment text required");

    const collection = getCollection("forumPosts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) throw new ApiError(404, "Post not found");

    const newComment = {
      _id: new ObjectId().toString(),
      userId: req.user.id,
      userName: req.user.name,
      userImage: req.user.image || "",
      text: text.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { _id: post._id },
      { $push: { comments: newComment }, $set: { updatedAt: new Date() } }
    );

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// PATCH /api/forum/:id/comments/:commentId — Edit comment
// ═══════════════════════════════════════════════════════
router.patch("/:id/comments/:commentId", verifyToken, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) throw new ApiError(400, "Comment text required");

    const collection = getCollection("forumPosts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) throw new ApiError(404, "Post not found");

    const comment = post.comments?.find((c) => c._id === req.params.commentId);
    if (!comment) throw new ApiError(404, "Comment not found");
    if (comment.userId !== req.user.id) {
      throw new ApiError(403, "You can only edit your own comments");
    }

    const updatedAt = new Date();

    await collection.updateOne(
      { _id: post._id, "comments._id": req.params.commentId },
      {
        $set: {
          "comments.$.text": text.trim(),
          "comments.$.updatedAt": updatedAt,
          updatedAt,
        },
      }
    );

    res.json({
      success: true,
      data: { ...comment, text: text.trim(), updatedAt },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/forum/:id/comments/:commentId — Delete comment
// ═══════════════════════════════════════════════════════
router.delete("/:id/comments/:commentId", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("forumPosts");
    const post = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!post) throw new ApiError(404, "Post not found");

    const comment = post.comments?.find((c) => c._id === req.params.commentId);
    if (!comment) throw new ApiError(404, "Comment not found");
    if (comment.userId !== req.user.id && req.user.role !== "admin") {
      throw new ApiError(403, "You can only delete your own comments");
    }

    await collection.updateOne(
      { _id: post._id },
      {
        $pull: { comments: { _id: req.params.commentId } },
        $set: { updatedAt: new Date() },
      }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;