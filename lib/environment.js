var nconf = require("nconf"),
    timekeeper = require("timekeeper");

nconf.argv().env().file({file: "config.json"});

var nodeEnv = nconf.get("NODE_ENV") || nconf.get("environment") || "development";
var Environment = nconf.get(nodeEnv);


if (Environment) {
    console.info("Using NODE_ENV:", nodeEnv, JSON.stringify(Environment));

    if (Environment.time) {
        timekeeper.travel(new Date(Number(Environment.time)));
    }

    module.exports = Environment;
} else {
    console.error("Could not load NODE_ENV:", nodeEnv);
    console.error("Exiting...");

    process.exit(1);
}
