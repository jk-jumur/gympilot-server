import { ApiError } from "../utils/ApiError.js";

export function verifyRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const userRole = (req.user.role || "user").toLowerCase();
    const allowed = allowedRoles.map((r) => r.toLowerCase());

    if (!allowed.includes(userRole)) {
      return next(
        new ApiError(403, `Access denied. Required: ${allowedRoles.join(" or ")}`)
      );
    }

    next();
  };
}