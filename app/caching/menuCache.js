/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const EventEmitter = require('events');
const scraper = require('../scraping/scraper');
const restaurants = require('../config').restaurants;
const winston = require('winston');
const moment = require('moment');
const urlCache = require('./urlCache');

const menuKeyPrefix = "menu";

class MenuCache extends EventEmitter {

    init(redisClient) {
        this.client = redisClient;
    }

    update(forceSync = false) {
        const now = moment();

        urlCache.update();

        // wait for url cache to update (... avoid the hell of nested promises)
        setTimeout(() => {
            winston.info('Updating menu caches...');

            scraper.getMensaWeekPlan()
                .then(weekPlan => this._updateIfNewer(restaurants.mensa.id, weekPlan));

            // sync these menus only a few times during Monday morning
            if (forceSync || (now.isoWeekday() === 1 && now.hour() >= 6 && now.hour <= 10)) {
                scraper.getHotspotWeekPlan()
                    .then(weekPlan => this._updateIfNewer(restaurants.hotspot.id, weekPlan));
                scraper.getBitsAndBytesWeekPlan()
                    .then(weekPlan => this._updateIfNewer(restaurants.bitsAndBytes.id, weekPlan));
                scraper.getUniWirtWeekPlan()
                    .then(weekPlan => this._updateIfNewer(restaurants.uniWirt.id, weekPlan));
                scraper.getUniPizzeriaWeekPlan()
                    .then(weekPlan => this._updateIfNewer(restaurants.uniPizzeria.id, weekPlan));
            }

            // sync the Interspar menu only once on Monday night
            if (forceSync || (now.isoWeekday() === 1 && now.hour() === 0)) {
                scraper.getIntersparWeekPlan()
                    .then(weekPlan => this._updateIfNewer(restaurants.interspar.id, weekPlan));
            }
        }, 10000);
    }

    _updateIfNewer(restaurantId, newWeekPlan) {
        var newWeekPlanJson = JSON.stringify(newWeekPlan);

        this.getMenu(restaurantId).then(cachedMenu => {
            if (cachedMenu !== newWeekPlanJson) {
                this._cacheMenu(restaurantId, newWeekPlan, newWeekPlanJson);
                this.emit(`${menuKeyPrefix}:${restaurantId}`, newWeekPlanJson); //Should we emit all single menus?
                winston.info(`"${restaurantId}" has changed the menu -> cache updated`)
            }
        });
    }

    _cacheMenu(restaurantId, weekPlan, weekPlanJson) {
        var promises = [];
        promises.push(this.client.setAsync(`${menuKeyPrefix}:${restaurantId}`, weekPlanJson)); //Store whole weekPlan

        for (let day = 0; day < weekPlan.length; day++) {
            let key = `${menuKeyPrefix}:${restaurantId}:${day}`;
            let menuJson = JSON.stringify(weekPlan[day]);
            promises.push(this.client.setAsync(key, menuJson));
        }

        return Promise.all(promises);
    }

    getMenu(menuName, day) {
        var key = day != null ? `${menuKeyPrefix}:${menuName}:${day}` : `${menuKeyPrefix}:${menuName}`;
        return this.client.getAsync(key);
    }
}

module.exports = new MenuCache();
