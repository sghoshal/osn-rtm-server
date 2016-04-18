"use strict";

var express = require('express');
var randtoken = require('rand-token');
var mongoose = require('mongoose');

var mongoModel = require('../models/mongo.js');

var router = express.Router();

// Generate a 16 character alpha-numeric token
router.get('/', function(req, res, next) {
  var token = randtoken.generate(16);

  res.render('registerBot', { botToken: token });
});

router.post('/', function(req, res, next) {
  console.log("Body: " + JSON.stringify(req.body));
   
  // Here I should ideally create an user in OSN first.
  // But OSN REST API does not have a handler for creating users
  // in the DB realm. This needs to be figured out. (TODO).
  
  var bot = new mongoModel.Bots({
    'token': req.body.botToken,
    'userName': req.body.botUserName,
    'botServerUrl': req.body.botServerUrl
  });
  
  bot.save(function(err, bot) {
    if (err) {
      console.log("Error in saving bot credentials.");
      if (err.code === 11000) {
        console.log("Credentials already exist");
      }
    }
    else {
      res.redirect('../');
    }
  });
});

module.exports = router;