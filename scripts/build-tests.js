'use strict';

const
    Browserify = require('browserify'),
    fs = require('fs'),
    path = require('path'),

    root = path.join(__dirname, '../'),
    src = function (f) { return path.join(root, f); };

/**
 * @returns {Promise}
 */
function buildTests() {
    var resolve, reject,
        promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        }),
        browserify = new Browserify(src('test/tests.js'));
    browserify.bundle(function (err1, buffer) {
        if (err1) {
            reject(err1);
            return;
        }
        fs.writeFile(src('test/browser/tests.js'), buffer.toString(), 'utf8', function (err2) {
            if (err2) {
                reject(err2);
                return;
            }
            resolve();
        });
    });
    return promise;
}

module.exports = buildTests;
