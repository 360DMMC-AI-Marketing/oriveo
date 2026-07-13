import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;

const users = await db.collection("users").find({}).toArray();
for (const u of users) {
  console.log(u.email, "| role:", u.role, "| superAdmin:", u.superAdmin, "| isActive:", u.isActive, "| org:", u.organization);
}

await db.collection("users").updateOne({ email: "admin@oriveo.io" }, { $set: { isActive: true } });
await db.collection("users").updateOne({ email: "anassamiri87@gmail.com" }, { $set: { isActive: true } });
console.log("Reactivated");

await mongoose.disconnect();
