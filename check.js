var p = db.patients.find({name:/Test/},{name:1,phone:1,callInstructions:1}).toArray();
p.forEach(function(x){
  print(x.name + " | " + x.phone + " | hasInstr: " + !!(x.callInstructions && x.callInstructions.templateName));
});
print("Total test patients: " + p.length);
