import { redisRateLimit as ratelimit } from 'koa-ratelimiter';
import redis from 'redis';
import koa from 'koa';

const app = koa();

// apply rate limit
app.use(ratelimit({
    db: redis.createClient(),
    duration: 60000,
    max: 100,
}));

// response middleware
app.use(function* middleware() {
    this.body = 'Stuff!';
});

app.listen(4000);
console.log('listening on port 4000');
