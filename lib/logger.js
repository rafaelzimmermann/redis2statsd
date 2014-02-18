var winston = require("winston"),
    path = require("path"),
    fs = require("fs"),
    environment = require("./environment.js");

/* creates the logs path */
try { fs.mkdirSync(environment.logs.path); } catch (e) {}

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: path.resolve(environment.logs.path + "/redis2statsd.log") })
  ]
});

module.exports = logger;
