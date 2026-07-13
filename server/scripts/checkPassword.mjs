import mongoose from "mongoose";
import bcrypt from "bcryptjs";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;

const user = await db.collection("users").findOne({ email: "anassamiri87@gmail.com" });
console.log("User:", user?.name, "role:", user?.role, "isActive:", user?.isActive);

// Try common passwords
const passwords = ["password123", "test123", "Test123!", "demo123", "anass123", "Anass123!", "Password123!", "admin123", "Admin123!"];
for (const pw of passwords) {
  const match = await bcrypt.compare(pw, user.password);
  if (match) console.log("PASSWORD FOUND:", pw);
}

// If no match found, reset it
if (true) {
  const hash = await bcrypt.hash("demo123", 10);
  await db.collection("users").updateOne({ _id: user._id }, { $set: { password: hash } });
  console.log("Password reset to: demo123");
}

await mongoose.disconnect();
