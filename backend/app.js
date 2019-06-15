var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// var session = require('express-session');
var logger = require('morgan');

var bodyParser = require('body-parser');

// Database
var mongo = require('mongodb'); var monk = require('monk');
var db = monk('localhost:27017/assignment2');

var socialserviceRouter = require('./routes/socialservice');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use(session({
//   name: 'session-id',
//   secret: 'defense',
//   saveUninitialized: false,
//   resave: false,
// }));


// Make our db accessible to routers 
app.use(function(req,res,next){
  req.db = db; next();
});



app.use('/socialservice', socialserviceRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//module.exports = app;
var server = app.listen(3001, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Example app listening at http://%s:%s", host, port);
  })
