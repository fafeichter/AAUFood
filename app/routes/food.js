const express = require('express');
const router = express.Router();
const cache = require('../caching/menuCache');
const timeHelper = require('../helpers/timeHelper');
const fs = require("fs");
const path = require("path");
const winston = require("winston");
const moment = require("moment/moment");
const uploadDirectory = "/usr/src/aaufood/upload/";
const fileNameFormat = 'DD-MM-YYYY';
const restaurants = require('../config').restaurants;

/* GET users listing. */
router.get('/uniwirt/:day?', function (req, res) {
    /*var day = +req.params.day;
     scraper.getUniwirtPlan(day)
     .then(result => res.json(result));*/
    res.setHeader('Content-Type', 'application/json');
    cache.getMenu(restaurants.uniWirt.id, timeHelper.sanitizeDay(req.params.day))
        .then(menu => res.send(menu));
});

router.get('/hotspot/:day?', function (req, res) {
    /*var day = +req.params.day;
     scraper.getHotspotPlan(day)
     .then(result => res.json(result));*/
    res.setHeader('Content-Type', 'application/json');
    cache.getMenu(restaurants.hotspot.id, timeHelper.sanitizeDay(req.params.day))
        .then(menu => res.send(menu));
});

router.post('/hotspot/today/pasta-des-tages', (req, res) => {
    // get the file that was set to our field named "image"
    const {image} = req.files;

    // if no file submitted, exit
    if (!image) {
        return res.sendStatus(400);
    }

    // if file does not have an image mime type prevent from uploading
    if (!/^image/.test(image.mimetype)) {
        return res.sendStatus(400)
    }

    // empty download directory
    emptyUploadDirectory();

    // move the uploaded image to our upload folder
    let fileName = moment().format(fileNameFormat) + '.' + image.mimetype.split('/')[1];
    let filePath = uploadDirectory + fileName;
    image.mv(filePath)
        .then(() => {
            winston.info(`Uploaded ${fileName}`)
            res.redirect('/#hotspot');
        })
        .catch(() => {
            res.sendStatus(500);
        });
});

router.get('/hotspot/today/pasta-des-tages', (req, res) => {
    fs.readdir(uploadDirectory, (err, files) => {
        if (err) {
            throw err;
        }

        let fileNameForToday = undefined;
        for (const file of files) {
            if (file.startsWith(moment().format(fileNameFormat))) {
                fileNameForToday = file;
                break;
            }
        }

        if (fileNameForToday !== undefined) {
            res.sendFile(uploadDirectory + fileNameForToday);
        } else {
            res.sendStatus(404);
        }
    });
});

router.get('/hotspot/today/pasta-des-tages/delete', (req, res) => {
    emptyUploadDirectory();
    res.redirect('/#hotspot');
});

router.get('/mensa/:day?', function (req, res) {
    /* var day = +req.params.day;
     scraper.getuniwirtMensaPlan(day)
     .then(result => res.json(result));*/
    res.setHeader('Content-Type', 'application/json');
    cache.getMenu(restaurants.mensa.id, timeHelper.sanitizeDay(req.params.day))
        .then(menu => res.send(menu));
});

router.get('/bitsandbytes/:day?', function (req, res) {
    /* var day = +req.params.day;
     scraper.getMensaPlan(day)
     .then(result => res.json(result));*/
    res.setHeader('Content-Type', 'application/json');
    cache.getMenu(restaurants.bitsAndBytes.id, timeHelper.sanitizeDay(req.params.day))
        .then(menu => res.send(menu));
});

if (process.env.FOOD_ENV === 'DEV') {
    router.get('/logs', function (req, res) {
        res.download('logfile.log');
    });
}

if (process.env.FOOD_ENV === 'DEV') {
    router.get('/sync', function (req, res) {
        cache.update(true);
        res.send("Ok")
    });
}

function emptyUploadDirectory() {
    let files = fs.readdirSync(uploadDirectory);
    for (const file of files) {
        fs.unlinkSync(path.join(uploadDirectory, file));
        winston.info(`Deleted ${file}`)
    }
}

module.exports = router;
