/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const scraper = require('../scraping/scraper');
const restaurants = require('../config').restaurants;
const winston = require('winston');
const moment = require('moment');

const menuKeyPrefix = "menu";

class MenuCache {

    init(redisClient) {
        this.client = redisClient;
    }

    update(forceSync = false) {
        // wait for url cache to update (... avoid the hell of nested promises)
        setTimeout(() => {
            winston.info('Updating menu caches ...');

            this.updateMenu(restaurants.mensa.id);

            // sync these menus only a few times during Monday morning
            const now = moment();
            if (forceSync || (now.isoWeekday() === 1 && now.hour() >= 6 && now.hour <= 11)) {
                this.updateMenu(restaurants.uniWirt.id);
                this.updateMenu(restaurants.bitsAndBytes.id);
                this.updateMenu(restaurants.hotspot.id);
            }
        }, 10000);
    }

    updateMenu(restaurantId) {
        let weekPlan = undefined;

        switch (restaurantId) {
            case restaurants.mensa.id: {
                weekPlan = scraper.getMensaWeekPlan();
                break;
            }
            case restaurants.interspar.id: {
                weekPlan = scraper.getIntersparWeekPlan();
                break;
            }
            case restaurants.uniWirt.id: {
                weekPlan = scraper.getUniWirtWeekPlan();
                break;
            }
            case restaurants.uniPizzeria.id: {
                weekPlan = scraper.getUniPizzeriaWeekPlan();
                break;
            }
            case restaurants.bitsAndBytes.id: {
                weekPlan = scraper.getBitsAndBytesWeekPlan();
                break;
            }
            case restaurants.hotspot.id: {
                weekPlan = scraper.getHotspotWeekPlan();
                break;
            }
            default: {
                throw new Error(`Restaurant with id ${restaurantId} is not supported for menu sync`);
            }
        }

        if (weekPlan) {
            weekPlan.then(weekPlan => this._updateIfNewer(restaurantId, weekPlan));
        }
    }

    _updateIfNewer(restaurantId, newWeekPlan) {
        var newWeekPlanJson = JSON.stringify(newWeekPlan);

        this.getMenu(restaurantId).then(cachedMenu => {
            if (cachedMenu !== newWeekPlanJson) {
                this._cacheMenu(restaurantId, newWeekPlan, newWeekPlanJson)
                    .then(() => {
                        winston.info(`"${restaurantId}" has changed the menu -> cache updated`)
                    });
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
