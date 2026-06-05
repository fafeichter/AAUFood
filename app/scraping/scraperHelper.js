"use strict";

const Menu = require("../models/menu");

function setDayToError(weekPlan, i) {
    let errorMenu = new Menu();
    errorMenu.error = true;
    weekPlan[i] = errorMenu;

    return weekPlan;
}

function getWeekEmptyModel() {
    return new Array(7).fill(1).map(() => {
        return new Menu();
    });
}

module.exports = {
    setDayToError,
    getWeekEmptyModel,
};
