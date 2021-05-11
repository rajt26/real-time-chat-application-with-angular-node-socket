const express = require("express");
const bcrypt = require("bcrypt-nodejs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode");
const router = express.Router();
const User = require("../models/userauth.model");
const queryHandler = require("../handlers/queryHandlers");
const passwordHash = require("../utils/password-hash");

// this.app.post("/usernameAvailable", routeHandler.userNameCheckHandler);

// this.app.post("/register", routeHandler.registerRouteHandler);

// this.app.post("/login", routeHandler.loginRouteHandler);

router.post("/signup", async (req, res) => {
  const data = {
    username: req.body.username.toLowerCase(),
    password: req.body.password,
    email: req.body.email,
    name: req.body.name,
  };
  if (data.username === "") {
    res.status(401).json({
      error: true,
      message: "CONSTANTS.USERNAME_NOT_FOUND",
    });
  } else if (data.password === "") {
    res.status(401).json({
      error: true,
      message: "CONSTANTS.PASSWORD_NOT_FOUND",
    });
  } else {
    try {
      data.online = "Y";
      data.socketId = "";
      data.password = passwordHash.createHash(data.password);
      const result = await queryHandler.registerUser(data);
      if (result === null || result === undefined) {
        res.status(400).json({
          error: false,
          message: "CONSTANTS.USER_REGISTRATION_FAILED",
        });
      } else {
        res.status(200).json({
          error: false,
          userId: result.insertedId,
          message: "CONSTANTS.USER_REGISTRATION_OK",
        });
      }
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "CONSTANTS.SERVER_ERROR_MESSAGE",
      });
    }
  }
});

router.post("/getMessages", async (request, response) => {
  let userId = request.body.userId;
  let toUserId = request.body.toUserId;
  if (userId == "") {
    response.status(401).json({
      error: true,
      message: "CONSTANTS.USERID_NOT_FOUND",
    });
  } else {
    try {
      const messagesResponse = await queryHandler.getMessages({
        userId: userId,
        toUserId: toUserId,
      });
      response.status(200).json({
        error: false,
        messages: messagesResponse,
      });
    } catch (error) {
      response.status(401).json({
        error: true,
        messages: "CONSTANTS.USER_NOT_LOGGED_IN",
      });
    }
  }
});

router.post("/login", async function (req, res) {
  // console.log("dsdsdsdsds");
  const data = {
    email: req.body.email.toLowerCase(),
    password: req.body.password,
  };
  if (data.email === "" || data.email === null) {
    res.status(401).json({
      error: true,
      message: "CONSTANTS.USERNAME_NOT_FOUND",
    });
  } else if (data.password === "" || data.password === null) {
    res.status(401).json({
      error: true,
      message: "CONSTANTS.PASSWORD_NOT_FOUND",
    });
  } else {
    try {
      const result = await queryHandler.getUserByUsername(data.email);
      if (result === null || result === undefined) {
        res.status(401).json({
          error: true,
          message: "CONSTANTS.USER_LOGIN_FAILED",
        });
      } else {
        if (passwordHash.compareHash(data.password, result.password)) {
          await queryHandler.makeUserOnline(result._id);
          res.status(200).json({
            error: false,
            userId: result._id,
            username: result.username,
            message: "CONSTANTS.USER_LOGIN_OK",
          });
        } else {
          res.status(401).json({
            error: true,
            message: "CONSTANTS.USER_LOGIN_FAILED",
          });
        }
      }
    } catch (error) {
      console.log("error", error);
      res.status(401).json({
        error: true,
        message: "CONSTANTS.USER_LOGIN_FAILED",
      });
    }
  }
});

module.exports = router;
