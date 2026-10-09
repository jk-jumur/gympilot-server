import express from "express";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// Get my bookings
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

// Check if already booked
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

// Create booking
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const {
      classId,
      className,
      trainerName,
      schedule,
      amount,
      transactionId,
    } = req.body;

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
      userName: req.user.name,
      classId,
      className: className || "",
      trainerName: trainerName || "",
      schedule: schedule || "",
      transactionId: transactionId || `txn_${Date.now()}`,
      amount: amount || 0,
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

export default router;