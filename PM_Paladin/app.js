/**
 * Require middleware
 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');


/**
 * Create a connection pool to MS SQL Server database 
 */
var sql = require('mssql');
require('dotenv').config();
var sqlConfig = {
  user: process.env.SQL_USER,  
  password: process.env.SQL_PASSWORD,  
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DB
};
// var cp = new sql.Connection(sqlConfig);
// cp.connect(function(err){
//   if (err){
//     console.log("Connection to db failed..."); 
//     console.log(err);
//   } else {
//     console.log("Connection to db success!");
//   }
// });
var cp = new sql.Connection(sqlConfig, function(err){
  if (err){
    console.log("Connection to db failed..."); 
    console.log(err);
  }
  else {
    console.log("Connection to db success!"); 
    cp.connect();
  }
});


/**
 * Get routers 
 */
var index = require('./routes/index');
var api = require('./routes/api')(cp);

/**
 * Create Express app
 */
var app = express();


/**
 * Add middleware to use between the request and the response in your Express app
 */
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


/**
 * Set routers to URIs
 */
app.use('/', index);
app.use('/api', api);

/**
 * Catch 404 and forward to error handler, and error handlers
 */
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler, will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
