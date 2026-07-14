import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  slug:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  specialty: { type: String, enum: ["general","cardiology","endocrinology","dentistry","orthopedics","veterinary","pediatrics","human","veterinary","dental"], default: "general" },
  isActive: { type: Boolean, default: true },
  logo:     { type: String, default: "" },
  brandName:{ type: String, default: "" },
  phone:    { type: String, default: "" },
  address:  { type: String, default: "" },
  stripeCustomerId: { type: String, default: "" },
  settings: {
    timezone:       { type: String, default: "America/New_York" },
    defaultLanguage:{ type: String, default: "en" },
    primaryColor:   { type: String, default: "#0a7c6f" },
    websiteUrl:     { type: String, default: "" },
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model("Organization", organizationSchema);
