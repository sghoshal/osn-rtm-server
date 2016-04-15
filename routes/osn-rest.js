"use strict";

var request = require('request');
var express = require('express');

var router = express.Router();

var osnHost = 'http://localhost';
var osnPort = 8080;
var osnContext = '/osn';
var osnRestPath = '/social/api/v1';

var osnRestFullPath = osnHost + ':' + osnPort.toString() + osnContext + osnRestPath;
var connectionsEndPoint = osnRestFullPath + '/connections';
var conversationsEndPoint = osnRestFullPath + '/conversations';


module.exports.postMessageToOSN = function(userName, password, conversationId, message, callback) {
  console.log("Connections end point: " + connectionsEndPoint);

  var invalidParamsMsg = checkValidParams(userName, password, conversationId, message);
  
  if (typeof invalidParamsMsg !== 'undefined') {
    callback(invalidParamsMsg);
    return;
  }
  
  getConnectionAndCreateMessage(userName, password, conversationId, message, callback);
}
            
function getConnectionAndCreateMessage(userName, password, conversationId, message, callback) {
  var apiRandomId;
  var cookie;

  request.post({
    headers: {
      'Content-type': 'application/json'
    },
    url: connectionsEndPoint,
    json: {
      name: userName,
      password: password
    }
  }, function(err, response, body) {
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
        
        createMessage(apiRandomId, cookie, conversationId, message, callback);
      }
  });
}


function createMessage(apiRandomId, cookie, convId, message, callback) {
  
  var messagesEndPoint = conversationsEndPoint + '/' + convId.toString() + '/messages';
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
        callback(err, response, body);
     }
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


function checkValidParams(userName, password, conversationId, message) {

  if (typeof userName === 'undefined') {
    return "Username is not specified. Aborting REST call to OSN";
  }

  if (typeof password === 'undefined') {
    return "Password is not specified. Aborting REST call to OSN";
  }

  if (typeof conversationId === 'undefined') {
    return "Conversation ID not specified. Aborting REST call to OSN";
  }

  if (typeof message === 'undefined') {
    return "Message not specified. Aborting REST call to OSN.";
  }

  return;
}