
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export async function verifyToken(req, res, next) {
  try {
    let rawToken =
      req.cookies?.["better-auth.session_token"] ||
      req.cookies?.["__Secure-better-auth.session_token"];

    if (!rawToken) {
      throw new ApiError(401, "Authentication required. Please login.");
    }

   
    rawToken = decodeURIComponent(rawToken);

   
    
    const token = rawToken.split(".")[0];

    const db = getDB();

   
    let session = await db.collection("session").findOne({ token });

    if (!session) {
      // fallback: full token try
      session = await db.collection("session").findOne({ token: rawToken });
    }

    if (!session) {
     
      throw new ApiError(401, "Invalid session");
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new ApiError(401, "Session expired. Please login again.");
    }

    const user = await db.collection("user").findOne({
      _id: new ObjectId(session.userId),
    });

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (user.status === "blocked" && req.method !== "GET") {
      throw new ApiError(403, "Action restricted by Admin");
    }

    req.user = {
      _id: user._id,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role || "user",
      status: user.status || "active",
    };

    next();
  } catch (err) {
    next(err);
  }
}

