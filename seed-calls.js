var now = new Date();
var tomorrow = new Date(now.getTime() + 24*60*60*1000);
var dayAfter = new Date(now.getTime() + 2*24*60*60*1000);
var nextWeek = new Date(now.getTime() + 7*24*60*60*1000);

var patients = db.patients.find({}).toArray();
var user = db.users.findOne({role: "admin"});
var userId = user ? user._id : null;

// Scheduled calls for tomorrow
var callPatients = [
  { patient: ObjectId("6a55dc3d3d54ae13e1e3acbd"), questionnaire: "diabetes-followup", qTitle: "Diabetes Follow-up" },
  { patient: ObjectId("6a55dc3d3d54ae13e1e3acc0"), questionnaire: "hypertension-monitor", qTitle: "Hypertension Monitoring" },
  { patient: ObjectId("6a55dc3d3d54ae13e1e3acc3"), questionnaire: "post-surgery-followup", qTitle: "Post-Surgery Follow-up" },
];

// Scheduled calls for day after tomorrow
var callPatients2 = [
  { patient: ObjectId("6a55dc3d3d54ae13e1e3acc6"), questionnaire: "mental-health", qTitle: "Mental Health Check-in" },
  { patient: ObjectId("6a55dc3d3d54ae13e1e3acc9"), questionnaire: "cardiac-recovery", qTitle: "Cardiac Recovery Follow-up" },
];

callPatients.forEach(function(cp) {
  db.calls.insertOne({
    patient: cp.patient,
    questionnaire: cp.qTitle,
    status: "scheduled",
    scheduledAt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
    language: "en",
    aiSeverityScore: 0,
    emergencyActionTaken: "none",
    createdAt: now,
    updatedAt: now
  });
});

callPatients2.forEach(function(cp) {
  db.calls.insertOne({
    patient: cp.patient,
    questionnaire: cp.qTitle,
    status: "scheduled",
    scheduledAt: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 14, 0),
    language: "en",
    aiSeverityScore: 0,
    emergencyActionTaken: "none",
    createdAt: now,
    updatedAt: now
  });
});

print("Done! Created 5 scheduled calls (3 tomorrow, 2 day-after-tomorrow).");
