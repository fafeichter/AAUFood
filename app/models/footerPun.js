"use strict";

class FooterPun {
    constructor(name, preText, icon, iconLink, postText, active = () => {
        return true
    }) {
        this.name = name;
        this.preText = preText;
        this.icon = icon;
        this.iconLink = iconLink;
        this.postText = postText;
        this.active = active;
    }
}

module.exports = FooterPun;