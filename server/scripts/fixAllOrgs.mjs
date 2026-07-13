import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;

const org = await db.collection("organizations").findOne({});
const orgId = org?._id;
console.log("Org ID:", orgId);

const user = await db.collection("users").findOne({ email: "anassamiri87@gmail.com" });
console.log("User org:", user?.organization);

// Fix calls
const callsMissing = await db.collection("calls").countDocuments({ $or: [{ organization: { $exists: false } }, { organization: null }] });
if (callsMissing > 0) {
  await db.collection("calls").updateMany({ $or: [{ organization: { $exists: false } }, { organization: null }] }, { $set: { organization: orgId } });
  console.log("Fixed calls:", callsMissing);
}

// Fix patients
const patientsMissing = await db.collection("patients").countDocuments({ $or: [{ organization: { $exists: false } }, { organization: null }] });
if (patientsMissing > 0) {
  await db.collection("patients").updateMany({ $or: [{ organization: { $exists: false } }, { organization: null }] }, { $set: { organization: orgId } });
  console.log("Fixed patients:", patientsMissing);
}

// Reports don't have organization field, but they reference calls which do
// Appointments don't have organization field either
// Add organization to appointments too for tenant filtering
const apptMissing = await db.collection("appointments").countDocuments({ $or: [{ organization: { $exists: false } }, { organization: null }] });
if (apptMissing > 0) {
  await db.collection("appointments").updateMany({ $or: [{ organization: { $exists: false } }, { organization: null }] }, { $set: { organization: orgId } });
  console.log("Fixed appointments:", apptMissing);
}

// Final counts
console.log("\nFinal counts:");
console.log("Calls:", await db.collection("calls").countDocuments());
console.log("Calls with user org:", await db.collection("calls").countDocuments({ organization: user?.organization }));
console.log("Patients:", await db.collection("patients").countDocuments());
console.log("Patients with user org:", await db.collection("patients").countDocuments({ organization: user?.organization }));
console.log("Appointments:", await db.collection("appointments").countDocuments());
console.log("Reports:", await db.collection("reports").countDocuments());

await mongoose.disconnect();
