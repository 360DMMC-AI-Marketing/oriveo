import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;

const orgId = new mongoose.Types.ObjectId("6a45bc6f53bb752725afb164");

await db.collection("patients").updateMany(
  { organization: { $exists: false } },
  { $set: { organization: orgId } }
);
console.log("Fixed patients");

await db.collection("calls").updateMany(
  { organization: { $exists: false } },
  { $set: { organization: orgId } }
);
console.log("Fixed calls");

const calls = await db.collection("calls").find({}).limit(2).toArray();
for (const c of calls) {
  console.log("Call:", String(c._id).slice(-8), "org:", c.organization);
}

const patient = await db.collection("patients").findOne({});
console.log("Patient org:", patient.organization);

await mongoose.disconnect();
