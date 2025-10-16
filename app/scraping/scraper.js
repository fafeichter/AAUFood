"use strict";

const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const cheerio = require('cheerio');
global.XMLHttpRequest = require('xhr2');
const moment = require('moment');
const _ = require('lodash');
const winston = require('winston');

const Food = require("../models/food");
const Menu = require("../models/menu");
const config = require('../config');
const restaurants = config.restaurants;
const timeHelper = require('../helpers/timeHelper');
const scraperHelper = require('./scraperHelper')
const gptHelper = require('./gptHelper')
const hashUtils = require('./hashUtils');
const urlCache = require('../caching/urlCache');
const menuHashCache = require('../caching/menuHashCache');
const fileUtils = require("./fileUtils");

const uniWirtRestaurantId = restaurants.uniWirt.id;
const mensaRestaurantId = restaurants.mensa.id;
const uniPizzeriaRestaurantId = restaurants.uniPizzeria.id;
const hotspotRestaurantId = restaurants.hotspot.id;
const bitsAndBytesRestaurantId = restaurants.bitsAndBytes.id;
const intersparRestaurantId = restaurants.interspar.id;
const daMarioRestaurantId = restaurants.daMario.id;
const burgerBoutiqueRestaurantId = restaurants.burgerBoutique.id;
const felsenkellerRestaurantId = restaurants.felsenkeller.id;

const PARSING_SKIPPED = null;

function getUniWirtWeekPlan() {
    return urlCache.getUrls(restaurants.uniWirt.id)
        .then(urls => request.getAsync(JSON.parse(urls).scraperUrl))
        .then(res => res.body)
        .then(body => parseUniwirt(body));
}


async function parseUniwirt(html) {
    winston.debug(`Parsing of "${uniWirtRestaurantId}" started ...`);
    var menu = scraperHelper.getWeekEmptyModel();

    var $ = cheerio.load(html);

    let relevantHtmlPart = $.html($("#tab-wochenmenue"));
    winston.debug(`Relevant HTML content of "${uniWirtRestaurantId}": ${relevantHtmlPart}`);

    if (relevantHtmlPart) {
        let relevantHtmlPartPreviousHash = await menuHashCache.getHash(uniWirtRestaurantId);
        let relevantHtmlPartHash = hashUtils.hashWithSHA256(relevantHtmlPart);
        menuHashCache.updateIfNewer(uniWirtRestaurantId, relevantHtmlPartHash);

        if (relevantHtmlPartPreviousHash === null || relevantHtmlPartPreviousHash !== relevantHtmlPartHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(relevantHtmlPart, uniWirtRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`ChatGPT response of "${uniWirtRestaurantId}": ${gptResponseContent}`);
            const gptJsonAnswer = JSON.parse(gptResponseContent);

            ["MO", "DI", "MI", "DO", "FR"].forEach(function (dayString, dayInWeek) {
                var menuForDay = new Menu();
                var menuct = 0;

                if (gptJsonAnswer.soups) {
                    for (let soup of gptJsonAnswer.soups) {
                        if (soup.day === dayString) {
                            let starterFood = new Food(`${soup.name}`);
                            menuForDay.starters.push(starterFood);
                            break;
                        }
                    }
                }

                for (let dish of gptJsonAnswer.dishes) {
                    if (dish.day === dayString) {
                        let title = `Menü ${++menuct}`;
                        let main = new Food(title, dish.price, true);

                        let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                            null, false, false, dish.allergens);
                        main.entries.push(food);
                        menuForDay.mains.push(main);
                    }
                }

                for (let pizza of gptJsonAnswer.pizzas) {
                    if (pizza.day === dayString) {
                        let title = `Menü ${++menuct}`;
                        let main = new Food(title, pizza.price, true);

                        let food = new Food(`${pizza.name}${pizza.description ? ' ' + pizza.description : ''}`,
                            null, false, false, pizza.allergens);
                        main.entries.push(food);
                        menuForDay.mains.push(main);
                    }
                }

                let weeklySpecial = gptJsonAnswer.weekly_special;
                if (weeklySpecial && menuForDay.mains.length > 0) {
                    let title = `Vegan die ganze Woche`;
                    let main = new Food(title, weeklySpecial.price, true);

                    let name = `${weeklySpecial.name}${weeklySpecial.description ? ' ' + weeklySpecial.description : ''}`;
                    let food = new Food(name, null, false, false, weeklySpecial.allergens);

                    main.entries.push(food);
                    menuForDay.mains.push(main);
                }

                if (menuForDay.mains.length > 0) {
                    menu[dayInWeek] = menuForDay;
                } else {
                    winston.debug(`There is no menu for "${uniWirtRestaurantId}" on day with index ${dayInWeek}`);
                    scraperHelper.setDayToError(menu, dayInWeek);
                }
            });
        } else {
            return PARSING_SKIPPED;
        }
    }

    menu[5].alacarte = true;
    menu[6].closed = true;

    return menu;
}

