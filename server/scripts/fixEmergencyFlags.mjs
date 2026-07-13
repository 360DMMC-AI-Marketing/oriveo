import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;

// Set emergency fields on all calls with tier 0 red flags or severity >= 7
const result = await db.collection("calls").updateMany(
  {
    $or: [
      { "redFlags.tier": 0 },
      { aiSeverityScore: { $gte: 7 } },
    ],
  },
  {
    $set: { emergencyDetected: true, emergencyType: "medical" },
    $setOnInsert: { emergencyActionTaken: "none" },
  }
);

// Also ensure all calls have emergencyActionTaken default
await db.collection("calls").updateMany(
  { emergencyActionTaken: { $exists: false } },
  { $set: { emergencyActionTaken: "none" } }
);

const count = await db.collection("calls").countDocuments({ emergencyDetected: true });
console.log("Emergency calls flagged:", count);

const calls = await db.collection("calls").find({ emergencyDetected: true }).toArray();
for (const c of calls) {
  console.log("  -", String(c._id).slice(-8), "sev:", c.aiSeverityScore, "action:", c.emergencyActionTaken);
}

await mongoose.disconnect();
