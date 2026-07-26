var now = new Date();
var tomorrow = new Date(now.getTime() + 24*60*60*1000);
var nextWeek = new Date(now.getTime() + 7*24*60*60*1000);

db.patients.updateOne({_id: ObjectId("6a55dc3d3d54ae13e1e3acbd")}, {$set: {
  callInstructions: {
    templateId: "diabetes-followup",
    templateName: "Diabetes Follow-up",
    notes: "Check HbA1c trends. Ask about insulin adherence and any hypoglycemic episodes. Review diet compliance.",
    setBy: null,
    setAt: now,
    expiresAt: tomorrow
  }
}});

db.patients.updateOne({_id: ObjectId("6a55dc3d3d54ae13e1e3acc0")}, {$set: {
  callInstructions: {
    templateId: "hypertension-monitor",
    templateName: "Hypertension Monitoring",
    notes: "Ask about daily BP readings. Verify medication compliance. Discuss salt intake and exercise.",
    setBy: null,
    setAt: now,
    expiresAt: nextWeek
  }
}});

db.patients.updateOne({_id: ObjectId("6a55dc3d3d54ae13e1e3acc3")}, {$set: {
  callInstructions: {
    templateId: "post-surgery-followup",
    templateName: "Post-Surgery Follow-up",
    notes: "Check wound healing progress. Ask about pain levels and medication. Confirm follow-up appointment.",
    setBy: null,
    setAt: now,
    expiresAt: tomorrow
  }
}});

db.patients.updateOne({_id: ObjectId("6a55dc3d3d54ae13e1e3acc6")}, {$set: {
  callInstructions: {
    templateId: "mental-health",
    templateName: "Mental Health Check-in",
    notes: "Screen for depression/anxiety. Ask about sleep quality and medication side effects.",
    setBy: null,
    setAt: now,
    expiresAt: nextWeek
  }
}});

db.patients.updateOne({_id: ObjectId("6a55dc3d3d54ae13e1e3acc9")}, {$set: {
  callInstructions: {
    templateId: "cardiac-recovery",
    templateName: "Cardiac Recovery Follow-up",
    notes: "Post-MI recovery check. Ask about chest pain, shortness of breath. Verify cardiac rehab attendance.",
    setBy: null,
    setAt: now,
    expiresAt: tomorrow
  }
}});

print("Done! Seeded call instructions on 5 patients.");
