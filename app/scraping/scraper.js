"use strict";

const Promise = require('bluebird');
const request = Promise.promisifyAll(require("request"));
const cheerio = require('cheerio');
global.XMLHttpRequest = require('xhr2');
const moment = require('moment');
const _ = require('lodash');
const crawler = require('crawler-request');

const Food = require("../models/food");
const Menu = require("../models/menu");
const config = require('../config');
const restaurants = config.restaurants;
const timeHelper = require('../helpers/timeHelper');
const scraperHelper = require('./scraperHelper')
const gptHelper = require('./gptHelper')
const urlCache = require('../caching/urlCache');

function parseWeek(input, parseFunction) {
    var menus = [];
    for (let day = 0; day < 7; day++) {
        menus[day] = parseFunction(input, day);
    }

    return menus;
}

function getUniWirtWeekPlan() {
    return urlCache.getUrls(restaurants.uniWirt.id)
        .then(urls => request.getAsync(JSON.parse(urls).scraperUrl))
        .then(res => res.body)
        .then(body => parseUniwirt(body));
}

function parseUniwirt(html) {
    var weekPlan = new Array(7);

    //Set Sunday closed
    let closedMenu = new Menu();
    closedMenu.closed = true;
    weekPlan[6] = closedMenu;

    var $ = cheerio.load(html);

    // Get Monday Date
    const mondayString = $("h3:contains(Montag)").text().split(" ")[1];
    const mondayDate = moment(mondayString, "DD.MM.YY");

    // Set outdated
    if (mondayDate.isValid() && mondayDate.format("DD.MM") !== timeHelper.getMondayDate()) {
        for (let i = 0; i < 6; i++) {
            let outdatedMenu = new Menu();
            outdatedMenu.outdated = true;
            weekPlan[i] = outdatedMenu;
        }
        return weekPlan;
    }

    // Week specials
    // Get last entry including "wochen"
    var weekHeading = $($("#mittagsmenues .wpb_row").toArray().filter(x => $(x).find("h2").text().toLowerCase().includes("woche")));

    // Get all names (first <p> in each column)
    var allWeekSpecialNodes = weekHeading.nextAll().find("p:first-of-type");

    // Filter out drinks
    var weekSpecialNodes = allWeekSpecialNodes
        .toArray()
        .map(x => $(x))
        .filter(x => !x.parent().text().toLowerCase().includes("drink"));

    const weekSpecials = [];
    for (let specialNameElement of weekSpecialNodes) {
        let infoText = specialNameElement.parent().text().trim();
        let price = scraperHelper.parsePrice(infoText);

        let special = new Food(specialNameElement.text(), price);
        if (!special.allergens || special.allergens.length === 0) {
            special.extractAllergens(infoText);
        }

        weekSpecials.push(special);
    }

    const weekSpecialMenu = new Food("Wochenangebote", null, true);
    weekSpecialMenu.entries = weekSpecials;

    // Daily menus
    var date = mondayDate;
    for (let dayInWeek = 0; dayInWeek < 6; dayInWeek++) {
        var dateString = date.format("DD.MM.YY");
        var dayEntry = $(`h3:contains(${dateString})`);
        if (!dayEntry || dayEntry.length === 0) {
            dateString = date.format('dddd').toLowerCase();
            dayEntry = $(`h3:icontains(${dateString})`);
        }

        try {
            let dayPlan = createUniwirtDayMenu(dayEntry.parent());
            dayPlan.mains.push(weekSpecialMenu);
            weekPlan[dayInWeek] = dayPlan;
        } catch (ex) {
            let errorMenu = new Menu();
            errorMenu.error = true;
            weekPlan[dayInWeek] = errorMenu;
        }
        date.add(1, 'days');
    }

    // Saturday a la carte
    weekPlan[5].alacarte = true;

    return weekPlan;
}

