import express from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ═══════════════════════════════════════════════════════
// POST /api/payments/create-checkout-session
// ═══════════════════════════════════════════════════════
router.post("/create-checkout-session", verifyToken, async (req, res, next) => {
  try {
    const { classId } = req.body;
    if (!classId) throw new ApiError(400, "Class ID required");

    const classesCollection = getCollection("classes");
    const cls = await classesCollection.findOne({
      _id: new ObjectId(classId),
    });

    if (!cls) throw new ApiError(404, "Class not found");

    const bookingsCollection = getCollection("bookings");
    const existing = await bookingsCollection.findOne({
      userId: req.user.id,
      classId,
    });

    if (existing) {
      throw new ApiError(409, "You have already booked this class");
    }

    // ⭐ Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: cls.name,
              description: `Trainer: ${cls.trainer} • ${cls.duration}`,
              images: [cls.image],
            },
            unit_amount: Math.round(cls.price * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: req.user.email,
      metadata: {
        classId,
        userId: req.user.id,
        className: cls.name,
        trainer: cls.trainer,
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/${classId}`,
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/payments/verify/:sessionId
// ═══════════════════════════════════════════════════════
router.get("/verify/:sessionId", verifyToken, async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );

    res.json({
      success: true,
      paid: session.payment_status === "paid",
      session: {
        id: session.id,
        email: session.customer_email,
        amount: session.amount_total / 100,
        metadata: session.metadata,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/payments/confirm/:sessionId
// ⭐ FALLBACK: Save booking after payment
// ═══════════════════════════════════════════════════════
router.post("/confirm/:sessionId", verifyToken, async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );

    if (session.payment_status !== "paid") {
      throw new ApiError(400, "Payment not completed");
    }

    const { classId, userId, className, trainer } = session.metadata;
    const bookingsCollection = getCollection("bookings");

    const existing = await bookingsCollection.findOne({
      userId,
      classId,
    });

    if (!existing) {
      await bookingsCollection.insertOne({
        userId,
        userEmail: session.customer_email,
        classId,
        className,
        trainer,
        amount: session.amount_total / 100,
        transactionId: session.payment_intent,
        stripeSessionId: session.id,
        status: "confirmed",
        createdAt: new Date(),
      });
      console.log(`✅ Booking created for ${session.customer_email}`);
    }

    res.json({ success: true, message: "Booking confirmed" });
  } catch (err) {
    next(err);
  }
});

export default router;