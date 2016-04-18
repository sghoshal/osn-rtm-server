"use strict";

var request = require('request');
var express = require('express');

var router = express.Router();

var osnRestPath = '/social/api/v1';

module.exports.postMessageToOSN = function(data, callback) {
  console.log("postMessageToOSN - Received data: " + JSON.stringify(data));
  
  var userName = data.botUserName,
      password = data.botPassword, 
      botServerUrl = data.botServerUrl,
      conversationId = data.conversationId,
      message = data.message;
  
  var botServerRestEndPoint = botServerUrl + osnRestPath;
  
  var invalidParamsMsg = checkValidParams(userName, password, botServerRestEndPoint, conversationId, message);
  
  if (typeof invalidParamsMsg !== 'undefined') {
    callback(invalidParamsMsg);
    return;
  }
  
  getConnectionAndCreateMessage(userName, password, botServerRestEndPoint, conversationId, message, callback);
}
 
function getConnectionAndCreateMessage(userName, password, botServerRestEndPoint, conversationId, message, callback) {
  var apiRandomId;
  var cookie;
  
  getConnection(userName, password, botServerRestEndPoint, function(err, response, body) {
      if (err || response.statusCode != 200) {
        printResponseError(err, response);  
        callback(err, response);
      }
      else { 
        console.log('Response: ' + JSON.stringify(response, null, 4));
        console.log('Body: ' + JSON.stringify(body, null, 4));
        
        apiRandomId = body['apiRandomID'];
        cookie = response.headers['set-cookie'].toString().split(';')[0];

        console.log("API Random ID: " + apiRandomId);
        console.log("Cookie: " + cookie);
        
        createMessage(apiRandomId, cookie, botServerRestEndPoint, conversationId, message, callback);
      }
  });
}

function getConnection(userName, password, botServerRestEndPoint, callback) {
  var connectionsUrl = botServerRestEndPoint + '/connections';
  
  console.log("-- Connections end point: " + connectionsUrl);

  request.post({
    headers: {
      'Content-type': 'application/json'
    },
    url: connectionsUrl,
    json: {
      name: userName,
      password: password
    }
  }, function(err, response, body) {
        callback(err, response, body);
  });
}

function createMessage(apiRandomId, cookie, botServerRestEndPoint, convId, message, callback) {
  
  var messagesEndPoint = botServerRestEndPoint + '/conversations/' + convId.toString() + '/messages';
  
  console.log("Messages End Point: " + messagesEndPoint);
  
  console.log("Using Random ID: " + apiRandomId);
  console.log("Using Cookie: " + cookie);
  
  request.post({
    headers: {
      'Content-type': 'application/json',
      'X-Waggle-RandomID': apiRandomId,
      'cookie': cookie.toString()
    },
    url: messagesEndPoint,
    json: {
      message: message,
      cookie: cookie
    }
  }, function(err, response, body) {
       if (err || response.statusCode != 200) {
         printResponseError(err, response);
       }
       else {
          console.log('Response: ' + JSON.stringify(response, null, 4));
          console.log('Body: ' + JSON.stringify(body, null, 4));
       }
       callback(err, response, body);
  });  
}

function printResponseError(err, response) {
  console.log("Uh oh, Something went wrong.");

  if (err) {
    console.log("Error: " + err);
  }
  else {
    console.log("Received a non 200 status code. Response: " + JSON.stringify(response, null, 4));
  }
}


function checkValidParams(userName, password, botServerRestEndPoint, conversationId, message) {

  if (typeof userName === 'undefined') {
    return "Username is not specified. Aborting REST call to OSN";
  }

  if (typeof password === 'undefined') {
    return "Password is not specified. Aborting REST call to OSN";
  }
  
  if (typeof botServerRestEndPoint === 'undefined') {
    return "The Server URL of the bot is not specified. Aborting REST call to OSN";
  }

  if (typeof conversationId === 'undefined') {
    return "Conversation ID not specified. Aborting REST call to OSN";
  }

  if (typeof message === 'undefined') {
    return "Message not specified. Aborting REST call to OSN.";
  }

  return;
}