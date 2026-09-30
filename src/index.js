import "dotenv/config";

import dns from "node:dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

import classesRoutes from "./routes/classes.routes.js";
import forumRoutes from "./routes/forum.routes.js";
import usersRoutes from "./routes/users.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import favoritesRoutes from "./routes/favorites.routes.js";
import applicationsRoutes from "./routes/applications.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:3000", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 GymPilot API is running",
    version: "1.0.0",
    endpoints: {
      classes: "/api/classes",
      forum: "/api/forum",
      users: "/api/users",
      bookings: "/api/bookings",
      favorites: "/api/favorites",
      applications: "/api/trainer-applications",
      payments: "/api/payments",
    },
  });
});

app.use("/api/classes", classesRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/trainer-applications", applicationsRoutes);
app.use("/api/payments", paymentsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Env: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔐 Auth: Better Auth session (shared with client)\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
}

start();