const moment = require("moment");
require('moment/locale/de');
const FooterPun = require("./models/footerPun");
const BreakInfo = require("./models/breakInfo");

const isChristmas = () => {
    return moment().format("DD.MM") === '24.12';
};

const isNewYear = () => {
    return moment().format("DD.MM") === '01.01';
};

module.exports = {
    settings: {
        useRandomFooterPuns: true,
        defaultFooterPun: "heart",
        winterTheme: ['01.12.', '01.03.'],
        nodePort: 3000,
    },
    onBreak: {
        mensa: [
            new BreakInfo("Wir haben vom", moment("22.12.2023", "DD.MM.YYYY"), moment("05.01.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding")
        ],
        "bits-and-bytes": [
            new BreakInfo("Wir haben vom", moment("27.12.2023", "DD.MM.YYYY"), moment("28.12.2023", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding")
        ],
        hotspot: [
            new BreakInfo("Wir haben vom", moment("27.12.2023", "DD.MM.YYYY"), moment("04.01.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding"),
            new BreakInfo("Wir haben vom", moment("25.03.2024", "DD.MM.YYYY"), moment("29.03.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-frown")
        ],
    },
    cache: {
        // time in milliseconds -> 1 hour
        menuCacheIntervall: 3600000,
        // time in milliseconds -> 15 min
        urlCacheIntervall: 900000,
        overallVisitorKey: "overallVisitors",
        dailyVisitorKey: "dailyVisitors"
    },
    restaurants: {
        mensa: {
            id: "mensa",
            name: "Mensa"
        },
        interspar: {
            id: "interspar",
            name: "Interspar"
        },
        uniWirt: {
            id: "uni-wirt",
            name: "Uniwirt"
        },
        uniPizzeria: {
            id: "uni-pizzeria",
            name: "Uni-Pizzeria"
        },
        bitsAndBytes: {
            id: "bits-and-bytes",
            name: "Bits & Bytes"
        },
        hotspot: {
            id: "hotspot",
            name: "Hotspot"
        },
        daMario: {
            id: "da-mario",
            name: "Da Mario"
        },
        burgerBoutique: {
            id: "burger-boutique",
            name: "Burger Boutique"
        }

    },
    cookie: {
        // 30 days in milliseconds
        maxAge: 2592000000
    },
    externalApis: {
        paramKey: "${param}",
        numbersApi: "http://numbersapi.com/${param}",
        catFactsApi: "https://catfact.ninja/fact",
        placeKittenApi: "https://placekitten.com/${param}/200",
        placeKittenWidth: 700,
        placeKittenWidthSpan: 200
    },
    footerPuns: [
        new FooterPun("heart", "Crafted with", "fa fa-heart"),
        new FooterPun("empire", "Constructed for the", "fab fa-empire", "http://starwars.wikia.com/wiki/Galactic_Empire"),
        new FooterPun("rebellion", "Join the", "fab fa-rebel", "http://starwars.wikia.com/wiki/Alliance_to_Restore_the_Republic"),
        new FooterPun("lizardpaper", '<i class="fa fa-fw fa-hand-lizard"></i> eats', "fa fa-hand-paper"),
        new FooterPun("print", "I'm also printable", "fa fa-print", "/print"),
        new FooterPun("got", "Winter is coming", "fa fa-snowflake", "http://gameofthrones.wikia.com/wiki/House_Stark"),
        new FooterPun("keyboard", "Use your ", "far fa-keyboard", null, " arrows on desktop"),
        new FooterPun("infinity", "To infinity ", "fas fa-rocket", null, " and beyond"),
        new FooterPun("christmas", "Merry Christmas", "fas fa-tree", null, null, isChristmas()),
        new FooterPun("christmas", "Happy New Year", "fas fa-glass-cheers", null, null, isNewYear())
    ],
    snowFall: {
        particles: 150,
    }
};
