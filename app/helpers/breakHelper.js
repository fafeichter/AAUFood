"use strict";
const config = require('../config');
const moment = require('moment');

function isOnBreak(restaurantId, day = moment().weekday()) {
    if (restaurantId == null) {
        return false;
    } else {
        return getBreakInfo(restaurantId, day) != null;
    }
}

function getBreakInfo(restaurantId, day) {
    let breakInfo = null;
    const dayOfWeek = moment().weekday(day);

    if (restaurantId != null) {
        const breakInfos = config.onBreak[restaurantId];
        if (breakInfos) {
            for (let i = 0; i < breakInfos.length; i++) {
                const breakInfoTmp = breakInfos[i];
                if (dayOfWeek.isSameOrAfter(breakInfoTmp.from) &&
                    dayOfWeek.isSameOrBefore(breakInfoTmp.to.endOf('day'))) {
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