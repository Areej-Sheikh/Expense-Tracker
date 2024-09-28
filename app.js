var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

require('dotenv').config('./.env')
require('./config/database')

var indexRouter = require('./routes/index.routes');
var expenseRouter = require('./routes/expense.routes');
var userRouter = require('./routes/user.routes')

const passport = require('passport');
const session = require('express-session');

// const fileupload = require("express-fileupload");

var flash = require("connect-flash");
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// connect flash
app.use(flash());
// file upload
// app.use(fileupload());


// npm i passport passport-local passport-local-mongoose express-session

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,  // Secret for signing session ID cookies
    saveUninitialized: false,  // Don't create session until something stored
    resave: false,  // Don't save session if unmodified
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,  // Session expires after 24 hours
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());  

// passport.serializeUser(UserSchema.serializeUser());
// passport.deserializeUser(UserSchema.deserializeUser()); 
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  next();
});

app.use('/', indexRouter);
app.use('/expense', expenseRouter);
app.use('/user', userRouter);


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
  res.render("error", { title: "Expense Tracker | Error" });
  
});

module.exports = app;
