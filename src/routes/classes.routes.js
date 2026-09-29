import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// GET /api/classes
router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "", page = 1, limit = 8 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = { status: "approved" };

    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    if (category && category !== "All") {
      query.category = { $in: [category] };
    }

    const collection = getCollection("classes");

    const [classes, totalItems] = await Promise.all([
      collection
        .find(query)
        .sort({ bookingsCount: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      collection.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      data: classes.map((c) => ({ ...c, _id: c._id.toString() })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/classes/featured
router.get("/featured", async (req, res, next) => {
  try {
    const collection = getCollection("classes");
    const classes = await collection
      .find({ status: "approved" })
      .sort({ bookingsCount: -1 })
      .limit(4)
      .toArray();

    res.json({
      success: true,
      data: classes.map((c) => ({ ...c, _id: c._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/classes/:id
router.get("/:id", async (req, res, next) => {
  try {
    const collection = getCollection("classes");
    const cls = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!cls) throw new ApiError(404, "Class not found");

    res.json({
      success: true,
      data: { ...cls, _id: cls._id.toString() },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/classes
router.post(
  "/",
  verifyToken,
  verifyRole("trainer", "admin"),
  async (req, res, next) => {
    try {
      const { name, category, price, duration, image, description, difficulty } =
        req.body;

      if (!name || !category || !price || !duration || !image) {
        throw new ApiError(400, "Missing required fields");
      }

      const newClass = {
        name,
        trainer: req.user.name,
        trainerId: req.user.id,
        category,
        price: Number(price),
        duration,
        image,
        description: description || "",
        difficulty: difficulty || "Beginner",
        bookingsCount: 0,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const collection = getCollection("classes");
      const result = await collection.insertOne(newClass);

      res.status(201).json({
        success: true,
        data: { ...newClass, _id: result.insertedId.toString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;