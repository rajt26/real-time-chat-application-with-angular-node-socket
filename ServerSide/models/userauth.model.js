var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.set("useCreateIndex", true);

var signupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});
var Users = mongoose.model("users", signupSchema);
module.exports = Users;
