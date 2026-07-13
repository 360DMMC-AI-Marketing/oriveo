const bcrypt = require("bcryptjs");
bcrypt.hash("demo123", 12).then(h => console.log(h));
