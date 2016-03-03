/**
 * Module dependencies.
 */

import debugFactory from 'debug';
import Limiter, { memoryAdapter, redisAdapter } from 'ratelimiter';
import ms from 'ms';

const debug = debugFactory('koa-ratelimit');

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
const middlewareFactory = (adapter = memoryAdapter()) => opts => function* middleware(next) {
    const id = opts.id ? opts.id(this) : this.ip;

    if (id === false) return yield * next;

    // initialize limiter
    const limiter = new Limiter({ ...opts, id }, adapter);

    // check limit
    const limit = yield limiter.newHit();

    // check if current call is legit
    const remaining = limit.remaining > 0 ? limit.remaining - 1 : 0;

    // header fields
    this.set('X-RateLimit-Limit', limit.total);
    this.set('X-RateLimit-Remaining', remaining);
    this.set('X-RateLimit-Reset', limit.reset);

    debug('remaining %s/%s %s', remaining, limit.total, id);
    if (limit.remaining) return yield * next;

    const delta = (limit.reset * 1000) - Date.now() | 0;
    const after = limit.reset - (Date.now() / 1000) | 0;
    this.set('Retry-After', after);
    this.status = 429;
    this.body = 'Rate limit exceeded, retry in ' + ms(delta, {
        long: true,
    });
};

export default middlewareFactory;

export const memoryRateLimit = opts => middlewareFactory(memoryAdapter())(opts);

export const redisRateLimit = opts => {
    if (!opts || !opts.db) {
        throw new Error('opts.db is required');
    }

    return middlewareFactory(redisAdapter(opts.db))(opts);
};