function createUniwirtDayMenu(dayEntry) {
    var dayMenu = new Menu();
    var paragraphs = dayEntry.find("p, li");
    //Omit first <p> as it is the date
    var dateParagraph = paragraphs.eq(0);
    paragraphs = paragraphs.filter(":not(:empty)");

    if (paragraphs.length < 2) {
        //Special cases
        let pText = paragraphs.length === 0 ? dateParagraph.text() : paragraphs.text();
        pText = pText.replace(/\d\d\.\d\d\.\d+/, "").trim();

        if (scraperHelper.contains(pText, true, ["feiertag", "ruhetag", "pause", "geschlossen", "closed"])) {
            dayMenu.closed = true;
        } else if (scraperHelper.contains(pText, true, ["Empfehlung"])) {
            dayMenu.alacarte = true;
        } else {
            pText = pText.charAt(0).toUpperCase() + pText.slice(1);
            let info = new Food(pText, null, false, true);
            dayMenu.mains.push(info);
        }
    } else {
        const foodEntries = []; // [name, price, isMainCourse]

        for (let i = 0; i < paragraphs.length; i++) {
            let pEntry = paragraphs.eq(i);

            let text = pEntry.text().trim();

            let price = scraperHelper.parsePrice(text);

            //If it has a price, it is a main course, otherwise a starter
            let hasName = !!text.trim();
            if (hasName) {
                foodEntries.push([text, price, !!price]);
            }
        }

        const starters = foodEntries.filter(x => !x[2]).map(([name]) => new Food(name));
        const mainCourses = foodEntries.filter(x => x[2]);

        const menus = mainCourses.map(([name, price], i) => {
            let main = new Food(`Menü ${i + 1}`, price, true);
            main.entries = [...starters, new Food(name)]
            return main;
        })

        dayMenu.mains = menus;
    }

    return scraperHelper.setErrorOnEmpty(dayMenu);
}

function getMensaWeekPlan() {
    return urlCache.getUrls(restaurants.mensa.id)
        .then(urls => request.getAsync({url: JSON.parse(urls).scraperUrl, jar: true}))
        .then(res => res.body)
        .then(body => parseMensa(body));
}

function parseMensa(html) {
    var result = new Array(7);

    let closedMenu = new Menu();
    closedMenu.closed = true;
    result[5] = result[6] = closedMenu;

    var $ = cheerio.load(html);

    let mondayDateString = $(".weekdays .date").first().text();
    let mondayDate = moment(mondayDateString, "DD.MM.");
    if (mondayDate.isValid() && mondayDate.week() !== moment().week()) {
        for (let i = 0; i < 5; i++) {
            let outdatedMenu = new Menu();
            outdatedMenu.outdated = true;
            result[i] = outdatedMenu;
        }
        return result;
    }

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

function createWochenspecialFoodMenusFromElements($, elements) {
    return elements.map((i, e) => createWochenspecialFoodMenuFromElement($, e)).toArray();
}

function createWochenspecialFoodMenuFromElement($, e) { // Kept here in case mensa changes its page once again
    e = $(e);
    let contentElement = e.find("> p :contains(Wochenhit)").last();

    if (!contentElement.length) {
        return null;
    }

    let nameWithPrice = contentElement.text();
    let price = scraperHelper.parsePrice(nameWithPrice);
    let foodNames = nameWithPrice
        .replace(/Wochenhit:?/, "") //Remove title
        .replace(/(\d+,\d+\s*)?€.*$/, "") // Remove leading prices (with leading or trailing €)
        .split(")") //Split at end of allergens, don't worry about missing closing )
        .map(s => s.trim());

    let food = new Food("Wochenspecial", price, true);
    food.entries = foodNames.map(n => new Food(n));
    return food;
}

async function getUniPizzeriaWeekPlan() {
    const menu = scraperHelper.getWeekEmptyModel();

    menu[5].alacarte = true;
    menu[6].alacarte = true;

    const pdfHttpResult = await urlCache.getUrls(restaurants.uniPizzeria.id)
        .then(urls => {
            return crawler(JSON.parse(urls).scraperUrl);
        });

    console.log(pdfHttpResult.text);

    const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfHttpResult.text);
    const gptJsonAnswer = JSON.parse(gptResponse.data.choices[0].message.content);

    console.log(gptJsonAnswer);

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

    return Promise.resolve(menu);
}

function getHotspotWeekPlan() {
    return urlCache.getUrls(restaurants.hotspot.id)
        .then(urls => request.getAsync(JSON.parse(urls).scraperUrl))
        .then(res => res.body)
        .then(body => parseHotspot(body));
}

