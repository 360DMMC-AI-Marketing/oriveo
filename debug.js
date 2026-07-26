// Check the patient cache issue and verify data
var admin = db.users.findOne({email: "anassamiri87@gmail.com"});
print("Admin org: " + JSON.stringify(admin.organization));
print("Admin role: " + admin.role);
print("Admin id: " + admin._id);

var totalPatients = db.patients.countDocuments({organization: admin.organization});
print("Total patients in org: " + totalPatients);

var testPatients = db.patients.find({name:/Test/},{name:1,phone:1,organization:1,callInstructions:1}).toArray();
print("Test patients found: " + testPatients.length);
testPatients.forEach(function(p) {
  print("  " + p.name + " | org: " + p.organization + " | instr: " + !!(p.callInstructions && p.callInstructions.templateName));
});
