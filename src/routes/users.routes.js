import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// GET /api/users — All users (admin only)
// ═══════════════════════════════════════════════════════
router.get("/", verifyToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const users = await getCollection("user")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: users.map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        image: u.image || "",
        role: u.role || "user",
        status: u.status || "active",
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/users/trainers — All trainers (admin only)
// ⚠️ MUST be BEFORE /:id
// ═══════════════════════════════════════════════════════
router.get(
  "/trainers",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const usersCollection = getCollection("user");
      const trainers = await usersCollection
        .find({ role: "trainer" })
        .sort({ createdAt: -1 })
        .toArray();

      // ✅ Optionally enrich with application info (specialty, experience)
      const appCollection = getCollection("trainerApplications");
      const trainerIds = trainers.map((t) => t._id.toString());

      const applications = await appCollection
        .find({ userId: { $in: trainerIds } })
        .toArray();

      const appMap = new Map();
      applications.forEach((a) => appMap.set(a.userId, a));

      const enriched = trainers.map((t) => {
        const app = appMap.get(t._id.toString());
        return {
          _id: t._id.toString(),
          name: t.name,
          email: t.email,
          image: t.image || "",
          role: t.role,
          status: t.status || "active",
          specialty: app?.specialty || "—",
          experience: app?.experience || 0,
          createdAt: t.createdAt,
        };
      });

      res.json({ success: true, data: enriched });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// PATCH /api/users/:id/block — Block user (admin only)
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id/block",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const usersCollection = getCollection("user");
      const user = await usersCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!user) throw new ApiError(404, "User not found");
      if (user.role === "admin") {
        throw new ApiError(400, "Cannot block an admin");
      }

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { status: "blocked", updatedAt: new Date() } }
      );

      res.json({ success: true, message: "User blocked" });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// PATCH /api/users/:id/unblock — Unblock user (admin only)
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id/unblock",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const usersCollection = getCollection("user");
      const user = await usersCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!user) throw new ApiError(404, "User not found");

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { status: "active", updatedAt: new Date() } }
      );

      res.json({ success: true, message: "User unblocked" });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// PATCH /api/users/:id/make-admin — Promote to admin
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id/make-admin",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const usersCollection = getCollection("user");
      const user = await usersCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!user) throw new ApiError(404, "User not found");

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { role: "admin", updatedAt: new Date() } }
      );

      res.json({ success: true, message: "User promoted to admin" });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// PATCH /api/users/:id/demote — Demote trainer → user
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id/demote",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const usersCollection = getCollection("user");
      const user = await usersCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!user) throw new ApiError(404, "User not found");
      if (user.role !== "trainer") {
        throw new ApiError(400, "User is not a trainer");
      }

      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { role: "user", updatedAt: new Date() } }
      );

      // ✅ Also update trainer application status if exists
      await getCollection("trainerApplications").updateOne(
        { userId: user._id.toString() },
        { $set: { status: "rejected", feedback: "Demoted by admin" } }
      );

      res.json({ success: true, message: "Trainer demoted to user" });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// GET /api/users/:id — Single user (admin)
// ═══════════════════════════════════════════════════════
router.get("/:id", verifyToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const user = await getCollection("user").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!user) throw new ApiError(404, "User not found");

    res.json({
      success: true,
      data: {
        ...user,
        _id: user._id.toString(),
        role: user.role || "user",
        status: user.status || "active",
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;