export const SPECIALTIES_BY_TYPE = {
  human: [
    { id: "general-practice",   label: "General Practice / Family Medicine", billingCodeSet: "cpt",  icon: "Stethoscope" },
    { id: "cardiology",         label: "Cardiology",                         billingCodeSet: "cpt",  icon: "HeartPulse" },
    { id: "pediatrics",         label: "Pediatrics",                        billingCodeSet: "cpt",  icon: "Baby" },
    { id: "neurology",          label: "Neurology",                         billingCodeSet: "cpt",  icon: "Brain" },
    { id: "psychiatry",         label: "Psychiatry / Behavioral Health",    billingCodeSet: "cpt",  icon: "BrainCircuit" },
    { id: "dermatology",        label: "Dermatology",                       billingCodeSet: "cpt",  icon: "ScanFace" },
    { id: "therapy",            label: "Physical / Occupational / Speech Therapy", billingCodeSet: "timed-units", icon: "Activity" },
    { id: "gastroenterology",   label: "Gastroenterology",                  billingCodeSet: "cpt",  icon: "Activity" },
    { id: "endocrinology",      label: "Endocrinology",                     billingCodeSet: "cpt",  icon: "TestTubes" },
    { id: "oncology",           label: "Oncology",                          billingCodeSet: "cpt",  icon: "Shield" },
    { id: "rheumatology",       label: "Rheumatology",                      billingCodeSet: "cpt",  icon: "Bone" },
    { id: "nephrology",         label: "Nephrology",                        billingCodeSet: "cpt",  icon: "Pill" },
    { id: "pulmonology",        label: "Pulmonology",                       billingCodeSet: "cpt",  icon: "Activity" },
    { id: "ophthalmology",      label: "Ophthalmology",                     billingCodeSet: "cpt",  icon: "Eye" },
    { id: "ent",                label: "ENT / Otolaryngology",              billingCodeSet: "cpt",  icon: "Ear" },
  ],
  dental: [
    { id: "general-dentistry",    label: "General Dentistry",    billingCodeSet: "cdt", icon: "Smile" },
    { id: "orthodontics",         label: "Orthodontics",         billingCodeSet: "cdt", icon: "Smile" },
    { id: "endodontics",          label: "Endodontics",          billingCodeSet: "cdt", icon: "Smile" },
    { id: "periodontics",         label: "Periodontics",         billingCodeSet: "cdt", icon: "Smile" },
    { id: "oral-surgery",         label: "Oral Surgery",         billingCodeSet: "cdt", icon: "Scissors" },
    { id: "prosthodontics",       label: "Prosthodontics",       billingCodeSet: "cdt", icon: "Hammer" },
    { id: "pediatric-dentistry",  label: "Pediatric Dentistry",  billingCodeSet: "cdt", icon: "Baby" },
  ],
  veterinary: [
    { id: "small-animal",       label: "Small Animal (Dogs & Cats)",                billingCodeSet: "mixed", icon: "Dog" },
    { id: "equine",             label: "Equine (Horses)",                           billingCodeSet: "mixed", icon: "Cat" },
    { id: "exotic-pets",        label: "Exotic Pets (Avian, Reptile, Mammal)",      billingCodeSet: "mixed", icon: "Rabbit" },
    { id: "large-animal",       label: "Large Animal (Bovine, Ovine)",              billingCodeSet: "mixed", icon: "Bird" },
    { id: "mixed-animal",       label: "Mixed Animal Practice",                     billingCodeSet: "mixed", icon: "Dog" },
    { id: "vet-specialty",      label: "Veterinary Specialty (Surgery/Ophthalmology)", billingCodeSet: "mixed", icon: "Stethoscope" },
  ],
};

export const CLINIC_TYPES = [
  { id: "human",     label: "Human",     description: "Medical clinics, hospitals, therapy practices", icon: "HeartPulse" },
  { id: "dental",    label: "Dental",    description: "Dentists, orthodontists, oral surgeons",         icon: "Smile" },
  { id: "veterinary", label: "Animal",   description: "Vet clinics, animal hospitals, equine practices", icon: "Dog" },
];

export function getSpecialtiesForType(type) {
  return SPECIALTIES_BY_TYPE[type] || [];
}

export function getSpecialty(type, specialtyId) {
  const specialties = SPECIALTIES_BY_TYPE[type] || [];
  return specialties.find(s => s.id === specialtyId) || null;
}

export const SPECIALTY_DASHBOARD_LABELS = {
  "general-practice": { title: "General Practice Dashboard", subtitle: "Family medicine & primary care overview" },
  "cardiology": { title: "Cardiology Dashboard", subtitle: "Cardiovascular care & diagnostics overview" },
  "pediatrics": { title: "Pediatrics Dashboard", subtitle: "Child health & wellness overview" },
  "neurology": { title: "Neurology Dashboard", subtitle: "Neurological care overview" },
  "psychiatry": { title: "Psychiatry Dashboard", subtitle: "Mental health & behavioral care overview" },
  "dermatology": { title: "Dermatology Dashboard", subtitle: "Skin health & dermatology overview" },
  "therapy": { title: "Therapy Dashboard", subtitle: "Rehabilitative therapy overview" },
  "gastroenterology": { title: "Gastroenterology Dashboard", subtitle: "Digestive health overview" },
  "endocrinology": { title: "Endocrinology Dashboard", subtitle: "Hormone & metabolic health overview" },
  "oncology": { title: "Oncology Dashboard", subtitle: "Cancer care overview" },
  "rheumatology": { title: "Rheumatology Dashboard", subtitle: "Rheumatic & autoimmune care overview" },
  "nephrology": { title: "Nephrology Dashboard", subtitle: "Kidney health overview" },
  "pulmonology": { title: "Pulmonology Dashboard", subtitle: "Respiratory care overview" },
  "ophthalmology": { title: "Ophthalmology Dashboard", subtitle: "Vision & eye health overview" },
  "ent": { title: "ENT Dashboard", subtitle: "Ear, nose & throat overview" },
  "general-dentistry": { title: "Dental Dashboard", subtitle: "General dentistry overview" },
  "orthodontics": { title: "Orthodontics Dashboard", subtitle: "Orthodontic treatment overview" },
  "endodontics": { title: "Endodontics Dashboard", subtitle: "Root canal & endodontic overview" },
  "periodontics": { title: "Periodontics Dashboard", subtitle: "Gum health & perio overview" },
  "oral-surgery": { title: "Oral Surgery Dashboard", subtitle: "Surgical dentistry overview" },
  "prosthodontics": { title: "Prosthodontics Dashboard", subtitle: "Restorative dentistry overview" },
  "pediatric-dentistry": { title: "Pediatric Dentistry Dashboard", subtitle: "Children's dental care overview" },
  "small-animal": { title: "Small Animal Dashboard", subtitle: "Dog & cat practice overview" },
  "equine": { title: "Equine Dashboard", subtitle: "Horse practice overview" },
  "exotic-pets": { title: "Exotic Pets Dashboard", subtitle: "Avian, reptile & small mammal overview" },
  "large-animal": { title: "Large Animal Dashboard", subtitle: "Bovine & ovine practice overview" },
  "mixed-animal": { title: "Mixed Animal Dashboard", subtitle: "Multi-species practice overview" },
  "vet-specialty": { title: "Veterinary Specialty Dashboard", subtitle: "Specialty vet care overview" },
};
