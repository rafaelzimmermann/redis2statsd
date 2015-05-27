var redis = require("redis"),
    logger = require("./logger"),
    _ = require("underscore");


var RedisInfoObserver = function() {

    var SECOND = 1000,
        DEFAULT_INTERVAL = 60,
        REDIS_DEFAULT_PORT = "6379";

    var redises = [],
        notify;

    this.init = function(redisAddresses, interval, auth) {

        interval = interval || DEFAULT_INTERVAL;

        var createClientHandler = function(redisClient) {
          redises.push(redisClient);
        };

        for (var i = 0; i < redisAddresses.length; i++) {
           createClient(redisAddresses[i], auth, createClientHandler);
        }

        setInterval(function() {
             if (notify) {
                 getInfos();
             }
        }, interval * SECOND);
    };

    this.onInfo = function(callback) {
        notify = callback;
    };

    var createClient = function(address, auth, callback) {
        var options = _.object(["host", "port"], address.split(":"));
        if (typeof options.port === "undefined") {
            options.port = REDIS_DEFAULT_PORT;
        }

        var client = redis.createClient(options.port, options.host);
        var redisClient = {
           host: options.host,
           port: options.port,
           auth: auth,
           client: client
        };

        var clientErrorHandler = function(err) {
             console.trace();
             logger.log("error", err);
             logger.log("error", "Reconecting to " + redisClient.host);
             redisClient.client.quit();
             redisClient.client = redis.createClient(redisClient.port, redisClient.host);
             redisClient.client.auth(redisClient.auth);
             redisClient.client.on("error", clientErrorHandler);
        };

        redisClient.client.on("error", clientErrorHandler);

        if (auth) {
           client.auth(auth, function() {
             callback(redisClient);
          });
        } else {
           callback(redisClient);
        }

    };

    var parseInfo = function(info) {
        var lines = info.split("\r\n");
        var parsedObject = {};
        lines.forEach(function(line) {
            var keyValue = line.split(":");
            if (keyValue.length === 2) {
                parsedObject[keyValue[0]] = parseFloat(keyValue[1]) || keyValue[1];
            }
        });
        return parsedObject;
    };

    var getInfos = function() {

        redises.forEach(function(redis) {
            var redisInfoHandler = function(err, data) {
                var info;
                if (!err) {
                    info = parseInfo(data);

                    notify(null, {
                        address: redis.host+"-"+ redis.port,
                        info: info
                    });
                } else {
                    notify(err, null);
                }
            };
            try {
               redis.client.info(redisInfoHandler);
            } catch(ex) {
               console.trace();
               console.log(ex);
            }

        });
    };

};

RedisInfoObserver["〇"] = "singleton";

module.exports = RedisInfoObserver;
