// Specialty → Department mappings for every Oriveo specialty.
// Each specialty gets:
//   - 4 base departments (medical, nursing, admin, support)
//   - extra specialty-specific departments as needed
// Every department maps to user roles so staff can be assigned.

export const SPECIALTY_DEPARTMENTS = {
  // ───── HUMAN ─────
  "general-practice": [
    { id: "medical",     label: "Medical Department",     roles: ["doctor"],         description: "Physicians, general practitioners and residents" },
    { id: "nursing",     label: "Nursing & Care",         roles: ["nurse"],          description: "Registered nurses, practical nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, billing and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning, logistics and general support" },
    { id: "lab",         label: "Laboratory",             roles: ["staff"],          description: "Lab technicians, phlebotomists and sample processing" },
  ],
  "cardiology": [
    { id: "medical",     label: "Cardiology Department",  roles: ["doctor"],         description: "Cardiologists and cardiology fellows" },
    { id: "nursing",     label: "Cardiac Nursing",         roles: ["nurse"],          description: "Cardiac care nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "imaging",     label: "Cardiac Diagnostics",    roles: ["staff"],          description: "Echocardiography, ECG stress test and holter techs" },
  ],
  "pediatrics": [
    { id: "medical",     label: "Pediatrics Department",  roles: ["doctor"],         description: "Pediatricians and residents" },
    { id: "nursing",     label: "Pediatric Nursing",      roles: ["nurse"],          description: "Pediatric nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "child-life",  label: "Child Life Support",     roles: ["staff"],          description: "Child life specialists, play therapists and family support" },
  ],
  "neurology": [
    { id: "medical",     label: "Neurology Department",   roles: ["doctor"],         description: "Neurologists and neurology residents" },
    { id: "nursing",     label: "Neurology Nursing",      roles: ["nurse"],          description: "Neurology nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "neuro-dx",    label: "Neuro Diagnostics",      roles: ["staff"],          description: "EEG, EMG, NCV technicians and sleep lab techs" },
  ],
  "psychiatry": [
    { id: "medical",     label: "Psychiatry Department",  roles: ["doctor"],         description: "Psychiatrists and psychiatric residents" },
    { id: "therapy",     label: "Therapy & Counseling",   roles: ["nurse", "staff"], description: "Psychologists, therapists, counselors and social workers" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "nursing",     label: "Psychiatric Nursing",    roles: ["nurse"],          description: "Psychiatric nurses and aides-soignants" },
  ],
  "dermatology": [
    { id: "medical",     label: "Dermatology Department", roles: ["doctor"],         description: "Dermatologists and residents" },
    { id: "nursing",     label: "Dermatology Nursing",    roles: ["nurse"],          description: "Dermatology nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "aesthetics",  label: "Aesthetics & Cosmetology", roles: ["staff"],        description: "Aestheticians, laser techs and cosmetic specialists" },
  ],
  "therapy": [
    { id: "clinical",    label: "Clinical Therapy",       roles: ["doctor"],         description: "Physical therapists, occupational therapists and speech-language pathologists" },
    { id: "aides",       label: "Therapy Aides",          roles: ["nurse", "staff"], description: "PT aides, OT aides and rehabilitation assistants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Equipment maintenance, cleaning and logistics" },
  ],
  "gastroenterology": [
    { id: "medical",     label: "Gastroenterology Dept",  roles: ["doctor"],         description: "Gastroenterologists and fellows" },
    { id: "nursing",     label: "GI Nursing",             roles: ["nurse"],          description: "GI nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "endoscopy",   label: "Endoscopy Suite",        roles: ["staff"],          description: "Endoscopy techs and sterile processing" },
  ],
  "endocrinology": [
    { id: "medical",     label: "Endocrinology Dept",     roles: ["doctor"],         description: "Endocrinologists and residents" },
    { id: "nursing",     label: "Endocrinology Nursing",  roles: ["nurse"],          description: "Endocrinology nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "diabetes-ed", label: "Diabetes Education",     roles: ["nurse", "staff"], description: "Diabetes educators, dietitians and nutritionists" },
  ],
  "oncology": [
    { id: "medical",     label: "Oncology Department",    roles: ["doctor"],         description: "Medical oncologists, radiation oncologists and fellows" },
    { id: "nursing",     label: "Oncology Nursing",       roles: ["nurse"],          description: "Oncology nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "infusion",    label: "Infusion & Chemotherapy", roles: ["nurse"],         description: "Infusion nurses and pharmacy techs" },
    { id: "social-work", label: "Social Work & Support",  roles: ["staff"],          description: "Social workers, patient navigators and palliative care" },
  ],
  "rheumatology": [
    { id: "medical",     label: "Rheumatology Department", roles: ["doctor"],        description: "Rheumatologists and fellows" },
    { id: "nursing",     label: "Rheumatology Nursing",    roles: ["nurse"],         description: "Rheumatology nurses and aides-soignants" },
    { id: "admin",       label: "Administration",          roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",           roles: ["staff"],         description: "Maintenance, cleaning and logistics" },
    { id: "infusion",    label: "Infusion Therapy",        roles: ["nurse"],         description: "Biologic infusion nurses and techs" },
  ],
  "nephrology": [
    { id: "medical",     label: "Nephrology Department",  roles: ["doctor"],         description: "Nephrologists and residents" },
    { id: "nursing",     label: "Nephrology Nursing",     roles: ["nurse"],          description: "Nephrology nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "dialysis",    label: "Dialysis Unit",          roles: ["nurse", "staff"], description: "Dialysis nurses and dialysis technicians" },
  ],
  "pulmonology": [
    { id: "medical",     label: "Pulmonology Department", roles: ["doctor"],         description: "Pulmonologists and residents" },
    { id: "nursing",     label: "Pulmonology Nursing",    roles: ["nurse"],          description: "Pulmonology nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "resp-therapy", label: "Respiratory Therapy",   roles: ["staff"],          description: "Respiratory therapists and pulmonary function techs" },
  ],
  "ophthalmology": [
    { id: "medical",     label: "Ophthalmology Department", roles: ["doctor"],       description: "Ophthalmologists and residents" },
    { id: "nursing",     label: "Ophthalmic Nursing",      roles: ["nurse"],         description: "Ophthalmic nurses and aides-soignants" },
    { id: "admin",       label: "Administration",          roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",           roles: ["staff"],         description: "Maintenance, cleaning and logistics" },
    { id: "optometry",   label: "Optometry & Imaging",     roles: ["staff"],         description: "Optometrists, ophthalmic techs and imaging specialists" },
  ],
  "ent": [
    { id: "medical",     label: "ENT Department",         roles: ["doctor"],         description: "ENT surgeons and otolaryngologists" },
    { id: "nursing",     label: "ENT Nursing",            roles: ["nurse"],          description: "ENT nurses and aides-soignants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling and admin" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Maintenance, cleaning and logistics" },
    { id: "audiology",   label: "Audiology & Speech",     roles: ["staff"],          description: "Audiologists, hearing aid techs and speech therapists" },
  ],

  // ───── DENTAL ─────
  "general-dentistry": [
    { id: "medical",     label: "Dentistry Department",   roles: ["doctor"],         description: "General dentists and dental surgeons" },
    { id: "hygiene",     label: "Dental Hygiene",         roles: ["nurse", "staff"], description: "Dental hygienists and prophylaxis specialists" },
    { id: "assisting",   label: "Dental Assisting",       roles: ["nurse", "staff"], description: "Dental assistants and chair-side support" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, insurance and billing" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Sterilization, lab, maintenance and logistics" },
    { id: "lab",         label: "Dental Laboratory",      roles: ["staff"],          description: "Dental lab technicians and crown/bridge fabrication" },
  ],
  "orthodontics": [
    { id: "medical",     label: "Orthodontics Department", roles: ["doctor"],        description: "Orthodontists and specialists" },
    { id: "assisting",   label: "Orthodontic Assisting",   roles: ["nurse", "staff"], description: "Orthodontic assistants and chair-side support" },
    { id: "admin",       label: "Administration",          roles: ["receptionist", "admin"], description: "Front desk, scheduling, insurance and billing" },
    { id: "support",     label: "Support Staff",           roles: ["staff"],         description: "Sterilization, lab, maintenance and logistics" },
    { id: "lab",         label: "Orthodontic Lab",         roles: ["staff"],         description: "Appliance fabrication, model trimming and retainers" },
  ],
  "endodontics": [
    { id: "medical",     label: "Endodontics Department", roles: ["doctor"],         description: "Endodontists and root canal specialists" },
    { id: "assisting",   label: "Endodontic Assisting",   roles: ["nurse", "staff"], description: "Endodontic assistants and chair-side support" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, insurance and billing" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Sterilization, maintenance and logistics" },
  ],
  "periodontics": [
    { id: "medical",     label: "Periodontics Department", roles: ["doctor"],        description: "Periodontists and gum disease specialists" },
    { id: "hygiene",     label: "Periodontal Hygiene",     roles: ["nurse", "staff"], description: "Periodontal hygienists and scaling/root planing" },
    { id: "surgical",    label: "Surgical Assisting",      roles: ["nurse", "staff"], description: "Surgical assistants for implant and grafting procedures" },
    { id: "admin",       label: "Administration",          roles: ["receptionist", "admin"], description: "Front desk, scheduling, insurance and billing" },
    { id: "support",     label: "Support Staff",           roles: ["staff"],         description: "Sterilization, maintenance and logistics" },
  ],
  "oral-surgery": [
    { id: "medical",     label: "Oral Surgery Department", roles: ["doctor"],        description: "Oral and maxillofacial surgeons" },
    { id: "surgical-nursing", label: "Surgical Nursing",   roles: ["nurse"],         description: "Surgical nurses for operating room" },
    { id: "anesthesia",  label: "Anesthesia Services",     roles: ["nurse", "staff"], description: "Anesthesiologists, nurse anesthetists and CRNAs" },
    { id: "admin",       label: "Administration",          roles: ["receptionist", "admin"], description: "Front desk, scheduling, insurance and billing" },
    { id: "support",     label: "Support Staff",           roles: ["staff"],         description: "Sterilization, maintenance and logistics" },
  ],
  "prosthodontics": [
    { id: "medical",     label: "Prosthodontics Department", roles: ["doctor"],      description: "Prosthodontists and restorative specialists" },
    { id: "assisting",   label: "Prosthodontic Assisting",   roles: ["nurse", "staff"], description: "Prosthodontic assistants and chair-side support" },
    { id: "admin",       label: "Administration",            roles: ["receptionist", "admin"], description: "Front desk, scheduling, insurance and billing" },
    { id: "support",     label: "Support Staff",             roles: ["staff"],       description: "Sterilization, maintenance and logistics" },
    { id: "lab",         label: "Prosthetics Laboratory",    roles: ["staff"],       description: "Crown, bridge, denture and implant lab fabrication" },
  ],
  "pediatric-dentistry": [
    { id: "medical",     label: "Pediatric Dentistry",    roles: ["doctor"],         description: "Pediatric dentists and specialists" },
    { id: "hygiene",     label: "Pediatric Hygiene",      roles: ["nurse", "staff"], description: "Pediatric dental hygienists" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, insurance and billing" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Sterilization, maintenance and logistics" },
    { id: "child-care",  label: "Child & Family Care",    roles: ["staff"],          description: "Child life specialists and family support coordinators" },
  ],

  // ───── VETERINARY ─────
  "small-animal": [
    { id: "medical",     label: "Veterinary Department",  roles: ["doctor"],         description: "Veterinarians and veterinary interns" },
    { id: "tech",        label: "Veterinary Nursing & Tech", roles: ["nurse"],       description: "Vet techs, licensed techs (LVT) and care assistants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, billing and client relations" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Kennel attendants, cleaners and maintenance" },
    { id: "surgery",     label: "Surgery Suite",          roles: ["nurse", "staff"], description: "Surgical vet techs and anesthesia monitoring" },
    { id: "kennel",      label: "Kennel & Boarding",      roles: ["staff"],          description: "Kennel attendants, walkers and animal care staff" },
    { id: "grooming",    label: "Grooming Services",      roles: ["staff"],          description: "Pet groomers and bathing staff" },
  ],
  "equine": [
    { id: "medical",     label: "Equine Medicine",        roles: ["doctor"],         description: "Equine veterinarians and interns" },
    { id: "tech",        label: "Equine Veterinary Tech", roles: ["nurse"],          description: "Equine vet techs and nursing assistants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, billing and client relations" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Barn attendants, maintenance and logistics" },
    { id: "farriery",    label: "Farriery & Hoof Care",   roles: ["staff"],          description: "Farriers and hoof care specialists" },
    { id: "barn",        label: "Barn & Stable",          roles: ["staff"],          description: "Stable hands, turnout and facility maintenance" },
  ],
  "exotic-pets": [
    { id: "medical",     label: "Exotic Medicine",        roles: ["doctor"],         description: "Exotic animal veterinarians" },
    { id: "tech",        label: "Veterinary Tech",        roles: ["nurse"],          description: "Vet techs for avian, reptile and small mammal care" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, billing and client relations" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Enclosure maintenance, cleaning and logistics" },
  ],
  "large-animal": [
    { id: "medical",     label: "Large Animal Medicine",  roles: ["doctor"],         description: "Large animal veterinarians (bovine, ovine)" },
    { id: "tech",        label: "Livestock Tech Services", roles: ["nurse"],         description: "Livestock vet techs and field assistants" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, billing and client relations" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Farm facility maintenance and logistics" },
    { id: "farm-svc",    label: "Field & Farm Services",  roles: ["staff"],          description: "Mobile clinic drivers, herd management and field support" },
  ],
  "mixed-animal": [
    { id: "medical",     label: "Veterinary Department",  roles: ["doctor"],         description: "Mixed practice veterinarians" },
    { id: "tech",        label: "Veterinary Tech & Nursing", roles: ["nurse"],       description: "Vet techs for small and large animals" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, scheduling, billing and client relations" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Facility maintenance, cleaning and logistics" },
    { id: "surgery",     label: "Surgery Suite",          roles: ["nurse", "staff"], description: "Surgical techs and field surgery support" },
  ],
  "vet-specialty": [
    { id: "medical",     label: "Specialty Veterinary",   roles: ["doctor"],         description: "Veterinary specialists (surgery, ophthalmology, neurology)" },
    { id: "tech",        label: "Specialty Vet Tech",     roles: ["nurse"],          description: "Specialty vet techs and nursing staff" },
    { id: "admin",       label: "Administration",         roles: ["receptionist", "admin"], description: "Front desk, referral coordination and billing" },
    { id: "support",     label: "Support Staff",          roles: ["staff"],          description: "Facility maintenance and logistics" },
    { id: "surgery",     label: "Advanced Surgery Suite", roles: ["nurse", "staff"], description: "Surgical techs, anesthesia and sterile processing" },
    { id: "imaging",     label: "Advanced Imaging",       roles: ["staff"],          description: "MRI, CT and diagnostic imaging technicians" },
  ],
};

// Get departments for a given specialty
export function getDepartmentsForSpecialty(specialtyId) {
  return SPECIALTY_DEPARTMENTS[specialtyId] || SPECIALTY_DEPARTMENTS["general-practice"] || [];
}

// Get base department IDs (always present)
export const BASE_DEPARTMENT_IDS = ["medical", "nursing", "admin", "support"];
