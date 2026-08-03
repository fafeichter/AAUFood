/**
 * Created by Markus on 23.06.2016.
 */
const visitorCache = require('../caching/visitorCache');
const winston = require('winston');

function countVisitors(req, res, next) {
    const isHealthCheck = req.headers['x-healthcheck'] === 'true';

    // Skip counting if request is coming from Docker health check
    (isHealthCheck
        ? visitorCache.getCounters(req.session)
        : visitorCache.increment(req.session))
        .then((visitorStats) => {
            req.visitorStats = visitorStats;
            next();
        })
        .catch(() => {
            winston.error('Visits could not be updated.');
            next(); // Pass control forward even if caching fails
        });
}

module.exports = {
    countVisitors
};