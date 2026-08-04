import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Patient from "../models/Patient.js";
import BookingToken from "../models/BookingToken.js";
import { generateAndEmailFamilyLink } from "../services/familyLinkService.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/oriveo";
const baseUrl = process.env.CLIENT_URL || process.env.CORS_ORIGIN || "http://localhost:3000";

let sent = 0;
let skipped = 0;
let noEmail = 0;
const errors = [];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const patients = await Patient.find({
    familyEmail: { $regex: /\S/, $options: "i" },
  }).lean();

  console.log(`Found ${patients.length} patient(s) with a family email\n`);

  for (const patient of patients) {
    try {
      const result = await generateAndEmailFamilyLink({
        patient,
        organizationId: patient.organization,
        baseUrl,
      });
      if (result.sent) {
        sent++;
        console.log(`✓ EMAILED ${patient.name} -> ${patient.familyEmail}`);
      } else if (result.reason && result.reason.includes("already exists")) {
        skipped++;
        console.log(`· skipped ${patient.name} (link already exists)`);
      } else {
        noEmail++;
        console.log(`✗ ${patient.name}: ${result.reason || "not sent"}`);
      }
    } catch (err) {
      errors.push(`${patient.name}: ${err.message}`);
      console.log(`✗ ${patient.name}: ${err.message}`);
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Sent: ${sent}`);
  console.log(`Already had valid link (not re-sent): ${skipped}`);
  console.log(`Not sent (no email config / other): ${noEmail}`);
  if (errors.length) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
