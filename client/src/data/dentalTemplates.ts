import type { MedicalTemplate } from "./medicalTemplates";

const lastQ = "Do you have any other dental concerns you'd like to discuss?";

export const dentalTemplates: MedicalTemplate[] = [
  {
    id: "general-dental", condition: "General Dental Checkup", category: "Dental", severity: "low",
    description: "Comprehensive oral examination per ADA guidelines. Includes periodontal probing, caries detection, oral cancer screening, radiographic assessment, and preventive care planning.",
    questions: ["When was your last dental cleaning and exam?", "Are you brushing twice daily with fluoride toothpaste and flossing regularly?", "Have you noticed any tooth pain, sensitivity to hot or cold, or discomfort?", "Do your gums bleed when you brush or floss?", "Have you noticed any loose teeth, changes in bite, or shifting of teeth?", "Do you have any crowns, bridges, implants, or fillings that concern you?", "Are you experiencing any jaw pain, clicking, or difficulty opening your mouth?", "Do you smoke, vape, or use tobacco products?", "Have you noticed any sores, lumps, or persistent spots in your mouth?", "Do you have any medical conditions (diabetes, heart disease) or take blood thinners?", lastQ],
  },
  {
    id: "root-canal", condition: "Root Canal Follow-up", category: "Dental", severity: "high",
    description: "Endodontic treatment assessment per AAE guidelines. Root canal therapy removes infected pulp, seals the canal space, and restores tooth function. Follow-up evaluates healing and symptoms.",
    questions: ["How many days since your root canal procedure?", "Rate your current pain level from 0 to 10?", "Are you taking prescribed pain medication and/or antibiotics as directed?", "Have you noticed any swelling of the gums, face, or around the treated tooth?", "Can you chew on the treated tooth without discomfort?", "Have you had any fever, chills, or signs of infection?", "Is there any discharge, bad taste, or pus coming from the treated area?", "Are you experiencing any sensitivity to hot or cold in that tooth?", "Are you able to open your mouth and bite down normally?", "Have you scheduled the permanent restoration (crown) appointment?", lastQ],
  },
  {
    id: "orthodontic", condition: "Orthodontic Adjustment Check", category: "Dental", severity: "low",
    description: "Routine orthodontic progress assessment per AAO guidelines. Tracks tooth movement, appliance integrity, oral hygiene compliance, and any discomfort or complications from treatment.",
    questions: ["How long have you been in orthodontic treatment?", "Are you experiencing any discomfort, soreness, or pain from your braces or aligners?", "Have you noticed any broken brackets, loose bands, or bent wires?", "Are you wearing your elastic bands or aligners for the prescribed hours per day?", "Do you have any sores, ulcers, or irritation inside your lips or cheeks?", "Are you brushing and flossing around your braces carefully?", "Have you been avoiding hard, sticky, or crunchy foods as instructed?", "Have you noticed any changes in your bite or tooth alignment?", "Are you using orthodontic wax for any sharp or poking areas?", "Do you have any questions about your treatment plan or timeline?", lastQ],
  },
  {
    id: "oral-surgery", condition: "Oral Surgery Recovery", category: "Dental", severity: "high",
    description: "Post-operative monitoring per AAOMS guidelines for procedures including extraction, implant placement, biopsy, and corrective jaw surgery. Focus on pain control, wound healing, and complication detection.",
    questions: ["How many days since your oral surgery procedure?", "Rate your pain level from 0 to 10 and is it improving?", "Are you taking all prescribed medications (pain, antibiotics, mouth rinse) as directed?", "Have you noticed any excessive bleeding or bleeding that won't stop?", "Is there significant swelling — are you applying ice packs as instructed?", "Are you able to eat soft foods and drink enough fluids?", "Have you had any fever, chills, or signs of infection?", "Do you have any numbness or altered sensation in your lips, tongue, or chin?", "Are you following activity restrictions — no strenuous activity or heavy lifting?", "Do you have your follow-up appointment scheduled?", lastQ],
  },
  {
    id: "dental-emergency", condition: "Dental Emergency", category: "Dental", severity: "critical",
    description: "Emergency dental triage per ADA guidelines. Includes severe pain, dental trauma (avulsed/fractured tooth), swelling, abscess, and uncontrolled bleeding. Immediate assessment determines urgency.",
    questions: ["Can you describe your dental emergency — pain, trauma, or swelling?", "Rate your pain level from 0 to 10?", "Have you lost, broken, or chipped a tooth? Do you have the pieces?", "Is there active bleeding that hasn't stopped with pressure?", "Do you have swelling in your face, jaw, or neck that affects breathing or swallowing?", "Can you breathe and swallow normally?", "Have you injured your jaw, mouth, or face from a fall or accident?", "Do you have a dental abscess — pus, fever, or foul taste in your mouth?", "Are you able to see a dentist today or go to an emergency room?", "Have you taken any pain medication? What and how much?", lastQ],
  },
  {
    id: "periodontal", condition: "Periodontal / Gum Disease Follow-up", category: "Dental", severity: "moderate",
    description: "Periodontal maintenance per AAP guidelines. Periodontitis is a chronic inflammatory disease requiring regular maintenance at 3-month intervals to prevent disease progression and tooth loss.",
    questions: ["Are you experiencing any gum pain, bleeding, or sensitivity?", "Do your gums bleed when you brush, floss, or eat?", "Have you noticed your gums receding or your teeth looking longer?", "Do you have persistent bad breath (halitosis) or a bad taste in your mouth?", "Have you noticed any pus or discharge between your teeth and gums?", "Do any of your teeth feel loose or are they shifting position?", "Are you using any prescribed mouth rinse or antibiotic gel as directed?", "Have you been keeping your 3-month periodontal maintenance schedule?", "Do you smoke or use tobacco products?", "Have you noticed any changes in how your teeth fit together when biting?", lastQ],
  },
  {
    id: "pediatric-dental", condition: "Pediatric Dental Check", category: "Dental", severity: "low",
    description: "Pediatric oral health per AAPD guidelines. First dental visit by age 1. Focuses on caries risk assessment, fluoride varnish, anticipatory guidance, and establishing a dental home.",
    questions: ["How old is your child?", "Is your child brushing with a fluoride toothpaste and parental supervision?", "Has your child complained of any tooth pain or sensitivity?", "Have you noticed any cavities, white spots, or discoloration on the teeth?", "Is your child eating and drinking normally?", "Has your child had any falls or mouth injuries?", "Does your child use a pacifier, thumb-suck, or bottle at bedtime?", "Have you started flossing your child's teeth?", "When was the last dental visit and were any X-rays taken?", "Are you applying fluoride varnish or using fluoridated water?", lastQ],
  },
  {
    id: "cosmetic-dental", condition: "Cosmetic Dentistry Consultation", category: "Dental", severity: "low",
    description: "Esthetic dental evaluation per AACD standards. Addresses patient concerns about tooth color, shape, alignment, and gaps. Treatment options include whitening, veneers, bonding, and orthodontics.",
    questions: ["What concerns do you have about your smile that you'd like to address?", "Are you considering teeth whitening, and have you tried over-the-counter products?", "Are you interested in veneers, bonding, or crowns to improve your smile?", "Have you had previous cosmetic dental treatment? If so, what?", "Are you happy with the shape, size, and color of your teeth?", "Do you have gaps, chips, or uneven teeth that bother you?", "Are your teeth stained or discolored from food, drinks, or smoking?", "Do you have any crowns, fillings, or restorations that need replacement?", "Do you experience any dental anxiety or sensitivity with treatment?", "What budget range are you considering for cosmetic treatment?", lastQ],
  },
];
