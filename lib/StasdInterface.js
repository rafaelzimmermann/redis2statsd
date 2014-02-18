var statsd = require('statsd-client'),
    environment = require("./environment.js"),
    _ = require("underscore"),
    logger = require("./logger");

var StasdInterface = function() {
    var statsdClient;

    if (environment.statsd) {
        statsdClient = new statsd(environment.statsd);
        logger.log("INFO", "statsd settings: " + JSON.stringify(statsdClient));
    } else {
        logger.log("INFO", "statsd settings not present, we're not persisting jack-shit!");
    }

    this.send = function(data) {
        var metric, key;
        if (!statsdClient) {
            return;
        }
        for (key in data) {
            if (data.hasOwnProperty(key)) {
                metric = "redis." + key;
                statsdClient.gauge(metric, data[key]);
            }
        }
    };
};

StasdInterface["〇"] = "singleton";

module.exports = StasdInterface;
