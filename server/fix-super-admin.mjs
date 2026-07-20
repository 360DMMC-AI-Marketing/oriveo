import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";
try {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const existing = await db.collection("users").findOne({ email: "admin@oriveo.io" });
  if (existing) {
    console.log("Found:", existing._id, "superAdmin:", existing.superAdmin);
    const hashed = await bcrypt.hash("OriveoAdmin2026!", 10);
    await db.collection("users").updateOne(
      { _id: existing._id },
      { $set: { superAdmin: true, organization: null, password: hashed, isActive: true } }
    );
    console.log("Updated: superAdmin=true, org=null");
  } else {
    console.log("Creating new super admin...");
    const hashed = await bcrypt.hash("OriveoAdmin2026!", 10);
    await db.collection("users").insertOne({
      name: "Super Admin",
      email: "admin@oriveo.io",
      password: hashed,
      role: "admin",
      superAdmin: true,
      organization: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Created");
  }
  const user = await db.collection("users").findOne({ email: "admin@oriveo.io" });
  console.log("Final:", { superAdmin: user.superAdmin, org: user.organization, isActive: user.isActive });
  await mongoose.disconnect();
} catch (e) {
  console.error("Error:", e.message);
  process.exit(1);
}
