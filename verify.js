print("Patients with instructions: " + db.patients.countDocuments({"callInstructions.templateName": {$ne: ""}}));
print("Scheduled calls: " + db.calls.countDocuments({status: "scheduled"}));
