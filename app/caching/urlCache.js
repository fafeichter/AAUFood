/**
 * Created by Markus on 08.06.2016.
 */

'use strict';

const winston = require('winston');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const cheerio = require('cheerio');
const moment = require('moment');
const restaurants = require('../config').restaurants;
const urlKeyPrefix = "urls";

class UrlCache {
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
        this._updateIfNewer(restaurants.uniWirt.id, {
            scraperUrl: "https://www.uniwirt.at/",
            userFriendlyUrl: "https://www.uniwirt.at/#menue"
        });
        this._updateIfNewer(restaurants.bitsAndBytes.id, {
            scraperUrl: "https://www.lakeside-scitec.com/services/gastronomie/bits-bytes",
            userFriendlyUrl: "https://www.lakeside-scitec.com/services/gastronomie/bits-bytes"
        });
        this._updateIfNewer(restaurants.hotspot.id, {
            scraperUrl: "https://www.lakeside-scitec.com/services/gastronomie/hotspot",
            userFriendlyUrl: "https://www.lakeside-scitec.com/services/gastronomie/hotspot"
        });
        this._updateIfNewer(restaurants.daMario.id, {
            scraperUrl: "https://da-mario.at/klagenfurt/speisen/",
            userFriendlyUrl: "https://da-mario.at/klagenfurt/speisen/"
        });
    }

    _setDynamicUrls() {
        this._updateIntersparUrl();
        this._updateMensaUrl();
        this._updateUniPizzeriaUrl();
        this._updateBurgerBoutiqueUrl();
    }

    _updateIntersparUrl() {
        let currentWeekNumber = moment().format('WW');
        this._updateIfNewer(restaurants.interspar.id, {
            scraperUrl: `https://flugblatt.interspar.at/menuplane/menuplan-kw${currentWeekNumber}/GetPDF.ashx`,
            userFriendlyUrl: `https://flugblatt.interspar.at/menuplane/menuplan-kw${currentWeekNumber}/`,
            secondaryFriendlyUrl: `https://flugblatt.interspar.at/happy-hour/happy-hour-kw${currentWeekNumber}/`
        });
    }

    _updateMensaUrl() {
        let now = moment();

        const currentYear = now.year();
        const currentWeek = now.week();

        this._updateIfNewer(restaurants.mensa.id, {
            scraperUrl: `https://backend.mensen.at/menuplan/Menuplan-902002-${currentWeek}-${currentYear}.pdf`,
            userFriendlyUrl: 'https://www.mensen.at/standort/mensa-alpe-adria-universitaet/'
        });
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

    _updateBurgerBoutiqueUrl() {
        request.getAsync("https://www.burgerboutique.at/")
            .then(res => res.body)
            .then(html => {
                // fallback to last known friendly URL in case current URL can not be retrieved
                let burgerBoutiqueUrl = this._parseBurgerBoutiqueUrl(html)
                    || "https://www.burgerboutique.at/wp-content/uploads/2023/02/BurgerBoutique2023.pdf";

                this._updateIfNewer(restaurants.burgerBoutique.id, {
                    scraperUrl: null,
                    userFriendlyUrl: burgerBoutiqueUrl
                });
            });
    }

    _parseBurgerBoutiqueUrl(html) {
        var $ = cheerio.load(html);
        return $("#menu-item-1614 > a").attr("href");
    }

    _updateIfNewer(restaurantId, urls) {
        this.getUrls(restaurantId).then(cachedUrls => {
            const urlsJson = JSON.stringify(urls);

            if (cachedUrls !== urlsJson) {
                this.client.setAsync(`${urlKeyPrefix}:${restaurantId}`, urlsJson).then(() => {
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