"use strict";
const breakHelper = require('./breakHelper');

const MenuState = {
    Normal: 0,
    NoMenu: 1,
    Closed: 2,
    Outdated: 3,
    OnBreak: 4,
    ScrapingNotImplemented: 5,
    Error: 6,
}

function getMenuState(restaurantId, menu) {
    let isOnBreak = breakHelper.isOnBreak(restaurantId);
    if (isOnBreak)
        return MenuState.OnBreak;

    if (menu == null || menu.error)
        return MenuState.Error;

    if (menu.scrapingNotImplemented)
        return MenuState.ScrapingNotImplemented;

    if (menu.closed)
        return MenuState.Closed;

    if (menu.outdated)
        return MenuState.Outdated;

    if (menu.noMenu)
        return MenuState.NoMenu;

    return MenuState.Normal;
}

function isDefaultState(menuState) {
    return menuState === MenuState.Normal;
}

module.exports = {
    getMenuState: getMenuState,
    MenuState: MenuState,
    isDefaultState: isDefaultState,
};
