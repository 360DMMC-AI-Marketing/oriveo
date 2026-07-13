export const PROFESSIONS = [
  {
    id: "doctor",
    label: "Doctor",
    icon: "Stethoscope",
    orgType: "human",
    description: "General practitioner or medical specialist",
    specialties: [
      "cardiology", "neurology", "pulmonology", "gastroenterology",
      "pediatrics", "orthopedics", "psychiatry", "dermatology",
      "endocrinology", "nephrology", "ophthalmology", "otolaryngology",
      "urology", "rheumatology", "oncology", "infectious-disease",
      "emergency-medicine", "internal-medicine", "family-medicine",
      "sports-medicine", "pain-management", "sleep-medicine",
    ],
  },
  {
    id: "dentist",
    label: "Dentist",
    icon: "Tooth",
    orgType: "dental",
    description: "Dental practitioner or oral health specialist",
    specialties: [
      "orthodontics", "oral-surgery", "periodontics", "endodontics",
      "prosthodontics", "pediatric-dentistry", "cosmetic-dentistry",
      "oral-pathology", "dental-implants", "tmj-disorders",
    ],
  },
  {
    id: "veterinarian",
    label: "Veterinarian",
    icon: "PawPrint",
    orgType: "veterinary",
    description: "Animal healthcare practitioner",
    specialties: [
      "small-animal", "large-animal", "exotic-pets", "feline-medicine",
      "canine-medicine", "equine-medicine", "avian-medicine",
      "veterinary-surgery", "veterinary-dermatology", "veterinary-dentistry",
      "veterinary-ophthalmology", "veterinary-cardiology", "veterinary-neurology",
      "veterinary-emergency", "veterinary-radiology", "veterinary-pathology",
    ],
  },
  {
    id: "nurse",
    label: "Nurse",
    icon: "HeartPulse",
    orgType: "human",
    description: "Registered nurse or nursing specialist",
    specialties: [
      "er-nursing", "icu-nursing", "pediatric-nursing", "geriatric-nursing",
      "surgical-nursing", "home-care-nursing", "psychiatric-nursing",
      "oncology-nursing", "cardiac-nursing", "midwifery",
    ],
  },
  {
    id: "therapist",
    label: "Therapist",
    icon: "Brain",
    orgType: "human",
    description: "Physical, occupational, or mental health therapist",
    specialties: [
      "physical-therapy", "occupational-therapy", "speech-therapy",
      "respiratory-therapy", "massage-therapy", "rehabilitation",
    ],
  },
];

export const SPECIALTY_LABELS = {
  cardiology: "Cardiology", neurology: "Neurology", pulmonology: "Pulmonology",
  gastroenterology: "Gastroenterology", pediatrics: "Pediatrics",
  orthopedics: "Orthopedics", psychiatry: "Psychiatry", dermatology: "Dermatology",
  endocrinology: "Endocrinology", nephrology: "Nephrology",
  ophthalmology: "Ophthalmology", otolaryngology: "Otolaryngology",
  urology: "Urology", rheumatology: "Rheumatology", oncology: "Oncology",
  "infectious-disease": "Infectious Disease", "emergency-medicine": "Emergency Medicine",
  "internal-medicine": "Internal Medicine", "family-medicine": "Family Medicine",
  "sports-medicine": "Sports Medicine", "pain-management": "Pain Management",
  "sleep-medicine": "Sleep Medicine",
  orthodontics: "Orthodontics", "oral-surgery": "Oral Surgery",
  periodontics: "Periodontics", endodontics: "Endodontics",
  prosthodontics: "Prosthodontics", "pediatric-dentistry": "Pediatric Dentistry",
  "cosmetic-dentistry": "Cosmetic Dentistry", "oral-pathology": "Oral Pathology",
  "dental-implants": "Dental Implants", "tmj-disorders": "TMJ Disorders",
  "small-animal": "Small Animal Medicine", "large-animal": "Large Animal Medicine",
  "exotic-pets": "Exotic Pet Medicine", "feline-medicine": "Feline Medicine",
  "canine-medicine": "Canine Medicine", "equine-medicine": "Equine Medicine",
  "avian-medicine": "Avian Medicine", "veterinary-surgery": "Veterinary Surgery",
  "veterinary-dermatology": "Veterinary Dermatology",
  "veterinary-dentistry": "Veterinary Dentistry",
  "veterinary-ophthalmology": "Veterinary Ophthalmology",
  "veterinary-cardiology": "Veterinary Cardiology",
  "veterinary-neurology": "Veterinary Neurology",
  "veterinary-emergency": "Veterinary Emergency & Critical Care",
  "veterinary-radiology": "Veterinary Radiology",
  "veterinary-pathology": "Veterinary Pathology",
  "er-nursing": "ER Nursing", "icu-nursing": "ICU Nursing",
  "pediatric-nursing": "Pediatric Nursing", "geriatric-nursing": "Geriatric Nursing",
  "surgical-nursing": "Surgical Nursing", "home-care-nursing": "Home Care Nursing",
  "psychiatric-nursing": "Psychiatric Nursing", "oncology-nursing": "Oncology Nursing",
  "cardiac-nursing": "Cardiac Nursing", midwifery: "Midwifery",
  "physical-therapy": "Physical Therapy", "occupational-therapy": "Occupational Therapy",
  "speech-therapy": "Speech Therapy", "respiratory-therapy": "Respiratory Therapy",
  "massage-therapy": "Massage Therapy", rehabilitation: "Rehabilitation",
};

export function getProfession(id) {
  return PROFESSIONS.find(p => p.id === id) || null;
}

export function getSpecialtiesForProfession(professionId) {
  const prof = getProfession(professionId);
  if (!prof) return [];
  return prof.specialties.map(id => ({ id, label: SPECIALTY_LABELS[id] || id }));
}
