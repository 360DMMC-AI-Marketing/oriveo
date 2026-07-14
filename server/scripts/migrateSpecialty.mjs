import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import MedicalRecord from "../models/MedicalRecord.js";
import PatientDocument from "../models/PatientDocument.js";
import VitalSign from "../models/VitalSign.js";
import Call from "../models/Call.js";
import Appointment from "../models/Appointment.js";
import Report from "../models/Report.js";
import ClinicalNote from "../models/ClinicalNote.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";

async function migrate() {
  const uri = process.argv[2] || MONGO_URI;
  await mongoose.connect(uri);
  console.log(`Connected: ${uri}`);

  const r1 = await Patient.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`Patients updated: ${r1.modifiedCount}`);

  const r2 = await MedicalRecord.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`MedicalRecords updated: ${r2.modifiedCount}`);

  const r3 = await PatientDocument.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`Documents updated: ${r3.modifiedCount}`);

  const r4 = await VitalSign.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`VitalSigns updated: ${r4.modifiedCount}`);

  const r5 = await Call.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`Calls updated: ${r5.modifiedCount}`);

  const r6 = await Appointment.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`Appointments updated: ${r6.modifiedCount}`);

  const r7 = await Report.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`Reports updated: ${r7.modifiedCount}`);

  const r8 = await ClinicalNote.updateMany(
    { $or: [{ specialty: { $exists: false } }, { specialty: null }] },
    { $set: { specialty: "general" } }
  );
  console.log(`ClinicalNotes updated: ${r8.modifiedCount}`);

  await mongoose.disconnect();
  console.log("Migration complete");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
