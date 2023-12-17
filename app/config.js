const FooterPun = require("./models/footerPun");
const BreakInfo = require("./models/breakInfo");

module.exports = {
    settings: {
        useRandomFooterPuns: true,
        defaultFooterPun: "heart",
        winterTheme: ['01.12.', '01.03.'],
        nodePort: 3000,
    },
    onBreak: {
        //The dates are only rendered, never used for checking if closed!
        // mensa: new BreakInfo("Wir werden im Zeitraum", "1.6", "27.9", "renoviert und sind in Sommerpause.", "fa fa-sun"),
        // mensa: new BreakInfo("Wir befinden uns für den Zeitraum", "28.7", "2.9", "in Sommerpause."),
    },
    cache: {
        // Time in milliseconds -> 1 hour.
        menuCacheIntervall: 3600000,
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
        new FooterPun("print", "I'm also printable!", "fa fa-print", "/print"),
        new FooterPun("got", "Winter is coming", "fa fa-snowflake", "http://gameofthrones.wikia.com/wiki/House_Stark"),
        /*new FooterPun("christmas", "Frohe Weihnachten!", "fa-snowflake-o"),
         new FooterPun("star", "Hey look!", "fa-star fa-spin", null, " It's spinning!"),
         new FooterPun("keyboard", "Use your ", "fa-keyboard-o", null, " arrows on desktop!"),
         new FooterPun("infinity", "To infinity ", "fa-space-shuttle", null, " and beyond!")*/
    ],
    snowFall: {
        particles: 150,
    }
};
