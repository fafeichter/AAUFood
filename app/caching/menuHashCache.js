/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const winston = require('winston');
const restaurants = require("../config");
const keyPrefix = "raw-data-cache";

class MenuHashCache {
    init(redisClient) {
        this.client = redisClient;
    }

    updateIfNewer(restaurantId, hash) {
        this.getHash(restaurantId).then(cachedHash => {
            if (cachedHash !== hash) {
                let key = `${keyPrefix}:${restaurantId}`;
                this.client.setAsync(key, hash).then(() => {
                    winston.info(`Parsable data of "${restaurantId}" has changed`);
                });
            } else {
                winston.info(`Parsable data of "${restaurantId}" has not changed`);
            }
        });
    }

    getHash(restaurantId) {
        return this.client.getAsync(`${keyPrefix}:${restaurantId}`);
    }

    resetAll() {
        winston.info("Starting to reset all menu raw data hash caches");
        for (let restaurant in restaurants) {
            const restaurantId = restaurants[restaurant].id;
            winston.info(`Starting to reset menu raw data hash cache for "${restaurantId}"`);

            let key = `${keyPrefix}:${restaurantId}`;
            this.client.delAsync(key)
                .then(() => {
                    winston.info(`Reset menu raw data hash cache for "${restaurantId}"`)
                });
        }
    }
}

module.exports = new MenuHashCache();