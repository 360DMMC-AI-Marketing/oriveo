export interface Profession {
  id: string;
  label: string;
  icon: string;
  description: string;
  orgType: "human" | "veterinary" | "dental";
  specialties: { id: string; label: string }[];
}

export const PROFESSIONS: Profession[] = [
  {
    id: "general-practitioner",
    label: "General Practitioner",
    icon: "Stethoscope",
    description: "Family medicine, internal medicine, general practice",
    orgType: "human",
    specialties: [
      { id: "family-medicine", label: "Family Medicine" },
      { id: "internal-medicine", label: "Internal Medicine" },
      { id: "pediatrics", label: "Pediatrics" },
      { id: "geriatrics", label: "Geriatrics" },
      { id: "sports-medicine", label: "Sports Medicine" },
    ],
  },
  {
    id: "dentist",
    label: "Dentist",
    icon: "Tooth",
    description: "General dentistry, orthodontics, oral surgery",
    orgType: "dental",
    specialties: [
      { id: "general-dentistry", label: "General Dentistry" },
      { id: "orthodontics", label: "Orthodontics" },
      { id: "endodontics", label: "Endodontics" },
      { id: "periodontics", label: "Periodontics" },
      { id: "oral-surgery", label: "Oral Surgery" },
      { id: "pediatric-dentistry", label: "Pediatric Dentistry" },
      { id: "prosthodontics", label: "Prosthodontics" },
    ],
  },
  {
    id: "veterinarian",
    label: "Veterinarian",
    icon: "PawPrint",
    description: "Small animal, large animal, exotic pet practice",
    orgType: "veterinary",
    specialties: [
      { id: "small-animal", label: "Small Animal" },
      { id: "large-animal", label: "Large Animal" },
      { id: "exotic-pets", label: "Exotic Pets" },
      { id: "equine", label: "Equine" },
      { id: "avian", label: "Avian" },
    ],
  },
  {
    id: "therapist",
    label: "Therapist",
    icon: "Brain",
    description: "Physical therapy, occupational therapy, speech therapy",
    orgType: "human",
    specialties: [
      { id: "physical-therapy", label: "Physical Therapy" },
      { id: "occupational-therapy", label: "Occupational Therapy" },
      { id: "speech-therapy", label: "Speech Therapy" },
      { id: "massage-therapy", label: "Massage Therapy" },
      { id: "chiropractic", label: "Chiropractic" },
    ],
  },
  {
    id: "nurse",
    label: "Nurse Practitioner",
    icon: "HeartPulse",
    description: "Primary care, urgent care, specialist nursing",
    orgType: "human",
    specialties: [
      { id: "family-nurse", label: "Family Nurse Practitioner" },
      { id: "pediatric-nurse", label: "Pediatric Nurse Practitioner" },
      { id: "psychiatric-nurse", label: "Psychiatric Nurse Practitioner" },
      { id: "acute-care", label: "Acute Care Nurse Practitioner" },
      { id: "geriatric-nurse", label: "Geriatric Nurse Practitioner" },
    ],
  },
];
