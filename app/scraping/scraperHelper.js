"use strict";

const Menu = require("../models/menu");

function setWeekPlanToOutdated(weekPlan) {
    for (let i = 0; i < 6; i++) {
        let outdatedMenu = new Menu();
        outdatedMenu.outdated = true;
        weekPlan[i] = outdatedMenu;
    }
    return weekPlan;
}

function setDayToError(weekPlan, i) {
    let errorMenu = new Menu();
    errorMenu.error = true;
    weekPlan[i] = errorMenu;

    return weekPlan;
}

function sanitizeName(val) {
    if (typeof val === "string") {
        val = val.replace(/\s\s+/g, ' '); // Replace tabs, newlines, multiple spaces etc. into a single space
        val = val.replace(/€?\s[0-9]+(,|.)[0-9]+/, ""); // Replace '€ 00.00'
        val = val.replace(/^[1-9].\s/, ""); // Replace '1. ', '2. '
        val = val.replace(/^[1-9]./, ""); // Replace '1.', '2.'
        val = val.replace(/^[,\.\-\\\? ]+/, "");
        val = val.replace(/[,\.\-\\\? ]+$/, "");
        val = val.replace('***', "");
        val = trimTrailingPrice(val);
        return val.trim();
    } else if (typeof val === "object" && val.length > 0) {
        for (let i = 0; i < val.length; i++) {
            val[i] = sanitizeName(val[i]);
        }
        return val;
    } else {
        return val;
    }
}

const trailingPriceRegex = /\s*€?\s*\d+[,\.]?\d*\s*€?\s*$/;

function trimTrailingPrice(str) {
    if (!str) {
        return str;
    }

    return str.replace(trailingPriceRegex, "").trim();
}

function getWeekEmptyModel() {
    return new Array(7).fill(1).map(() => {
        return new Menu();
    });
}

module.exports = {
    setWeekPlanToOutdated,
    setDayToError,
    sanitizeName,
    getWeekEmptyModel,
};
