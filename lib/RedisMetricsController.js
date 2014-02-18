var bilbo = require("bilbo"),
    logger = require("./logger");

var RedisMetricsController = function() {

    var bag = bilbo.bag(),
        lastInfo = {},
        started = false;

    var DELTA_METRICS = ["expired_key", "evicted_keys", "keyspace_hits", "keyspace_misses"],
        STATIC_METRICS = ["instantaneous_ops_per_sec", "used_memory", "mem_fragmentation_ratio"];

    var RedisInfoObserver = bag.grab("RedisInfoObserver"),
        StasdInterface = bag.grab("StasdInterface");

    this.start = function(options) {
        if (!started) {
            var interval = options.interval;

            RedisInfoObserver.init(options.addresses, options.interval);
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
        return normalizedAddress + "." + metric;
    };

    var processAndSendData = function(data) {
        var currentInfo = data.info,
            deltaTime = currentInfo["uptime_in_seconds"] - lastInfo[data.address]["uptime_in_seconds"],
            metricsData = {},
            metricName;
        DELTA_METRICS.forEach(function(metric) {
            metricName = addRedisAddressToMetricName(data.address, metric);
            if (currentInfo.hasOwnProperty(metric) && deltaTime > 0) {
                metricsData[metricName + "_per_sec"] = calcRate(currentInfo[metric], lastInfo[data.address][metric], deltaTime);
            }
        });

        STATIC_METRICS.forEach(function(metric) {
            metricName = addRedisAddressToMetricName(data.address, metric);
            if (currentInfo.hasOwnProperty(metric)) {
                metricsData[metricName] = currentInfo[metric];
            }
        });
        StasdInterface.send(metricsData);
        lastInfo[data.address] = data.info;
    };

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
