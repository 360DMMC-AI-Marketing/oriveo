import mongoose from "mongoose";

const homeVisitSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    caregiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    carePlan: { type: mongoose.Schema.Types.ObjectId, ref: "CarePlan", default: null },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ["scheduled", "in-progress", "completed", "cancelled"], default: "scheduled" },
    checkInAt: { type: Date, default: null },
    checkOutAt: { type: Date, default: null },
    geoCheckIn: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: "" },
    },
    vitals: {
      bloodPressure: { type: String, default: "" },
      heartRate: { type: Number, default: null },
      temperature: { type: Number, default: null },
      spo2: { type: Number, default: null },
      weight: { type: Number, default: null },
      painScore: { type: Number, default: null },
      notes: { type: String, default: "" },
    },
    soap: {
      subjective: { type: String, default: "" },
      objective: { type: String, default: "" },
      assessment: { type: String, default: "" },
      plan: { type: String, default: "" },
    },
    tasksCompleted: { type: [String], default: [] },
    billableCodes: { type: [String], default: [] },
    notes: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

homeVisitSchema.index({ organization: 1 });
homeVisitSchema.index({ patient: 1 });
homeVisitSchema.index({ caregiver: 1 });
homeVisitSchema.index({ status: 1 });
homeVisitSchema.index({ scheduledAt: 1 });
homeVisitSchema.index({ organization: 1, scheduledAt: -1 });

export default mongoose.model("HomeVisit", homeVisitSchema);
