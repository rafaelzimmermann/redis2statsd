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
        console.log(redisAddresses, interval);
        interval = interval || DEFAULT_INTERVAL;

        createClient(redisAddresses[0], auth, function(client) {


               var redis = {
                   address: redisAddresses[0],
                   client: client
               };
               redises.push(redis);

           setInterval(function() {
               if (notify) {
                   getInfos();
               }
           }, interval * SECOND);
        });


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
        if (auth) {
           client.auth(auth);
        }

        callback(client);
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
                        address: redis.address,
                        info: info
                    });
                } else {
                    notify(err, null);
                }
            };

            redis.client.info(redisInfoHandler);
        });
    };

};

RedisInfoObserver["〇"] = "singleton";

module.exports = RedisInfoObserver;
