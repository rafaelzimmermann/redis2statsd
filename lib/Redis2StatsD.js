var optionsParser = require('minimist'),
    bilbo = require("bilbo"),
    logger = require("./logger");

var bag = bilbo.bag();
var bag = bilbo.requiringBag(undefined, process.cwd()+"/lib/");

var RedisMetricsController = bag.grab('RedisMetricsController');

var parseArgs = function() {
    var argv = optionsParser(process.argv.slice(2)),
        options = {};

    options.addresses = argv._.length === 0 ? ["localhost:6379"] : argv._;
    options.auth = argv.a || argv.auth;

    options.interval = argv.interval;
    return options;
};

var options = parseArgs();
logger.log("INFO", "Redis Metrics started...");
logger.log("INFO", options);

RedisMetricsController.start(options);
