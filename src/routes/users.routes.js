import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// GET /api/users — Admin only
router.get("/", verifyToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const collection = getCollection("user");
    const users = await collection
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json({
      success: true,
      data: users.map((u) => ({ ...u, _id: u._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/block
router.patch(
  "/:id/block",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const collection = getCollection("user");
      const user = await collection.findOne({ _id: new ObjectId(req.params.id) });

      if (!user) throw new ApiError(404, "User not found");

      const newStatus = user.status === "blocked" ? "active" : "blocked";

      await collection.updateOne(
        { _id: user._id },
        { $set: { status: newStatus, updatedAt: new Date() } }
      );

      res.json({ success: true, status: newStatus });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/users/:id/role
router.patch(
  "/:id/role",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const { role } = req.body;
      if (!["user", "trainer", "admin"].includes(role)) {
        throw new ApiError(400, "Invalid role");
      }

      const collection = getCollection("user");
      await collection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { role, updatedAt: new Date() } }
      );

      res.json({ success: true, role });
    } catch (err) {
      next(err);
    }
  }
);

export default router;