/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const winston = require('winston');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const cheerio = require('cheerio');
const moment = require('moment');
const url = require("url");
const restaurants = require('../config').restaurants;
const urlKeyPrefix = "urls";

class UrlCache {
    init(redisClient) {
        this.client = redisClient;
        // set static urls
        this.client.setAsync(`${urlKeyPrefix}:${restaurants.mensa.id}`,
            JSON.stringify({
                scraperUrl: "https://menu.mensen.at/index/index/locid/45",
                userFriendlyUrl: "https://menu.mensen.at/index/index/locid/45"
            })
        );
        this.client.setAsync(`${urlKeyPrefix}:${restaurants.uniWirt.id}`,
            JSON.stringify({
                scraperUrl: "https://www.uniwirt.at/wp/home/mittagsmenues/",
                userFriendlyUrl: "https://www.uniwirt.at/wp/home/mittagsmenues/"
            })
        );
        this.client.setAsync(`${urlKeyPrefix}:${restaurants.bitsAndBytes.id}`,
            JSON.stringify({
                scraperUrl: "https://www.lakeside-scitec.com/services/gastronomie/bits-bytes",
                userFriendlyUrl: "https://www.lakeside-scitec.com/services/gastronomie/bits-bytes"
            })
        );
        this.client.setAsync(`${urlKeyPrefix}:${restaurants.hotspot.id}`,
            JSON.stringify({
                scraperUrl: "https://www.lakeside-scitec.com/services/gastronomie/hotspot",
                userFriendlyUrl: "https://www.lakeside-scitec.com/services/gastronomie/hotspot"
            })
        );
        // set dynamic urls
        this.update();
    }

    update() {
        winston.info('Updating url caches...');
        this._updateUniPizzeriaUrl();
        this._updateIntersparUrl();
    }

    _updateUniPizzeriaUrl() {
        request.getAsync("https://uni-pizzeria.at/essen/mittagsteller-2/")
            .then(res => res.body)
            .then(html => {
                // fallback to overview page if we can not extract the dynamic url for the week menu
                let uniPizzeriaUrl = this._parseUniPizzeriaUrl(html) || "https://uni-pizzeria.at/essen/mittagsteller-2/";
                this._updateIfNewer(restaurants.uniPizzeria.id, {
                    scraperUrl: uniPizzeriaUrl,
                    userFriendlyUrl: uniPizzeriaUrl
                });
            });
    }

    _parseUniPizzeriaUrl(html) {
        var $ = cheerio.load(html);
        return $(".elementor-button.elementor-button-link.elementor-size-md").attr("href");
    }

    _updateIntersparUrl() {
        let currentWeekNumber = moment().format('W');
        this._updateIfNewer(restaurants.interspar.id, {
            scraperUrl: `https://flugblatt.interspar.at/menuplane/menuplan-kw${currentWeekNumber}/GetPDF.ashx`,
            userFriendlyUrl: `https://flugblatt.interspar.at/menuplane/menuplan-kw${currentWeekNumber}/`
        });
    }

    _updateIfNewer(restaurantId, urls) {
        this.getUrls(restaurantId).then(cachedUrls => {
            const urlsJson = JSON.stringify(urls);

            if (cachedUrls !== urlsJson) {
                this.client.setAsync(`${urlKeyPrefix}:${restaurantId}`, urlsJson);
                winston.info(`"${restaurantId}" has changed the url -> cache updated`)
            }
        });
    }

    getUrls(restaurantId) {
        return this.client.getAsync(`${urlKeyPrefix}:${restaurantId}`);
    }
}

module.exports = new UrlCache();