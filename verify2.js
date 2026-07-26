// Show the 5 seeded patients with instructions
var patients = db.patients.find({"callInstructions.templateName": {$ne: ""}}, {name: 1, "callInstructions.templateName": 1, "callInstructions.notes": 1, "callInstructions.expiresAt": 1}).toArray();
patients.forEach(function(p) {
  print(p.name + " | " + p.callInstructions.templateName + " | " + p.callInstructions.notes.substring(0, 60) + "... | expires: " + p.callInstructions.expiresAt);
});
print("\nTotal patients with instructions: " + patients.length);