async function parseHotspot(html) {
    var result = new Array(7);
    let closedMenu = new Menu();
    closedMenu.closed = true;
    result[4] = result[5] = result[6] = closedMenu;

    var $ = cheerio.load(html);

    var mainContent = $("section > .content");
    var heading = mainContent.find("h1:contains(Restaurant Hotspot)").eq(0).text() || "";
    var weekIsOutdated = !timeHelper.checkInputForCurrentWeek(heading)

    if (weekIsOutdated) {
        return scraperHelper.invalidateMenus(result);
    }

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
    console.log(relevantHtmlPart);

    const gptResponse = await gptHelper.letMeChatGptThatForYou(relevantHtmlPart);
    const gptJsonAnswer = JSON.parse(gptResponse.data.choices[0].message.content);

    console.log(gptJsonAnswer);

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
    let closedMenu = new Menu();
    closedMenu.closed = true;
    result[5] = result[6] = closedMenu;

    var $ = cheerio.load(html);

    var mainContent = $("section > .content");
    var heading = mainContent.find("h1:contains(Bits & Bytes Marketplace)").eq(0).text() || "";
    var weekIsOutdated = !timeHelper.checkInputForCurrentWeek(heading)

    if (weekIsOutdated) {
        return scraperHelper.invalidateMenus(result);
    }

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
    console.log(relevantHtmlPart);

    const gptResponse = await gptHelper.letMeChatGptThatForYou(relevantHtmlPart);
    const gptJsonAnswer = JSON.parse(gptResponse.data.choices[0].message.content);

    console.log(gptJsonAnswer);

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

    return result;
}

async function getIntersparWeekPlan() {
    const menu = scraperHelper.getWeekEmptyModel();

    const pdfHttpResult = await urlCache.getUrls(restaurants.interspar.id)
        .then(urls => {
            return crawler(JSON.parse(urls).scraperUrl);
        });

    console.log(pdfHttpResult.text);

    const gptResponse = await gptHelper.letMeChatGptThatForYou(pdfHttpResult.text);
    const gptJsonAnswer = JSON.parse(gptResponse.data.choices[0].message.content);

    console.log(gptJsonAnswer);

    for (let i = 0; i < 5; i++) {
        let klassischGptDish, vegetarischGptDish;
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

        const klassischMain = new Food('Menü Klassisch', klassischGptDish.price || 8.4);
        const klassischFood = new Food(`${klassischGptDish.name}${klassischGptDish.description ? ' ' +
                klassischGptDish.description : ''}`,
            null, false, false, klassischGptDish.allergens);
        klassischMain.entries = [klassischFood];

        const vegetarischMain = new Food('Menü Vegetarisch', vegetarischGptDish.price || 7.9);
        const vegetarischFood = new Food(`${vegetarischGptDish.name}${vegetarischGptDish.description ? ' ' +
                vegetarischGptDish.description : ''}`,
            null, false, false, vegetarischGptDish.allergens);
        vegetarischMain.entries = [vegetarischFood];

        let monatsHitMain = undefined
        const monatsHitGptDish = gptJsonAnswer.monthly_special;
        if (monatsHitGptDish) {
            monatsHitMain = new Food('Monats-Hit', monatsHitGptDish.price || 10.9);
            const monatsHitFood = new Food(`${monatsHitGptDish.name}${monatsHitGptDish.description ? ' ' +
                    monatsHitGptDish.description : ''}`,
                null, false, false, monatsHitGptDish.allergens);
            monatsHitMain.entries = [monatsHitFood];
        }

        menu[i].mains.push(klassischMain)
        menu[i].mains.push(vegetarischMain)
        if (monatsHitMain) {
            menu[i].mains.push(monatsHitMain)
        }
        menu[i].scrapingNotImplemented = false;
    }

    menu[5].closed = true;
    menu[5].scrapingNotImplemented = false;
    menu[6].closed = true;
    menu[6].scrapingNotImplemented = false;

    return Promise.resolve(menu);
}

module.exports = {
    getUniWirtWeekPlan: getUniWirtWeekPlan,
    getHotspotWeekPlan: getHotspotWeekPlan,
    getMensaWeekPlan: getMensaWeekPlan,
    getUniPizzeriaWeekPlan: getUniPizzeriaWeekPlan,
    getBitsAndBytesWeekPlan: getBitsAndBytesWeekPlan,
    getIntersparWeekPlan: getIntersparWeekPlan
};
