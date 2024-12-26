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

router.get('/', counter.countVisitors, function (req, res, next) {
    Promise.all([
        menuCache.getMenu(uniWirt), urlCache.getUrls(uniWirt),
        menuCache.getMenu(mensa), urlCache.getUrls(mensa),
        menuCache.getMenu(hotspot), urlCache.getUrls(hotspot),
        menuCache.getMenu(uniPizzeria), urlCache.getUrls(uniPizzeria),
        menuCache.getMenu(bitsAndBytes), urlCache.getUrls(bitsAndBytes),
        menuCache.getMenu(interspar), urlCache.getUrls(interspar),
        menuCache.getMenu(daMario), urlCache.getUrls(daMario),
        menuCache.getMenu(burgerBoutique), urlCache.getUrls(burgerBoutique)])
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

module.exports = router;
