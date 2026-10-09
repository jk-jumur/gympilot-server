import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// Submit trainer application
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { experience, specialty } = req.body;
    if (!experience || !specialty) {
      throw new ApiError(400, "Experience and specialty required");
    }

    const collection = getCollection("trainerApplications");

    //  Check for both pending and approved
    const existing = await collection.findOne({
      userId: req.user.id,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      throw new ApiError(
        409,
        existing.status === "pending"
          ? "You already have a pending application"
          : "You are already a trainer"
      );
    }

    const application = {
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userImage: req.user.image || "",
      experience: Number(experience),
      specialty,
      status: "pending",
      feedback: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(application);

    res.status(201).json({
      success: true,
      data: { ...application, _id: result.insertedId.toString() },
    });
  } catch (err) {
    next(err);
  }
});

// Get my application
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const collection = getCollection("trainerApplications");
    const app = await collection.findOne({ userId: req.user.id });

    res.json({
      success: true,
      data: app ? { ...app, _id: app._id.toString() } : null,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: get all applications
router.get("/", verifyToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const collection = getCollection("trainerApplications");
    const apps = await collection.find({}).sort({ createdAt: -1 }).toArray();

    res.json({
      success: true,
      data: apps.map((a) => ({ ...a, _id: a._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
});

// Admin: approve/reject application
router.patch("/:id", verifyToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const { action, feedback = "" } = req.body;
    if (!["approve", "reject"].includes(action)) {
      throw new ApiError(400, "Invalid action");
    }

    const appsCollection = getCollection("trainerApplications");
    const usersCollection = getCollection("user");

    const app = await appsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!app) throw new ApiError(404, "Application not found");

    const newStatus = action === "approve" ? "approved" : "rejected";

    await appsCollection.updateOne(
      { _id: app._id },
      {
        $set: {
          status: newStatus,
          feedback,
          updatedAt: new Date(),
          reviewedBy: req.user.id,
        },
      }
    );

    if (action === "approve") {
      await usersCollection.updateOne(
        { _id: new ObjectId(app.userId) },
        { $set: { role: "trainer", updatedAt: new Date() } }
      );
    }

    res.json({ success: true, status: newStatus });
  } catch (err) {
    next(err);
  }
});

export default router;