async function getMensaWeekPlan() {
    winston.debug(`Parsing of "${mensaRestaurantId}" started ...`);

    let menu = scraperHelper.getWeekEmptyModel();

    const scraperUrl = await urlCache.getUrls(mensaRestaurantId)
        .then(urls => JSON.parse(urls).scraperUrl)

    const pdfAsBase64Image = await fileUtils.pdf2Base64Image(scraperUrl, mensaRestaurantId);

    if (pdfAsBase64Image) {
        let imagePreviousHash = await menuHashCache.getHash(mensaRestaurantId);
        let imageHash = hashUtils.hashWithSHA256(pdfAsBase64Image);
        menuHashCache.updateIfNewer(mensaRestaurantId, imageHash);

        if (imagePreviousHash === null || imagePreviousHash !== imageHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfAsBase64Image, mensaRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`ChatGPT response of "${mensaRestaurantId}": ${gptResponseContent}`);
            const gptJsonAnswer = JSON.parse(gptResponseContent);

            ["MO", "DI", "MI", "DO", "FR"].forEach(function (dayString, dayInWeek) {
                var menuForDay = new Menu();

                // Tagesangebot
                let dailyDishTitle = 'Tagesangebot';
                let dailyDishMain = new Food(dailyDishTitle, null, true);
                for (let dailyDish of gptJsonAnswer.daily_dishes) {
                    if (dailyDish.day === null || dailyDish.day === dayString) {
                        let food = new Food(`${dailyDish.name}${dailyDish.description ? ' ' + dailyDish.description : ''}`,
                            dailyDish.price, false, false, dailyDish.allergens);

                        dailyDishMain.entries.push(food);
                    }
                }

                if (dailyDishMain.entries.length > 0) {
                    menuForDay.mains.push(dailyDishMain);
                }

                // Wochenangebot
                let weeklyDishTitle = 'Wochenangebot';
                let weeklyDishMain = new Food(weeklyDishTitle, null, true);
                for (let weeklyDish of gptJsonAnswer.weekly_dishes) {
                    let food = new Food(`${weeklyDish.name}${weeklyDish.description ? ' ' + weeklyDish.description : ''}`,
                        weeklyDish.price, false, false, weeklyDish.allergens);

                    weeklyDishMain.entries.push(food);
                }

                if (weeklyDishMain.entries.length > 0) {
                    menuForDay.mains.push(weeklyDishMain);
                }

                if (menuForDay.mains.length > 0) {
                    menu[dayInWeek] = menuForDay;
                } else {
                    winston.debug(`There is no menu for "${restaurants.interspar.id}" on day with index ${dayInWeek}`);
                    scraperHelper.setDayToError(menu, dayInWeek);
                }
            });
        } else {
            return PARSING_SKIPPED;
        }
    }

    menu[5].closed = true;
    menu[6].closed = true;

    return menu;
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
    winston.debug(`Parsing of "${uniPizzeriaRestaurantId}" started ...`);

    let menu = scraperHelper.getWeekEmptyModel();

    const scraperUrl = await urlCache.getUrls(uniPizzeriaRestaurantId)
        .then(urls => JSON.parse(urls).scraperUrl)

    const pdfAsBase64Image = await fileUtils.pdf2Base64Image(scraperUrl, uniPizzeriaRestaurantId);

    if (pdfAsBase64Image) {
        let imagePreviousHash = await menuHashCache.getHash(uniPizzeriaRestaurantId)
        let imageHash = hashUtils.hashWithSHA256(pdfAsBase64Image);
        menuHashCache.updateIfNewer(uniPizzeriaRestaurantId, imageHash);

        if (imagePreviousHash === null || imagePreviousHash !== imageHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfAsBase64Image, uniPizzeriaRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`ChatGPT response of "${uniPizzeriaRestaurantId}": ${gptResponseContent}`);
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

                        let salats = gptJsonAnswer.salats;
                        if (salats) {
                            for (let salat of gptJsonAnswer.salats) {
                                if (salat.day === dayString) {
                                    main.entries.push(new Food(`${salat.name}`));
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
                } else {
                    winston.debug(`There is no menu for "${restaurants.uniWirt.id}" on day with index ${dayInWeek}`);
                    scraperHelper.setDayToError(menu, dayInWeek);
                }
            });
        } else {
            return PARSING_SKIPPED;
        }
    }

    menu[5].alacarte = true;
    menu[6].alacarte = true;

    return menu;
}

