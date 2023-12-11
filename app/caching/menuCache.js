/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const EventEmitter = require('events');
const scraper = require('../scraping/scraper');
const restaurants = require('../config').restaurants;
const winston = require('winston');
const moment = require('moment');

const menuKeyPrefix = "menu";

class MenuCache extends EventEmitter {

    init(redisClient) {
        this.client = redisClient;
        // give the url cache a few seconds to finish first
        setTimeout(() => {
            this.update(true);
        }, 3000);
    }

    update(forceSync = false) {
        winston.info('Updating menu caches...');

        const now = moment();

        scraper.getMensaWeekPlan()
            .then(weekPlan => this._updateIfNewer(restaurants.mensa.id, weekPlan));
        scraper.getUniWirtWeekPlan()
            .then(weekPlan => this._updateIfNewer(restaurants.uniWirt.id, weekPlan));

        // sync these menus only during Monday morning to minimize the cost of ChatGPT
        if (forceSync || process.env.FOOD_ENV === 'DEV' || (now.isoWeekday() === 1 && now.hour() > 5 && now.hour <= 12)) {
            scraper.getHotspotWeekPlan()
                .then(weekPlan => this._updateIfNewer(restaurants.hotspot.id, weekPlan));
            scraper.getBitsAndBytesWeekPlan()
                .then(weekPlan => this._updateIfNewer(restaurants.bitsAndBytes.id, weekPlan));
            scraper.getUniPizzeriaWeekPlan()
                .then(weekPlan => this._updateIfNewer(restaurants.uniPizzeria.id, weekPlan));
        }

        // sync the Interspar menu only between 0am and 1am on Monday because they always published the current menu already a week ago
        if (forceSync || process.env.FOOD_ENV === 'DEV' || (now.isoWeekday() === 1 && now.hour() === 0)) {
            scraper.getIntersparWeekPlan()
                .then(weekPlan => this._updateIfNewer(restaurants.interspar.id, weekPlan));
        }
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
