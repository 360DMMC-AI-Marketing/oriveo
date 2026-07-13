const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://mongodb:27017/oriveo");
  
  const Schema = mongoose.Schema;
  const User = mongoose.model("User", new Schema({
    name: String, email: String, password: String,
    role: String, superAdmin: Boolean,
    organization: Schema.Types.ObjectId,
    isActive: Boolean, tokenVersion: Number,
    phone: String, language: String, specialty: String, avatar: String
  }, { timestamps: true, strict: false }));
  
  const existing = await User.findOne({ email: "admin@oriveo.com" });
  if (!existing) {
    const hash = await bcrypt.hash("k6AkItDAlewK0^QMc%sO", 12);
    await User.create({
      name: "Oriveo Admin",
      email: "admin@oriveo.com",
      password: hash,
      role: "superAdmin",
      superAdmin: true,
      isActive: true,
      tokenVersion: 0
    });
    console.log("Super admin created: admin@oriveo.com / k6AkItDAlewK0^QMc%sO");
  } else {
    console.log("Super admin already exists");
  }
  
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
