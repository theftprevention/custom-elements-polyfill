'use strict';

const
    join = require('path').join,
    root = join(__dirname, '../');

/**
 * @param {string} path
 * @returns {string}
 */
module.exports = function pathTo(path) {
    return join(root, path);
};
