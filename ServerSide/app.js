const express = require("express");
const fs = require("fs");
const path = require("path");
const favicon = require("serve-favicon");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const userRoute = require("./routes/userauth");
const userDemoRoute = require("./routes/user_demo");
const chat = require("./routes/chat");
require("./dbConfig/db");

var app = express();
//connecting to mongodb
//database connection setup
const mongoose = require("mongoose");
// mongoose.Promise = global.Promise;
// mongoose
//   .connect("mongodb://localhost:27017/ChatApplication", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("Connected to MongoDB!!"))
//   .catch((err) => console.log(err));

//middlewares used
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

//create a write stream in append mode
var accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});
//set up the logger
app.use(morgan("combined", { stream: accessLogStream }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "PUT, GET, POST, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  next();
});

var port = process.env.PORT || 3000;
var server = require("http").createServer(app);
var io = require("socket.io")(server);

app.use("/", chat);
app.use("/api", userRoute);
app.use("/api", userDemoRoute);

server.listen(port, function (req, res) {
  console.log("You are listening to port 3000");
});

module.exports = app;
