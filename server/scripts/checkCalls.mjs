import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;
const calls = await db.collection("calls").find({}).toArray();
console.log("Total calls:", calls.length);
for (const c of calls.slice(0, 5)) {
  const flags = (c.redFlags || []).map((f) => `${f.keyword}(t${f.tier})`).join(", ");
  console.log(
    "ID:", String(c._id).slice(-8),
    "| sev:", c.aiSeverityScore,
    "| emergency:", c.emergencyDetected,
    "| action:", c.emergencyActionTaken,
    "| flags:", flags || "none",
    "| status:", c.status
  );
}
await mongoose.disconnect();
