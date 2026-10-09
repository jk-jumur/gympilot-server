export default function errorHandler(err, req, res, next) {
  // ⭐ Logging
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  // ⭐ Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // ⭐ MongoDB: Invalid ObjectId
  if (err.name === "BSONError" || err.message?.includes("ObjectId")) {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // ⭐ MongoDB: Duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `Duplicate value for ${field}`;
  }

  // ⭐ MongoDB: Validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ");
  }

  // ⭐ JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired. Please login again.";
  }

  // ⭐ Response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      path: req.originalUrl,
    }),
  });
}