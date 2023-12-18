"use strict";

const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const cheerio = require('cheerio');
global.XMLHttpRequest = require('xhr2');
const moment = require('moment');
const _ = require('lodash');
const crawler = require('crawler-request');
const winston = require('winston');

const Food = require("../models/food");
const Menu = require("../models/menu");
const config = require('../config');
const restaurants = config.restaurants;
const timeHelper = require('../helpers/timeHelper');
const scraperHelper = require('./scraperHelper')
const gptHelper = require('./gptHelper')
const urlCache = require('../caching/urlCache');

function getUniWirtWeekPlan() {
    return urlCache.getUrls(restaurants.uniWirt.id)
        .then(urls => request.getAsync(JSON.parse(urls).scraperUrl))
        .then(res => res.body)
        .then(body => parseUniwirt(body));
}

async function parseUniwirt(html) {
    const menu = scraperHelper.getWeekEmptyModel();

    var $ = cheerio.load(html);

    // Get Monday Date
    const mondayString = $("h3:contains(Montag)").text().split(" ")[1];
    const mondayDate = moment(mondayString, "DD.MM.YY");

    // Set outdated
    if (mondayDate.isValid() && mondayDate.format("DD.MM") !== timeHelper.getMondayDate()) {
        for (let i = 0; i < 6; i++) {
            let outdatedMenu = new Menu();
            outdatedMenu.outdated = true;
            menu[i] = outdatedMenu;
        }
    } else {
        let relevantHtmlPart = $.html($(".slideContent.gu12 > div:nth-child(2),div:nth-child(3)"));
        winston.debug(`${restaurants.uniWirt.name}: ${relevantHtmlPart}`);

        if (relevantHtmlPart) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(relevantHtmlPart, restaurants.uniWirt.id);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`${restaurants.uniWirt.name}: ${gptResponseContent}`);
            const gptJsonAnswer = JSON.parse(gptResponseContent);

            ["MO", "DI", "MI", "DO", "FR"].forEach(function (dayString, dayInWeek) {
                var menuForDay = new Menu();
                var menuct = 0;

                for (let dish of gptJsonAnswer.dishes) {
                    if (dish.day === dayString) {
                        let title = `Menü ${++menuct}`;
                        let main = new Food(title, dish.price, true);

                        let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                            null, false, false, dish.allergens);
                        if (gptJsonAnswer.soups) {
                            for (let soup of gptJsonAnswer.soups) {
                                if (soup.day === dayString) {
                                    main.entries.push(new Food(`${soup.name}`));
                                    break;
                                }
                            }
                        }
                        main.entries.push(food);
                        menuForDay.mains.push(main);
                    }
                }

                if (menuForDay.mains.length > 0) {
                    menu[dayInWeek] = menuForDay;
                }
            });
        }
    }

    menu[5].alacarte = true;
    menu[6].closed = true;

    return menu;
}

function getMensaWeekPlan() {
    return urlCache.getUrls(restaurants.mensa.id)
        .then(urls => request.getAsync({url: JSON.parse(urls).scraperUrl, jar: true}))
        .then(res => res.body)
        .then(body => parseMensa(body));
}

function parseMensa(html) {
    var result = new Array(7);

    var $ = cheerio.load(html);

    let mondayDateString = $(".weekdays .date").first().text();
    let mondayDate = moment(mondayDateString, "DD.MM.");
    if (mondayDate.isValid() && mondayDate.week() !== moment().week()) {
        for (let i = 0; i < 5; i++) {
            let outdatedMenu = new Menu();
            outdatedMenu.outdated = true;
            result[i] = outdatedMenu;
        }
    } else {
        var leftMenuElements = $("#leftColumn .menu-left .menu-category > *");
        var rightMenuElements = $("#middleColumn .menu-category > *");

        var menuElements = $.merge(leftMenuElements, rightMenuElements);
        var menuElementsGroupedByName = _.groupBy(menuElements, e => $(e).find("> :header").text());

        var foodsPerWeekday = [[], [], [], [], [], [], []]; //.fill only works with primitive values
        _.forOwn(menuElementsGroupedByName, (menusForWeek, name) => {
            var foodsForWeek = menusForWeek.map(m => createMensaFoodMenuFromElement($, m, name));
            for (let i = 0; i < foodsForWeek.length; i++) {
                let dayEntry = foodsPerWeekday[i];
                if (!dayEntry)
                    continue;

                dayEntry.push(foodsForWeek[i]);
            }
        });

        for (let i = 0; i < 5; i++) {
            let menu = new Menu();
            result[i] = menu;

            for (let food of foodsPerWeekday[i]) {
                menu.mains.push(food);
            }

            orderMensaMenusOfDay(menu, i);

            menu.starters = menu.starters.filter(m => m && m.name);
            menu.mains = menu.mains.filter(m => m && m.name);

            scraperHelper.setErrorOnEmpty(menu);
        }
    }

    let closedMenu = new Menu();
    closedMenu.closed = true;
    result[5] = result[6] = closedMenu;

    return result;
}

