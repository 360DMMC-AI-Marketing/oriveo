import { Activity, Heart, Users, Calendar, TrendingUp, Brain } from "lucide-react";

export function getHumanWidgets(specialty: string) {
  const common = [
    { label: "Patients Today", icon: Users, color: "blue", key: "patientsToday" },
    { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
    { label: "Avg Severity", icon: TrendingUp, color: "amber", key: "avgSeverity" },
    { label: "AI Assessments", icon: Brain, color: "emerald", key: "aiAssessments" },
  ];
  if (specialty === "cardiology") {
    return [
      ...common,
      { label: "ECG Reads", icon: Heart, color: "red", key: "ecgReads" },
      { label: "BP Alerts", icon: Activity, color: "orange", key: "bpAlerts" },
    ];
  }
  if (specialty === "therapy") {
    return [
      { label: "Active Patients", icon: Users, color: "blue", key: "patientsToday" },
      { label: "Sessions Today", icon: Calendar, color: "violet", key: "appointments" },
      { label: "This Week Units", icon: Activity, color: "emerald", key: "weeklyUnits" },
      { label: "Avg Progress", icon: TrendingUp, color: "amber", key: "avgProgress" },
    ];
  }
  if (specialty === "psychiatry") {
    return [
      ...common,
      { label: "Mood Assessments", icon: Brain, color: "purple", key: "moodAssessments" },
      { label: "Med Reviews", icon: Activity, color: "pink", key: "medReviews" },
    ];
  }
  return [...common, { label: "Follow-ups", icon: Activity, color: "emerald", key: "followUps" }];
}
