import mongoose from "mongoose";
import ClinicalTemplate from "../models/ClinicalTemplate.js";
import { REPORT_TEMPLATES } from "../config/reportTemplates.js";

async function seedTemplates() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  let created = 0;
  let skipped = 0;

  for (const [specialty, config] of Object.entries(REPORT_TEMPLATES)) {
    const name = `${config.label} Note Template`;

    const existing = await ClinicalTemplate.findOne({ specialty, isBuiltIn: true, name });
    if (existing) {
      skipped++;
      continue;
    }

    const sections = config.sections || [];
    const subjectiveFields = sections.filter((s) => ["chiefComplaint", "hpi", "history", "pmh", "ros", "birthHistory", "developmentalMilestones", "cardiacHistory", "riskFactors", "psychiatricHistory", "substanceUse", "socialHistory", "dentalHistory", "medicalHistory", "referralHistory", "signalment", "husbandry"].includes(s.id));
    const objectiveFields = sections.filter((s) => ["vitals", "physicalExam", "diagnosticTests", "neuroExam", "skinExam", "jointExam", "eyeExam", "slitLamp", "fundoscopy", "entExam", "imaging", "labs", "pft", "endoscopy", "pathology", "periodontalChart", "radiographs", "intraoralExam", "records", "specialtyExam", "tpr"].includes(s.id));

    await ClinicalTemplate.create({
      specialty,
      name,
      description: `${config.label} clinical note template following ${config.standard}`,
      subjectivePrompt: `Document ${subjectiveFields.map((s) => s.label).join(", ")}. ${subjectiveFields.map((s) => s.description).join(" ")}`,
      objectivePrompt: `Document ${objectiveFields.map((s) => s.label).join(", ")}. ${objectiveFields.map((s) => s.description).join(" ")}`,
      assessmentPrompt: `Provide assessment with ICD-10 codes. Include problem list, differential diagnoses, severity/staging. ${config.assessmentScales?.length ? `Use these scales: ${config.assessmentScales.map((s) => `${s.label} (${s.description})`).join(", ")}` : ""}`,
      planPrompt: `Document treatment plan including: medications with dosages, procedures, follow-up interval, patient education. ${config.clinicType === "veterinary" ? "INCLUDE DRUG WITHDRAWAL TIMES for meat and milk." : ""} ${config.clinicType === "dental" ? "Use CDT codes for dental procedures with ADA tooth numbering." : "Use CPT codes where applicable."}`,
      commonDiagnoses: (config.commonIcd10 || []).slice(0, 10).map((c) => ({ code: c, name: `${config.label} related diagnosis` })),
      commonOrders: [...new Set(["CBC", "CMP", ...relevantOrdersForSpecialty(specialty)])],
      isBuiltIn: true,
      isActive: true,
    });

    created++;
    console.log(`Created template: ${name}`);
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
}

function relevantOrdersForSpecialty(specialty) {
  const orders = {
    "cardiology": ["ECG", "Echocardiogram", "Lipid Panel", "BNP", "Troponin"],
    "pediatrics": ["Growth Chart", "Developmental Screening", "Lead Level"],
    "neurology": ["MRI Brain", "EEG", "CT Head"],
    "psychiatry": ["PHQ-9", "GAD-7", "C-SSRS", "MSE"],
    "therapy": ["Functional Assessment", "ROM Measurement", "MMT"],
    "gastroenterology": ["EGD", "Colonoscopy", "H. pylori Test", "Celiac Panel"],
    "endocrinology": ["HbA1c", "TSH", "FT4", "Vitamin D"],
    "oncology": ["CBC with Diff", "Tumor Markers", "CT Scan"],
    "rheumatology": ["RF", "CCP", "ANA", "CRP", "ESR"],
    "nephrology": ["BUN/Creatinine", "GFR", "Electrolytes", "Urinalysis"],
    "pulmonology": ["Spirometry", "Chest X-Ray", "O2 Sat"],
    "ophthalmology": ["Visual Acuity", "IOP", "OCT", "Visual Fields"],
    "ent": ["Audiometry", "Tympanometry", "CT Sinus"],
    "general-dentistry": ["BWX", "PA", "Panoramic", "Periodontal Charting"],
    "orthodontics": ["Cephalometric X-ray", "Panoramic", "Study Models", "Photos"],
    "endodontics": ["PA X-ray", "CBCT", "Cold Test", "EPT"],
    "periodontics": ["Full Perio Chart", "CBCT", "Radiographic Bone Assessment"],
    "oral-surgery": ["Panoramic", "CBCT", "CT Scan"],
    "prosthodontics": ["Diagnostic Casts", "Facebow Transfer", "Shade Selection"],
    "pediatric-dentistry": ["BWX", "Panoramic", "Caries Risk Assessment"],
    "small-animal": ["CBC", "Chemistry Panel", "Urinalysis", "Heartworm Test"],
    "equine": ["CBC", "Chemistry", "Coggins Test", "Fecal", "Radiographs"],
    "exotic-pets": ["Fecal Exam", "CBC", "Chemistry Panel", "Radiographs"],
    "large-animal": ["CBC", "Chemistry", "Fecal Float", "Milk Culture"],
    "vet-specialty": ["MRI", "CT", "Arthroscopy", "Biopsy"],
  };
  const defaultOrders = ["CBC", "CMP", "Imaging as indicated"];
  return orders[specialty] || defaultOrders;
}

seedTemplates().catch(console.error);