async function getHotspotWeekPlan() {
    winston.debug(`Parsing of "${hotspotRestaurantId}" started ...`);

    let menu = scraperHelper.getWeekEmptyModel();

    const scraperUrl = await urlCache.getUrls(hotspotRestaurantId)
        .then(urls => JSON.parse(urls).scraperUrl)

    const pdfAsBase64Image = await fileUtils.pdf2Base64Image(scraperUrl, hotspotRestaurantId);

    if (pdfAsBase64Image) {
        let imagePreviousHash = await menuHashCache.getHash(hotspotRestaurantId);
        let imageHash = hashUtils.hashWithSHA256(pdfAsBase64Image);
        menuHashCache.updateIfNewer(hotspotRestaurantId, imageHash);

        if (imagePreviousHash === null || imagePreviousHash !== imageHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfAsBase64Image, hotspotRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`ChatGPT response of "${hotspotRestaurantId}": ${gptResponseContent}`);
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

                if (menuForDay.mains.length > 0) {
                    menu[dayInWeek] = menuForDay;
                } else {
                    winston.debug(`There is no menu for "${hotspotRestaurantId}" on day with index ${dayInWeek}`);
                    scraperHelper.setDayToError(menu, dayInWeek);
                }
            }
        } else {
            return PARSING_SKIPPED;
        }
    }

    // Friday + Saturday + Sunday
    let closedMenu = new Menu();
    closedMenu.closed = true;
    menu[4] = menu[5] = menu[6] = closedMenu;

    return menu;
}

async function getBitsAndBytesWeekPlan() {
    winston.debug(`Parsing of "${bitsAndBytesRestaurantId}" started ...`);

    let menu = scraperHelper.getWeekEmptyModel();

    const scraperUrl = await urlCache.getUrls(bitsAndBytesRestaurantId)
        .then(urls => JSON.parse(urls).scraperUrl)

    const pdfAsBase64Image = await fileUtils.pdf2Base64Image(scraperUrl, bitsAndBytesRestaurantId);

    if (pdfAsBase64Image) {
        let imagePreviousHash = await menuHashCache.getHash(bitsAndBytesRestaurantId);
        let imageHash = hashUtils.hashWithSHA256(pdfAsBase64Image);
        menuHashCache.updateIfNewer(bitsAndBytesRestaurantId, imageHash);

        if (imagePreviousHash === null || imagePreviousHash !== imageHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfAsBase64Image, bitsAndBytesRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`ChatGPT response of "${bitsAndBytesRestaurantId}": ${gptResponseContent}`);
            const gptJsonAnswer = JSON.parse(gptResponseContent);

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

                if (menuForDay.mains.length > 0) {
                    menu[dayInWeek] = menuForDay;
                } else {
                    winston.debug(`There is no menu for "${bitsAndBytesRestaurantId}" on day with index ${dayInWeek}`);
                    scraperHelper.setDayToError(menu, dayInWeek);
                }
            }
        } else {
            return PARSING_SKIPPED;
        }
    }

    // Saturday + Sunday
    let closedMenu = new Menu();
    closedMenu.closed = true;
    menu[5] = menu[6] = closedMenu;

    return menu;
}

