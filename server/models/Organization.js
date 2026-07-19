import mongoose from "mongoose";
import { SPECIALTIES_BY_TYPE } from "../config/specialties.js";

const STAFF_ROLES = ["doctor", "nurse", "receptionist", "otherStaff"];

const organizationSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  slug:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  clinicType: {
    type: String,
    enum: ["human", "dental", "veterinary"],
    required: true,
  },
  clinicSize: {
    type: String,
    enum: ["small", "large"],
    default: "small",
  },
  staffSetup: {
    doctors:      { type: Number, default: 0 },
    nurses:       { type: Number, default: 0 },
    receptionists: { type: Number, default: 0 },
    otherStaff:   { type: Number, default: 0 },
    workstations: { type: Number, default: 1 },
  },
  billingSetup: {
    codeSet: { type: String, enum: ["cpt", "cdt", "timed-units", "mixed"], default: "cpt" },
  },
  specialty: { type: String, default: "general-practice" },
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
  defaultSlotDuration: { type: Number, default: 30 },
  defaultBufferBetween: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

organizationSchema.pre("validate", function (next) {
  if (this.clinicType) {
    const validIds = (SPECIALTIES_BY_TYPE[this.clinicType] || []).map(s => s.id);
    if (validIds.length > 0 && !validIds.includes(this.specialty)) {
      this.specialty = validIds[0];
    }
  }
  if (this.staffSetup && this.clinicSize === "small") {
    for (const key of STAFF_ROLES) {
      if (typeof this.staffSetup[key] !== "number" || this.staffSetup[key] < 0) {
        this.staffSetup[key] = 0;
      }
    }
  }
  next();
});

organizationSchema.methods.getStaffCount = function () {
  if (this.clinicSize === "large") return -1;
  const s = this.staffSetup || {};
  return (s.doctors || 0) + (s.nurses || 0) + (s.receptionists || 0) + (s.otherStaff || 0);
};

export default mongoose.model("Organization", organizationSchema);
