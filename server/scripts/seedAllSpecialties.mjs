import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/oriveo";

const CLINIC_TYPES = ["human", "dental", "veterinary"];

const SPECIALTIES = {
  human: [
    { id: "general-practice", label: "General Practice / Family Medicine" },
    { id: "cardiology", label: "Cardiology" },
    { id: "pediatrics", label: "Pediatrics" },
    { id: "neurology", label: "Neurology" },
    { id: "psychiatry", label: "Psychiatry / Behavioral Health" },
    { id: "dermatology", label: "Dermatology" },
    { id: "therapy", label: "Physical / Occupational / Speech Therapy" },
    { id: "gastroenterology", label: "Gastroenterology" },
    { id: "endocrinology", label: "Endocrinology" },
    { id: "oncology", label: "Oncology" },
    { id: "rheumatology", label: "Rheumatology" },
    { id: "nephrology", label: "Nephrology" },
    { id: "pulmonology", label: "Pulmonology" },
    { id: "ophthalmology", label: "Ophthalmology" },
    { id: "ent", label: "ENT / Otolaryngology" },
  ],
  dental: [
    { id: "general-dentistry", label: "General Dentistry" },
    { id: "orthodontics", label: "Orthodontics" },
    { id: "endodontics", label: "Endodontics" },
    { id: "periodontics", label: "Periodontics" },
    { id: "oral-surgery", label: "Oral Surgery" },
    { id: "prosthodontics", label: "Prosthodontics" },
    { id: "pediatric-dentistry", label: "Pediatric Dentistry" },
  ],
  veterinary: [
    { id: "small-animal", label: "Small Animal (Dogs & Cats)" },
    { id: "equine", label: "Equine (Horses)" },
    { id: "exotic-pets", label: "Exotic Pets (Avian, Reptile, Mammal)" },
    { id: "large-animal", label: "Large Animal (Bovine, Ovine)" },
    { id: "mixed-animal", label: "Mixed Animal Practice" },
    { id: "vet-specialty", label: "Veterinary Specialty (Surgery/Ophthalmology)" },
  ],
};

