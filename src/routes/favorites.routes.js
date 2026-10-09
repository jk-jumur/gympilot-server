import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// Get my favorites
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("favorites");
    const favorites = await collection
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: favorites.map((f) => ({ ...f, _id: f._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

// Add favorite
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { classId, className, trainerName, price, image } = req.body;

    if (!classId) throw new ApiError(400, "Class ID required");

    const collection = getCollection("favorites");

    const existing = await collection.findOne({
      userId: req.user.id,
      classId,
    });

    if (existing) throw new ApiError(409, "Already in favorites");

    const favorite = {
      userId: req.user.id,
      classId,
      className: className || "",
      trainerName: trainerName || "",
      price: price || 0,
      image: image || "",
      createdAt: new Date(),
    };

    const result = await collection.insertOne(favorite);

    res.status(201).json({
      success: true,
      data: { ...favorite, _id: result.insertedId.toString() },
    });
  } catch (err) {
    next(err);
  }
});

// Delete favorite by MongoDB _id
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("favorites");

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id),
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      throw new ApiError(404, "Favorite not found");
    }

    res.json({ success: true, message: "Removed from favorites" });
  } catch (err) {
    next(err);
  }
});

export default router;