var bilbo = require("bilbo"),
    environment = require("./environment"),
    logger = require("./logger"),
    _ = require("underscore"),
    querystring = require('querystring'),
    bigInt = require("big-integer");

var RedisMetricsController = function() {

    var bag = bilbo.bag(),
        lastInfo = {},
        started = false;

    var DELTA_METRICS= environment.redis.metrics_delta,
        STATIC_METRICS = environment.redis.metrics_static,
        SLAVE_METRICS = environment.redis.slave_metrics;

    var RedisInfoObserver = bag.grab("RedisInfoObserver"),
        StasdInterface = bag.grab("StasdInterface");

    this.start = function(options) {
        if (!started) {
            var interval = options.interval;

            RedisInfoObserver.init(options.addresses, options.interval, options.auth);
            RedisInfoObserver.onInfo(infoHandler);

            started = true;
            logger.log("info", "RedisMetricsController started");
        }
    };

    var calcRate  = function(newValue, oldValue, interval) {
        return ((newValue - oldValue) / interval) || 0;
    };

    var addRedisAddressToMetricName = function(address, metric) {
        var normalizedAddress = address.replace(/\.|:/g, "-");
        if (environment.metric && environment.metric.format) {
            return environment.metric.format
                .replace("{METRIC}", metric)
                .replace("{REDIS_ADDRESS}", normalizedAddress);
        } else {
            return normalizedAddress + "." + metric;
        }
    };

    var processAndSendData = function(data) {
        var currentInfo = data.info,
            deltaTime = currentInfo["uptime_in_seconds"] - lastInfo[data.address]["uptime_in_seconds"],
            metricsData = {},
            metricName;
        DELTA_METRICS.forEach(function(metric) {
            metricName = addRedisAddressToMetricName(data.address, metric);
            if (currentInfo.hasOwnProperty(metric) && deltaTime > 0) {
                metricsData[metricName.replace(metric, metric + "_per_sec")] = calcRate(currentInfo[metric], lastInfo[data.address][metric], deltaTime);
            }
        });

        STATIC_METRICS.forEach(function(metric) {
            metricName = addRedisAddressToMetricName(data.address, metric);
            if (currentInfo.hasOwnProperty(metric)) {
                metricsData[metricName] = currentInfo[metric];
            }
        });

        if (SLAVE_METRICS && currentInfo.connected_slaves) {
            _.extend(metricsData, getSlaveMetrics(data));
        }

        StasdInterface.send(metricsData);
        lastInfo[data.address] = data.info;
    };

    var getSlaveMetrics = function(data) {
        var slaveMetrics = {};
        var currentInfo = data.info;
        var redisInstance = data.address;
        try {
            var masterOffset = bigInt(currentInfo.master_repl_offset || 0);
            for (var i = 0; i < currentInfo.connected_slaves; i++) {
                var slaveName = "slave" + i.toString();
                var slaveString = currentInfo[slaveName];
                if (slaveString) {
                    slaveString = slaveString.split(',').join('&');
                    var slaveObject = querystring.parse(slaveString);
                    if (slaveObject) {
                        var slaveOffset = bigInt(slaveObject["offset"] || 0);
                        var slaveLagInBytes = masterOffset.subtract(slaveOffset);

                        slaveMetrics[addRedisAddressToMetricName(redisInstance, slaveName + "_online")] = (slaveObject["state"] === 'online' ? 1 : 0);
                        slaveMetrics[addRedisAddressToMetricName(redisInstance, slaveName + "_lag")] = parseInt(slaveObject["lag"]) || 0;
                        slaveMetrics[addRedisAddressToMetricName(redisInstance, slaveName + "_lagBytes")] = slaveLagInBytes.toJSNumber();
                    }
                }
            }
        } catch (e) {
        }

        return slaveMetrics;
    }

    var infoHandler = function(err, data) {
        if (!lastInfo.hasOwnProperty(data.address)) {
            lastInfo[data.address] = data.info;
        } else {
            processAndSendData(data);
        }
    };

};

RedisMetricsController["〇"] = "singleton";

module.exports = RedisMetricsController;
