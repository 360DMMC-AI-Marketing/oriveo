import { Activity, Heart, Users, Calendar, TrendingUp, Brain, Stethoscope, AlertTriangle, Pill, Thermometer, Eye, Ear, Bone, Shield, Clock } from "lucide-react";

const common = [
  { label: "Patients Today", icon: Users, color: "blue", key: "patientsToday" },
  { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
  { label: "Avg Severity", icon: TrendingUp, color: "amber", key: "avgSeverity" },
  { label: "AI Assessments", icon: Brain, color: "emerald", key: "aiAssessments" },
];

const SPECIALTY_WIDGETS: Record<string, Array<{ label: string; icon: any; color: string; key: string }>> = {
  "general-practice": [
    ...common,
    { label: "Follow-ups", icon: Activity, color: "emerald", key: "followUps" },
  ],
  cardiology: [
    ...common,
    { label: "ECG Reads", icon: Heart, color: "red", key: "ecgReads" },
    { label: "BP Alerts", icon: AlertTriangle, color: "orange", key: "bpAlerts" },
  ],
  pediatrics: [
    { label: "Patients Today", icon: Users, color: "blue", key: "patientsToday" },
    { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
    { label: "Fever Cases", icon: Thermometer, color: "red", key: "avgSeverity" },
    { label: "AI Assessments", icon: Brain, color: "emerald", key: "aiAssessments" },
    { label: "Vaccinations Due", icon: Shield, color: "amber", key: "followUps" },
  ],
  neurology: [
    ...common,
    { label: "Stroke Screens", icon: Brain, color: "red", key: "ecgReads" },
    { label: "Seizure Cases", icon: Activity, color: "orange", key: "bpAlerts" },
  ],
  psychiatry: [
    { label: "Patients Today", icon: Users, color: "blue", key: "patientsToday" },
    { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
    { label: "Mood Assessments", icon: Brain, color: "purple", key: "moodAssessments" },
    { label: "Med Reviews", icon: Pill, color: "pink", key: "medReviews" },
    { label: "Crisis Flags", icon: AlertTriangle, color: "red", key: "followUps" },
  ],
  dermatology: [
    ...common,
    { label: "Biopsy Pending", icon: Eye, color: "amber", key: "ecgReads" },
    { label: "Lesion Evaluations", icon: Stethoscope, color: "orange", key: "bpAlerts" },
  ],
  therapy: [
    { label: "Active Patients", icon: Users, color: "blue", key: "patientsToday" },
    { label: "Sessions Today", icon: Calendar, color: "violet", key: "appointments" },
    { label: "This Week Units", icon: Activity, color: "emerald", key: "weeklyUnits" },
    { label: "Avg Progress", icon: TrendingUp, color: "amber", key: "avgProgress" },
    { label: "Fall Risk Patients", icon: AlertTriangle, color: "red", key: "followUps" },
  ],
  gastroenterology: [
    ...common,
    { label: "Endoscopy Queue", icon: Stethoscope, color: "amber", key: "ecgReads" },
    { label: "GI Bleed Alerts", icon: AlertTriangle, color: "red", key: "bpAlerts" },
  ],
  endocrinology: [
    ...common,
    { label: "HbA1c Overdue", icon: Clock, color: "amber", key: "ecgReads" },
    { label: "Diabetic Alerts", icon: AlertTriangle, color: "red", key: "bpAlerts" },
  ],
  oncology: [
    ...common,
    { label: "Chemo Sessions", icon: Activity, color: "red", key: "ecgReads" },
    { label: "Neutropenic Risk", icon: AlertTriangle, color: "orange", key: "bpAlerts" },
  ],
  rheumatology: [
    ...common,
    { label: "DAS28 Assessments", icon: Bone, color: "amber", key: "ecgReads" },
    { label: "Flare-up Cases", icon: AlertTriangle, color: "red", key: "bpAlerts" },
  ],
  nephrology: [
    ...common,
    { label: "Dialysis Sessions", icon: Activity, color: "red", key: "ecgReads" },
    { label: "GFR Alerts", icon: AlertTriangle, color: "orange", key: "bpAlerts" },
  ],
  pulmonology: [
    ...common,
    { label: "Spirometry Done", icon: Activity, color: "amber", key: "ecgReads" },
    { label: "COPD Exacerbations", icon: AlertTriangle, color: "red", key: "bpAlerts" },
  ],
  ophthalmology: [
    ...common,
    { label: "Vision Screens", icon: Eye, color: "amber", key: "ecgReads" },
    { label: "Glaucoma Checks", icon: Eye, color: "red", key: "bpAlerts" },
  ],
  ent: [
    ...common,
    { label: "Audiometry Done", icon: Ear, color: "amber", key: "ecgReads" },
    { label: "Throat Cultures", icon: Stethoscope, color: "orange", key: "bpAlerts" },
  ],
};

export function getHumanWidgets(specialty: string) {
  return SPECIALTY_WIDGETS[specialty] || SPECIALTY_WIDGETS["general-practice"];
}
