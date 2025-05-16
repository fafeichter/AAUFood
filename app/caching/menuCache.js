/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const scraper = require('../scraping/scraper');
const restaurants = require('../config').restaurants;
const winston = require('winston');

const menuKeyPrefix = "menu";

class MenuCache {

    init(redisClient) {
        this.client = redisClient;
    }

    update() {
        // wait for url cache to update (... avoid the hell of nested promises)
        setTimeout(() => {
            winston.debug('Updating menu caches ...');

            this._updateMenu(restaurants.mensa.id);
            this._updateMenu(restaurants.burgerBoutique.id);
            this._updateMenu(restaurants.uniWirt.id);
            this._updateMenu(restaurants.bitsAndBytes.id);
            this._updateMenu(restaurants.hotspot.id);
            this._updateMenu(restaurants.daMario.id);
            this._updateMenu(restaurants.interspar.id);
            this._updateMenu(restaurants.uniPizzeria.id);
            this._updateMenu(restaurants.felsenkeller.id);
        }, 10000);
    }

    _updateMenu(restaurantId) {
        winston.debug(`Getting week plan for "${restaurantId}"`);

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
            case restaurants.daMario.id: {
                weekPlan = scraper.getDaMarioWeekPlan();
                break;
            }
            case restaurants.burgerBoutique.id: {
                weekPlan = scraper.getBurgerBoutiquePlan();
                break;
            }
            case restaurants.felsenkeller.id: {
                weekPlan = scraper.getFelsenkellerPlan();
                break;
            }
            default: {
                throw new Error(`Restaurant with id "${restaurantId}" is not supported for menu sync`);
            }
        }

        weekPlan.then(weekPlan => {
            if (weekPlan !== scraper.PARSING_SKIPPED) {
                this._updateIfNewer(restaurantId, weekPlan);
            }
        });
    }

    resetAll() {
        winston.info("Starting to reset all menu caches");
        for (let restaurant in restaurants) {
            const restaurantId = restaurants[restaurant].id;
            winston.info(`Starting to reset menu cache for "${restaurantId}"`);
            this._deleteMenu(restaurantId)
                .then(() => {
                    winston.info(`Reset menu cache for "${restaurantId}"`)
                });
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
            } else {
                winston.info(`"${restaurantId}" has not changed the menu`)
            }
        });
    }

    _cacheMenu(restaurantId, weekPlan, weekPlanJson) {
        var promises = [];
        promises.push(this.client.setAsync(`${menuKeyPrefix}:${restaurantId}`, weekPlanJson)); // save whole weekPlan

        for (let day = 0; day < weekPlan.length; day++) {
            let key = `${menuKeyPrefix}:${restaurantId}:${day}`;
            let menuJson = JSON.stringify(weekPlan[day]);
            promises.push(this.client.setAsync(key, menuJson));
        }

        return Promise.all(promises);
    }

    _deleteMenu(restaurantId) {
        var promises = [];
        promises.push(this.client.delAsync(`${menuKeyPrefix}:${restaurantId}`)); // delete whole weekPlan

        for (let day = 0; day < 7; day++) {
            let key = `${menuKeyPrefix}:${restaurantId}:${day}`;
            promises.push(this.client.delAsync(key));
        }

        return Promise.all(promises);
    }

    getMenu(menuName, day) {
        var key = day != null ? `${menuKeyPrefix}:${menuName}:${day}` : `${menuKeyPrefix}:${menuName}`;
        return this.client.getAsync(key);
    }
}

module.exports = new MenuCache();