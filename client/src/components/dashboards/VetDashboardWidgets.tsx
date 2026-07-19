import { Dog, Activity, Users, Calendar, Syringe, Stethoscope } from "lucide-react";

export function getVetWidgets(specialty: string) {
  const common = [
    { label: "Active Patients", icon: Users, color: "blue", key: "patientsToday" },
    { label: "Appointments", icon: Calendar, color: "violet", key: "appointments" },
    { label: "Vaccinations Due", icon: Syringe, color: "amber", key: "vaccinationsDue" },
  ];
  if (specialty === "equine") {
    return [
      ...common,
      { label: "Farm Visits", icon: Activity, color: "emerald", key: "farmVisits" },
      { label: "Coggins Tests", icon: Stethoscope, color: "cyan", key: "cogginsTests" },
    ];
  }
  if (specialty === "small-animal") {
    return [
      ...common,
      { label: "Spay/Neuter", icon: Syringe, color: "red", key: "spayNeuterQueue" },
      { label: "Dental Cleanings", icon: Dog, color: "cyan", key: "dentalCleanings" },
    ];
  }
  return [
    ...common,
    { label: "Wellness Exams", icon: Stethoscope, color: "emerald", key: "wellnessExams" },
    { label: "In-Patients", icon: Activity, color: "blue", key: "inPatients" },
  ];
}
