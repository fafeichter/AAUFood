"use strict";

const weekdays = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function weekDayName(sanitizedDay) {
    return weekdays[sanitizedDay];
}

function determineLastMonday() {
    var d = new Date();
    var day = d.getDay();
    var diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diffToMonday));
}

function dateStringShort(date) {
    return ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2);
}

function getMondayDate() {
    return dateStringShort(determineLastMonday());
}

function checkInputForCurrentWeek(str) {
    var mon = determineLastMonday();
    for (var i = 0; i <= 6; i++) {
        if (str.indexOf(dateStringShort(mon)) !== -1) // if date in string return True
            return true;
        mon.setDate(mon.getDate() + 1);
    }
    return false;
}

module.exports = {
    weekDayName,
    getMondayDate,
    checkInputForCurrentWeek,
};