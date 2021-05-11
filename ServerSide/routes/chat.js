var express = require("express");
var router = express.Router();
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var cors = require("cors");
var mongoose = require("mongoose");
const queryHandler = require("../handlers/queryHandlers");
const { ObjectID } = require("bson");
server.listen(4000, function (req, res) {
  console.log("Socket You are listening to port 4000");
});

io.origins("*:*");
var users = 0;

io.on("connection", function (socket) {
  console.log("User connected", socket.id);
  io.use(async (socket, next) => {
    try {
      await queryHandler.addSocketId({
        userId: socket.request._query["userId"],
        socketId: socket.id,
      });
      next();
    } catch (error) {
      // Error
      console.error(error);
    }
  });
  // socket.on("disconnect", function (socket) {
  //   console.log("user disconnected");
  // });
  //join room
  socket.on("join", function (data) {
    //display the number of users in room
    users += 1;
    console.log(users);
    io.sockets.emit("usercount", { count: users + " person joined " });
    //end

    // user joining the particular room
    socket.join(data.room);

    console.log(data.user + "joined the room:" + data.room);

    //inform other on the room about event
    socket.broadcast.to(data.room).emit("new user joined", {
      user: data.user,
      message: "has joined this room ",
    });
  });
  //leave room
  socket.on("leave", function (data) {
    //number of users in room
    users--;
    io.sockets.emit("usercount", { count: "" + users });
    console.log(users);
    //end

    console.log(data.user + "has left the room " + data.room);
    socket.broadcast
      .to(data.room)
      .emit("left room", { user: data.user, message: "has left the room " });
    socket.leave(data.room);
  });

  socket.on(`add-message`, async (data) => {
    if (data.message === "") {
      io.to(socket.id).emit(`add-message-data`, {
        error: true,
        message: "CONSTANTS.MESSAGE_NOT_FOUND",
      });
    } else if (data.fromUserId === "") {
      io.to(socket.id).emit(`add-message-data`, {
        error: true,
        message: "CONSTANTS.SERVER_ERROR_MESSAGE",
      });
    } else if (data.toUserId === "") {
      io.to(socket.id).emit(`add-message-data`, {
        error: true,
        message: "CONSTANTS.SELECT_USER",
      });
    } else {
      try {
        const [toSocketId, messageResult] = await Promise.all([
          queryHandler.getUserInfo({
            userId: data.toUserId,
            socketId: true,
          }),
          queryHandler.insertMessages(data),
        ]);
        console.log("emit", data, socket.id);
        io.to(toSocketId).emit("add-message-data", data);
      } catch (error) {
        console.log("error", error);
        io.to(socket.id).emit(`add-message-data`, {
          error: true,
          message: "CONSTANTS.MESSAGE_STORE_ERROR",
        });
      }
    }
  });

  //sending message
  socket.on("message", function (data) {
    io.in(data.room).emit("new message", {
      user: data.user,
      message: data.message,
    });
  });

  socket.on(`chat-list`, async (data) => {
    console.log("data", data);
    if (data.userId == "") {
      io.emit(`chat-list-response`, {
        error: true,
        message: CONSTANTS.USER_NOT_FOUND,
      });
    } else {
      try {
        const [UserInfoResponse, chatlistResponse] = await Promise.all([
          queryHandler.getUserInfo({
            userId: ObjectID(data.userId),
            socketId: false,
          }),
          queryHandler.getChatList(socket.id),
        ]);
        io.to(socket.id).emit(`chat-list-response`, {
          error: false,
          singleUser: false,
          chatList: chatlistResponse,
        });
        socket.broadcast.emit(`chat-list-response`, {
          error: false,
          singleUser: true,
          chatList: UserInfoResponse,
        });
      } catch (error) {
        io.to(socket.id).emit(`chat-list-response`, {
          error: true,
          chatList: [],
        });
      }
    }
  });

  socket.on("logout", async (data) => {
    try {
      const userId = data.userId;
      await queryHandler.logout(userId);
      io.to(socket.id).emit(`logout-response`, {
        error: false,
        message: CONSTANTS.USER_LOGGED_OUT,
        userId: userId,
      });

      socket.broadcast.emit(`chat-list-response`, {
        error: false,
        userDisconnected: true,
        userid: userId,
      });
    } catch (error) {
      io.to(socket.id).emit(`logout-response`, {
        error: true,
        message: CONSTANTS.SERVER_ERROR_MESSAGE,
        userId: userId,
      });
    }
  });
  socket.on("disconnect", async () => {
    socket.broadcast.emit(`chat-list-response`, {
      error: false,
      userDisconnected: true,
      userid: socket.request._query["userId"],
    });
  });
});

module.exports = router;
