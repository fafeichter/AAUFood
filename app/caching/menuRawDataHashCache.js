/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const winston = require('winston');
const urlKeyPrefix = "raw-data-cache";

class MenuRawDataHashCache {
    init(redisClient) {
        this.client = redisClient;
    }

    updateIfNewer(restaurantId, hash) {
        this.getHash(restaurantId).then(cachedHash => {
            if (cachedHash !== hash) {
                this.client.setAsync(`${urlKeyPrefix}:${restaurantId}`, hash).then(() => {
                    winston.info(`Parsable data of "${restaurantId}" has changed`);
                });
            } else {
                winston.info(`Parsable data of "${restaurantId}" has not changed`);
            }
        });
    }

    getHash(restaurantId) {
        return this.client.getAsync(`${urlKeyPrefix}:${restaurantId}`);
    }
}

module.exports = new MenuRawDataHashCache();