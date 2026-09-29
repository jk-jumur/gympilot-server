import express from "express";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("favorites");
    const favorites = await collection.find({ userId: req.user.id }).toArray();

    res.json({
      success: true,
      data: favorites.map((f) => ({ ...f, _id: f._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { classId } = req.body;
    const collection = getCollection("favorites");

    const existing = await collection.findOne({
      userId: req.user.id,
      classId,
    });

    if (existing) throw new ApiError(409, "Already in favorites");

    const favorite = {
      userId: req.user.id,
      classId,
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

router.delete("/:classId", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("favorites");
    await collection.deleteOne({
      userId: req.user.id,
      classId: req.params.classId,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;