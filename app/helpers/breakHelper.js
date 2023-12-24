"use strict";
const config = require('../config');
const moment = require('moment');

function isOnBreak(restaurantId) {
    if (restaurantId == null) {
        return false;
    } else {
        return getBreakInfo(restaurantId) != null;
    }
}

function getBreakInfo(restaurantId) {
    let breakInfo = null;
    const now = moment();

    if (restaurantId != null) {
        const breakInfos = config.onBreak[restaurantId];
        if (breakInfos) {
            for (let i = 0; i <= breakInfos.length; i++) {
                const breakInfoTmp = breakInfos[i];
                if (now.isSameOrAfter(breakInfoTmp.from) && now.isSameOrBefore(breakInfoTmp.to)) {
                    breakInfo = breakInfoTmp;
                    break;
                }
            }
        }
    }

    return breakInfo;
}

module.exports = {
    getBreakInfo,
    isOnBreak
};