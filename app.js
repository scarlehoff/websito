var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var rfs = require("rotating-file-stream");
// Use helmet to protect the http headers
// as per https://expressjs.com/en/advanced/best-practice-security.html#use-helmet
var helmet = require("helmet");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();
app.use(helmet());

// Use a rate-limiter
const rateLimit = require("express-rate-limit");

app.set("trust proxy", 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.locals.basedir = path.join(__dirname, "views");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// flag
app.use(express.static(path.join(__dirname, "node_modules/mdbootstrap/css/addons")));
// sql
app.use(express.static(path.join(__dirname, "node_modules/sql.js/dist/")));
app.use(express.static(path.join(__dirname, "public")));

// Create a log per day
let logStream = rfs.createStream("access.log", {
  interval: "1d", // rotate every day
  path: path.join(__dirname, "log"),
});

// Create a token for the ip
// (due to being behind nginx, the ip might not come in the standard place)
logger.token("userIP", (req) => {
  let userIP = req.header("X-Real-IP") || req.connection.remoteAddress;
  return userIP;
});

// Prepare the logging (needs to be done before setting /)
// set up the combine logger from morgan to console
// might be unnecesarily verbose?
app.use(logger("combined"));

//// Set up the IP
app.use(
  logger(":date > :url > :userIP", {
    stream: logStream,
  })
);

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use(express.static(path.join(__dirname, "public/pdfs/")));

// trust the proxy to be able to look at IPs
// needs to set in nginx:
//  proxy_set_header X-Real-IP $remote_addr;
app.set("trust proxy", true);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
