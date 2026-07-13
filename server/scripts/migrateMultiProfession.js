import mongoose from "mongoose";
import "dotenv/config";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // 1. Set all existing orgs to type "human"
  const orgResult = await mongoose.connection.collection("organizations").updateMany(
    { type: { $exists: false } },
    { $set: { type: "human" } }
  );
  console.log(`Organizations updated: ${orgResult.modifiedCount}`);

  // 2. Set all existing patients to patientType "human"
  const patientResult = await mongoose.connection.collection("patients").updateMany(
    { patientType: { $exists: false } },
    { $set: { patientType: "human" } }
  );
  console.log(`Patients updated: ${patientResult.modifiedCount}`);

  // 3. Set all existing users to profession "" and specialty to array
  const userResult = await mongoose.connection.collection("users").updateMany(
    { profession: { $exists: false } },
    { $set: { profession: "" } }
  );
  console.log(`Users profession field added: ${userResult.modifiedCount}`);

  const userSpecResult = await mongoose.connection.collection("users").updateMany(
    { $or: [{ specialty: { $type: "string" } }, { specialty: { $exists: false } }] },
    [{ $set: { specialty: { $cond: { if: { $eq: ["$specialty", ""] }, then: [], else: { $ifNull: [["$specialty"], []] } } } } }]
  );
  console.log(`Users specialty array conversion attempted`);

  // 4. Set calls patientType and species defaults
  const callResult = await mongoose.connection.collection("calls").updateMany(
    { patientType: { $exists: false } },
    { $set: { patientType: "", species: "" } }
  );
  console.log(`Calls updated: ${callResult.modifiedCount}`);

  // 5. Create indexes
  await mongoose.connection.collection("patients").createIndex({ patientType: 1 });
  await mongoose.connection.collection("users").createIndex({ profession: 1 });
  await mongoose.connection.collection("users").createIndex({ organization: 1 });
  await mongoose.connection.collection("organizations").createIndex({ type: 1 });
  await mongoose.connection.collection("questionnaires").createIndex({ targetProfession: 1 });

  console.log("Indexes created");
  console.log("Migration complete!");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