function createMensaFoodMenuFromElement($, e, name) {
    e = $(e);

    // If Mensa changes to splitting foods by <br> again, look in git history for this section how to handle this

    let foodNameElements = e.find("> p:not(:contains(€))").toArray();
    // Filter short delimiter lines
    foodNameElements = foodNameElements.filter(x => $(x).text().trim().length > 4);
    let foodNames = foodNameElements.map(x => $(x).text().trim().replace("&nbsp;", " "));

    // remove additional entries that does not contain dishes (= everything from "ohne Suppe und Salat" on)
    let removeStartingFromIndex = foodNames.findIndex(n => n.toLowerCase().includes("ohne suppe und salat") || n.includes('(*) ='));
    if (removeStartingFromIndex >= 0) {
        foodNameElements.splice(removeStartingFromIndex, foodNameElements.length - removeStartingFromIndex);
        foodNames.splice(removeStartingFromIndex, foodNames.length - removeStartingFromIndex);
    }

    let foodInfos = foodNameElements.map(x => $(x).next().text());
    let hasMultiplePrices = e.find("> p:contains(€)").length > 1;

    let price = hasMultiplePrices ? null : scraperHelper.parsePrice(e.find("> p:contains(€)").text());

    let food = new Food(name, price);
    if (!hasMultiplePrices && (!food.allergens || !food.allergens.length)) {
        let allergenText = foodInfos.join(' ').split('€')[0].trim();
        food.extractAllergens(allergenText);
    }

    food.entries = foodNames.map((foodName, i) => {
        let individualPrice = hasMultiplePrices ? scraperHelper.parsePrice(foodInfos[i]) : null;

        let foodEntry = new Food(foodName, individualPrice)
        if (hasMultiplePrices && (!foodEntry.allergens || !foodEntry.allergens.length)) {
            let allergenText = foodInfos[i].split('€')[0].trim();
            foodEntry.extractAllergens(allergenText);
        }
        return foodEntry;
    });

    return food;
}

/**
 * Changes the order of a menu to "Veggie - Herzhaft - Wochen-Angebote".
 */
function orderMensaMenusOfDay(menu, dayIndex) {
    let from = 3; // move element from this index
    let to = 2; // ... to this index

    // I don't know why first day of week is special ¯\_(ツ )_/¯
    if (dayIndex !== 0) {
        from = 2;
        to = 1;
    }

    const temp = menu.mains[from];
    // shift elements to the left
    for (let j = from; j >= to; j--) {
        menu.mains[j] = menu.mains[j - 1];
    }

    menu.mains[to] = temp;
}

async function getUniPizzeriaWeekPlan() {
    let menu = scraperHelper.getWeekEmptyModel();

    const pdfHttpResult = await urlCache.getUrls(restaurants.uniPizzeria.id)
        .then(urls => crawler(JSON.parse(urls).scraperUrl));

    winston.debug(`${restaurants.uniPizzeria.name}: ${pdfHttpResult.text}`);

    if (pdfHttpResult.text) {
        const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfHttpResult.text, restaurants.uniPizzeria.id);
        const gptResponseContent = gptResponse.data.choices[0].message.content;
        winston.debug(`${restaurants.uniPizzeria.name}: ${gptResponseContent}`);
        const gptJsonAnswer = JSON.parse(gptResponseContent);

        ["MO", "DI", "MI", "DO", "FR", "SA", "SO",].forEach(function (dayString, dayInWeek) {
            var menuForDay = new Menu();
            var menuct = 0;
            let title = `Menü ${++menuct}`;
            let mainCourse = new Food(title, null, true);

            for (let dish of gptJsonAnswer.dishes) {
                if (dish.day === dayString) {
                    let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                        dish.price, false, false, dish.allergens);
                    mainCourse.entries.push(food);
                }
            }

            if (mainCourse.entries.length > 0) {
                menuForDay.mains.push(mainCourse);
                menu[dayInWeek] = menuForDay;
            }
        });
    } else {
        menu = scraperHelper.invalidateMenus(menu);
    }

    menu[5].alacarte = true;
    menu[6].alacarte = true;

    return menu;
}

