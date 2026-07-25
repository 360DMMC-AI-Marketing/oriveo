import { Dog, Activity, Users, Calendar, Syringe, Stethoscope, Heart, AlertTriangle, Clock, Bird } from "lucide-react";

const common = [
  { label: "Active Patients", icon: Users, color: "blue", key: "patientsToday" },
  { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
  { label: "Vaccinations Due", icon: Syringe, color: "amber", key: "vaccinationsDue" },
];

const SPECIALTY_WIDGETS: Record<string, Array<{ label: string; icon: any; color: string; key: string }>> = {
  "small-animal": [
    ...common,
    { label: "Spay/Neuter", icon: Syringe, color: "red", key: "spayNeuterQueue" },
    { label: "Dental Cleanings", icon: Dog, color: "cyan", key: "dentalCleanings" },
  ],
  equine: [
    ...common,
    { label: "Farm Visits", icon: Activity, color: "emerald", key: "farmVisits" },
    { label: "Coggins Tests", icon: Stethoscope, color: "cyan", key: "cogginsTests" },
  ],
  "exotic-pets": [
    ...common,
    { label: "Husbandry Checks", icon: Activity, color: "emerald", key: "wellnessExams" },
    { label: "Fecal Exams", icon: Stethoscope, color: "amber", key: "labCases" },
  ],
  "large-animal": [
    ...common,
    { label: "Herd Health Visits", icon: Activity, color: "emerald", key: "farmVisits" },
    { label: "Mastitis Cases", icon: AlertTriangle, color: "red", key: "wellnessExams" },
  ],
  "mixed-animal": [
    ...common,
    { label: "Emergency Cases", icon: AlertTriangle, color: "red", key: "inPatients" },
    { label: "Wellness Exams", icon: Stethoscope, color: "emerald", key: "wellnessExams" },
  ],
  "vet-specialty": [
    ...common,
    { label: "Surgery Cases", icon: Syringe, color: "red", key: "inPatients" },
    { label: "Post-Op Follow-ups", icon: Clock, color: "orange", key: "wellnessExams" },
  ],
};

export function getVetWidgets(specialty: string) {
  return SPECIALTY_WIDGETS[specialty] || SPECIALTY_WIDGETS["small-animal"];
}
