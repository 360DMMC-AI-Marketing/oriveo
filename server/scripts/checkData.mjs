import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;

console.log("Total calls:", await db.collection("calls").countDocuments());
console.log("Direction existing:", await db.collection("calls").countDocuments({ direction: { $exists: true } }));
console.log("Direction missing:", await db.collection("calls").countDocuments({ direction: { $exists: false } }));
console.log("Direction inbound:", await db.collection("calls").countDocuments({ direction: "inbound" }));
console.log("Direction outbound:", await db.collection("calls").countDocuments({ direction: "outbound" }));

// Show samples
const inbound = await db.collection("calls").find({ direction: "inbound" }).limit(3).toArray();
for (const c of inbound) {
  console.log("INBOUND:", String(c._id).slice(-8), "status:", c.status, "emergency:", c.emergencyDetected, "responded:", c.patientResponded);
}

const outbound = await db.collection("calls").find({ direction: "outbound" }).limit(3).toArray();
for (const c of outbound) {
  console.log("OUTBOUND:", String(c._id).slice(-8), "status:", c.status, "emergency:", c.emergencyDetected, "responded:", c.patientResponded);
}

const noDir = await db.collection("calls").find({ direction: { $exists: false } }).toArray();
console.log("Calls missing direction:", noDir.length);
if (noDir.length > 0) {
  // Update them to outbound
  await db.collection("calls").updateMany({ direction: { $exists: false } }, { $set: { direction: "outbound" } });
  console.log("Fixed missing direction fields -> set to outbound");
}

await mongoose.disconnect();
