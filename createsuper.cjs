const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || "mongodb://mongodb:27017/oriveo");
  
  const Schema = mongoose.Schema;
  const User = mongoose.model("User", new Schema({
    name: String, email: String, password: String,
    role: String, superAdmin: Boolean,
    organization: Schema.Types.ObjectId,
    isActive: Boolean, tokenVersion: Number,
    phone: String, language: String, specialty: String, avatar: String
  }, { timestamps: true, strict: false }));
  
  const existing = await User.findOne({ email });
  if (!existing) {
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      name: "Oriveo Admin",
      email,
      password: hash,
      role: "superAdmin",
      superAdmin: true,
      isActive: true,
      tokenVersion: 0
    });
    console.log("Super admin created: " + email);
  } else {
    console.log("Super admin already exists");
  }
  
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
