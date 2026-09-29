import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// GET /api/forum
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

// GET /api/forum/latest
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

// GET /api/forum/:id
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

// POST /api/forum
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

export default router;