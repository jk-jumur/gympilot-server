import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// GET /api/classes — Public (approved only, paginated)
// ═══════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════
// GET /api/classes/featured — Top 4 by bookingsCount
// ═══════════════════════════════════════════════════════
router.get("/featured", async (req, res, next) => {
  try {
    const classes = await getCollection("classes")
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

// ═══════════════════════════════════════════════════════
// GET /api/classes/trainer/my — Own classes (trainer/admin)
// ⚠️ MUST be BEFORE /:id
// ═══════════════════════════════════════════════════════
router.get(
  "/trainer/my",
  verifyToken,
  verifyRole("trainer", "admin"),
  async (req, res, next) => {
    try {
      const classes = await getCollection("classes")
        .find({ trainerId: req.user.id })
        .sort({ createdAt: -1 })
        .toArray();

      res.json({
        success: true,
        data: classes.map((c) => ({ ...c, _id: c._id.toString() })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// GET /api/classes/admin/all — All classes (admin)
// ⚠️ MUST be BEFORE /:id
// ═══════════════════════════════════════════════════════
router.get(
  "/admin/all",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const classes = await getCollection("classes")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.json({
        success: true,
        data: classes.map((c) => ({ ...c, _id: c._id.toString() })),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// GET /api/classes/:id/students — Enrolled students
// ⚠️ MUST be BEFORE /:id
// ═══════════════════════════════════════════════════════
router.get(
  "/:id/students",
  verifyToken,
  verifyRole("trainer", "admin"),
  async (req, res, next) => {
    try {
      const bookings = await getCollection("bookings")
        .find({ classId: req.params.id })
        .toArray();

      const students = bookings.map((b) => ({
        _id: b._id.toString(),
        userId: b.userId,
        userName: b.userName || "User",
        userEmail: b.userEmail,
        userImage: b.userImage || "",
      }));

      res.json({ success: true, data: students });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// GET /api/classes/:id — Single class
// ═══════════════════════════════════════════════════════
router.get("/:id", async (req, res, next) => {
  try {
    const cls = await getCollection("classes").findOne({
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

// ═══════════════════════════════════════════════════════
// POST /api/classes — Create class (trainer/admin)
// ═══════════════════════════════════════════════════════
router.post(
  "/",
  verifyToken,
  verifyRole("trainer", "admin"),
  async (req, res, next) => {
    try {
      const {
        name,
        className,
        category,
        price,
        duration,
        image,
        description,
        difficulty,
        schedule,
      } = req.body;

      const finalName = className || name;

      if (!finalName || !category || !price || !duration || !image) {
        throw new ApiError(400, "Missing required fields");
      }

      const newClass = {
        name: finalName,
        className: finalName,
        trainer: req.user.name,
        trainerName: req.user.name,
        trainerId: req.user.id,
        category,
        price: Number(price),
        duration,
        image,
        description: description || "",
        difficulty: difficulty || "Beginner",
        schedule: schedule || "",
        bookingsCount: 0,
        enrolledCount: 0,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await getCollection("classes").insertOne(newClass);

      res.status(201).json({
        success: true,
        data: { ...newClass, _id: result.insertedId.toString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// PATCH /api/classes/:id/approve — Admin approve
// ⚠️ MUST be BEFORE /:id PATCH
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id/approve",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const collection = getCollection("classes");
      const cls = await collection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!cls) throw new ApiError(404, "Class not found");

      await collection.updateOne(
        { _id: cls._id },
        { $set: { status: "approved", updatedAt: new Date() } }
      );

      res.json({ success: true, message: "Class approved" });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// PATCH /api/classes/:id/reject — Admin reject
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id/reject",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const collection = getCollection("classes");
      const cls = await collection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!cls) throw new ApiError(404, "Class not found");

      await collection.updateOne(
        { _id: cls._id },
        { $set: { status: "rejected", updatedAt: new Date() } }
      );

      res.json({ success: true, message: "Class rejected" });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// PATCH /api/classes/:id — Update (own or admin)
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id",
  verifyToken,
  verifyRole("trainer", "admin"),
  async (req, res, next) => {
    try {
      const collection = getCollection("classes");
      const cls = await collection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!cls) throw new ApiError(404, "Class not found");

      if (req.user.role !== "admin" && cls.trainerId !== req.user.id) {
        throw new ApiError(403, "You can only update your own class");
      }

      const updates = { ...req.body, updatedAt: new Date() };
      if (updates.price) updates.price = Number(updates.price);

      await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updates }
      );

      const updated = await collection.findOne({
        _id: new ObjectId(req.params.id),
      });

      res.json({
        success: true,
        data: { ...updated, _id: updated._id.toString() },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// DELETE /api/classes/:id — Delete (own or admin)
// ═══════════════════════════════════════════════════════
router.delete(
  "/:id",
  verifyToken,
  verifyRole("trainer", "admin"),
  async (req, res, next) => {
    try {
      const collection = getCollection("classes");
      const cls = await collection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!cls) throw new ApiError(404, "Class not found");

      if (req.user.role !== "admin" && cls.trainerId !== req.user.id) {
        throw new ApiError(403, "You can only delete your own class");
      }

      await collection.deleteOne({ _id: new ObjectId(req.params.id) });

      res.json({ success: true, message: "Class deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;