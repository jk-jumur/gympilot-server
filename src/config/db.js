import { MongoClient } from "mongodb";

let client;
let db;

export async function connectDB() {
  try {
    client = new MongoClient(process.env.MONGODB_URL);
    await client.connect();
    db = client.db("gympilot_db");
    console.log("✅ MongoDB connected");
    return db;
  } catch (err) {
    console.error("❌ MongoDB failed:", err);
    throw err;
  }
}

export function getDB() {
  if (!db) throw new Error("Database not connected");
  return db;
}

export function getCollection(name) {
  return getDB().collection(name);
}

process.on("SIGINT", async () => {
  console.log("\n🔌 Closing MongoDB...");
  if (client) await client.close();
  process.exit(0);
});