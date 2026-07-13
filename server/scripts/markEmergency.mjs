import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;
const call = await db.collection("calls").findOne({ aiSeverityScore: { $gte: 7 }, emergencyActionTaken: "none" });
if (call) {
  await db.collection("calls").updateOne({ _id: call._id }, { $set: { emergencyDetected: true, emergencyType: "medical" } });
  console.log("Marked emergency on call:", call._id);
} else {
  console.log("No high severity call found");
}
await mongoose.disconnect();
