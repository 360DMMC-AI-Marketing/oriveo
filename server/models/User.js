import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["admin", "doctor", "nurse", "receptionist", "staff", "user"],
      default: "doctor",
    },
    profession: { type: String, default: "" },
    phone: { type: String, default: "" },
    specialty: { type: [String], default: [] },
    language: { type: String, default: "en" },
    avatar: { type: String, default: "" },
    digitalSignature: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    department: { type: String, default: "" },
    tokenVersion: { type: Number, default: 0 },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    superAdmin: { type: Boolean, default: false },
    googleCalendarConnected: { type: Boolean, default: false },
    googleRefreshToken: { type: String, default: "" },
    googleCalendarEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ specialty: 1 });
userSchema.index({ profession: 1 });
userSchema.index({ organization: 1 });
userSchema.index({ name: "text" });

export default mongoose.model("User", userSchema);