const PATIENT_TEMPLATES = {
  "general-practice": [
    { name: "John Smith", gender: "male", age: 45, dx: "Type 2 Diabetes", meds: "Metformin 500mg", allergies: "Penicillin", chronic: "Hypertension, High cholesterol" },
    { name: "Mary Johnson", gender: "female", age: 34, dx: "Hypothyroidism", meds: "Levothyroxine 75mcg", allergies: "None", chronic: "None" },
    { name: "Robert Brown", gender: "male", age: 62, dx: "COPD", meds: "Tiotropium 18mcg", allergies: "Codeine", chronic: "Chronic bronchitis" },
    { name: "Lisa Davis", gender: "female", age: 28, dx: "Migraine", meds: "Sumatriptan 50mg PRN", allergies: "Ibuprofen", chronic: "None" },
  ],
  cardiology: [
    { name: "James Wilson", gender: "male", age: 58, dx: "Coronary Artery Disease", meds: "Atorvastatin 40mg, Aspirin 81mg", allergies: "None", chronic: "Hypertension" },
    { name: "Patricia Moore", gender: "female", age: 65, dx: "Heart Failure (CHF)", meds: "Furosemide 40mg, Metoprolol 25mg", allergies: "Sulfa", chronic: "Diabetes, AFib" },
    { name: "Richard Taylor", gender: "male", age: 72, dx: "Atrial Fibrillation", meds: "Apixaban 5mg, Digoxin 0.125mg", allergies: "None", chronic: "Hypertension" },
    { name: "Susan Anderson", gender: "female", age: 55, dx: "Hypertensive Urgency", meds: "Lisinopril 20mg, Amlodipine 5mg", allergies: "None", chronic: "Diabetes" },
  ],
  pediatrics: [
    { name: "Emma Thompson", gender: "female", age: 6, dx: "Recurrent URTI", meds: "None", allergies: "Amoxicillin", chronic: "Mild asthma" },
    { name: "Noah Garcia", gender: "male", age: 3, dx: "Acute Otitis Media", meds: "None", allergies: "None", chronic: "Eczema" },
    { name: "Sophia Martinez", gender: "female", age: 10, dx: "ADHD", meds: "Methylphenidate 10mg", allergies: "None", chronic: "None" },
  ],
  neurology: [
    { name: "Michael Brown", gender: "male", age: 50, dx: "Multiple Sclerosis", meds: "Interferon beta-1a", allergies: "None", chronic: "None" },
    { name: "Jennifer White", gender: "female", age: 38, dx: "Chronic Migraine", meds: "Topiramate 50mg", allergies: "Sumatriptan", chronic: "Anxiety" },
    { name: "David Lee", gender: "male", age: 68, dx: "Parkinson's Disease", meds: "Levodopa/Carbidopa 25/100mg", allergies: "None", chronic: "Hypertension" },
  ],
  psychiatry: [
    { name: "Sarah Miller", gender: "female", age: 32, dx: "Major Depressive Disorder", meds: "Sertraline 100mg", allergies: "None", chronic: "GAD" },
    { name: "Daniel Clark", gender: "male", age: 41, dx: "Bipolar I Disorder", meds: "Lithium 900mg", allergies: "None", chronic: "None" },
    { name: "Emily Turner", gender: "female", age: 26, dx: "Panic Disorder", meds: "Escitalopram 20mg", allergies: "None", chronic: "None" },
  ],
  dermatology: [
    { name: "Kevin Hall", gender: "male", age: 35, dx: "Psoriasis", meds: "Topical betamethasone", allergies: "None", chronic: "None" },
    { name: "Amanda Wright", gender: "female", age: 24, dx: "Severe Acne", meds: "Isotretinoin 20mg", allergies: "None", chronic: "None" },
    { name: "Steven King", gender: "male", age: 55, dx: "Basal Cell Carcinoma (follow-up)", meds: "None", allergies: "None", chronic: "None" },
  ],
  therapy: [
    { name: "Nancy Adams", gender: "female", age: 60, dx: "Post-TKR Rehabilitation", meds: "Acetaminophen PRN", allergies: "NSAIDs", chronic: "Osteoarthritis" },
    { name: "Brian Scott", gender: "male", age: 45, dx: "Lower Back Pain", meds: "None", allergies: "None", chronic: "None" },
    { name: "Margaret Hill", gender: "female", age: 52, dx: "Stroke Recovery", meds: "Clopidogrel 75mg", allergies: "None", chronic: "Hypertension" },
  ],
  gastroenterology: [
    { name: "Thomas Green", gender: "male", age: 44, dx: "GERD", meds: "Omeprazole 20mg", allergies: "None", chronic: "Hiatal hernia" },
    { name: "Rebecca Baker", gender: "female", age: 38, dx: "Celiac Disease", meds: "None", allergies: "Gluten", chronic: "None" },
    { name: "George Nelson", gender: "male", age: 55, dx: "Ulcerative Colitis", meds: "Mesalamine 2.4g", allergies: "Sulfa", chronic: "Anemia" },
  ],
  endocrinology: [
    { name: "Laura Collins", gender: "female", age: 48, dx: "Type 1 Diabetes", meds: "Insulin Lispro, Insulin Glargine", allergies: "None", chronic: "Celiac disease" },
    { name: "Edward Reed", gender: "male", age: 58, dx: "Hyperthyroidism (Graves')", meds: "Methimazole 10mg", allergies: "None", chronic: "Atrial fibrillation" },
    { name: "Helen Cooper", gender: "female", age: 35, dx: "PCOS", meds: "Metformin 1000mg", allergies: "None", chronic: "None" },
  ],
  oncology: [
    { name: "Robert Kelly", gender: "male", age: 62, dx: "Lung Cancer (NSCLC) — Chemo Follow-up", meds: "Pembrolizumab", allergies: "None", chronic: "COPD" },
    { name: "Diane Foster", gender: "female", age: 55, dx: "Breast Cancer — Post-Mastectomy Follow-up", meds: "Letrozole 2.5mg", allergies: "None", chronic: "None" },
    { name: "Peter Mitchell", gender: "male", age: 70, dx: "Prostate Cancer — Active Surveillance", meds: "None", allergies: "None", chronic: "Hypertension" },
  ],
  rheumatology: [
    { name: "Karen Turner", gender: "female", age: 45, dx: "Rheumatoid Arthritis", meds: "Methotrexate 15mg, Prednisone 5mg", allergies: "None", chronic: "None" },
    { name: "William Cox", gender: "male", age: 52, dx: "Ankylosing Spondylitis", meds: "Adalimumab 40mg", allergies: "None", chronic: "None" },
    { name: "Betty Gray", gender: "female", age: 38, dx: "Systemic Lupus (SLE)", meds: "Hydroxychloroquine 200mg", allergies: "Sulfa", chronic: "None" },
  ],
  nephrology: [
    { name: "Frank Wood", gender: "male", age: 65, dx: "CKD Stage 3", meds: "Lisinopril 10mg", allergies: "None", chronic: "Diabetes, Hypertension" },
    { name: "Sharon Price", gender: "female", age: 58, dx: "End Stage Renal Disease (Dialysis)", meds: "Sevelamer 800mg, Epoetin alfa", allergies: "None", chronic: "Diabetes" },
    { name: "Joseph Ward", gender: "male", age: 48, dx: "Nephrotic Syndrome", meds: "Furosemide 40mg, Prednisone 20mg", allergies: "Penicillin", chronic: "None" },
  ],
  pulmonology: [
    { name: "Charles Barnes", gender: "male", age: 67, dx: "Severe Asthma", meds: "Fluticasone/Salmeterol 250/50", allergies: "Aspirin", chronic: "GERD" },
    { name: "Dorothy Ross", gender: "female", age: 72, dx: "Idiopathic Pulmonary Fibrosis", meds: "Pirfenidone 801mg", allergies: "None", chronic: "None" },
    { name: "Patrick Hayes", gender: "male", age: 55, dx: "Obstructive Sleep Apnea", meds: "None (uses CPAP)", allergies: "None", chronic: "Obesity, Hypertension" },
  ],
  ophthalmology: [
    { name: "Mildred Cook", gender: "female", age: 70, dx: "Cataract (Pre-op)", meds: "None", allergies: "None", chronic: "Diabetes" },
    { name: "Ruth Bell", gender: "female", age: 62, dx: "Glaucoma", meds: "Latanoprost 0.005% drops", allergies: "None", chronic: "None" },
    { name: "Samuel Bailey", gender: "male", age: 45, dx: "Diabetic Retinopathy Screening", meds: "Insulin", allergies: "None", chronic: "Type 1 Diabetes" },
  ],
  ent: [
    { name: "Albert Cooper", gender: "male", age: 35, dx: "Chronic Sinusitis", meds: "Fluticasone nasal spray", allergies: "Dust mites", chronic: "None" },
    { name: "Virginia Morgan", gender: "female", age: 28, dx: "Allergic Rhinitis", meds: "Cetirizine 10mg", allergies: "Pollen, Mold", chronic: "None" },
    { name: "Howard Murphy", gender: "male", age: 58, dx: "Sudden Sensorineural Hearing Loss", meds: "Prednisone 60mg taper", allergies: "None", chronic: "Hypertension" },
  ],
  "general-dentistry": [
    { name: "Carol Peterson", gender: "female", age: 34, dx: "Dental Caries (Multiple)", meds: "None", allergies: "Lidocaine", chronic: "None" },
    { name: "Donald Reed", gender: "male", age: 45, dx: "Gingivitis", meds: "None", allergies: "None", chronic: "Diabetes" },
    { name: "Sandra Foster", gender: "female", age: 52, dx: "Crown Re-cementation", meds: "None", allergies: "None", chronic: "None" },
  ],
  orthodontics: [
    { name: "Jennifer Lee", gender: "female", age: 16, dx: "Malocclusion Class II", meds: "None", allergies: "Latex", chronic: "None" },
    { name: "Michael Torres", gender: "male", age: 14, dx: "Crowding", meds: "None", allergies: "None", chronic: "None" },
    { name: "Ashley Kim", gender: "female", age: 24, dx: "Retainer Check", meds: "None", allergies: "None", chronic: "None" },
  ],
  endodontics: [
    { name: "Mark Rivera", gender: "male", age: 38, dx: "Pulpitis (Tooth #19)", meds: "Ibuprofen 600mg", allergies: "None", chronic: "None" },
    { name: "Laura Bennett", gender: "female", age: 45, dx: "Root Canal Follow-up (#14)", meds: "Amoxicillin 500mg", allergies: "Penicillin", chronic: "None" },
    { name: "Jason Hughes", gender: "male", age: 30, dx: "Apical Abscess", meds: "Clindamycin 300mg", allergies: "Penicillin", chronic: "None" },
  ],
  periodontics: [
    { name: "Susan Price", gender: "female", age: 55, dx: "Severe Periodontitis", meds: "Chlorhexidine mouthwash", allergies: "None", chronic: "Diabetes" },
    { name: "Thomas Ward", gender: "male", age: 62, dx: "Gum Recession", meds: "None", allergies: "None", chronic: "None" },
    { name: "Martha Cook", gender: "female", age: 48, dx: "Periodontal Maintenance", meds: "None", allergies: "None", chronic: "None" },
  ],
  "oral-surgery": [
    { name: "Ryan Brooks", gender: "male", age: 22, dx: "Impacted Wisdom Teeth (All Four)", meds: "None", allergies: "Penicillin", chronic: "None" },
    { name: "Heather Diaz", gender: "female", age: 28, dx: "Jaw Cyst Excision Follow-up", meds: "Acetaminophen/Hydrocodone", allergies: "None", chronic: "None" },
    { name: "Gary Phillips", gender: "male", age: 50, dx: "Dental Implant Evaluation", meds: "None", allergies: "None", chronic: "Hypertension" },
  ],
  prosthodontics: [
    { name: "Dorothy Bell", gender: "female", age: 68, dx: "Complete Dentures (New)", meds: "None", allergies: "None", chronic: "None" },
    { name: "Richard Cox", gender: "male", age: 72, dx: "Implant-Supported Bridge", meds: "Apixaban 5mg", allergies: "None", chronic: "AFib" },
    { name: "Nancy Hayes", gender: "female", age: 60, dx: "Denture Reline", meds: "None", allergies: "None", chronic: "None" },
  ],
  "pediatric-dentistry": [
    { name: "Oliver Ward", gender: "male", age: 7, dx: "Cavity (Tooth K, L)", meds: "None", allergies: "None", chronic: "None" },
    { name: "Sophie Turner", gender: "female", age: 5, dx: "Routine Checkup", meds: "None", allergies: "None", chronic: "None" },
    { name: "Liam Brooks", gender: "male", age: 9, dx: "Sealant Application", meds: "None", allergies: "None", chronic: "Mild asthma" },
  ],
  "small-animal": [
    { name: "Buddy (Golden Retriever)", gender: "male", age: 7, dx: "Hip Dysplasia (Canine)", meds: "Carprofen 100mg", allergies: "None", chronic: "None", petType: "dog", breed: "Golden Retriever" },
    { name: "Mittens (Domestic Cat)", gender: "female", age: 5, dx: "Chronic Kidney Disease (Feline)", meds: "Amlodipine 0.625mg", allergies: "None", chronic: "None", petType: "cat", breed: "DSH" },
    { name: "Max (German Shepherd)", gender: "male", age: 4, dx: "Annual Vaccination", meds: "Heartworm prevention", allergies: "None", chronic: "None", petType: "dog", breed: "German Shepherd" },
  ],
  equine: [
    { name: "Thunder (Quarter Horse)", gender: "male", age: 12, dx: "Lameness (Left Forelimb)", meds: "Phenylbutazone 2g", allergies: "None", chronic: "None", petType: "horse", breed: "Quarter Horse" },
    { name: "Daisy (Thoroughbred Mare)", gender: "female", age: 9, dx: "Equine Influenza Vaccination", meds: "None", allergies: "None", chronic: "None", petType: "horse", breed: "Thoroughbred" },
    { name: "Shadow (Arabian Gelding)", gender: "male", age: 15, dx: "Dental Float", meds: "None", allergies: "None", chronic: "Cushing's disease", petType: "horse", breed: "Arabian" },
  ],
  "exotic-pets": [
    { name: "Kiwi (Blue & Gold Macaw)", gender: "female", age: 20, dx: "Feather Plucking", meds: "None", allergies: "None", chronic: "None", petType: "bird", breed: "Blue & Gold Macaw" },
    { name: "Spike (Bearded Dragon)", gender: "male", age: 4, dx: "Metabolic Bone Disease", meds: "Calcium + D3 supplement", allergies: "None", chronic: "None", petType: "reptile", breed: "Bearded Dragon" },
    { name: "Coco (Guinea Pig)", gender: "female", age: 2, dx: "Upper Respiratory Infection", meds: "Enrofloxacin 5mg/kg", allergies: "None", chronic: "None", petType: "mammal", breed: "Guinea Pig" },
  ],
  "large-animal": [
    { name: "Bessie (Holstein Cow)", gender: "female", age: 5, dx: "Mastitis", meds: "Ceftiofur 2.2mg/kg", allergies: "None", chronic: "None", petType: "bovine", breed: "Holstein" },
    { name: "Woolly (Sheep)", gender: "female", age: 3, dx: "Foot Rot", meds: "Oxytetracycline", allergies: "None", chronic: "None", petType: "ovine", breed: "Suffolk" },
  ],
  "mixed-animal": [
    { name: "Rocky (Bernese Mountain Dog)", gender: "male", age: 6, dx: "Elbow Dysplasia", meds: "Galliprant 60mg", allergies: "None", chronic: "None", petType: "dog", breed: "Bernese Mountain Dog" },
    { name: "Luna (Flemish Giant Rabbit)", gender: "female", age: 3, dx: "GI Stasis", meds: "Metoclopramide", allergies: "None", chronic: "None", petType: "mammal", breed: "Flemish Giant" },
    { name: "Dolly (Pygmy Goat)", gender: "female", age: 4, dx: "Hoof Trimming & Vaccination", meds: "None", allergies: "None", chronic: "None", petType: "caprine", breed: "Pygmy Goat" },
  ],
  "vet-specialty": [
    { name: "Zeus (Great Dane)", gender: "male", age: 8, dx: "Gastric Dilatation-Volvulus (Post-op)", meds: "Omeprazole 20mg, Metronidazole 250mg", allergies: "None", chronic: "None", petType: "dog", breed: "Great Dane" },
    { name: "Oreo (Domestic Cat)", gender: "male", age: 6, dx: "Feline Odontoclastic Resorptive Lesion", meds: "Buprenorphine 0.01mg/kg", allergies: "None", chronic: "None", petType: "cat", breed: "Domestic Shorthair" },
    { name: "Apollo (Miniature Poodle)", gender: "male", age: 10, dx: "Cataract Surgery Evaluation", meds: "None", allergies: "None", chronic: "Diabetes", petType: "dog", breed: "Miniature Poodle" },
  ],
};

