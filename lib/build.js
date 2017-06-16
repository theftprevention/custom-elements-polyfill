'use strict';

const
    Browserify = require('browserify'),
    path = require('path'),

    root = path.join(__dirname, '../'),
    src = function (f) { return path.join(root, f); },

    otherPolyfills = {
        'Array.from': src('lib/browser/other-polyfills/Array.from.js'),
        'DOMException': src('lib/browser/other-polyfills/DOMException.js'),
        'Object.getOwnPropertyDescriptors': src('lib/browser/other-polyfills/Object.getOwnPropertyDescriptors.js'),
        'Promise': 'es6-promise/auto'
    };

/**
 * @typedef {object} PolyfillOptions
 * 
 * @property {Array|boolean} excludedPolyfills - An optional array of strings, each of which is the
 *   name of an optional polyfill to exclude from the final bundle. Valid values are "Array.from",
 *   "DOMException", "Object.getOwnPropertyDescriptors", and "Promise". If this option is true,
 *   then none of the optional polyfills are included in the final bundle. If the option is false
 *   or omitted, then all of the optional polyfills are included.
 */

/**
 * Builds the custom elements polyfill, returning the polyfill script as a readable stream.
 * 
 * @public
 * 
 * @param {PolyfillOptions} options - A set of options used when building
 *   the polyfill bundle. Only the "otherPolyfills" property is used; the remaining options
 *   are passed to Browserify.
 * 
 * @param {function} [callback] - An optional callback function that will be invoked when
 *   the bundle is completed. Its first parameter is an Error if an error was raised, or
 *   null otherwise. Its second parameter is a Buffer containing the bundle contents.
 * 
 * @returns {stream.Readable} - A readable stream containing the bundle contents.
 */
function build(options, callback) {
    var browserify = new Browserify(src('lib/browser/index.js')),
        excludes, i, name;

    if (typeof options === 'function') {
        callback = options;
        options = null;
    } else if (typeof callback !== 'function') {
        callback = null;
    }

    excludes = options && options.hasOwnProperty('excludedPolyfills') ? options.excludedPolyfills : true

    if (excludes) {
        if (excludes === true) {
            excludes = Object.getOwnPropertyNames(otherPolyfills);
        } else {
            excludes = Array.from(excludes);
        }
        i = excludes.length;
        while (i--) {
            name = String(excludes[i]);
            if (otherPolyfills.hasOwnProperty(name)) {
                browserify.ignore(otherPolyfills[name]);
            }
        }
    }

    return callback ? browserify.bundle(callback) : browserify.bundle();
}

module.exports = build;
