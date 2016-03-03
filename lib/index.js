'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.redisRateLimit = exports.memoryRateLimit = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Module dependencies.
                                                                                                                                                                                                                                                                   */

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _ratelimiter = require('ratelimiter');

var _ratelimiter2 = _interopRequireDefault(_ratelimiter);

var _ms = require('ms');

var _ms2 = _interopRequireDefault(_ms);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('koa-ratelimit');

/**
 * Initialize ratelimit middleware with the given `opts`:
 *
 * - `duration` limit duration in milliseconds [1 hour]
 * - `max` max requests per `id` [2500]
 * - `db` database connection
 * - `id` id to compare requests [ip]
 *
 * @param {Object} opts
 * @param {Object} adapter [memoryAdapter]
 * @return {Function}
 * @api public
 */
var middlewareFactory = function middlewareFactory() {
    var adapter = arguments.length <= 0 || arguments[0] === undefined ? (0, _ratelimiter.memoryAdapter)() : arguments[0];
    return function (opts) {
        return regeneratorRuntime.mark(function middleware(next) {
            var id, limiter, limit, remaining, delta, after;
            return regeneratorRuntime.wrap(function middleware$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            id = opts.id ? opts.id(this) : this.ip;

                            if (!(id === false)) {
                                _context.next = 4;
                                break;
                            }

                            return _context.delegateYield(next, 't0', 3);

                        case 3:
                            return _context.abrupt('return', _context.t0);

                        case 4:

                            // initialize limiter
                            limiter = new _ratelimiter2.default(_extends({}, opts, { id: id }), adapter);

                            // check limit

                            _context.next = 7;
                            return limiter.newHit();

                        case 7:
                            limit = _context.sent;


                            // check if current call is legit
                            remaining = limit.remaining > 0 ? limit.remaining - 1 : 0;

                            // header fields

                            this.set('X-RateLimit-Limit', limit.total);
                            this.set('X-RateLimit-Remaining', remaining);
                            this.set('X-RateLimit-Reset', limit.reset);

                            debug('remaining %s/%s %s', remaining, limit.total, id);

                            if (!limit.remaining) {
                                _context.next = 16;
                                break;
                            }

                            return _context.delegateYield(next, 't1', 15);

                        case 15:
                            return _context.abrupt('return', _context.t1);

                        case 16:
                            delta = limit.reset * 1000 - Date.now() | 0;
                            after = limit.reset - Date.now() / 1000 | 0;

                            this.set('Retry-After', after);
                            this.status = 429;
                            this.body = 'Rate limit exceeded, retry in ' + (0, _ms2.default)(delta, {
                                long: true
                            });

                        case 21:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, middleware, this);
        });
    };
};

exports.default = middlewareFactory;
var memoryRateLimit = exports.memoryRateLimit = function memoryRateLimit(opts) {
    return middlewareFactory((0, _ratelimiter.memoryAdapter)())(opts);
};

var redisRateLimit = exports.redisRateLimit = function redisRateLimit(opts) {
    if (!opts || !opts.db) {
        throw new Error('opts.db is required');
    }

    return middlewareFactory((0, _ratelimiter.redisAdapter)(opts.db))(opts);
};