function getHotspotWeekPlan() {
    return urlCache.getUrls(restaurants.hotspot.id)
        .then(urls => request.getAsync(JSON.parse(urls).scraperUrl))
        .then(res => res.body)
        .then(body => parseHotspot(body));
}

async function parseHotspot(html) {
    var result = new Array(7);

    var $ = cheerio.load(html);

    var mainContent = $("section > .content");
    var heading = mainContent.find("h1:contains(Restaurant Hotspot)").eq(-1).text() || "";
    var weekIsOutdated = !timeHelper.checkInputForCurrentWeek(heading)

    if (weekIsOutdated) {
        result = scraperHelper.invalidateMenus(result);
    } else {
        var contentTable = mainContent.find("> table > tbody");

        // Hauptspeisen
        const contentTableDict = []
        let isMainDish = false;
        contentTable.find('tr').each((ind, itm) => {
            // filter out soups and salats and menu sets ("MENÜ-SET-PREIS")
            if ($(itm).find("td:contains(MENÜ-SET-PREIS)").length === 1) {
                isMainDish = false;
            } else {
                if (isMainDish) {
                    if ($(itm).text().trim() !== "" && $(itm).has('li').length) {
                        contentTableDict.push(itm);
                    }
                } else {
                    if ($(itm).find("td:contains(MENÜHAUPTSPEISEN)").length > 0) {
                        isMainDish = true;
                    }
                }
            }
        })

        let relevantHtmlPart = $.html(contentTableDict);
        winston.debug(`${restaurants.hotspot.name}: ${relevantHtmlPart}`);

        if (relevantHtmlPart) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(relevantHtmlPart, restaurants.hotspot.id);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`${restaurants.hotspot.name}: ${gptResponseContent}`);
            const gptJsonAnswer = JSON.parse(gptResponseContent);

            for (let dayInWeek = 0; dayInWeek < 4; dayInWeek++) { // Hotspot currently only MON-THU
                var menuForDay = new Menu();
                var menuct = 0;

                for (let dish of gptJsonAnswer.dishes) {
                    let title = `Menü ${++menuct}`;
                    let mainCourse = new Food(title, dish.price, true);
                    let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                        null, false, false, dish.allergens);
                    mainCourse.entries = [food];
                    menuForDay.mains.push(mainCourse);
                }

                result[dayInWeek] = menuForDay;
            }
        }
    }

    let closedMenu = new Menu();
    closedMenu.closed = true;
    result[4] = result[5] = result[6] = closedMenu;

    return result;
}

function getBitsAndBytesWeekPlan() {
    return urlCache.getUrls(restaurants.bitsAndBytes.id)
        .then(urls => request.getAsync(JSON.parse(urls).scraperUrl))
        .then(res => res.body)
        .then(body => parseBitsAndBytes(body));
}

async function parseBitsAndBytes(html) {
    var result = new Array(7);

    var $ = cheerio.load(html);

    var mainContent = $("section > .content");
    var heading = mainContent.find("h1:contains(Bits & Bytes Marketplace)").eq(-1).text() || "";
    var weekIsOutdated = !timeHelper.checkInputForCurrentWeek(heading)

    if (weekIsOutdated) {
        result = scraperHelper.invalidateMenus(result);
    } else {
        var contentTable = mainContent.find("> table > tbody");

        // Hauptspeisen
        const contentTableDict = []
        let isMainDish = false;
        contentTable.find('tr').each((ind, itm) => {
            // filter out pizza and wok
            if ($(itm).find("td:contains(WOK)").length === 1) {
                isMainDish = false;
            } else {
                if (isMainDish) {
                    if ($(itm).text().trim() !== "" && $(itm).has('li').length) {
                        contentTableDict.push(itm);
                    }
                } else {
                    if ($(itm).find("td:contains(HEISSE THEKE)").length > 0) {
                        isMainDish = true;
                    }
                }
            }
        })

        let relevantHtmlPart = $.html(contentTableDict);
        winston.debug(`${restaurants.bitsAndBytes.name}: ${relevantHtmlPart}`);

        if (relevantHtmlPart) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(relevantHtmlPart, restaurants.bitsAndBytes.id);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            const gptJsonAnswer = JSON.parse(gptResponseContent);
            winston.debug(`${restaurants.bitsAndBytes.name}: ${gptResponseContent}`);

            for (let dayInWeek = 0; dayInWeek < 5; dayInWeek++) {
                var menuForDay = new Menu();
                var menuct = 0;

                for (let dish of gptJsonAnswer.dishes) {
                    let title = `Menü ${++menuct}`;
                    let mainCourse = new Food(title, dish.price, true);
                    let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                        null, false, false, dish.allergens);
                    mainCourse.entries = [food];
                    menuForDay.mains.push(mainCourse);
                }

                result[dayInWeek] = menuForDay;
            }
        }
    }

    let closedMenu = new Menu();
    closedMenu.closed = true;
    result[5] = result[6] = closedMenu;

    return result;
}

