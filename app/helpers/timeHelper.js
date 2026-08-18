"use strict";

const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function weekDayName(sanitizedDay) {
    return weekdays[sanitizedDay];
}

module.exports = {
    weekDayName,
};