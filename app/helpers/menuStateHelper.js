"use strict";
const breakHelper = require('./breakHelper');

const MenuState = {
    Normal: 0,
    ALaCarte: 1,
    Closed: 2,
    Outdated: 3,
    OnBreak: 4,
    Error: 6,
}

function getMenuState(restaurantId, menu, day) {
    if (breakHelper.isOnBreak(restaurantId, day))
        return MenuState.OnBreak;

    if (menu == null || menu.error)
        return MenuState.Error;

    if (menu.closed)
        return MenuState.Closed;

    if (menu.alacarte)
        return MenuState.ALaCarte;

    if (menu.outdated)
        return MenuState.Outdated;

    return MenuState.Normal;
}

function isDefaultState(menuState) {
    return menuState === MenuState.Normal;
}

module.exports = {
    getMenuState,
    MenuState,
    isDefaultState,
};
