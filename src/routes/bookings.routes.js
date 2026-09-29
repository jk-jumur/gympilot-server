import express from "express";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("bookings");
    const bookings = await collection
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: bookings.map((b) => ({ ...b, _id: b._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { classId } = req.body;
    if (!classId) throw new ApiError(400, "Class ID required");

    const collection = getCollection("bookings");
    const existing = await collection.findOne({
      userId: req.user.id,
      classId,
    });

    if (existing) {
      throw new ApiError(409, "You have already booked this class");
    }

    const booking = {
      userId: req.user.id,
      userEmail: req.user.email,
      classId,
      transactionId: `txn_${Date.now()}`,
      amount: 0,
      status: "confirmed",
      createdAt: new Date(),
    };

    const result = await collection.insertOne(booking);

    res.status(201).json({
      success: true,
      data: { ...booking, _id: result.insertedId.toString() },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/check/:classId", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("bookings");
    const existing = await collection.findOne({
      userId: req.user.id,
      classId: req.params.classId,
    });

    res.json({ success: true, booked: !!existing });
  } catch (err) {
    next(err);
  }
});

export default router;