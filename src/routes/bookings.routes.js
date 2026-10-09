import express from "express";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// GET /api/bookings — My bookings
// ═══════════════════════════════════════════════════════
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const bookings = await getCollection("bookings")
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

// ═══════════════════════════════════════════════════════
// GET /api/bookings/all — All bookings (admin)
// ⚠️ MUST be BEFORE /check/:classId
// ═══════════════════════════════════════════════════════
router.get(
  "/all",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const bookings = await getCollection("bookings")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.json({
        success: true,
        data: bookings.map((b) => ({ ...b, _id: b._id.toString() })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// GET /api/bookings/check/:classId — Already booked?
// ═══════════════════════════════════════════════════════
router.get("/check/:classId", verifyToken, async (req, res, next) => {
  try {
    const existing = await getCollection("bookings").findOne({
      userId: req.user.id,
      classId: req.params.classId,
    });

    res.json({ success: true, booked: !!existing });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/bookings — Create booking
// ═══════════════════════════════════════════════════════
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

    const existing = await getCollection("bookings").findOne({
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
      trainer: trainerName || "",
      trainerName: trainerName || "",
      schedule: schedule || "",
      amount: amount || 0,
      transactionId: transactionId || `txn_${Date.now()}`,
      status: "confirmed",
      createdAt: new Date(),
    };

    const result = await getCollection("bookings").insertOne(booking);

    // ⭐ Increment bookingsCount on the class
    try {
      const { ObjectId } = await import("mongodb");
      await getCollection("classes").updateOne(
        { _id: new ObjectId(classId) },
        { $inc: { bookingsCount: 1, enrolledCount: 1 } }
      );
    } catch (e) {
      console.error("Failed to increment class count:", e);
    }

    res.status(201).json({
      success: true,
      data: { ...booking, _id: result.insertedId.toString() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;