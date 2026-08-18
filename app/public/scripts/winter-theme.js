var snowFall = require("../../helpers/snowFall");

$(document).ready(function () {
    // Snowfall depends on window size
    // This messy setup was the only way to get both working correctly
    requestAnimationFrame(function () {
        snowFall.initSnowFall();
    });
});