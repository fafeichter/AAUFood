"use strict";

class Food {
    name = "";
    price = null;
    isMain = false;
    isInfo = false;
    allergens = [];
    entries = [];

    constructor(name, price, isMain, isInfo, allergens) {
        this.name = name;
        this.isMain = isMain;
        this.price = price;
        this.isInfo = isInfo === true;
        if (Array.isArray(allergens)) {
            this.allergens = allergens.join(',');
        }
    }
}

module.exports = Food;
