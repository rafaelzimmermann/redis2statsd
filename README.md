# redis2statsd

redis2statsd is a tool written in JavaScript, used to monitor Redis.


It uses Redis [INFO](http://redis.io/commands/info) command to collect data, and sends it to [StatsD](https://github.com/etsy/statsd/).
We chose StatsD because it's very flexible and can be plugged with Graphite, Librato or any other tool you choose to plot the graphs.

## Installation and Configuration
* Install node.js
* Clone the project
* Run npm install
* Adjust config.json file

## Running

```
usage: node lib/Redis2StatsD.js ["HOST:PORT" ...]

    --interval=INTERVAl         Redis consult interval
    --environment=ENVIRONMENT   Select config.json environment configuration

$node lib/Redis2StatsD.js localhost --interval=60
```



