const express = require('express');
const router = express.Router();
const Promise = require("bluebird");
const menuCache = require('../caching/menuCache');
const urlCache = require('../caching/urlCache');
const externalApis = require('../externals/externalApis');
const counter = require('../middleware/visitorCounter');
const restaurants = require('../config').restaurants;

router.get('/:day(-?\\d*)?', counter.countVisitors, function (req, res, next) {
    var uniwirtPlan = menuCache.getMenu(restaurants.uniWirt.id);
    var mensaPlan = menuCache.getMenu(restaurants.mensa.id);
    var hotspotPlan = menuCache.getMenu(restaurants.hotspot.id);
    var uniPizzeriaPlan = menuCache.getMenu(restaurants.uniPizzeria.id);
    var bitsAndBytesPlan = menuCache.getMenu(restaurants.bitsAndBytes.id);
    var intersparPlan = menuCache.getMenu(restaurants.interspar.id);
    var daMarioPlan = menuCache.getMenu(restaurants.daMario.id);

    var uniWirtUrls = urlCache.getUrls(restaurants.uniWirt.id);
    var mensaUrls = urlCache.getUrls(restaurants.mensa.id);
    var hotspotUrls = urlCache.getUrls(restaurants.hotspot.id);
    var uniPizzeriaUrls = urlCache.getUrls(restaurants.uniPizzeria.id);
    var bitsAndBytesUrls = urlCache.getUrls(restaurants.bitsAndBytes.id);
    var intersparUrls = urlCache.getUrls(restaurants.interspar.id);
    var daMarioUrls = urlCache.getUrls(restaurants.daMario.id);

    Promise.all([
        uniwirtPlan, uniWirtUrls,
        mensaPlan, mensaUrls,
        hotspotPlan, hotspotUrls,
        uniPizzeriaPlan, uniPizzeriaUrls,
        bitsAndBytesPlan, bitsAndBytesUrls,
        intersparPlan, intersparUrls,
        daMarioPlan, daMarioUrls])
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
                visitorStats: req.visitorStats,
                restaurants
            });
        });
});

router.get('/city/:day(-?\\d*)?', counter.countVisitors, function (req, res, next) {
    var lapastaPlan = menuCache.getMenu('lapasta');
    var princsPlan = menuCache.getMenu('princs');

    Promise.all([lapastaPlan, princsPlan])
        .then(results => {
            res.render('cityfood', {
                title: 'City Food',
                lapasta: JSON.parse(results[0]) || [],
                princs: JSON.parse(results[1]) || [],
                visitorStats: req.visitorStats,
            });
        });
});

router.get('/about', counter.countVisitors, function (req, res, next) {
    var dailyVisitors = req.visitorStats.dailyVisitors;
    var overallVisitors = req.visitorStats.overallVisitors;

    var dailyVisitorsFact = externalApis.getNumberFact(dailyVisitors);
    var overallVisitiorsFact = externalApis.getNumberFact(overallVisitors);
    var catFact = externalApis.getCatFact();

    Promise.all([dailyVisitorsFact, overallVisitiorsFact, catFact])
        .then(facts => {
            res.render('about', {
                title: 'AAU Food: About',
                dailyVisitorsFact: facts[0],
                overallVisitiorsFact: facts[1],
                catFact: facts[2],
                visitorStats: req.visitorStats,
            });
        });
});
router.get('/print', counter.countVisitors, function (req, res, next) {
    var uniwirtPlan = menuCache.getMenu(restaurants.uniWirt.id);
    var mensaPlan = menuCache.getMenu(restaurants.mensa.id);
    var hotspotPlan = menuCache.getMenu(restaurants.hotspot.id);
    var uniPizzeriaPlan = menuCache.getMenu(restaurants.uniPizzeria.id);
    var bitsAndBytesPlan = menuCache.getMenu(restaurants.bitsAndBytes.id);
    var intersparPlan = menuCache.getMenu(restaurants.interspar.id);
    var daMarioPlan = menuCache.getMenu(restaurants.daMario.id);

    Promise.all([uniwirtPlan, mensaPlan, hotspotPlan, uniPizzeriaPlan, bitsAndBytesPlan, intersparPlan, daMarioPlan])
        .then(results => {
            res.render('print', {
                title: 'AAU Food: Wochenplan',
                uniWirt: JSON.parse(results[0]),
                mensa: JSON.parse(results[1]),
                hotspot: JSON.parse(results[2]),
                uniPizzeria: JSON.parse(results[3]),
                bitsAndBytes: JSON.parse(results[4]),
                interspar: JSON.parse(results[5]),
                daMario: JSON.parse(results[6]),
                restaurants
            });
        });
});


module.exports = router;
