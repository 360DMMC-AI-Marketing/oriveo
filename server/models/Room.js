import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name:         { type: String, required: true, trim: true },
  number:       { type: String, default: "" },
  type:         { type: String, enum: ["exam", "consultation", "procedure", "operating", "imaging", "lab", "recovery", "waiting", "telehealth", "other"], default: "exam" },
  department:   { type: String, default: "" },
  floor:        { type: String, default: "" },
  wing:         { type: String, default: "" },
  status:       { type: String, enum: ["available", "occupied", "maintenance", "reserved", "cleaning"], default: "available" },
  equipment:    [{ type: String }],
  capacity:     { type: Number, default: 1, min: 1 },
  assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isActive:     { type: Boolean, default: true },
  currentPatient:  { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },
  currentProvider: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  currentAppointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
  occupiedUntil:   { type: Date, default: null },
  notes:        { type: String, default: "" },
  lastCleaned:  { type: Date, default: null },
  lastMaintenance: { type: Date, default: null },
}, { timestamps: true });

roomSchema.index({ organization: 1, status: 1 });
roomSchema.index({ organization: 1, type: 1 });
roomSchema.index({ organization: 1, isActive: 1 });

export default mongoose.model("Room", roomSchema);