const CALL_SCRIPTS = {
  human: [
    [
      { question: "Hello, this is Oriveo Clinic calling for your routine checkup. How are you feeling today?", answer: "I'm doing alright, thanks." },
      { question: "Glad to hear that. Have you had any new symptoms or concerns since your last visit?", answer: "Nothing major. A little tired lately but that's probably just work." },
      { question: "Are you taking your medications as prescribed?", answer: "Yes, every day like I'm supposed to." },
      { question: "Have you noticed any side effects from the medication?", answer: "None at all. I feel fine." },
      { question: "Do you have any questions or concerns you'd like to discuss with your doctor?", answer: "No, I think everything is fine. Thanks for calling." },
    ],
    [
      { question: "Hello, this is Oriveo Clinic calling with your health checkup. How are you doing today?", answer: "Not great, actually. I've been having some issues." },
      { question: "I'm sorry to hear that. Can you tell me what's been bothering you?", answer: "I've had some pain and discomfort. It's been affecting my daily activities." },
      { question: "I understand. How long has this been going on?", answer: "About a week now. It's getting worse instead of better." },
      { question: "Are you taking anything for the pain or discomfort?", answer: "Just over-the-counter stuff. It helps a little but not much." },
      { question: "I think you should come in for an evaluation. Let me schedule you an appointment.", answer: "Yes, please do. I think I need to be seen." },
    ],
    [
      { question: "Hello, this is an automated follow-up from Oriveo Clinic. Are you available to speak?", answer: "Yes, I'm available. Go ahead." },
      { question: "How have you been managing since your last appointment?", answer: "Pretty well. Following the treatment plan as discussed." },
      { question: "Have you been monitoring your symptoms?", answer: "Yes, I keep a daily log. Things have been stable." },
      { question: "When was your last lab work done?", answer: "About 2 months ago. Results were normal." },
      { question: "Great to hear. We'll schedule your next follow-up in 3 months. Take care!", answer: "Thank you. Have a good day." },
    ],
  ],
  dental: [
    [
      { question: "Hello, this is Oriveo Dental Care calling. How are you doing today?", answer: "Good thanks, how are you?" },
      { question: "Great! This is your appointment reminder. You have a checkup scheduled next week.", answer: "Perfect. I'll be there." },
      { question: "Have you had any tooth pain or sensitivity recently?", answer: "No, everything feels fine." },
      { question: "Any bleeding when you brush or floss?", answer: "Sometimes a little, but not much." },
      { question: "Good. We'll see you at your appointment. Please remember to bring your insurance card.", answer: "Will do. Thanks!" },
    ],
    [
      { question: "Hello, this is Oriveo Dental Care. I'm calling for your follow-up.", answer: "Hi, thanks for calling." },
      { question: "How is your recovery going since the procedure?", answer: "Much better. The pain has subsided significantly." },
      { question: "Have you been taking the prescribed medication?", answer: "Yes, as directed." },
      { question: "Any swelling, bleeding, or other concerns?", answer: "No swelling. Minimal bleeding the first day, now it's stopped." },
      { question: "Excellent. That sounds like normal healing. Let's schedule your follow-up in 2 weeks.", answer: "Sounds good. Thank you." },
    ],
    [
      { question: "Hello, this is Oriveo Dental Care with a checkup call.", answer: "Hi there." },
      { question: "How have your teeth and gums been since your last visit?", answer: "I've noticed some sensitivity in my back tooth when I drink cold things." },
      { question: "That could indicate a cavity or gum recession. How long has this been happening?", answer: "About 2 weeks now." },
      { question: "We should take a look at that. Let me schedule you for an exam.", answer: "Yes, please. I've been worried about it." },
    ],
  ],
  veterinary: [
    [
      { question: "Hello, this is Oriveo Veterinary Clinic calling about your pet. How are they doing?", answer: "They're doing well, thanks!" },
      { question: "Glad to hear it! This is a routine wellness check follow-up.", answer: "Great. No issues at all." },
      { question: "Has your pet been eating and drinking normally?", answer: "Yes, good appetite and water intake." },
      { question: "Any changes in behavior, activity level, or bathroom habits?", answer: "None at all. Everything is normal." },
      { question: "Wonderful. We'll see you at the next scheduled visit.", answer: "Thank you. See you then." },
    ],
    [
      { question: "Hello, this is Oriveo Veterinary Clinic. How is your pet feeling today?", answer: "I'm a bit worried. They haven't been themselves lately." },
      { question: "I'm sorry to hear that. What symptoms have you noticed?", answer: "They've been lethargic and not eating as much as usual." },
      { question: "How long has this been going on?", answer: "About 3-4 days now." },
      { question: "Have there been any vomiting, diarrhea, or changes in thirst?", answer: "No vomiting. Slightly less drinking." },
      { question: "We should schedule an appointment to check them out. I'll book you in.", answer: "Yes, please. I'm worried." },
    ],
    [
      { question: "Hello, this is Oriveo Veterinary Clinic with a post-treatment follow-up.", answer: "Hi, thanks for checking in." },
      { question: "How is your pet recovering since the procedure?", answer: "Recovering well. Much more active now." },
      { question: "Are you administering all medications as prescribed?", answer: "Yes, on schedule." },
      { question: "Is the incision site healing well? Any redness or discharge?", answer: "Looks clean and dry. No issues." },
      { question: "Excellent. Keep up the good care. We'll see you for the suture removal.", answer: "Thank you. Will do." },
    ],
  ],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function rn(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function randomDate(daysBack) {
  const now = Date.now();
  const past = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function slugify(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function makePhone() { return `+1555${String(rn(100, 999))}${String(rn(1000, 9999))}`; }

function getAge(dob) { return Math.floor((new Date() - new Date(dob)) / 31557600000); }

function makeDob(age) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(rn(0, 11));
  d.setDate(rn(1, 28));
  return d;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");
  const db = mongoose.connection.db;

  let totalOrgs = 0, totalUsers = 0, totalPatients = 0, totalCalls = 0, totalAppts = 0;
  let totalReports = 0, totalRecords = 0, totalVitals = 0, totalGroups = 0, totalNotes = 0;

  for (const clinicType of CLINIC_TYPES) {
    const specialties = SPECIALTIES[clinicType];
    for (const spec of specialties) {
      const specId = spec.id;
      const specLabel = spec.label;
      const slug = specId;
      const email = `${specId}@oriveo.io`;
      const orgName = `${specLabel} Clinic`;
      console.log(`\n═══ ${orgName} (${email}) ═══`);

      // ── Skip if already exists ──
      const existingOrg = await db.collection("organizations").findOne({ slug });
      if (existingOrg) {
        console.log(`  SKIP: ${orgName} already exists`);
        continue;
      }

      // ── 1. Organization ──
      const orgRes = await db.collection("organizations").insertOne({
        name: orgName, slug,
        clinicType, clinicSize: "large",
        specialty: specId,
        settings: { timezone: "America/New_York", defaultLanguage: "en" },
        billingSetup: { codeSet: clinicType === "human" ? "cpt" : clinicType === "dental" ? "cdt" : "mixed" },
        createdAt: new Date(), updatedAt: new Date(),
      });
      const orgId = orgRes.insertedId;
      totalOrgs++;

      // ── 2. Subscription ──
      await db.collection("subscriptions").insertOne({
        organization: orgId,
        plan: "pro", status: "active",
        limits: { users: 25, patients: 5000, monthlyCalls: 10000 },
        currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        createdAt: new Date(),
      });

      // ── 3. Users ──
      const password = await bcrypt.hash("demo123", 10);
      const userRes = await db.collection("users").insertOne({
        name: `${specLabel} Admin`, email, password,
        role: "admin", organization: orgId,
        specialty: [specId],
        phone: makePhone(), isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      });
      const userId = userRes.insertedId;
      totalUsers++;

      // Doctor user
      await db.collection("users").insertOne({
        name: `${specLabel} Doctor`, email: `doctor.${specId}@oriveo.io`, password,
        role: "doctor", organization: orgId,
        specialty: [specId],
        phone: makePhone(), isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      });

      // Nurse user
      await db.collection("users").insertOne({
        name: `${specLabel} Nurse`, email: `nurse.${specId}@oriveo.io`, password,
        role: "nurse", organization: orgId,
        specialty: [specId],
        phone: makePhone(), isActive: true,
        createdAt: new Date(), updatedAt: new Date(),
      });

      console.log(`  Created org + admin (${email} / demo123) + doctor + nurse`);

      // ── 4. Patients ──
      const patientTemplates = PATIENT_TEMPLATES[specId] || PATIENT_TEMPLATES["general-practice"];
      const useVet = clinicType === "veterinary";
      const callScripts = CALL_SCRIPTS[clinicType === "dental" ? "dental" : clinicType === "veterinary" ? "veterinary" : "human"];

      const patientIds = [];
      for (const pt of patientTemplates) {
        const dob = makeDob(pt.age);
        const patientDoc = {
          name: pt.name, phone: makePhone(),
          gender: pt.gender || "male", dob,
          language: "en",
          primaryDiagnosis: pt.dx,
          chronicConditions: pt.chronic || "None",
          allergies: pt.allergies || "None",
          currentMedications: pt.meds || "None",
          medicalNotes: "Routine follow-up",
          bloodType: pick(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
          specialty: specId,
          patientType: clinicType === "veterinary" ? "pet" : "human",
          organization: orgId, createdBy: userId,
          isActive: true, createdAt: new Date(), updatedAt: new Date(),
        };
        if (useVet) {
          patientDoc.species = pt.petType || "dog";
          patientDoc.breed = pt.breed || "Mixed";
          patientDoc.ownerName = `${pt.name.split("(")[0].trim()} Owner`;
          patientDoc.ownerPhone = makePhone();
        }
        const pRes = await db.collection("patients").insertOne(patientDoc);
        patientIds.push(pRes.insertedId);
        console.log(`  Patient: ${pt.name}`);
      }
      totalPatients += patientIds.length;

      // ── 5. Medical Records ──
      for (const pid of patientIds) {
        const recTypes = ["diagnosis", "medication", "allergy", "lab", "surgery", "imaging"];
        for (let i = 0; i < rn(2, 4); i++) {
          await db.collection("medicalrecords").insertOne({
            patient: pid, organization: orgId, createdBy: userId,
            type: pick(recTypes),
            title: `${pick(["Initial", "Follow-up", "Annual"])} ${pick(["Evaluation", "Screening", "Assessment"])}`,
            description: `Medical record entry for ${specLabel} patient`,
            date: randomDate(180),
            provider: `${specLabel} Clinic`,
            notes: "Patient stable. Continue current management.",
            createdAt: new Date(), updatedAt: new Date(),
          });
          totalRecords++;
        }
      }
      console.log(`  Medical records created`);

      // ── 6. Vital Signs ──
      for (const pid of patientIds) {
        for (let i = 0; i < rn(1, 2); i++) {
          const record = {};
          if (clinicType !== "veterinary") {
            record.bloodPressureSystolic = rn(100, 160);
            record.bloodPressureDiastolic = rn(60, 100);
            record.heartRate = rn(60, 100);
            record.temperature = parseFloat((36.5 + Math.random() * 1.5).toFixed(1));
            record.weight = rn(50, 120);
            record.height = rn(150, 190);
            record.spO2 = rn(94, 100);
          } else {
            record.heartRate = rn(60, 140);
            record.temperature = parseFloat((37.5 + Math.random() * 2).toFixed(1));
            record.weight = rn(5, 60);
            record.respiratoryRate = rn(12, 40);
          }
          record.patient = pid;
          record.organization = orgId;
          record.recordedBy = userId;
          record.recordedAt = randomDate(30);
          await db.collection("vitalsigns").insertOne({
            ...record,
            createdAt: new Date(), updatedAt: new Date(),
          });
          totalVitals++;
        }
      }
      console.log(`  Vital signs created`);

      // ── 7. Calls ──
      const questionnaire = await db.collection("questionnaires").findOne({ isDefault: true });
      const qId = questionnaire?._id;

      for (let pi = 0; pi < patientIds.length; pi++) {
        const pid = patientIds[pi];
        const numCalls = rn(1, 2);
        for (let ci = 0; ci < numCalls; ci++) {
          const scriptIdx = ci % callScripts.length;
          const script = callScripts[scriptIdx];
          const severity = rn(2, 9);
          const duration = rn(120, 480);
          const isComplete = Math.random() > 0.3;

          await db.collection("calls").insertOne({
            direction: "outbound",
            organization: orgId,
            patient: pid,
            questionnaire: qId,
            startedBy: userId,
            status: isComplete ? "completed" : "in-progress",
            startedAt: randomDate(30),
            endedAt: isComplete ? new Date() : null,
            duration: isComplete ? duration : null,
            transcript: script,
            aiSummary: script.map(t => t.question).join(" ").substring(0, 120),
            aiSeverityScore: severity,
            aiRecommendations: severity >= 7
              ? "Urgent: Schedule follow-up within 24 hours. Notify attending physician."
              : severity >= 4
                ? "Schedule follow-up in 1 week. Monitor symptoms."
                : "Patient stable. Routine follow-up in 3 months.",
            language: "en",
            patientResponded: true,
            recallCount: 0,
            triageTier: severity >= 7 ? 1 : severity >= 4 ? 2 : 3,
            highestTier: severity >= 7 ? 1 : severity >= 4 ? 2 : 3,
            redFlags: severity >= 7
              ? [{ tier: 0, keyword: "elevated severity", text: "AI severity score >= 7", crisis: false }]
              : severity >= 4
                ? [{ tier: 1, keyword: "moderate", text: "Moderate severity", crisis: false }]
                : [],
            identityVerified: true, consentRecorded: true,
            emotionalState: { primary: "neutral", intensity: rn(1, 5), painLevel: null },
            emergencyDetected: false, emergencyActionTaken: "none",
            createdAt: randomDate(30), updatedAt: new Date(),
          });
          totalCalls++;
        }
      }
      console.log(`  Calls created: ${patientIds.length * 1.5|0}+`);

      // ── 8. Reports (for completed calls) ──
      const completedCalls = await db.collection("calls").find({
        organization: orgId, status: "completed",
        reportGenerated: { $ne: true },
      }).toArray();
      for (const call of completedCalls.slice(0, 4)) {
        const patient = await db.collection("patients").findOne({ _id: call.patient });
        if (!patient) continue;
        await db.collection("reports").insertOne({
          call: call._id, patient: patient._id, generatedBy: userId,
          patientInfo: { name: patient.name, age: getAge(patient.dob), gender: patient.gender, phone: patient.phone },
          chiefComplaint: call.aiSummary?.substring(0, 100) || "Routine checkup",
          symptomsCaptured: call.transcript?.slice(0, 3).map(t => ({ symptom: t.question.substring(0, 30), severity: rn(1, 5) })) || [],
          redFlags: call.redFlags?.map(f => f.keyword) || [],
          triageLevel: call.triageTier,
          triageLabel: call.triageTier <= 0 ? "Emergency" : call.triageTier <= 1 ? "Urgent" : call.triageTier <= 2 ? "Moderate" : "Low",
          aiAssessment: call.aiSummary || "Routine checkup completed. Patient stable.",
          adviceGiven: call.aiRecommendations || "Continue current medications. Follow up as scheduled.",
          medicationsReviewed: patient.currentMedications || "None",
          allergiesFlagged: patient.allergies || "None",
          chronicConditions: patient.chronicConditions || "None",
          keyExchanges: call.transcript?.slice(0, 4).flatMap(t => [
            { speaker: "AI", text: t.question },
            { speaker: "Patient", text: t.answer },
          ]) || [],
          nextSteps: call.aiRecommendations?.split(". ").map(s => s.trim()).filter(Boolean) || ["Schedule follow-up"],
          aiQaScores: { accuracy: rn(75, 98), empathy: rn(70, 95), professionalism: rn(80, 98), adherence: rn(75, 95), resolution: rn(70, 92), overall: rn(75, 95) },
          callSummary: call.aiSummary || "Automated checkup call completed",
          callDuration: call.duration, callDate: call.createdAt,
          doctorSigned: false, digitalSignature: "", signatureTitle: "", doctorNotes: "",
          createdAt: call.createdAt,
        });
        await db.collection("calls").updateOne({ _id: call._id }, { $set: { reportGenerated: true } });
        totalReports++;
      }
      console.log(`  Reports: ${totalReports}`);

      // ── 9. Appointments ──
      const apptTypes = ["in-person", "phone", "video"];
      const apptStatuses = ["scheduled", "confirmed", "completed"];
      for (const pid of patientIds.slice(0, 3)) {
        const patient = await db.collection("patients").findOne({ _id: pid });
        if (!patient) continue;
        const apptDate = new Date();
        apptDate.setDate(apptDate.getDate() + rn(1, 30));
        apptDate.setHours(rn(9, 17), rn(0, 3) * 15, 0, 0);
        await db.collection("appointments").insertOne({
          patient: pid, bookedBy: userId,
          title: `${pick(["Follow-up", "Routine Checkup", "Medication Review", "Test Results Discussion"])} — ${patient.name}`,
          description: pick(["Regular checkup", "Review lab results", "Discuss treatment plan", "Follow up on symptoms"]),
          date: apptDate, duration: pick([15, 30, 45, 60]),
          location: pick(["Main Clinic Room 1", "Main Clinic Room 2", "Phone Call", "Video Call"]),
          type: pick(apptTypes), status: pick(apptStatuses),
          notes: "", reason: pick(["Routine", "Follow-up", "Medication adjustment", "Test results"]),
          reminderSent: Math.random() > 0.5,
          createdAt: randomDate(14), updatedAt: new Date(),
        });
        totalAppts++;
      }
      console.log(`  Appointments created`);

      // ── 10. Groups ──
      for (let gi = 0; gi < 2; gi++) {
        const groupPatientIds = patientIds.slice(0, rn(2, patientIds.length));
        const groupNames = [
          `${specLabel} - ${pick(["Chronic Care", "Post-Op Follow-up", "Annual Screening", "Medication Review"])}`,
          `${specLabel} - ${pick(["High Priority", "Wellness Program", "Patient Education", "Recall"])}`,
        ];
        await db.collection("groups").insertOne({
          name: groupNames[gi], organization: orgId, createdBy: userId,
          members: groupPatientIds.map(p => ({ patient: p, addedAt: new Date() })),
          description: `Patient group for ${specLabel}`,
          tags: [specId, clinicType],
          createdAt: new Date(), updatedAt: new Date(),
        });
        totalGroups++;
      }
      console.log(`  Groups created`);

      // ── 11. Clinical Notes ──
      for (let ni = 0; ni < Math.min(2, patientIds.length); ni++) {
        const pid = patientIds[ni];
        const patient = await db.collection("patients").findOne({ _id: pid });
        if (!patient) continue;
        await db.collection("clinicalnotes").insertOne({
          patient: pid, organization: orgId, createdBy: userId,
          subjective: `${patient.name} reports ${pick(["feeling well", "some improvement", "stable symptoms", "mild discomfort"])}.`,
          objective: `Vitals stable. ${pick(["No acute distress", "Alert and oriented", "Appears well"])}.`,
          assessment: `${patient.primaryDiagnosis} — ${pick(["stable", "improving", "ongoing management", "routine follow-up needed"])}.`,
          plan: `${pick(["Continue current medications", "Adjust medication dose", "Schedule follow-up in 3 months", "Order lab work"])}. ${pick(["Return as needed", "Monitor symptoms", "Patient education provided"])}.`,
          diagnosis: [{ code: pick(["E11.9", "I10", "J45.9", "M06.9", "N18.3"]), description: patient.primaryDiagnosis }],
          medications: patient.currentMedications?.split(", ").map(m => ({ name: m, dosage: "as prescribed" })) || [],
          createdAt: randomDate(30), updatedAt: new Date(),
        });
        totalNotes++;
      }
      console.log(`  Clinical notes created`);

      // ── 12. Audit Logs ──
      const auditActions = ["patient.viewed", "patient.updated", "call.transcript.viewed", "report.generated", "user.login", "appointment.created"];
      for (let i = 0; i < 5; i++) {
        await db.collection("auditlogs").insertOne({
          action: pick(auditActions), userId: userId,
          organization: orgId,
          resourceType: pick(["Patient", "Call", "Report", "Appointment", "User"]),
          resourceId: null,
          details: { timestamp: new Date().toISOString(), specialty: specId },
          ip: "127.0.0.1", userAgent: "Oriveo Seed All Specialties",
          createdAt: randomDate(14),
        });
      }
    }
  }

  // ── Summary ──
  console.log(`\n${"=".repeat(50)}`);
  console.log("✅ SEED COMPLETE — All 28 Specialties");
  console.log(`${"=".repeat(50)}`);
  console.log(`  Organizations: ${totalOrgs}`);
  console.log(`  Users:         ${totalUsers}`);
  console.log(`  Patients:      ${totalPatients}`);
  console.log(`  Calls:         ${totalCalls}`);
  console.log(`  Appointments:  ${totalAppts}`);
  console.log(`  Reports:       ${totalReports}`);
  console.log(`  Medical Recs:  ${totalRecords}`);
  console.log(`  Vital Signs:   ${totalVitals}`);
  console.log(`  Groups:        ${totalGroups}`);
  console.log(`  Clinical Notes: ${totalNotes}`);
  console.log(`\nLogin: {specialty-id}@oriveo.io / demo123`);
  console.log(`Example: general-practice@oriveo.io / demo123`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error("Seed error:", err); process.exit(1); });