async function getIntersparWeekPlan() {
    winston.debug(`Parsing of "${intersparRestaurantId}" started ...`);

    let menu = scraperHelper.getWeekEmptyModel();

    const scraperUrl = await urlCache.getUrls(intersparRestaurantId)
        .then(urls => JSON.parse(urls).scraperUrl)

    const pdfAsBase64Image = await fileUtils.pdf2Base64Image(scraperUrl, intersparRestaurantId);

    if (pdfAsBase64Image) {
        let imagePreviousHash = await menuHashCache.getHash(intersparRestaurantId);
        let imageHash = hashUtils.hashWithSHA256(pdfAsBase64Image);
        menuHashCache.updateIfNewer(intersparRestaurantId, imageHash);

        if (imagePreviousHash === null || imagePreviousHash !== imageHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfAsBase64Image, intersparRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`ChatGPT response of "${intersparRestaurantId}": ${gptResponseContent}`);
            const gptJsonAnswer = JSON.parse(gptResponseContent);

            ["MO", "DI", "MI", "DO", "FR"].forEach(function (dayString, dayInWeek) {
                var menuForDay = new Menu();
                var menuct = 0;

                for (let dish of gptJsonAnswer.dishes) {
                    if (dish.day === dayString) {
                        let title = `Menü ${menuct++ === 0 ? 'Klassisch' : 'Vegetarisch'}`;
                        let main = new Food(title, dish.price, true);

                        let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                            null, false, false, dish.allergens);

                        main.entries.push(food);
                        menuForDay.mains.push(main);
                    }
                }

                let monthlySpecial = gptJsonAnswer.monthly_special;
                if (monthlySpecial && menuForDay.mains.length > 0) {
                    let title = `Monats-Hit`;
                    let main = new Food(title, monthlySpecial.price, true);

                    let name = `${monthlySpecial.name}${monthlySpecial.description ? ' ' + monthlySpecial.description : ''}`;
                    let food = new Food(name, null, false, false, monthlySpecial.allergens);

                    main.entries.push(food);
                    menuForDay.mains.push(main);
                }

                if (menuForDay.mains.length > 0) {
                    menu[dayInWeek] = menuForDay;
                } else {
                    winston.debug(`There is no menu for "${restaurants.interspar.id}" on day with index ${dayInWeek}`);
                    scraperHelper.setDayToError(menu, dayInWeek);
                }
            });
        } else {
            return PARSING_SKIPPED;
        }
    }

    menu[5].alacarte = true;
    menu[6].closed = true;

    return menu;
}

function getDaMarioWeekPlan() {
    return urlCache.getUrls(restaurants.daMario.id)
        .then(urls => request.getAsync(JSON.parse(urls).scraperUrl))
        .then(res => res.body)
        .then(body => parseDaMario(body));
}

async function parseDaMario(html) {
    winston.debug(`Parsing of "${daMarioRestaurantId}" started ...`);
    var result = new Array(7);

    var $ = cheerio.load(html);

    let relevantHtmlPart = $.html($('div.wd-tab-content.wd-active.wd-in'));
    winston.debug(`Relevant HTML content of "${daMarioRestaurantId}": ${relevantHtmlPart}`);

    if (relevantHtmlPart) {
        let relevantHtmlPartPreviousHash = await menuHashCache.getHash(daMarioRestaurantId);
        let relevantHtmlPartHash = hashUtils.hashWithSHA256(relevantHtmlPart);
        menuHashCache.updateIfNewer(daMarioRestaurantId, relevantHtmlPartHash);

        if (relevantHtmlPartPreviousHash === null || relevantHtmlPartPreviousHash !== relevantHtmlPartHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(relevantHtmlPart, daMarioRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            const gptJsonAnswer = JSON.parse(gptResponseContent);
            winston.debug(`ChatGPT response of "${daMarioRestaurantId}": ${gptResponseContent}`);

            for (let dayInWeek = 0; dayInWeek < 5; dayInWeek++) {
                var menuForDay = new Menu();

                let starterFood = new Food("Salat mit Essig-Öl Dressing");
                menuForDay.starters.push(starterFood)

                let titlePizza = 'Pizza';
                let mainCoursePizza = new Food(titlePizza, null, true);
                for (let dish of gptJsonAnswer.pizza) {
                    let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                        dish.price, false, false, dish.allergens);
                    mainCoursePizza.entries.push(food);
                }
                menuForDay.mains.push(mainCoursePizza);

                let titlePasta = 'Pasta';
                let mainCoursePasta = new Food(titlePasta, null, true);
                for (let dish of gptJsonAnswer.pasta) {
                    let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                        dish.price, false, false, dish.allergens);
                    mainCoursePasta.entries.push(food);
                }
                menuForDay.mains.push(mainCoursePasta);

                result[dayInWeek] = menuForDay;
            }
        } else {
            return PARSING_SKIPPED;
        }
    }

    let closedMenu = new Menu();
    closedMenu.closed = true;
    result[0] = result[5] = result[6] = closedMenu;

    return result;
}

