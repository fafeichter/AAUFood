/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const winston = require('winston');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const cheerio = require('cheerio');
const moment = require('moment');
const EventEmitter = require('events')
const restaurants = require('../config').restaurants;
const urlKeyPrefix = "urls";

class UrlCache extends EventEmitter {
    init(redisClient) {
        this.client = redisClient;
        this._setStaticUrls();
    }

    update() {
        winston.debug('Updating dynamic url caches ...');
        this._setDynamicUrls();
    }

    _setStaticUrls() {
        winston.debug('Updating static url caches ...');
        this._updateIfNewer(restaurants.mensa.id, {
            scraperUrl: "https://menu.mensen.at/index/index/locid/45",
            userFriendlyUrl: "https://menu.mensen.at/index/index/locid/45"
        });
        this._updateIfNewer(restaurants.uniWirt.id, {
            scraperUrl: "https://www.uniwirt.at/wp/home/mittagsmenues/",
            userFriendlyUrl: "https://www.uniwirt.at/wp/home/mittagsmenues/"
        });
        this._updateIfNewer(restaurants.bitsAndBytes.id, {
            scraperUrl: "https://www.lakeside-scitec.com/services/gastronomie/bits-bytes",
            userFriendlyUrl: "https://www.lakeside-scitec.com/services/gastronomie/bits-bytes"
        });
        this._updateIfNewer(restaurants.hotspot.id, {
            scraperUrl: "https://www.lakeside-scitec.com/services/gastronomie/hotspot",
            userFriendlyUrl: "https://www.lakeside-scitec.com/services/gastronomie/hotspot"
        });
    }

    _setDynamicUrls() {
        this._updateIntersparUrl();
        this._updateUniPizzeriaUrl();
    }

    _updateUniPizzeriaUrl() {
        request.getAsync("https://uni-pizzeria.at/essen/mittagsteller-2/")
            .then(res => res.body)
            .then(html => {
                // fallback to overview page if we can not extract the dynamic url for the week menu
                let uniPizzeriaUrl = this._parseUniPizzeriaUrl(html) || "https://uni-pizzeria.at/essen/mittagsteller-2/";

                if (uniPizzeriaUrl.includes("https://acrobat.adobe.com/")) {
                    const dynamicPart = uniPizzeriaUrl.split("https://acrobat.adobe.com/id/")[1];
                    const options = {
                        url: `https://send-asr.acrobat.com/a/invitation/${dynamicPart}/asset/asset-0/preview?withDownloadUrl=true`,
                        headers: {
                            'Accept': 'application/vnd.adobe.skybox+json;version=1'
                        }
                    };
                    request.getAsync(options)
                        .then(res => res.body)
                        .then(res => JSON.parse(res))
                        .then(res => {
                            let urlToPdf = res["download_url"];
                            this._updateIfNewer(restaurants.uniPizzeria.id, {
                                scraperUrl: urlToPdf,
                                userFriendlyUrl: urlToPdf
                            });
                        })
                } else {
                    this._updateIfNewer(restaurants.uniPizzeria.id, {
                        scraperUrl: uniPizzeriaUrl,
                        userFriendlyUrl: uniPizzeriaUrl
                    });
                }
            });
    }

    _parseUniPizzeriaUrl(html) {
        var $ = cheerio.load(html);
        return $(".elementor-button.elementor-button-link.elementor-size-md").attr("href");
    }

    _updateIntersparUrl() {
        let currentWeekNumber = moment().format('WW');
        this._updateIfNewer(restaurants.interspar.id, {
            scraperUrl: `https://flugblatt.interspar.at/menuplane/menuplan-kw${currentWeekNumber}/GetPDF.ashx`,
            userFriendlyUrl: `https://flugblatt.interspar.at/menuplane/menuplan-kw${currentWeekNumber}/`
        });
    }

    _updateIfNewer(restaurantId, urls) {
        this.getUrls(restaurantId).then(cachedUrls => {
            const urlsJson = JSON.stringify(urls);

            if (cachedUrls !== urlsJson) {
                this.client.setAsync(`${urlKeyPrefix}:${restaurantId}`, urlsJson).then(() => {
                    this.emit('update', restaurantId);
                    winston.info(`"${restaurantId}" has changed the url -> cache updated`);
                });
            } else {
                winston.info(`"${restaurantId}" has not changed the url`);
            }
        });
    }

    getUrls(restaurantId) {
        return this.client.getAsync(`${urlKeyPrefix}:${restaurantId}`);
    }
}

module.exports = new UrlCache();
