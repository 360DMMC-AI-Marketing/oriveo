import { Smile, Activity, Users, Calendar, Scan, Syringe, Stethoscope, Shield, AlertTriangle, Clock, Bone } from "lucide-react";

const common = [
  { label: "Patients Today", icon: Users, color: "blue", key: "patientsToday" },
  { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
  { label: "Active Treatments", icon: Activity, color: "emerald", key: "activeTreatments" },
];

const SPECIALTY_WIDGETS: Record<string, Array<{ label: string; icon: any; color: string; key: string }>> = {
  "general-dentistry": [
    ...common,
    { label: "Hygiene Due", icon: Smile, color: "cyan", key: "hygieneDue" },
    { label: "Lab Cases", icon: Scan, color: "amber", key: "labCases" },
  ],
  orthodontics: [
    ...common,
    { label: "Adjustments Due", icon: Smile, color: "cyan", key: "adjustmentsDue" },
    { label: "X-Rays Pending", icon: Scan, color: "amber", key: "xraysPending" },
  ],
  endodontics: [
    ...common,
    { label: "Root Canals Scheduled", icon: Activity, color: "red", key: "surgeriesToday" },
    { label: "Post-Op Follow-ups", icon: Clock, color: "orange", key: "postOpFollowups" },
  ],
  periodontics: [
    ...common,
    { label: "SRP Scheduled", icon: Stethoscope, color: "amber", key: "hygieneDue" },
    { label: "Bone Loss Cases", icon: Bone, color: "red", key: "labCases" },
  ],
  "oral-surgery": [
    ...common,
    { label: "Surgeries Today", icon: Syringe, color: "red", key: "surgeriesToday" },
    { label: "Post-op Follow-ups", icon: Activity, color: "orange", key: "postOpFollowups" },
  ],
  prosthodontics: [
    ...common,
    { label: "Crown Fittings", icon: Smile, color: "cyan", key: "adjustmentsDue" },
    { label: "Implant Restorations", icon: Activity, color: "amber", key: "labCases" },
  ],
  "pediatric-dentistry": [
    ...common,
    { label: "Sealants Due", icon: Shield, color: "cyan", key: "hygieneDue" },
    { label: "Trauma Cases", icon: AlertTriangle, color: "red", key: "labCases" },
  ],
};

export function getDentalWidgets(specialty: string) {
  return SPECIALTY_WIDGETS[specialty] || SPECIALTY_WIDGETS["general-dentistry"];
}
