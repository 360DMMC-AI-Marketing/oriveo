var now = new Date();
var tomorrow = new Date(now.getTime() + 24*60*60*1000);
var dayAfter = new Date(now.getTime() + 2*24*60*60*1000);

var scheduledCalls = [
  { patientId: "6a65e05d6bf9d39cab4a1cfe", time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0) },
  { patientId: "6a65e05d6bf9d39cab4a1cff", time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0) },
  { patientId: "6a65e05d6bf9d39cab4a1d00", time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0) },
  { patientId: "6a65e05d6bf9d39cab4a1d01", time: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 9, 0) },
  { patientId: "6a65e05d6bf9d39cab4a1d02", time: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 10, 30) },
  { patientId: "6a65e05d6bf9d39cab4a1d04", time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0) },
];

scheduledCalls.forEach(function(sc) {
  db.calls.insertOne({
    patient: ObjectId(sc.patientId),
    status: "scheduled",
    scheduledAt: sc.time,
    language: "en",
    aiSeverityScore: 0,
    emergencyActionTaken: "none",
    createdAt: now,
    updatedAt: now
  });
});

print("Created " + scheduledCalls.length + " scheduled calls for test patients.");
