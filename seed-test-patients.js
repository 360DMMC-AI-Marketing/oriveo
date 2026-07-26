var now = new Date();
var tomorrow = new Date(now.getTime() + 24*60*60*1000);
var nextWeek = new Date(now.getTime() + 7*24*60*60*1000);

var admin = db.users.findOne({email: "anassamiri87@gmail.com"});
var userId = admin ? admin._id : null;
var orgId = admin ? admin.organization : null;

var patients = [
  { name: "Ahmed Test - Diabetes", phone: "+212600100001", primaryDiagnosis: "Type 2 Diabetes", callInstructions: {
    templateId: "diabetes-followup", templateName: "Diabetes Follow-up",
    notes: "Check HbA1c results. Ask about insulin timing and any low blood sugar episodes. Review meal planning.",
    setBy: userId, setAt: now, expiresAt: tomorrow
  }},
  { name: "Fatima Test - Heart", phone: "+212600100002", primaryDiagnosis: "Post-CABG Recovery", callInstructions: {
    templateId: "cardiac-recovery", templateName: "Cardiac Recovery Follow-up",
    notes: "Check chest pain levels. Verify cardiac rehab attendance. Ask about shortness of breath during exercise.",
    setBy: userId, setAt: now, expiresAt: nextWeek
  }},
  { name: "Omar Test - Mental Health", phone: "+212600100003", primaryDiagnosis: "Major Depressive Disorder", callInstructions: {
    templateId: "mental-health", templateName: "Mental Health Check-in",
    notes: "Screen PHQ-9. Ask about sleep patterns and medication side effects. Check for suicidal ideation.",
    setBy: userId, setAt: now, expiresAt: tomorrow
  }},
  { name: "Khadija Test - Pregnancy", phone: "+212600100004", primaryDiagnosis: "32 weeks pregnant", callInstructions: {
    templateId: "prenatal-checkup", templateName: "Prenatal Check-up",
    notes: "Ask about fetal movement. Check for swelling/edema. Discuss birth plan preparation.",
    setBy: userId, setAt: now, expiresAt: nextWeek
  }},
  { name: "Youssef Test - Asthma", phone: "+212600100005", primaryDiagnosis: "Moderate Persistent Asthma", callInstructions: {
    templateId: "respiratory-followup", templateName: "Respiratory Follow-up",
    notes: "Check inhaler usage frequency. Ask about nighttime symptoms. Review peak flow readings.",
    setBy: userId, setAt: now, expiresAt: tomorrow
  }},
  { name: "Sara Test - No Instructions", phone: "+212600100006", primaryDiagnosis: "Annual Physical" },
  { name: "Karim Test - Dental", phone: "+212600100007", primaryDiagnosis: "Periodontal Disease", callInstructions: {
    templateId: "perio-maintenance", templateName: "Periodontal Maintenance",
    notes: "Ask about gum bleeding. Check if patient is flossing. Verify next cleaning appointment.",
    setBy: userId, setAt: now, expiresAt: tomorrow
  }},
  { name: "Layla Test - Pediatric", phone: "+212600100008", primaryDiagnosis: "Child wellness 5yr" },
];

patients.forEach(function(p) {
  var doc = {
    name: p.name,
    phone: p.phone,
    primaryDiagnosis: p.primaryDiagnosis || "",
    language: "en",
    patientType: "human",
    organization: orgId,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    chronicConditions: "",
    allergies: "",
    currentMedications: "",
    pastSurgeries: "",
    medicalNotes: ""
  };
  if (p.callInstructions) {
    doc.callInstructions = p.callInstructions;
  }
  var result = db.patients.insertOne(doc);
  print("Created: " + p.name + (p.callInstructions ? " (with instructions)" : " (no instructions)") + " _id=" + result.insertedId);
});

print("\nDone! 8 test patients created.");
