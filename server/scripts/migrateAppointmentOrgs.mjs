import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/statvox";

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected: ${MONGO_URI}`);

  const db = mongoose.connection.db;
  const appointments = db.collection("appointments");
  const patients = db.collection("patients");

  const cursor = appointments.find({ $or: [{ organization: null }, { organization: { $exists: false } }] });
  let updated = 0;
  let skipped = 0;

  for await (const apt of cursor) {
    if (!apt.patient) {
      skipped++;
      continue;
    }
    const patientId = apt.patient._id || apt.patient;
    const patient = await patients.findOne({ _id: patientId });
    if (patient && patient.organization) {
      await appointments.updateOne(
        { _id: apt._id },
        { $set: { organization: patient.organization } }
      );
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Migration complete: ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
