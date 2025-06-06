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
            new BreakInfo("Wir haben vom", moment("22.12.2023", "DD.MM.YYYY"), moment("05.01.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding"),
            new BreakInfo("Wir haben vom", moment("05.08.2024", "DD.MM.YYYY"), moment("16.08.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-frown"),
            new BreakInfo("Wir haben vom", moment("23.12.2024", "DD.MM.YYYY"), moment("06.01.2025", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding")
        ],
        "bits-and-bytes": [
            new BreakInfo("Wir haben vom", moment("27.12.2023", "DD.MM.YYYY"), moment("28.12.2023", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding"),
            new BreakInfo("Wir haben vom", moment("24.12.2024", "DD.MM.YYYY"), moment("27.12.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding"),
            new BreakInfo("Wir haben vom", moment("01.01.2025", "DD.MM.YYYY"), moment("01.01.2025", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding")
        ],
        hotspot: [
            new BreakInfo("Wir haben vom", moment("27.12.2023", "DD.MM.YYYY"), moment("04.01.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding"),
            new BreakInfo("Wir haben vom", moment("25.03.2024", "DD.MM.YYYY"), moment("29.03.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-frown"),
            new BreakInfo("Wir haben vom", moment("24.12.2024", "DD.MM.YYYY"), moment("27.12.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding"),
            new BreakInfo("Wir haben vom", moment("31.12.2024", "DD.MM.YYYY"), moment("03.01.2025", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding")

        ],
        "uni-wirt": [
            new BreakInfo("Wir haben wegen Umbau vom", moment("01.11.2024", "DD.MM.YYYY"), moment("10.11.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-paint-roller"),
            new BreakInfo("Wir haben vom", moment("24.12.2024", "DD.MM.YYYY"), moment("26.12.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding"),
            new BreakInfo("Wir haben vom", moment("31.12.2024", "DD.MM.YYYY"), moment("01.01.2025", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding")
        ],
        interspar: [
            new BreakInfo("Wir haben vom", moment("25.12.2024", "DD.MM.YYYY"), moment("25.12.2024", "DD.MM.YYYY"), "geschlossen.", "fas fa-snowboarding")
        ],
    },
    cache: {
        // time in milliseconds -> 5 min
        urlCacheIntervall: 5 * 60 * 1000,
        // time in milliseconds -> 15 min
        menuCacheIntervall: 15 * 60 * 1000,
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
        },
        felsenkeller: {
            id: "felsenkeller",
            name: "Felsenkeller"
        }

    },
    cookie: {
        // 30 days in milliseconds
        maxAge: 2592000000
    },
    footerPuns: [
        new FooterPun("heart", "Crafted with", "fa fa-heart"),
        new FooterPun("empire", "Constructed for the", "fab fa-empire", "https://starwars.wikia.com/wiki/Galactic_Empire"),
        new FooterPun("rebellion", "Join the", "fab fa-rebel", "https://starwars.wikia.com/wiki/Alliance_to_Restore_the_Republic"),
        new FooterPun("lizardpaper", '<i class="fa fa-fw fa-hand-lizard"></i> eats', "fa fa-hand-paper"),
        new FooterPun("got", "Winter is coming", "fa fa-snowflake", "https://gameofthrones.wikia.com/wiki/House_Stark"),
        new FooterPun("keyboard", "Use your ", "far fa-keyboard", null, " arrows on desktop"),
        new FooterPun("infinity", "To infinity ", "fas fa-rocket", null, " and beyond"),
        new FooterPun("christmas", "Merry Christmas", "fas fa-tree", null, null, isChristmas()),
        new FooterPun("christmas", "Happy New Year", "fas fa-glass-cheers", null, null, isNewYear())
    ],
    snowFall: {
        particles: 150,
    }
};
