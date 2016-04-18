var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socketIo = require('socket.io');
var mongoose = require('mongoose');

// MongoDB schema + init code.
mongoose.connect('mongodb://localhost/osnRtm');

var osn = require('./routes/osn-rest');
var registerBot = require('./routes/registerBot');
var mongoModel = require('./models/mongo.js');

var app = express();
var io = socketIo();

app.io = io;

var botsConnected = {};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/registerBot', registerBot);

app.get('/', function(req, res, next) {
  res.render('home');
});

// Test end point.

app.post('/osn', function(req, res, next) {
  osn.postMessageToOSN(req.body, function(err, resp, body) {
    if (err || resp.statusCode != 200) {
      res.send('error' + JSON.stringify(err));
    }
    else {
      res.send(JSON.stringify(resp, null, 4));
    }
  });
});

app.post('/bot', function(req, res, next) {
  var recipientBotUserName = req.body.botUserName,
      osnServerUrl = req.body.osnServerUrl,
      message = req.body.message;
  
  console.log("/bot end point. Received params: " + recipientBotUserName + " " + osnServerUrl);
  
  mongoModel.Bots.find({"userName": recipientBotUserName, "botServerUrl": osnServerUrl}, function(err, result) {
      if (err) {
        console.log("Error in fetching bot results from Mongo " + 
                    "using the bot username: " + recipientBotUserName + 
                    "and server url: " + osnServerUrl);
        next();
      }
      else {
        var recipientBotToken = result[0].token;
        
        if (recipientBotToken in botsConnected) {
          console.log("Found token " + recipientBotToken + " in botsConnected map");
          console.log("Emitting 'osnMessage' event to socket: " + botsConnected[recipientBotToken]);
          botsConnected[recipientBotToken].emit('osnMessage', {'message': message});
        }  
      }
  });
});

// Socket IO event handlers

io.on('connection', function(socket) {
  console.log('A bot connected');
  console.log("Socket created: " + socket);
  
  socket.on('disconnect', function() {
    console.log('A bot disconnected');
  });
  
  // botMessage event handler:
  // - Message received from bot client.
  socket.on('botMessage', function(data, callback) {
    console.log("Received botMessage");
    console.log("-- Body: " + JSON.stringify(data, null, 4));
    
    if (typeof data === 'undefined') {
      callback("Error: body is not defined");
    }
    
    if (typeof data.botToken === 'undefined') {
      callback("Error: Token is not specified in the request");
    }
    
    // Add an attribute about the current connected bot to the created socket
    
    socket.botToken = data.botToken;
    
    botsConnected[data.botToken] = socket;
    
    // Find the bot username and password from Mongo using the bot token.
    
    mongoModel.Bots.find({token: data.botToken.toString()}, function(err, result) {
      if (err) {
        console.log("Error in fetching bot results from Mongo " + 
                    "using the bot token: " + data.botToken);
        next();
      }
      else {
        data.botUserName = result[0].userName;
        data.botPassword = result[0].password;
        data.botServerUrl = result[0].botServerUrl;
        
        console.log("-- Fetched details from Mongo. Result = " + JSON.stringify(result));
        
        osn.postMessageToOSN(data, function(err, resp, body) {
          if (err || resp.statusCode != 200) {
            console.log("Uh oh, something went wrong. From Socket 'botMessage' event");
          }
          callback(err, resp, body);
        });
      }
    });
  });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;