function getBurgerBoutiquePlan() {
    winston.debug(`Building static menu of "${burgerBoutiqueRestaurantId}" started ...`);
    let menu = scraperHelper.getWeekEmptyModel();

    // Monday
    let mondayMenu = new Menu();
    let mondayMain = new Food("Menü 1", 11.5, true);
    let mondayFood = new Food("Burritos + Pommes und Sauce", null, false, false, null);

    mondayMain.entries.push(mondayFood);
    mondayMenu.mains.push(mondayMain);
    menu[0] = mondayMenu;

    // Tuesday
    let tuesdayMenu = new Menu();
    let tuesdayMain = new Food("Menü 1", 11.5, true);
    let tuesdayFood = new Food("Bowls", null, false, false, null);

    tuesdayMain.entries.push(tuesdayFood);
    tuesdayMenu.mains.push(tuesdayMain);
    menu[1] = tuesdayMenu;

    // Wednesday
    let wednesdayMenu = new Menu();
    let wednesdayMain = new Food("Menü 1", 11.5, true);
    let wednesdayFood = new Food();
    wednesdayFood.name = "Burger (außer New Jersey, Route 66 und Surf and Turf)";

    wednesdayMain.entries.push(wednesdayFood);
    wednesdayMenu.mains.push(wednesdayMain);
    menu[2] = wednesdayMenu;

    // Thursday
    let thursdayMenu = new Menu();
    let thursdayMain = new Food("Menü 1", 11.5, true);
    let thursdayFood = new Food("Wraps + Pommes und Sauce", null, false, false, null);

    thursdayMain.entries.push(thursdayFood);
    thursdayMenu.mains.push(thursdayMain);
    menu[3] = thursdayMenu;

    // Friday
    let fridayMenu = new Menu();
    let fridayFood = new Food("Alle Abholungen -20%", null, false, false, null);

    fridayMenu.starters.push(fridayFood);
    menu[4] = fridayMenu;

    // Saturday
    let aLaCarteMenu = new Menu();
    aLaCarteMenu.alacarte = true;
    menu[5] = aLaCarteMenu;

    // Sunday
    let sundayMenu = new Menu();
    let sundayMain = new Food("Sonntagsspecial", 4.9, true);
    let sundayFood = new Food("Kidsmenü + Pommes und Apfelsaft", null, false, false, null);

    sundayMain.entries.push(sundayFood);
    sundayMenu.mains.push(sundayMain);
    menu[6] = sundayMenu;

    return Promise.resolve(menu);
}

async function getFelsenkellerPlan() {
    winston.debug(`Parsing of "${felsenkellerRestaurantId}" started ...`);

    let menu = scraperHelper.getWeekEmptyModel();

    const scraperUrl = await urlCache.getUrls(felsenkellerRestaurantId)
        .then(urls => JSON.parse(urls).scraperUrl)

    const pdfAsBase64Image = await fileUtils.pdf2Base64Image(scraperUrl, felsenkellerRestaurantId);

    if (pdfAsBase64Image) {
        let imagePreviousHash = await menuHashCache.getHash(felsenkellerRestaurantId);
        let imageHash = hashUtils.hashWithSHA256(pdfAsBase64Image);
        menuHashCache.updateIfNewer(felsenkellerRestaurantId, imageHash);

        if (imagePreviousHash === null || imagePreviousHash !== imageHash) {
            const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfAsBase64Image, felsenkellerRestaurantId);
            const gptResponseContent = gptResponse.data.choices[0].message.content;
            winston.debug(`ChatGPT response of "${felsenkellerRestaurantId}": ${gptResponseContent}`);
            const gptJsonAnswer = JSON.parse(gptResponseContent);

            ["MO", "DI", "MI", "DO", "FR"].forEach(function (dayString, dayInWeek) {
                var menuForDay = new Menu();
                var menuct = 0;

                if (gptJsonAnswer.soups) {
                    for (let soup of gptJsonAnswer.soups) {
                        if (soup.day === dayString) {
                            let starterFood = new Food(`${soup.name}`);
                            menuForDay.starters.push(starterFood);
                            break;
                        }
                    }
                }

                for (let dish of gptJsonAnswer.dishes) {
                    if (dish.day === dayString) {
                        let title = `Menü ${++menuct}`;
                        let main = new Food(title, dish.price, true);

                        let food = new Food(`${dish.name}${dish.description ? ' ' + dish.description : ''}`,
                            null, false, false, dish.allergens);
                        main.entries.push(food);
                        menuForDay.mains.push(main);
                    }
                }

                if (menuForDay.mains.length > 0) {
                    menu[dayInWeek] = menuForDay;
                } else {
                    winston.debug(`There is no menu for "${felsenkellerRestaurantId}" on day with index ${dayInWeek}`);
                    scraperHelper.setDayToError(menu, dayInWeek);
                }
            });
        } else {
            return PARSING_SKIPPED;
        }
    }

    menu[5].alacarte = true;
    menu[6].closed = true;

    return menu;
}

module.exports = {
    getUniWirtWeekPlan,
    getHotspotWeekPlan,
    getMensaWeekPlan,
    getUniPizzeriaWeekPlan,
    getBitsAndBytesWeekPlan,
    getIntersparWeekPlan,
    getDaMarioWeekPlan,
    getBurgerBoutiquePlan,
    getFelsenkellerPlan,
    PARSING_SKIPPED
};
