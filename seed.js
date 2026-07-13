const mongoose = require("mongoose");
async function main() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://mongodb:27017/oriveo");
  const Organization = mongoose.model("Organization", new mongoose.Schema({ name: String, slug: String, isActive: Boolean }, { timestamps: true, strict: false }));
  const User = mongoose.model("User", new mongoose.Schema({ name: String, email: String, password: String, role: String, organization: mongoose.Schema.Types.ObjectId, isActive: Boolean, tokenVersion: Number }, { timestamps: true, strict: false }));
  
  let org = await Organization.findOne({ slug: "demo-clinic" });
  if (!org) {
    org = await Organization.create({ name: "Demo Clinic", slug: "demo-clinic", isActive: true });
    console.log("Org created:", org._id);
  } else {
    console.log("Org exists:", org._id);
  }
  
  const existing = await User.findOne({ email: "anassamiri87@gmail.com" });
  if (!existing) {
    await User.create({
      name: "Dr. Anas Samiri",
      email: "anassamiri87@gmail.com",
      password: "$2a$12$LJ3m4ys3Lk0TSwHnbfOMi.H/9k1S3oHWG3r.t/.5UUKwS4F7ICMKe",
      role: "admin",
      organization: org._id,
      isActive: true,
      tokenVersion: 0
    });
    console.log("User created: anassamiri87@gmail.com / demo123");
  } else {
    console.log("User already exists");
  }
  
  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
