const express = require('express');
const bluebird = require('bluebird');
const path = require('path');
const redis = require('redis');
const bodyParser = require('body-parser');
const compression = require('compression');
const menuCache = require('./caching/menuCache');
const urlCache = require('./caching/urlCache');
const visitorCache = require('./caching/visitorCache');
const config = require('./config');
const indexRoutes = require('./routes/index');
const foodRoutes = require('./routes/food');
const winston = require('winston');
const timeHelper = require('./helpers/timeHelper');
const footerPunHelper = require('./helpers/footerPunHelper');
const breakHelper = require('./helpers/breakHelper');
const placeKittenHelper = require('./helpers/placeKittenHelper');
const menuStateHelper = require('./helpers/menuStateHelper');
const moment = require('moment');
const cron = require('node-cron');

require('moment/locale/de');
moment.locale('de');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = redis.createClient({host: process.env.FOOD_REDIS_HOST, port: 6379});
const fileUpload = require('express-fileupload');
const app = express();
const requestLogger = (req, res, next) => {
    var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
    winston.info(` ${req.method} ${req.url} ${ip}`);
    next();
};

// use the express-fileupload middleware
app.use(
    fileUpload({
        limits: {
            fileSize: 10000000, // 10MB
        },
        abortOnLimit: true,
    })
);

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
    timestamp: function () {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 23);
    }, colorize: true
});
winston.level = 'debug';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: config.cookie
}));

app.use(compression());
app.use(express.static(__dirname + '/public'));
app.use("/modules", express.static(__dirname + "/node_modules"));
app.use(requestLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/', indexRoutes);
app.use('/food', foodRoutes);

app.use(function (err, req, res, next) {
    winston.error(err);
    res.status(500);
    res.json({error: err.message});
});

process.on('unhandledRejection', (reason) => {
    winston.error(reason);
});

//Locals for usage in views
app.locals.moment = moment;
app.locals.timeHelper = timeHelper;
app.locals.getFooterPun = footerPunHelper.getFooterPun;
app.locals.isOnBreak = breakHelper.isOnBreak;
app.locals.getBreakInfo = breakHelper.getBreakInfo;
app.locals.menuStateHelper = menuStateHelper;
app.locals.catFactHeaderUrl = placeKittenHelper.catFactHeaderUrl;
app.locals.isWinterThemeActive = () => {
    const [from, to] = config.settings.winterTheme.map(date => moment(date, "DD.MM"));
    return !moment().isBetween(to, from);
};

var server = app.listen(config.settings.nodePort, function () {
    winston.info('AAU Food listening on port ' + config.settings.nodePort + '!');

    const io = require('socket.io')(server);

    urlCache.init(redisClient);
    menuCache.init(redisClient);
    visitorCache.init(redisClient, io);

    cron.schedule('0 0 * * MON', () => {
        menuCache.resetAll();
    });
    winston.debug("Successfully registered menu cache resetter");

    urlCache.update();
    setInterval(() => urlCache.update(), config.cache.urlCacheIntervall);
    winston.debug("Successfully registered url cache updater");

    let forceMenuSync = process.env.FOOD_ENV === 'DEV' || process.env.FOOD_FORCE_SYNC_ON_STARTUP === 'true';
    if (forceMenuSync) {
        winston.debug("Forcing menu sync on startup");
        menuCache.update(true);
    }
    setInterval(() => menuCache.update(forceMenuSync), config.cache.menuCacheIntervall);
    winston.debug("Successfully registered menu cache updater");
});

urlCache.on('update', async (restaurantId) => {
    menuCache.updateMenu(restaurantId);
});
