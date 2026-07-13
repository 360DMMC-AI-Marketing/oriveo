import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, unique: true },
  plan:         { type: String, enum: ["starter", "pro", "enterprise"], required: true },
  status:       { type: String, enum: ["trialing", "active", "suspended", "cancelled", "expired"], default: "active" },
  startDate:    { type: Date, default: Date.now },
  endDate:      { type: Date },
  features:     [{ type: String }],
  stripeCustomerId:      { type: String },
  stripeSubscriptionId:  { type: String },
  limits: {
    maxUsers:         { type: Number, default: 5 },
    maxPatients:      { type: Number, default: 500 },
    maxMonthlyCalls:  { type: Number, default: 1000 },
  },
}, { timestamps: true });

export default mongoose.model("Subscription", subscriptionSchema);
