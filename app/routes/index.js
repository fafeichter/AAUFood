const express = require('express');
const router = express.Router();
const Promise = require("bluebird");
const menuCache = require('../caching/menuCache');
const urlCache = require('../caching/urlCache');
const counter = require('../middleware/visitorCounter');
const restaurants = require('../config').restaurants;
const uniWirt = restaurants.uniWirt.id;
const mensa = restaurants.mensa.id;
const hotspot = restaurants.hotspot.id;
const uniPizzeria = restaurants.uniPizzeria.id;
const bitsAndBytes = restaurants.bitsAndBytes.id;
const interspar = restaurants.interspar.id;
const daMario = restaurants.daMario.id;
const burgerBoutique = restaurants.burgerBoutique.id;
const felsenkeller = restaurants.felsenkeller.id;
const villaLido = restaurants.villaLido.id;
const ichiGoIchiE = restaurants.ichiGoIchiE.id;
const breakPointLunchBar = restaurants.breakPointLunchBar.id;
const baburu = restaurants.baburu.id;

router.get('/', counter.countVisitors, function (req, res, next) {
    Promise.all([
        menuCache.getMenu(uniWirt), urlCache.getUrls(uniWirt),
        menuCache.getMenu(mensa), urlCache.getUrls(mensa),
        menuCache.getMenu(hotspot), urlCache.getUrls(hotspot),
        menuCache.getMenu(uniPizzeria), urlCache.getUrls(uniPizzeria),
        menuCache.getMenu(bitsAndBytes), urlCache.getUrls(bitsAndBytes),
        menuCache.getMenu(interspar), urlCache.getUrls(interspar),
        menuCache.getMenu(daMario), urlCache.getUrls(daMario),
        menuCache.getMenu(burgerBoutique), urlCache.getUrls(burgerBoutique),
        menuCache.getMenu(felsenkeller), urlCache.getUrls(felsenkeller),
        menuCache.getMenu(villaLido), urlCache.getUrls(villaLido),
        menuCache.getMenu(ichiGoIchiE), urlCache.getUrls(ichiGoIchiE),
        menuCache.getMenu(breakPointLunchBar), urlCache.getUrls(breakPointLunchBar),
        menuCache.getMenu(baburu), urlCache.getUrls(baburu)])
        .then(results => {
            res.render('index', {
                title: 'AAU Food',
                uniWirt: {
                    menu: JSON.parse(results[0]) || [],
                    userFriendlyUrl: JSON.parse(results[1]).userFriendlyUrl
                },
                mensa: {
                    menu: JSON.parse(results[2]) || [],
                    userFriendlyUrl: JSON.parse(results[3]).userFriendlyUrl
                },
                hotspot: {
                    menu: JSON.parse(results[4]) || [],
                    userFriendlyUrl: JSON.parse(results[5]).userFriendlyUrl
                },
                uniPizzeria: {
                    menu: JSON.parse(results[6]) || [],
                    userFriendlyUrl: JSON.parse(results[7]).userFriendlyUrl
                },
                bitsAndBytes: {
                    menu: JSON.parse(results[8]) || [],
                    userFriendlyUrl: JSON.parse(results[9]).userFriendlyUrl
                },
                interspar: {
                    menu: JSON.parse(results[10]) || [],
                    userFriendlyUrl: JSON.parse(results[11]).userFriendlyUrl,
                    secondaryFriendlyUrl: JSON.parse(results[11]).secondaryFriendlyUrl
                },
                daMario: {
                    menu: JSON.parse(results[12]) || [],
                    userFriendlyUrl: JSON.parse(results[13]).userFriendlyUrl
                },
                burgerBoutique: {
                    menu: JSON.parse(results[14]) || [],
                    userFriendlyUrl: JSON.parse(results[15]).userFriendlyUrl
                },
                felsenkeller: {
                    menu: JSON.parse(results[16]) || [],
                    userFriendlyUrl: JSON.parse(results[17]).userFriendlyUrl
                },
                villaLido: {
                    menu: JSON.parse(results[18]) || [],
                    userFriendlyUrl: JSON.parse(results[19]).userFriendlyUrl
                },
                ichiGoIchiE: {
                    menu: JSON.parse(results[20]) || [],
                    userFriendlyUrl: JSON.parse(results[21]).userFriendlyUrl
                },
                breakPointLunchBar: {
                    menu: JSON.parse(results[22]) || [],
                    userFriendlyUrl: JSON.parse(results[23]).userFriendlyUrl
                },
                baburu: {
                    menu: JSON.parse(results[24]) || [],
                    userFriendlyUrl: JSON.parse(results[25]).userFriendlyUrl
                },
                visitorStats: req.visitorStats,
                restaurants
            });
        });
});

router.get('/about', counter.countVisitors, function (req, res, next) {
    res.render('about', {
        title: 'AAU Food: About',
        visitorStats: req.visitorStats,
    });
});

router.get('/imprint', counter.countVisitors, function (req, res, next) {
    res.render('imprint', {
        title: 'AAU Food: Imprint',
        visitorStats: req.visitorStats,
    });
});

module.exports = router;