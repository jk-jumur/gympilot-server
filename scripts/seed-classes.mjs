import dns from "node:dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const CLASSES = [
  // ═══════════ YOGA (4 distinct) ═══════════
  {
    name: "Sunrise Vinyasa Flow",
    trainer: "Sophia Martinez",
    trainerId: "seed_trainer_1",
    category: "Yoga",
    price: 28,
    duration: "60 min",
    difficulty: "Beginner",
    bookingsCount: 312,
    enrolledStudents: 312,
    schedule: "Mon, Wed, Fri — 6:00 AM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    description: "Start your morning with flowing yoga sequences designed to awaken your body and mind.",
  },
  {
    name: "Morning Mobility Flow",
    trainer: "Yuki Tanaka",
    trainerId: "seed_trainer_2",
    category: "Yoga",
    price: 25,
    duration: "45 min",
    difficulty: "Beginner",
    bookingsCount: 178,
    enrolledStudents: 178,
    schedule: "Tue, Thu — 7:00 AM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    description: "Gentle mobility routine to improve flexibility and prevent injuries.",
  },
  {
    name: "Deep Stretch Recovery",
    trainer: "Sophia Martinez",
    trainerId: "seed_trainer_1",
    category: "Yoga",
    price: 26,
    duration: "60 min",
    difficulty: "Beginner",
    bookingsCount: 167,
    enrolledStudents: 167,
    schedule: "Sat, Sun — 8:00 AM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    description: "Deep stretching and recovery session for tired muscles.",
  },
  {
    name: "Mindful Breathing",
    trainer: "Yuki Tanaka",
    trainerId: "seed_trainer_2",
    category: "Yoga",
    price: 24,
    duration: "30 min",
    difficulty: "Beginner",
    bookingsCount: 92,
    enrolledStudents: 92,
    schedule: "Daily — 9:00 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800&q=80",
    description: "Pranayama and meditation for mental clarity.",
  },

  // ═══════════ CARDIO (4 distinct) ═══════════
  {
    name: "Combat Cardio Blast",
    trainer: "Marcus Chen",
    trainerId: "seed_trainer_3",
    category: "Cardio",
    price: 32,
    duration: "45 min",
    difficulty: "Intermediate",
    bookingsCount: 267,
    enrolledStudents: 267,
    schedule: "Mon, Wed — 6:30 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80",
    description: "High-intensity cardio workout inspired by martial arts movements.",
  },
  {
    name: "Power HIIT Circuit",
    trainer: "Amara Okafor",
    trainerId: "seed_trainer_4",
    category: "Cardio",
    price: 35,
    duration: "40 min",
    difficulty: "Advanced",
    bookingsCount: 234,
    enrolledStudents: 234,
    schedule: "Tue, Thu — 7:00 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    description: "Push your limits with our most intense HIIT training.",
  },
  {
    name: "Core Crusher",
    trainer: "Marcus Chen",
    trainerId: "seed_trainer_3",
    category: "Cardio",
    price: 30,
    duration: "35 min",
    difficulty: "Intermediate",
    bookingsCount: 145,
    enrolledStudents: 145,
    schedule: "Sat — 10:00 AM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    description: "Focused core strengthening with variety of exercises.",
  },
  {
    name: "Endurance Cardio",
    trainer: "Marcus Chen",
    trainerId: "seed_trainer_3",
    category: "Cardio",
    price: 33,
    duration: "50 min",
    difficulty: "Advanced",
    bookingsCount: 112,
    enrolledStudents: 112,
    schedule: "Sun — 7:00 AM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
    description: "Long-duration cardio for endurance athletes.",
  },

  // ═══════════ WEIGHTS (3 distinct) ═══════════
  {
    name: "Barbell Basics",
    trainer: "Ethan Brooks",
    trainerId: "seed_trainer_5",
    category: "Weights",
    price: 38,
    duration: "75 min",
    difficulty: "Beginner",
    bookingsCount: 189,
    enrolledStudents: 189,
    schedule: "Mon, Wed, Fri — 5:00 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80",
    description: "Master foundational barbell lifts with expert coaching.",
  },
  {
    name: "Heavy Lift Strength",
    trainer: "Ethan Brooks",
    trainerId: "seed_trainer_5",
    category: "Weights",
    price: 42,
    duration: "90 min",
    difficulty: "Advanced",
    bookingsCount: 156,
    enrolledStudents: 156,
    schedule: "Tue, Thu — 6:00 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80",
    description: "Advanced strength training for experienced lifters.",
  },
  {
    name: "Dumbbell Sculpt",
    trainer: "Ethan Brooks",
    trainerId: "seed_trainer_5",
    category: "Weights",
    price: 34,
    duration: "50 min",
    difficulty: "Beginner",
    bookingsCount: 189,
    enrolledStudents: 189,
    schedule: "Sat, Sun — 9:00 AM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?w=800&q=80",
    description: "Sculpt and tone with dumbbell-only workout.",
  },

  // ═══════════ DANCE (3 distinct) ═══════════
  {
    name: "Bollywood Dance Fit",
    trainer: "Priya Sharma",
    trainerId: "seed_trainer_6",
    category: "Dance",
    price: 22,
    duration: "50 min",
    difficulty: "Beginner",
    bookingsCount: 145,
    enrolledStudents: 145,
    schedule: "Mon, Fri — 7:00 PM",
    status: "approved",
     image:"https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80",

    description: "Fun, energetic dance workout combining Bollywood moves with fitness.",
  },
  {
    name: "Zumba Party Night",
    trainer: "Priya Sharma",
    trainerId: "seed_trainer_6",
    category: "Dance",
    price: 20,
    duration: "55 min",
    difficulty: "Beginner",
    bookingsCount: 198,
    enrolledStudents: 198,
    schedule: "Wed, Sat — 8:00 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=800&q=80",
    description: "Party-style Zumba class with energizing Latin music.",
  },
  {
    name: "Salsa Fusion",
    trainer: "Priya Sharma",
    trainerId: "seed_trainer_6",
    category: "Dance",
    price: 26,
    duration: "55 min",
    difficulty: "Intermediate",
    bookingsCount: 134,
    enrolledStudents: 134,
    schedule: "Tue, Thu — 8:00 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80",
    description: "Fusion of salsa and fitness for a spicy workout.",
  },

  // ═══════════ BOXING (2 distinct) ═══════════
  {
    name: "Boxing Fundamentals",
    trainer: "Amara Okafor",
    trainerId: "seed_trainer_4",
    category: "Boxing",
    price: 40,
    duration: "60 min",
    difficulty: "Intermediate",
    bookingsCount: 124,
    enrolledStudents: 124,
    schedule: "Mon, Thu — 6:00 PM",
    status: "approved",
    image: "https://images.unsplash.com/photo-1636581563867-1ecab574858f?w=800&q=80",
    description: "Learn boxing basics — footwork, punches, and defense.",
  },
  {
    name: "Power Kickboxing",
    trainer: "Amara Okafor",
    trainerId: "seed_trainer_4",
    category: "Boxing",
    price: 45,
    duration: "60 min",
    difficulty: "Advanced",
    bookingsCount: 88,
    enrolledStudents: 88,
    schedule: "Tue, Sat — 7:00 AM",
    status: "approved",
  image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
    description: "Advanced kickboxing combining cardio and strength.",
  },
];

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URL);
  try {
    await client.connect();
    const db = client.db("gympilot_db");
    const collection = db.collection("classes");

    const deleted = await collection.deleteMany({});
    console.log(`🗑️ Deleted ${deleted.deletedCount} existing classes`);

    const withTimestamps = CLASSES.map((c) => ({
      ...c,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await collection.insertMany(withTimestamps);
    console.log(`✅ Inserted ${result.insertedCount} classes`);

    await collection.createIndex({ name: "text" });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ status: 1, bookingsCount: -1 });
    await collection.createIndex({ trainerId: 1 });
    console.log("✅ Indexes created");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await client.close();
    console.log("🔌 MongoDB closed");
  }
}

seed();