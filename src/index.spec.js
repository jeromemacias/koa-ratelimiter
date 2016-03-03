import koa from 'koa';
import request from 'supertest';
import 'should';
import redis from 'redis';

import { memoryRateLimit, redisRateLimit } from '.';

describe('ratelimit middleware with memoryAdapter', () => {
    const rateLimitDuration = 1000;
    const goodBody = 'Num times hit: ';

    describe('limit', () => {
        let guard;
        let app;

        const routeHitOnlyOnce = () => {
            guard.should.be.equal(1);
        };

        beforeEach(done => {
            app = koa();

            app.use(memoryRateLimit({
                duration: rateLimitDuration,
                max: 1,
            }));

            app.use(function* next() {
                guard++;
                this.body = goodBody + guard;
            });

            guard = 0;

            setTimeout(() => {
                request(app.listen())
                    .get('/')
                    .expect(200, goodBody + '1')
                    .expect(routeHitOnlyOnce)
                    .end(done);
            }, rateLimitDuration);
        });

        it('responds with 429 when rate limit is exceeded', done => {
            request(app.listen())
                .get('/')
                .expect('X-RateLimit-Remaining', 0)
                .expect(429)
                .end(done);
        });

        it('should not yield downstream if ratelimit is exceeded', done => {
            request(app.listen())
                .get('/')
                .expect(429)
                .end(() => {
                    routeHitOnlyOnce();
                    done();
                });
        });
    });

    describe('id', () => {
        it('should allow specifying a custom `id` function', done => {
            const app = koa();

            app.use(memoryRateLimit({
                max: 1,
                id: ctx => ctx.request.header.foo,
            }));

            request(app.listen())
                .get('/')
                .set('foo', 'bar')
                .expect(res => {
                    res.header['x-ratelimit-remaining'].should.equal('0');
                })
                .end(done);
        });

        it('should not limit if `id` returns `false`', done => {
            const app = koa();

            app.use(memoryRateLimit({
                id: () => false,
                max: 5,
            }));

            request(app.listen())
                .get('/')
                .expect(res => {
                    res.header.should.not.have.property('x-ratelimit-remaining');
                })
                .end(done);
        });

        it('should limit using the `id` value', done => {
            const app = koa();

            app.use(memoryRateLimit({
                max: 1,
                id: ctx => ctx.request.header.foo,
            }));

            app.use(function* next() {
                this.body = this.request.header.foo;
            });

            request(app.listen())
                .get('/')
                .set('foo', 'bar')
                .expect(200, 'bar')
                .end(() => {
                    request(app.listen())
                        .get('/')
                        .set('foo', 'biz')
                        .expect(200, 'biz')
                        .end(done);
                });
        });
    });
});

describe('ratelimit middleware with redis', () => {
    const db = redis.createClient();
    const rateLimitDuration = 1000;
    const goodBody = 'Num times hit: ';

    before(done => {
        db.keys('limit:*', (err, rows) => {
            rows.forEach(db.del, db);
        });

        done();
    });

    describe('limit', () => {
        let guard;
        let app;

        const routeHitOnlyOnce = () => {
            guard.should.be.equal(1);
        };

        beforeEach(done => {
            app = koa();

            app.use(redisRateLimit({
                db,
                duration: rateLimitDuration,
                max: 1,
            }));

            app.use(function* next() {
                guard++;
                this.body = goodBody + guard;
            });

            guard = 0;

            setTimeout(() => {
                request(app.listen())
                    .get('/')
                    .expect(200, goodBody + '1')
                    .expect(routeHitOnlyOnce)
                    .end(done);
            }, rateLimitDuration);
        });

        it('responds with 429 when rate limit is exceeded', done => {
            request(app.listen())
                .get('/')
                .expect('X-RateLimit-Remaining', 0)
                .expect(429)
                .end(done);
        });

        it('should not yield downstream if ratelimit is exceeded', done => {
            request(app.listen())
                .get('/')
                .expect(429)
                .end(() => {
                    routeHitOnlyOnce();
                    done();
                });
        });
    });

    describe('id', () => {
        it('should allow specifying a custom `id` function', done => {
            const app = koa();

            app.use(redisRateLimit({
                db,
                max: 1,
                id: ctx => ctx.request.header.foo,
            }));

            request(app.listen())
                .get('/')
                .set('foo', 'bar')
                .expect(res => {
                    res.header['x-ratelimit-remaining'].should.equal('0');
                })
                .end(done);
        });

        it('should not limit if `id` returns `false`', done => {
            const app = koa();

            app.use(redisRateLimit({
                db,
                id: () => false,
                max: 5,
            }));

            request(app.listen())
                .get('/')
                .expect(res => {
                    res.header.should.not.have.property('x-ratelimit-remaining');
                })
                .end(done);
        });

        it('should limit using the `id` value', done => {
            const app = koa();

            app.use(redisRateLimit({
                db,
                max: 1,
                id: ctx => ctx.request.header.foo,
            }));

            app.use(function* next() {
                this.body = this.request.header.foo;
            });

            request(app.listen())
                .get('/')
                .set('foo', 'bar')
                .expect(200, 'bar')
                .end(() => {
                    request(app.listen())
                        .get('/')
                        .set('foo', 'biz')
                        .expect(200, 'biz')
                        .end(done);
                });
        });
    });
});
