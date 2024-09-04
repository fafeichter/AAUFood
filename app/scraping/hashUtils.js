"use strict";

const crypto = require('crypto');

function hashWithSHA256(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

module.exports = {
    hashWithSHA256,
};