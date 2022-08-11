var createError = require("http-errors");
var express = require("express");
var path = require("path");
var logger = require("morgan");
var fs = require("fs");
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
// flags
app.use(express.static(path.join(__dirname, "node_modules/mdbootstrap/css/addons")));
// sql
app.use(express.static(path.join(__dirname, "node_modules/sql.js/dist/")));
app.use(express.static(path.join(__dirname, "public")));

// -------------- Prepare logger (needs to be configured before setting '/')

// Create a token for the ip
// (due to being behind nginx, the ip might not come in the standard place)
logger.token("userIP", (req) => {
  const userIP = req.header("X-Real-IP") || req.connection.remoteAddress;
  return userIP;
});

// Log at the same time to console
// if ipinfo is available, check for the location of the IP and print it asynchronously to stdout
// otherwise simply use morgan logger tokens
let stdout_logger = logger("[:userIP] :method :url :status <:user-agent - :referrer>");

const ipjson = "./ipinfodata.json";

if (fs.existsSync(ipjson)) {
  const { IPinfoWrapper } = require("node-ipinfo");
  const ipToken = require(ipjson)["token"];
  const ipinfo = new IPinfoWrapper(ipToken);
  let allIp = {};
  let ipLogging = true;

  async function getIpInfo(ip) {
    let mapLocation = allIp[ip];
    if (!mapLocation && ipLogging) {
      mapLocation = await ipinfo
        .lookupIp(ip)
        .then((response) => {
          // Get the geographical information
          console.log("Reading from ipinfo");
          const country = response.country;
          const region = response.region;
          const city = response.city;
          //const geoloc = response.loc;
          return country ? ` - ${city} (${region}, ${country})` : " - ";
        })
        .catch((err) => {
          console.log(err);
          // Disable iplogging on failure
          ipLogging = false;
          console.log("IP logging has been disabled manually");
        });
    }
    allIp[ip] = mapLocation;
    return mapLocation;
  }

  // Create a middleware logger
  stdout_logger = function (req, res, next) {
    const ip = req.header("X-Real-IP") || req.connection.remoteAddress;
    getIpInfo(ip).then((mapLocation) => {
      // And the request information
      const method = req.method;
      const url = req.originalUrl || req.url;
      const st = String(res.statusCode);
      const uag = req.headers["user-agent"];
      const ref = req.headers.referer || req.headers.referrer || "";

      // And log it to console!
      const logline = `[${ip}${mapLocation}] ${method} ${url} ${st} <${uag} - ${ref}>`;
      console.log(logline);
    });
    next();
  };
}
app.use(stdout_logger);

// Create a log per day
const logStream = rfs.createStream("access.log", {
  interval: "1d", // rotate every day
  path: path.join(__dirname, "log"),
});

// Log also information to file (to the access.log)
app.use(
  logger(":date > :url > :userIP", {
    stream: logStream,
  })
);

// ------------------------ log finished

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
