import express from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyRole } from "../middleware/verifyRole.js";

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

    //  DB field names handle 
    const className = cls.name || cls.className || "Fitness Class";
    const trainerName =
      cls.trainer || cls.trainerName || "Unknown Trainer";
    const schedule = cls.schedule || "";
    const duration = cls.duration || "";
    const image = cls.image || "";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: className,
              description: `Trainer: ${trainerName} • ${duration}`,
              images: image ? [image] : [],
            },
            unit_amount: Math.round((cls.price || 0) * 100),
          },
          quantity: 1,
        },
      ],
   
      metadata: {
        classId,
        userId: req.user.id,
        className,
        trainer: trainerName,  
        trainerName,             
        schedule,                
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
// ⭐ Session info + auto booking save
// ═══════════════════════════════════════════════════════
router.get("/verify/:sessionId", verifyToken, async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );

    if (session.payment_status !== "paid") {
      return res.json({
        success: true,
        paid: false,
        message: "Payment not completed yet",
      });
    }

    const {
      classId,
      userId,
      className,
      trainer,
      trainerName: metaTrainerName,
      schedule,
    } = session.metadata;

    const finalTrainer = metaTrainerName || trainer || "";

    const bookingsCollection = getCollection("bookings");
    const existing = await bookingsCollection.findOne({ userId, classId });

    let booking = existing;

    if (!existing) {
      const newBooking = {
        userId,
       
        userName: req.user.name || "",
        classId,
        className: className || "",
        trainer: finalTrainer,          
        trainerName: finalTrainer,      
        schedule: schedule || "",       
        amount: (session.amount_total || 0) / 100,
        transactionId: session.payment_intent || session.id,
        stripeSessionId: session.id,
        status: "confirmed",
        createdAt: new Date(),
      };

      const result = await bookingsCollection.insertOne(newBooking);
      booking = { ...newBooking, _id: result.insertedId.toString() };
      console.log(`✅ Booking saved for ${session.customer_email}`);
    }

    res.json({
      success: true,
      paid: true,
      booking: booking
        ? { ...booking, _id: booking._id?.toString?.() || booking._id }
        : null,
      session: {
        id: session.id,
        email: session.customer_email,
        amount: (session.amount_total || 0) / 100,
        metadata: session.metadata,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/payments/confirm/:sessionId (fallback)
// ═══════════════════════════════════════════════════════
router.post("/confirm/:sessionId", verifyToken, async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(
      req.params.sessionId
    );

    if (session.payment_status !== "paid") {
      throw new ApiError(400, "Payment not completed");
    }

    const {
      classId,
      userId,
      className,
      trainer,
      trainerName: metaTrainerName,
      schedule,
    } = session.metadata;

    const finalTrainer = metaTrainerName || trainer || "";

    const bookingsCollection = getCollection("bookings");
    const existing = await bookingsCollection.findOne({ userId, classId });

    if (!existing) {
      await bookingsCollection.insertOne({
        userId,
        // userEmail: session.customer_email,
        userName: req.user.name || "",
        classId,
        className: className || "",
        trainer: finalTrainer,          
        trainerName: finalTrainer,      
        schedule: schedule || "",       
        amount: (session.amount_total || 0) / 100,
        transactionId: session.payment_intent || session.id,
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


// ═══════════════════════════════════════════════════════
// GET /api/payments/transactions — All payments (admin)
// ═══════════════════════════════════════════════════════
router.get(
  "/transactions",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const transactions = await getCollection("bookings")
        .find({ transactionId: { $exists: true, $ne: null } })
        .sort({ createdAt: -1 })
        .toArray();

      res.json({
        success: true,
        data: transactions.map((t) => ({
          _id: t._id.toString(),
          userEmail: t.userEmail,
          userName: t.userName,
          amount: t.amount || 0,
          transactionId: t.transactionId,
          classId: t.classId,
          className: t.className,
          createdAt: t.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;