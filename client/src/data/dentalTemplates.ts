import type { MedicalTemplate } from "./medicalTemplates";

const lastQ = "Do you have any other dental concerns you'd like to discuss?";

export const dentalTemplates: MedicalTemplate[] = [
  {
    id: "general-dental", condition: "General Dental Checkup", category: "Dental", severity: "low",
    questions: ["When was your last dental cleaning?", "Have you been brushing twice daily?", "Do you floss regularly?", "Have you noticed any tooth pain or sensitivity?", "Do your gums bleed when brushing?", "Have you noticed any loose teeth?", "Do you have any dental crowns or bridges?", "Are you experiencing any jaw pain?", "Have you had any recent dental work?", "Do you have any concerns about your smile?", lastQ],
  },
  {
    id: "root-canal", condition: "Root Canal Follow-up", category: "Dental", severity: "high",
    questions: ["How many days since your root canal procedure?", "Rate your pain level from 1 to 10.", "Are you taking prescribed pain medication?", "Have you noticed any swelling?", "Can you chew on that tooth?", "Have you had any fever or chills?", "Is there any discharge from the treated area?", "Are you experiencing any sensitivity to hot or cold?", "Are you able to open your mouth fully?", "Have you been following post-procedure care instructions?", lastQ],
  },
  {
    id: "orthodontic", condition: "Orthodontic Adjustment Check", category: "Dental", severity: "low",
    questions: ["How long have you had braces or aligners?", "Are you experiencing any discomfort from your braces?", "Have you noticed any broken brackets or wires?", "Are you wearing your rubber bands as directed?", "Do you have any sore spots in your mouth?", "Are you brushing around your braces carefully?", "Have you been avoiding hard or sticky foods?", "Are you keeping your aligner wear schedule?", "Have you noticed any changes in your bite?", "Are you using any orthodontic wax for irritation?", lastQ],
  },
  {
    id: "oral-surgery", condition: "Oral Surgery Recovery", category: "Dental", severity: "high",
    questions: ["How many days since your oral surgery?", "Rate your pain level from 1 to 10.", "Are you taking prescribed medications?", "Have you noticed any excessive bleeding?", "Is there significant swelling?", "Are you able to eat soft foods?", "Have you been applying ice packs?", "Do you have any numbness that hasn't resolved?", "Have you had any fever or signs of infection?", "Are you keeping your follow-up appointment?", lastQ],
  },
  {
    id: "dental-emergency", condition: "Dental Emergency", category: "Dental", severity: "critical",
    questions: ["What type of dental emergency are you experiencing?", "Are you in severe pain?", "Have you lost a tooth or crown?", "Is there active bleeding?", "Do you have swelling in your face or jaw?", "Can you breathe and swallow normally?", "Have you injured your jaw or mouth?", "Do you have a dental abscess?", "Are you able to see a dentist today?", "Have you taken any pain medication?", lastQ],
  },
  {
    id: "periodontal", condition: "Periodontal / Gum Disease Follow-up", category: "Dental", severity: "moderate",
    questions: ["Are you experiencing any gum pain or sensitivity?", "Do your gums bleed when brushing or flossing?", "Have you noticed gum recession?", "Do you have persistent bad breath?", "Have you noticed any pus between teeth and gums?", "Are any teeth feeling loose?", "Are you using any prescribed mouth rinse?", "Have you been keeping your periodontal maintenance schedule?", "Do you smoke or use tobacco products?", "Have you noticed any changes in how your teeth fit together?", lastQ],
  },
  {
    id: "pediatric-dental", condition: "Pediatric Dental Check", category: "Dental", severity: "low",
    questions: ["How old is your child?", "Has your child been brushing with supervision?", "Is your child complaining of any tooth pain?", "Have you noticed any cavities or discoloration?", "Is your child eating and drinking normally?", "Has your child had any dental injuries from falls?", "Is your child thumb-sucking or using a pacifier?", "Have you started flossing your child's teeth?", "When was the last dental visit?", "Any concerns about your child's dental development?", lastQ],
  },
  {
    id: "cosmetic-dental", condition: "Cosmetic Dentistry Consultation", category: "Dental", severity: "low",
    questions: ["What concerns do you have about your smile?", "Are you considering teeth whitening?", "Are you interested in veneers or bonding?", "Have you had any previous cosmetic dental work?", "Are you happy with the shape of your teeth?", "Do you have gaps between your teeth?", "Are your teeth stained or discolored?", "Are you considering orthodontic treatment?", "Do you have any dental anxiety?", "What is your budget for cosmetic treatment?", lastQ],
  },
];
