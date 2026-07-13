import mongoose from "mongoose";
await mongoose.connect("mongodb://localhost:27017/oriveo");
const db = mongoose.connection.db;
await db.collection("users").updateOne({ email: "admin@oriveo.io" }, { $set: { isActive: true } });
const u = await db.collection("users").findOne({ email: "admin@oriveo.io" });
console.log("Admin:", u.email, "isActive:", u.isActive);
await mongoose.disconnect();
