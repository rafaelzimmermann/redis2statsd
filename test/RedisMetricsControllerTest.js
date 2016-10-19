var assert = require("assert"),
    bilbo = require("bilbo");


describe('RedisMetricsController', function() {

    var bag = bilbo.mockingBag(),
        cwd = process.cwd(),
        lib = cwd + "/lib/";

    var RedisMetricsController = require(lib + "RedisMetricsController");

    describe("Info Observer configuration", function() {
        it("should config and start info Observer", function() {
            var expectedAddresses = ["someaddress:8080"],
                expectedInterval = 60,
                rmc;
            bag.stuff("RedisInfoObserver", {
                init: function(addresses, interval) {
                    assert.equal(expectedAddresses, addresses);
                    assert.equal(expectedInterval, interval);
                },
                onInfo: function() {

                }
            });

            rmc = new RedisMetricsController();

            rmc.start({ addresses: expectedAddresses, interval: expectedInterval});
        });
    });

    describe("Metric calculation", function() {
        it("should calc expired_keys_per_sec", function(done) {
            var addresses = ["someaddress"],
                interval = 60,

                expectedData = {
                    "someaddress.expired_keys_per_sec": 10
                },
                rmc,
                first = true;

            bag.singleton("RedisInfoObserver", function() {
                var onInfoCallback;
                var mockInfoEvent = function() {
                    var data = {
                        address: "someaddress",
                        info: {
                            "uptime_in_seconds": 0,
                            "expired_keys": 0
                        }
                    };
                    if (!first) {
                        data.info.uptime_in_seconds = 60;
                        data.info.expired_keys = 600;
                    }
                    onInfoCallback(null, data);
                    first = false;

                };
                return {
                    init: function() {},
                    onInfo: function(callback) {
                        onInfoCallback = callback;
                        process.nextTick(mockInfoEvent);
                        process.nextTick(mockInfoEvent);
                    }
                };

            });

            bag.singleton("StasdInterface", function() {
                return {
                    send: function(metricData) {
                        if (!first) {
                            assert.deepEqual(expectedData, metricData);
                            done();
                        }
                    }
                };
            });

            rmc = new RedisMetricsController();

            rmc.start({ addresses: addresses, interval: interval});
        });
    });

    describe("StatsDInterface Communication", function() {
        it("should call StatsdInterface on Info", function () {
            var expectedAddresses = ["someaddress:8080"],
                expectedInterval = 60,
                data = {
                    address: "someaddress",
                    info: {
                        "instantaneous_ops_per_sec": 10
                    }
                },
                expectedData = {
                    "someaddress.instantaneous_ops_per_sec": 10
                },
                rmc;

            bag.stuff("RedisInfoObserver", {
                init: function() {},
                onInfo: function(callback) {
                    callback(null,data);
                }
            });

            bag.stuff("StasdInterface", {
                send: function(metricData) {
                    assert.equal(expectedData, metricData);
                }
            });

            rmc = new RedisMetricsController();

            rmc.start({ addresses: expectedAddresses, interval: expectedInterval});
        });
    });

});