async function getIntersparWeekPlan() {
    let menu = scraperHelper.getWeekEmptyModel();

    const pdfHttpResult = await urlCache.getUrls(restaurants.interspar.id)
        .then(urls => crawler(JSON.parse(urls).scraperUrl));

    winston.debug(`${restaurants.interspar.name}: ${pdfHttpResult.text}`);

    if (pdfHttpResult.text) {
        const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfHttpResult.text, restaurants.interspar.id);
        const gptResponseContent = gptResponse.data.choices[0].message.content;
        winston.debug(`${restaurants.interspar.name}: ${gptResponseContent}`);
        const gptJsonAnswer = JSON.parse(gptResponseContent);

        for (let i = 0; i < 5; i++) {
            let klassischGptDish, vegetarischGptDish;
            try {
                switch (i) {
                    case 0: {
                        klassischGptDish = gptJsonAnswer.dishes[1];
                        vegetarischGptDish = gptJsonAnswer.dishes[2];
                        break;
                    }
                    case 1: {
                        klassischGptDish = gptJsonAnswer.dishes[4];
                        vegetarischGptDish = gptJsonAnswer.dishes[5];
                        break;
                    }
                    case 2: {
                        klassischGptDish = gptJsonAnswer.dishes[8];
                        vegetarischGptDish = gptJsonAnswer.dishes[9];
                        break;
                    }
                    case 3: {
                        klassischGptDish = gptJsonAnswer.dishes[6];
                        vegetarischGptDish = gptJsonAnswer.dishes[7];
                        break;
                    }
                    case 4: {
                        klassischGptDish = gptJsonAnswer.dishes[3];
                        vegetarischGptDish = gptJsonAnswer.dishes[0];
                        break;
                    }
                }
            } catch (error) {
                winston.error(error);
            }

            if (klassischGptDish) {
                try {
                    const klassischMain = new Food('Menü Klassisch', klassischGptDish.price || 8.4);
                    const klassischFood = new Food(`${klassischGptDish.name}${klassischGptDish.description ? ' ' +
                            klassischGptDish.description : ''}`,
                        null, false, false, klassischGptDish.allergens);
                    klassischMain.entries = [klassischFood];
                    menu[i].mains.push(klassischMain)
                } catch (error) {
                    winston.error(error);
                }
            }
            if (vegetarischGptDish) {
                try {
                    const vegetarischMain = new Food('Menü Vegetarisch', vegetarischGptDish.price || 7.9);
                    const vegetarischFood = new Food(`${vegetarischGptDish.name}${vegetarischGptDish.description ? ' ' +
                            vegetarischGptDish.description : ''}`,
                        null, false, false, vegetarischGptDish.allergens);
                    vegetarischMain.entries = [vegetarischFood];

                    menu[i].mains.push(vegetarischMain)
                } catch (error) {
                    winston.error(error);
                }
            }

            try {
                let monatsHitMain = undefined
                const monatsHitGptDish = gptJsonAnswer.monthly_special ||
                gptJsonAnswer.dishes.length === 11 ? gptJsonAnswer.dishes[10] : undefined;
                if (monatsHitGptDish) {
                    monatsHitMain = new Food('Monats-Hit', monatsHitGptDish.price || 10.9);
                    const monatsHitFood = new Food(`${monatsHitGptDish.name}${monatsHitGptDish.description ? ' ' +
                            monatsHitGptDish.description : ''}`,
                        null, false, false, monatsHitGptDish.allergens);
                    monatsHitMain.entries = [monatsHitFood];
                }

                if (monatsHitMain) {
                    menu[i].mains.push(monatsHitMain)
                }
            } catch (error) {
                winston.error(error);
            }
        }
    } else {
        menu = scraperHelper.invalidateMenus(menu);
    }

    menu[5].closed = true;
    menu[6].closed = true;

    return menu;
}

module.exports = {
    getUniWirtWeekPlan: getUniWirtWeekPlan,
    getHotspotWeekPlan: getHotspotWeekPlan,
    getMensaWeekPlan: getMensaWeekPlan,
    getUniPizzeriaWeekPlan: getUniPizzeriaWeekPlan,
    getBitsAndBytesWeekPlan: getBitsAndBytesWeekPlan,
    getIntersparWeekPlan: getIntersparWeekPlan
};
