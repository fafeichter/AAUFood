"use strict";
const config = require('../config');

function isOnBreak(restaurantId) {
    if (restaurantId == null) {
        return false;
    } else if (typeof restaurantId === "string") {
        return getBreakInfo(restaurantId) != null;
    } else {
        //Object is set in settings. This restaurant is on a break :)
        return true;
    }
}

function getBreakInfo(restaurantId) {
    return restaurantId != null ? config.onBreak[restaurantId] : null;
}

module.exports = {
    getBreakInfo: getBreakInfo,
    isOnBreak: isOnBreak
};