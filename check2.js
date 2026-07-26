// Check admin's org
var admin = db.users.findOne({email: "anassamiri87@gmail.com"});
print("Admin org: " + JSON.stringify(admin.organization));

// Check test patients' orgs
var pts = db.patients.find({name:/Test/},{name:1,organization:1}).toArray();
pts.forEach(function(p) {
  print(p.name + " | org: " + JSON.stringify(p.organization));
});
