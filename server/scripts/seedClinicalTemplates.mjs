import mongoose from "mongoose";
import ClinicalTemplate from "../models/ClinicalTemplate.js";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";

const BUILT_IN_TEMPLATES = [
  {
    name: "General Checkup",
    specialty: "general",
    description: "Standard annual physical examination",
    subjectivePrompt: "Chief complaint / reason for visit:\nHistory of present illness:\nPast medical history:",
    objectivePrompt: "Vital signs:\nGeneral appearance:\nHEENT:\nCardiovascular:\nRespiratory:\nAbdomen:\nExtremities:\nNeurological:",
    assessmentPrompt: "Assessment / diagnosis:\nDifferential diagnoses:",
    planPrompt: "Treatment plan:\nMedications:\nLifestyle modifications:\nFollow-up:\nPatient instructions:",
    commonDiagnoses: [
      { code: "Z00.00", name: "General medical examination" },
      { code: "I10", name: "Essential hypertension" },
      { code: "E78.5", name: "Hyperlipidemia" },
      { code: "E11.9", name: "Type 2 diabetes mellitus" },
    ],
    commonMedications: [
      { name: "Lisinopril", dose: "10mg", route: "oral", frequency: "daily" },
      { name: "Metformin", dose: "500mg", route: "oral", frequency: "BID" },
      { name: "Atorvastatin", dose: "20mg", route: "oral", frequency: "daily" },
    ],
    commonOrders: ["CBC", "CMP", "Lipid panel", "HbA1c", "TSH", "Urinalysis", "EKG"],
  },
  {
    name: "Hypertension Follow-up",
    specialty: "cardiology",
    description: "Routine hypertension management visit",
    subjectivePrompt: "Blood pressure logs since last visit:\nCurrent symptoms (chest pain, SOB, palpitations, edema):\nMedication adherence:\nSide effects:",
    objectivePrompt: "Vital signs (including orthostatic BPs):\nCardiovascular exam:\nPedal edema:\nLung auscultation:\nWeight:",
    assessmentPrompt: "Blood pressure control status:\nRisk assessment:\nMedication adjustments needed:",
    planPrompt: "Medication changes:\nLifestyle counseling:\nFollow-up interval:\nLabs ordered:",
    commonDiagnoses: [
      { code: "I10", name: "Essential hypertension" },
      { code: "I11.9", name: "Hypertensive heart disease" },
      { code: "N18.9", name: "Chronic kidney disease" },
    ],
    commonMedications: [
      { name: "Amlodipine", dose: "5mg", route: "oral", frequency: "daily" },
      { name: "Losartan", dose: "50mg", route: "oral", frequency: "daily" },
      { name: "Hydrochlorothiazide", dose: "25mg", route: "oral", frequency: "daily" },
      { name: "Metoprolol", dose: "25mg", route: "oral", frequency: "BID" },
    ],
    commonOrders: ["CMP", "Urinalysis", "EKG", "Echocardiogram"],
  },
  {
    name: "Diabetes Management",
    specialty: "endocrinology",
    description: "Diabetes follow-up and medication management",
    subjectivePrompt: "Blood glucose logs:\nHypoglycemic episodes:\nDiet and exercise:\nMedication adherence:\nComplications (vision, feet, neuropathy):",
    objectivePrompt: "Vital signs:\nWeight/BMI:\nFoot examination:\nFundoscopic exam:\nSkin exam:",
    assessmentPrompt: "Glycemic control assessment:\nComplications screening:\nA1c goal adjustment:",
    planPrompt: "Medication adjustment:\nDietary counseling:\nExercise plan:\nReferrals needed:\nFollow-up:",
    commonDiagnoses: [
      { code: "E11.9", name: "Type 2 diabetes without complications" },
      { code: "E10.9", name: "Type 1 diabetes without complications" },
      { code: "E11.21", name: "Diabetes with diabetic nephropathy" },
      { code: "E11.51", name: "Diabetes with peripheral angiopathy" },
    ],
    commonMedications: [
      { name: "Metformin", dose: "1000mg", route: "oral", frequency: "BID" },
      { name: "Insulin Glargine", dose: "20 units", route: "subcutaneous", frequency: "daily" },
      { name: "Semaglutide", dose: "0.5mg", route: "subcutaneous", frequency: "weekly" },
      { name: "Empagliflozin", dose: "10mg", route: "oral", frequency: "daily" },
    ],
    commonOrders: ["HbA1c", "CMP", "Urinalysis", "Microalbumin", "Lipid panel", "Foot exam"],
  },
  {
    name: "Dental Examination",
    specialty: "dentistry",
    description: "Comprehensive oral examination",
    subjectivePrompt: "Chief complaint:\nDental history:\nOral hygiene routine:\nPain assessment:\nBleeding gums:\nSensitivity:",
    objectivePrompt: "Extraoral exam:\nIntraoral soft tissue exam:\nPeriodontal probing:\nCaries assessment:\nOcclusion:\nRestorations present:\nRadiographic findings:",
    assessmentPrompt: "Diagnosis:\nPeriodontal status:\nCaries risk assessment:\nOral cancer screening:",
    planPrompt: "Treatment plan:\nRestorative procedures:\nPeriodontal therapy:\nOral hygiene instructions:\nFollow-up schedule:",
    commonDiagnoses: [
      { code: "K02.9", name: "Dental caries, unspecified" },
      { code: "K05.30", name: "Chronic periodontitis" },
      { code: "K04.0", name: "Pulpitis" },
      { code: "K08.101", name: "Complete edentulism" },
    ],
    commonOrders: ["Panoramic radiograph", "Bitewings", "Periapical radiograph", "Cone beam CT"],
  },
  {
    name: "Orthopedic Evaluation",
    specialty: "orthopedics",
    description: "Musculoskeletal complaint evaluation",
    subjectivePrompt: "Chief complaint (pain location, onset, duration):\nMechanism of injury:\nAggravating/relieving factors:\nFunctional limitations:\nPrevious treatments:",
    objectivePrompt: "Gait assessment:\nRange of motion:\nStrength testing:\nSpecial tests:\nPalpation:\nNeurovascular exam:",
    assessmentPrompt: "Diagnosis:\nFracture classification (if applicable):\nSurgical vs non-surgical decision:",
    planPrompt: "Immobilization:\nPhysical therapy:\nMedications:\nActivity restrictions:\nFollow-up imaging:\nSurgical plan (if indicated):",
    commonDiagnoses: [
      { code: "M54.5", name: "Low back pain" },
      { code: "M17.9", name: "Osteoarthritis of knee" },
      { code: "S52.509A", name: "Radius fracture" },
      { code: "S72.009A", name: "Femur fracture" },
    ],
    commonMedications: [
      { name: "Ibuprofen", dose: "600mg", route: "oral", frequency: "TID" },
      { name: "Acetaminophen", dose: "650mg", route: "oral", frequency: "QID" },
      { name: "Naproxen", dose: "500mg", route: "oral", frequency: "BID" },
    ],
    commonOrders: ["X-ray affected joint", "MRI", "CT scan", "Bone density scan"],
  },
  {
    name: "Pediatric Well-Child Visit",
    specialty: "pediatrics",
    description: "Routine well-child checkup and developmental screening",
    subjectivePrompt: "Parent concerns:\nFeeding/nutrition:\nSleep patterns:\nDevelopmental milestones:\nBehavior:\nVaccination status:\nSchool performance:",
    objectivePrompt: "Growth parameters (weight, height, head circumference):\nVital signs:\nDevelopmental screening:\nVision/hearing screening:\nPhysical exam by system:",
    assessmentPrompt: "Growth assessment:\nDevelopmental status:\nNutritional status:\nImmunization review:",
    planPrompt: "Immunizations given:\nAnticipatory guidance:\nNutrition counseling:\nSafety counseling:\nNext well-child visit:",
    commonDiagnoses: [
      { code: "Z00.129", name: "Routine child health examination" },
      { code: "Z23", name: "Encounter for immunization" },
      { code: "H66.9", name: "Otitis media" },
    ],
    commonOrders: ["Hemoglobin", "Lead screening", "Developmental screening tool"],
  },
  {
    name: "Veterinary Wellness Exam",
    specialty: "veterinary",
    description: "Annual wellness examination for companion animals",
    subjectivePrompt: "Owner concerns:\nDiet and appetite:\nWater consumption:\nActivity level:\nBowel/bladder habits:\nVaccination history:\nParasite prevention:",
    objectivePrompt: "Body condition score:\nTemperature:\nHeart rate/rhythm:\nRespiratory rate:\nOral health:\nEyes/ears:\nCoat/skin:\nMusculoskeletal:",
    assessmentPrompt: "Overall health status:\nDental disease severity:\nParasite status:\nWeight management needs:",
    planPrompt: "Vaccinations due:\nParasite prevention:\nDental recommendations:\nDietary recommendations:\nFollow-up schedule:",
    commonDiagnoses: [
      { code: "Z00.00", name: "Wellness exam" },
      { code: "K02.9", name: "Dental disease" },
      { code: "L20.9", name: "Dermatitis" },
    ],
    commonOrders: ["Heartworm test", "Fecal exam", "Blood chemistry", "CBC"],
  },
  {
    name: "Acute Respiratory Infection",
    specialty: "general",
    description: "URI / bronchitis / pneumonia evaluation",
    subjectivePrompt: "Onset and duration:\nCough (productive/dry):\nFever:\nSore throat:\nNasal congestion:\nChest pain:\nSOB:\nSmoking history:\nExposures:",
    objectivePrompt: "Vital signs:\nO2 saturation:\nHEENT:\nLung auscultation:\nCardiac exam:\nChest wall tenderness:",
    assessmentPrompt: "Diagnosis:\nSeverity assessment:\nViral vs bacterial decision:",
    planPrompt: "Symptom management:\nAntibiotics (if indicated):\nWhen to return:\nWork/school note:\nFollow-up:",
    commonDiagnoses: [
      { code: "J06.9", name: "Acute URI" },
      { code: "J20.9", name: "Acute bronchitis" },
      { code: "J15.9", name: "Bacterial pneumonia" },
      { code: "J02.9", name: "Acute pharyngitis" },
    ],
    commonMedications: [
      { name: "Amoxicillin", dose: "875mg", route: "oral", frequency: "BID" },
      { name: "Azithromycin", dose: "250mg", route: "oral", frequency: "daily" },
      { name: "Dextromethorphan/guaifenesin", dose: "10mL", route: "oral", frequency: "Q4H" },
    ],
    commonOrders: ["Chest X-ray", "CBC with diff", "Rapid strep", "COVID-19 test", "Influenza test"],
  },
  {
    name: "Mental Health Assessment",
    specialty: "general",
    description: "Initial mental health evaluation or follow-up",
    subjectivePrompt: "Chief concern:\nMood and affect:\nSleep:\nAppetite:\nEnergy:\nAnxiety levels:\nSuicidal ideation (screened):\nSubstance use:\nStressors:",
    objectivePrompt: "Mental status exam:\nAppearance:\nBehavior:\nSpeech:\nMood/Affect:\nThought process:\nCognition:\nInsight/Judgment:",
    assessmentPrompt: "Diagnosis:\nSeverity:\nRisk assessment (suicide/homicide):\nFunctional impairment:",
    planPrompt: "Medication start/adjustment:\nTherapy referral:\nCrisis plan:\nSafety plan:\nFollow-up interval:",
    commonDiagnoses: [
      { code: "F32.9", name: "Major depressive disorder" },
      { code: "F41.1", name: "Generalized anxiety disorder" },
      { code: "F41.9", name: "Anxiety disorder" },
    ],
    commonMedications: [
      { name: "Sertraline", dose: "50mg", route: "oral", frequency: "daily" },
      { name: "Escitalopram", dose: "10mg", route: "oral", frequency: "daily" },
      { name: "Bupropion", dose: "150mg", route: "oral", frequency: "daily" },
    ],
    commonOrders: ["PHQ-9", "GAD-7", "CBC", "TSH", "Vitamin D", "B12"],
  },
  {
    name: "Post-Operative Follow-up",
    specialty: "general",
    description: "Surgical follow-up and wound check",
    subjectivePrompt: "Pain level:\nWound appearance:\nFever/Chills:\nBowel/bladder function:\nActivity level:\nAppetite:",
    objectivePrompt: "Vital signs:\nIncision/wound inspection:\nDressing condition:\nSigns of infection:\nEdema:\nDrain output:",
    assessmentPrompt: "Wound healing status:\nComplications:\nPain control adequacy:",
    planPrompt: "Wound care instructions:\nActivity restrictions:\nMedication changes:\nSuture/staple removal:\nFollow-up:",
    commonDiagnoses: [
      { code: "Z48.00", name: "Encounter for surgical aftercare" },
      { code: "T81.49XA", name: "Wound infection" },
      { code: "L02.91", name: "Wound dehiscence" },
    ],
    commonMedications: [
      { name: "Acetaminophen", dose: "650mg", route: "oral", frequency: "Q4H PRN" },
      { name: "Ibuprofen", dose: "600mg", route: "oral", frequency: "TID" },
    ],
    commonOrders: ["Wound culture", "CBC", "CRP"],
  },
];

async function seed() {
  const uri = process.argv[2] || MONGO_URI;
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB: ${uri}`);

  const existing = await ClinicalTemplate.countDocuments({ isBuiltIn: true });
  if (existing > 0) {
    console.log(`Already have ${existing} built-in templates. Dropping and reseeding...`);
    await ClinicalTemplate.deleteMany({ isBuiltIn: true });
  }

  const docs = BUILT_IN_TEMPLATES.map((t) => ({
    ...t,
    organization: null,
    createdBy: null,
    isBuiltIn: true,
    isActive: true,
  }));

  const result = await ClinicalTemplate.insertMany(docs);
  console.log(`Seeded ${result.length} built-in clinical templates`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
