import mongoose from "mongoose";
import crypto from "crypto";
import encryptPlugin from "../utils/encryptPlugin.js";

const patientSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    patientType: { type: String, enum: ["human", "pet"], default: "human" },

    name: { type: String, required: true, trim: true },
    phone: { type: String, default: "", trim: true },
    phoneHash: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    dob: { type: Date, default: null },
    gender: { type: String, enum: ["male", "female", "other", "intact-male", "neutered", "intact-female", "spayed", ""], default: "" },
    bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""], default: "" },
    language: { type: String, default: "en" },
    address: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    emergencyContactPhone: { type: String, default: "" },
    insuranceId: { type: String, default: "" },
    primaryDiagnosis: { type: String, default: "" },
    chronicConditions: { type: String, default: "" },
    allergies: { type: String, default: "" },
    currentMedications: { type: String, default: "" },
    pastSurgeries: { type: String, default: "" },
    medicalNotes: { type: String, default: "" },
    lastCheckupDate: { type: Date, default: null },
    nextScheduledDate: { type: Date, default: null },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true },
    kbNotes: { type: String, default: "" },
    doNotCall: { type: Boolean, default: false },
    doNotCallReason: { type: String, default: "" },

    species: { type: String, default: "" },
    breed: { type: String, default: "" },
    weight: { type: Number, default: null },
    color: { type: String, default: "" },
    microchipId: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    ownerPhone: { type: String, default: "" },
    ownerEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

const phiFields = ["name", "phone", "email", "address", "emergencyContact", "emergencyContactPhone", "insuranceId", "medicalNotes", "chronicConditions", "allergies", "currentMedications", "pastSurgeries", "primaryDiagnosis", "ownerName", "ownerPhone", "ownerEmail"];
encryptPlugin(patientSchema, { fields: phiFields });

patientSchema.pre("save", function (next) {
  if (this.isModified("phone")) {
    this.phoneHash = this.phone ? crypto.createHash("sha256").update(this.phone.replace(/\D/g, "")).digest("hex") : "";
  }
  next();
});

patientSchema.index({ organization: 1 });
patientSchema.index({ phoneHash: 1 });
patientSchema.index({ name: "text", phone: "text" });
patientSchema.index({ email: 1 });
patientSchema.index({ assignedDoctor: 1 });
patientSchema.index({ createdBy: 1, createdAt: -1 });
patientSchema.index({ assignedDoctor: 1, isActive: 1 });
patientSchema.index({ isActive: 1 });
patientSchema.index({ language: 1 });
patientSchema.index({ primaryDiagnosis: 1 });

export default mongoose.model("Patient", patientSchema);
