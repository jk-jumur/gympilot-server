import express from "express";
import { getCollection } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { verifyRole } from "../middleware/verifyRole.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════
// GET /api/stats — Overview cards (Admin only)
// ═══════════════════════════════════════════════════════
router.get("/", verifyToken, verifyRole("admin"), async (req, res, next) => {
  try {
    const usersCount = await getCollection("user").countDocuments();
    const classesCount = await getCollection("classes").countDocuments();
    const bookingsCount = await getCollection("bookings").countDocuments();

    res.json({
      success: true,
      data: {
        users: usersCount,
        classes: classesCount,
        bookings: bookingsCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════
// GET /api/stats/charts — Chart data (Admin only)
// ═══════════════════════════════════════════════════════
router.get(
  "/charts",
  verifyToken,
  verifyRole("admin"),
  async (req, res, next) => {
    try {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      // Build last 6 months keys
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        last6Months.push({ key, date: new Date(d) });
      }

      const sixMonthsAgo = last6Months[0].date;

      // ─── BAR: Bookings per month ───
      const bookings = await getCollection("bookings")
        .find({ createdAt: { $gte: sixMonthsAgo } })
        .toArray();

      const barMap = {};
      last6Months.forEach((m) => (barMap[m.key] = 0));
      bookings.forEach((b) => {
        const d = new Date(b.createdAt);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        if (barMap[key] !== undefined) barMap[key]++;
      });
      const barData = Object.entries(barMap).map(([month, bookings]) => ({
        month,
        bookings,
      }));

      // ─── LINE: User growth ───
      const users = await getCollection("user")
        .find({ createdAt: { $gte: sixMonthsAgo } })
        .toArray();

      const lineMap = {};
      last6Months.forEach((m) => (lineMap[m.key] = 0));
      users.forEach((u) => {
        const d = new Date(u.createdAt);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        if (lineMap[key] !== undefined) lineMap[key]++;
      });
      const lineData = Object.entries(lineMap).map(([month, users]) => ({
        month,
        users,
      }));

      // ─── PIE: Category distribution ───
      const allClasses = await getCollection("classes").find({}).toArray();
      const catMap = {};
      allClasses.forEach((c) => {
        const cat = c.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const pieData = Object.entries(catMap).map(([name, value]) => ({
        name,
        value,
      }));

      res.json({
        success: true,
        data: {
          bar: barData,
          line: lineData,
          pie: pieData,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;