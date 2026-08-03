import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";
const ORG = "6a554f5f68ed3185349a78bf";
const ADMIN = "6a554f5f68ed3185349a78c2";
const COLLECTIONS = ["patients", "labresults", "reports", "groups", "vitalsigns", "medicalrecords", "clinicalnotes", "careplans", "homevisits", "prescriptions"];

async function run() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const admin = new mongoose.Types.ObjectId(ADMIN);
  const org = new mongoose.Types.ObjectId(ORG);
  for (const c of COLLECTIONS) {
    const col = db.collection(c);
    const res = await col.updateMany(
      { organization: org, $or: [{ createdBy: { $exists: false } }, { createdBy: null }] },
      { $set: { createdBy: admin } }
    );
    if (res.modifiedCount > 0) console.log(`${c}: backfilled ${res.modifiedCount}`);
  }
  await mongoose.disconnect();
  console.log("DONE");
}

run().catch((e) => { console.error(e.message); process.exit(1); });
