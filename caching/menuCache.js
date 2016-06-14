/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const redis = require('redis');
const bluebird = require('bluebird');
const EventEmitter = require('events');
const config = require('../config');
const scraper = require('../scraping/scraper');
const winston = require('winston');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

class MenuCache extends EventEmitter {
    init() {
        this.client = redis.createClient(config.cache.redisUrl);
        this.update();
        winston.info('Initialized Logger.');
    }

    update() {
        scraper.getMensaWeekPlan()
            .then(weekPlan => this._updateIfInvalid('mensa', weekPlan));

        scraper.getMittagstischWeekPlan()
            .then(weekPlan => this._updateIfInvalid('mittagstisch', weekPlan));

        scraper.getUniwirtWeekPlan()
            .then(weekPlan => this._updateIfInvalid('uniwirt', weekPlan));

        winston.info('Updating caches.');
    }

    _updateIfInvalid(restaurantName, newWeekPlan) {
        var newWeekPlanJson = JSON.stringify(newWeekPlan);

        this.getMenu(restaurantName).then(cachedMenu => {
            if (cachedMenu !== newWeekPlanJson) {
                this._cacheMenu(restaurantName, newWeekPlan, newWeekPlanJson);
                this.emit(`menu:${restaurantName}`, newWeekPlanJson); //Should we emit all single menus?
                winston.info(`${restaurantName} has changed the menu. -> Cache updated.`)
            }
        });
    }

    _cacheMenu(restaurantName, weekPlan, weekPlanJson) {
        var promises = [];
        promises.push(this.client.setAsync(`menu:${restaurantName}`, weekPlanJson)); //Store whole weekPlan

        for (let day = 0; day < weekPlan.length; day++) {
            let key = `menu:${restaurantName}:${day}`;
            let menuJson = JSON.stringify(weekPlan[day]);
            promises.push(this.client.setAsync(key, menuJson));
        }

        return Promise.all(promises);
    }

    getMenu(menuName, day) {
        var key = day != null ? `menu:${menuName}:${day}` : `menu:${menuName}`;
        return this.client.getAsync(key);
    }
}

module.exports = new MenuCache();