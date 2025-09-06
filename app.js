var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const authRouter = require('./routes/authRouter');
const courseRouter = require('./routes/courseRouter');
const userRouter = require('./routes/userRouter');
const ticketRouter = require('./routes/ticketRouter');
const feedbackRouter = require('./routes/feedbackRouter');
const ServCon = require('./routes/serviceNow');
const mailer = require('./routes/mailer')
const cancellation = require('./routes/cancellationr')
const mailTra = require('./routes/mailtr');
const Rod = require('./routes/RodRouters')
const cors = require('cors');
const BodyParser = require('body-parser');

const mongoose = require("mongoose");

var app = express();

// mongoose.connect("mongodb+srv://chitturiveeravenu:LssqjFSYSt4NHtSJ@cluster0.iylbz.mongodb.net/")
mongoose.connect("mongodb+srv://chitturiveeravenu:N7BZdoHiavl842N9@cluster0.melswsx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(result => {
  console.log("connected successfully with mongodb")
})
.catch(err =>{
  console.log(err)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(BodyParser.json());
app.use("/auth", authRouter);
app.use("/courses", courseRouter);
app.use("/user", userRouter);
app.use("/tickets",ticketRouter);
app.use("/feedback",feedbackRouter);
app.use('/ServiceNow',ServCon);
app.use('/mailer',mailer);
app.use('/cancellation',cancellation);
app.use('/track',mailTra);
app.use('/Rod',Rod)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.listen(4000, function(){
  console.log("server started on port 4000")
})

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

module.exports = app;