var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socketIo = require('socket.io');

var osn = require('./routes/osn-rest');

var app = express();
var io = socketIo();

app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


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

// Socket IO event handlers

io.on('connection', function(socket) {
  console.log('A user connected');
  
  socket.on('disconnect', function() {
    console.log('A user disconnect');
  });
  
  socket.on('botMessage', function(data, callback) {
    console.log("Received botMessage");
    console.log("-- Body: " + JSON.stringify(data, null, 4));
    
    if (typeof data === 'undefined') {
      callback("Error: body is not defined");
    }
    
    osn.postMessageToOSN(data, function(err, resp, body) {
      if (err || resp.statusCode != 200) {
        console.log("Uh oh, something went wrong. From Socket 'botMessage' event");
      }
      callback(err, resp, body);
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
