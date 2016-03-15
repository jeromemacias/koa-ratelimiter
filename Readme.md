
# koa-ratelimiter

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![node version][node-image]][node-url]

[npm-image]: https://img.shields.io/npm/v/koa-ratelimit.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-ratelimit
[travis-image]: https://img.shields.io/travis/koajs/ratelimit.svg?style=flat-square
[travis-url]: https://travis-ci.org/koajs/ratelimit
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11-red.svg?style=flat-square
[node-url]: http://nodejs.org/download/

 Rate limiter middleware for koa.

## Installation

```js
$ npm install koa-ratelimiter
```

## Usage

The library exports 3 things:
- default: a factory accepting a `ratelimiter` adapter and which a function with options to build the middleware
- `redisRateLimit`: an helper function returning a middleware initialized with a redisAdapter
- `memoryRateLimit`: an helper function returning a middleware initialized with a memoryAdapter

## redisRateLimit

### Options

 - `db` redis connection instance
 - `max` max requests within `duration` [2500]
 - `duration` of limit in milliseconds [3600000]
 - `id` id to compare requests [ip]

### Example

```js
var ratelimiter = require('koa-ratelimiter').redisRateLimit;
var redis = require('redis');
var koa = require('koa');
var app = koa();

// apply rate limit

app.use(ratelimiter({
  db: redis.createClient(),
  duration: 60000,
  max: 100,
  id: function (context) {
    return context.ip;
  }
}));

// response middleware

app.use(function *(){
  this.body = 'Stuff!';
});

app.listen(3000);
console.log('listening on port 3000');
```

## memoryRateLimit

This mode uses the memoryAdapter of node-ratelimiter. It should only be used
in development.

### Options

 - `max` max requests within `duration` [2500]
 - `duration` of limit in milliseconds [3600000]
 - `id` id to compare requests [ip]

### Example

```js
var ratelimiter = require('koa-ratelimiter').memoryRateLimit;
var koa = require('koa');
var app = koa();

// apply rate limit

app.use(ratelimiter({
  duration: 60000,
  max: 100,
  id: function (context) {
    return context.ip;
  }
}));

// response middleware

app.use(function *(){
  this.body = 'Stuff!';
});

app.listen(3000);
console.log('listening on port 3000');
```

## nullRateLimit

This mode uses the nullAdapter of node-ratelimiter. It should only be used
for testing purposes.

### Example

```js
var ratelimiter = require('koa-ratelimiter').nullRateLimit;
var koa = require('koa');
var app = koa();

// apply rate limit

app.use(ratelimiter({}));

// response middleware

app.use(function *(){
  this.body = 'Stuff!';
});

app.listen(3000);
console.log('listening on port 3000');
```
## custom adapter

To learn more about what a custom adapter should be, please refer to the `ratelimiter` [documentation](https://github.com/marmelab/node-ratelimiter/tree/adapters)

### Options

 - `max` max requests within `duration` [2500]
 - `duration` of limit in milliseconds [3600000]
 - `id` id to compare requests [ip]

### Example

```js
var ratelimiter = require('koa-ratelimiter');
var koa = require('koa');
var app = koa();
var myCustomAdapter = require('./myCustomAdapter');
// apply rate limit

app.use(ratelimiter(myCustomAdapter)({
  duration: 60000,
  max: 100,
  id: function (context) {
    return context.ip;
  }
}));

// response middleware

app.use(function *(){
 this.body = 'Stuff!';
});

app.listen(3000);
console.log('listening on port 3000');
```

## Responses

  Example 200 with header fields:

```
HTTP/1.1 200 OK
X-Powered-By: koa
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1384377793
Content-Type: text/plain; charset=utf-8
Content-Length: 6
Date: Wed, 13 Nov 2013 21:22:13 GMT
Connection: keep-alive

Stuff!
```

  Example 429 response:

```
HTTP/1.1 429 Too Many Requests
X-Powered-By: koa
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1384377716
Content-Type: text/plain; charset=utf-8
Content-Length: 39
Retry-After: 7
Date: Wed, 13 Nov 2013 21:21:48 GMT
Connection: keep-alive

Rate limit exceeded, retry in 8 seconds
```

## License

  MIT
