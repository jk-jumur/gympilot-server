import dns from "node:dns";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const POSTS = [
  {
    title: "How I Lost 12kg in 6 Months Without a Gym",
    excerpt:
      "You don't need a fancy gym membership to transform your body. Here's the exact routine that worked for me...",
    description:
      "You don't need a fancy gym membership to transform your body. Here's the exact routine that worked for me over the last 6 months.\n\nThe key was consistency, not intensity. I started with 20-minute home workouts 5 days a week. Simple moves: pushups, squats, planks, and light dumbbells.\n\nTrack everything you eat for the first month. Not to obsess, but to understand your patterns. Then adjust.",
    author: "Olivia Bennett",
    authorId: "seed_author_1",
    authorImage: "https://i.pravatar.cc/100?img=47",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    title: "The Truth About Protein Supplements",
    excerpt:
      "Do you really need protein powder? Let's cut through the marketing and look at the actual science...",
    description:
      "Do you really need protein powder? Let's cut through the marketing and look at the actual science.\n\nShort answer: no, you don't NEED it — but it can help. If you're struggling to hit your daily protein target from whole foods, a shake is a convenient solution.\n\nHow much protein do you actually need? 1.6-2.2g per kg of bodyweight for most active people.",
    author: "Lucas Müller",
    authorId: "seed_author_2",
    authorImage: "https://i.pravatar.cc/100?img=13",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    title: "5-Minute Morning Mobility Routine",
    excerpt:
      "Start your day with this quick routine. Your joints will thank you, especially if you sit at a desk all day...",
    description:
      "Start your day with this quick 5-minute morning mobility routine. Your joints will thank you, especially if you sit at a desk all day.\n\nThe routine:\n1. Cat-cow — 30 seconds\n2. World's greatest stretch — 30 seconds each side\n3. Hip circles — 30 seconds each side\n4. Thoracic rotations — 30 seconds each side\n5. Neck rolls — 30 seconds\n6. Standing forward fold — 30 seconds\n7. Downward dog to cobra — 1 minute",
    author: "Yuki Tanaka",
    authorId: "seed_author_3",
    authorImage: "https://i.pravatar.cc/100?img=36",
    image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Cardio vs Weights: Which Comes First?",
    excerpt:
      "The age-old debate finally settled. Here's what the research says about workout order and results...",
    description:
      "The age-old debate finally settled. Here's what the research says about workout order and results.\n\nIf your goal is STRENGTH: do weights first. Cardio after. Doing cardio first depletes your energy for the heavy lifts.\n\nIf your goal is ENDURANCE: cardio first, then weights.\n\nIf your goal is FAT LOSS: it doesn't matter much. Total calories burned and consistency matter more than order.",
    author: "Amara Okafor",
    authorId: "seed_author_4",
    authorImage: "https://i.pravatar.cc/100?img=59",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Why Sleep is Your Secret Weapon for Gains",
    excerpt:
      "You can train hard and eat right, but without quality sleep, you're leaving results on the table...",
    description:
      "You can train hard and eat right, but without quality sleep, you're leaving results on the table.\n\nDuring deep sleep, your body releases growth hormone — the master hormone for muscle repair and fat loss. Skip sleep, skip progress.\n\nAim for 7-9 hours. Keep your room cool, dark, and quiet. No screens 30 minutes before bed.",
    author: "Marcus Chen",
    authorId: "seed_author_5",
    authorImage: "https://i.pravatar.cc/100?img=15",
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Beginner's Guide to Strength Training",
    excerpt:
      "New to lifting? Here's everything you need to know to start safely and effectively...",
    description:
      "New to lifting? Here's everything you need to know to start safely and effectively.\n\nStart with compound movements: squat, deadlift, bench press, row, overhead press. These work multiple muscles at once.\n\nBegin with light weights. Focus on form. Add 2.5kg every week as long as your form stays perfect.",
    author: "Ethan Brooks",
    authorId: "seed_author_6",
    authorImage: "https://i.pravatar.cc/100?img=33",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    title: "The Power of Habit Stacking for Fitness",
    excerpt:
      "Want to build lasting fitness habits? Here's the psychological trick that actually works...",
    description:
      "Want to build lasting fitness habits? Here's the psychological trick that actually works.\n\nHabit stacking: attach a new habit to an existing one. After I pour my morning coffee, I do 10 pushups. After I brush my teeth, I stretch for 2 minutes.\n\nSmall wins compound into massive results.",
    author: "Priya Sharma",
    authorId: "seed_author_7",
    authorImage: "https://i.pravatar.cc/100?img=44",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
  },
  {
    title: "Hydration: The Overlooked Performance Booster",
    excerpt:
      "Even 2% dehydration can tank your performance. Here's how to stay properly hydrated...",
    description:
      "Even 2% dehydration can tank your performance. Here's how to stay properly hydrated.\n\nRule of thumb: drink 30-35ml per kg of bodyweight daily. Add 500ml for every hour of intense exercise.\n\nElectrolytes matter too — especially sodium, potassium, and magnesium if you sweat heavily.",
    author: "Sophia Martinez",
    authorId: "seed_author_8",
    authorImage: "https://i.pravatar.cc/100?img=47",
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80",
    likes: [],
    dislikes: [],
    comments: [],
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
  },
];

async function seed() {
  const client = new MongoClient(process.env.MONGODB_URL);
  try {
    await client.connect();
    const db = client.db("gympilot_db");
    const collection = db.collection("forumPosts");

    const deleted = await collection.deleteMany({});
    console.log(`🗑️ Deleted ${deleted.deletedCount} existing posts`);

    const result = await collection.insertMany(POSTS);
    console.log(`✅ Inserted ${result.insertedCount} forum posts`);

    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({ authorId: 1 });
    console.log("✅ Indexes created");
  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await client.close();
    console.log("🔌 MongoDB closed");
  }
}

seed();