import { Smile, Activity, Users, Calendar, Scan, Syringe } from "lucide-react";

export function getDentalWidgets(specialty: string) {
  const common = [
    { label: "Patients Today", icon: Users, color: "blue", key: "patientsToday" },
    { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
    { label: "Active Treatments", icon: Activity, color: "emerald", key: "activeTreatments" },
  ];
  if (specialty === "orthodontics") {
    return [
      ...common,
      { label: "Adjustments Due", icon: Smile, color: "cyan", key: "adjustmentsDue" },
      { label: "X-Rays Pending", icon: Scan, color: "amber", key: "xraysPending" },
    ];
  }
  if (specialty === "oral-surgery") {
    return [
      ...common,
      { label: "Surgeries Today", icon: Syringe, color: "red", key: "surgeriesToday" },
      { label: "Post-op Follow-ups", icon: Activity, color: "orange", key: "postOpFollowups" },
    ];
  }
  return [
    ...common,
    { label: "Hygiene Due", icon: Smile, color: "cyan", key: "hygieneDue" },
    { label: "Lab Cases", icon: Scan, color: "amber", key: "labCases" },
  ];
}
