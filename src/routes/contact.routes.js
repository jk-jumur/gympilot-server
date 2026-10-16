import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// POST /api/contact — Submit contact form (PUBLIC)
// ═══════════════════════════════════════════════════════
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    // ✅ Validation
    if (!name || !email || !subject || !message) {
      throw new ApiError(400, "All fields are required");
    }

    if (name.trim().length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters");
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Please provide a valid email");
    }

    if (subject.trim().length < 3) {
      throw new ApiError(400, "Subject must be at least 3 characters");
    }

    if (message.trim().length < 10) {
      throw new ApiError(400, "Message must be at least 10 characters");
    }

    // ✅ Save to MongoDB
    const contactDoc = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: "unread",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await getCollection("contacts").insertOne(contactDoc);

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully.",
      data: { _id: result.insertedId.toString() },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/contact — All messages (ADMIN ONLY)
// ═══════════════════════════════════════════════════════
router.get("/", verifyToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const contacts = await getCollection("contacts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      count: contacts.length,
      data: contacts.map((c) => ({
        _id: c._id.toString(),
        name: c.name,
        email: c.email,
        subject: c.subject,
        message: c.message,
        status: c.status || "unread",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// PATCH /api/contact/:id — Update status (ADMIN ONLY)
// ═══════════════════════════════════════════════════════
router.patch(
  "/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body;

      if (!status || !["unread", "read", "replied"].includes(status)) {
        throw new ApiError(400, "Invalid status value");
      }

      const result = await getCollection("contacts").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        throw new ApiError(404, "Contact message not found");
      }

      res.json({
        success: true,
        message: "Status updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════
// DELETE /api/contact/:id — Delete message (ADMIN ONLY)
// ═══════════════════════════════════════════════════════
router.delete(
  "/:id",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const result = await getCollection("contacts").deleteOne({
        _id: new ObjectId(req.params.id),
      });

      if (result.deletedCount === 0) {
        throw new ApiError(404, "Contact message not found");
      }

      res.json({
        success: true,
        message: "Contact message deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;