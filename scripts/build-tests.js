'use strict';

const
    Browserify = require('browserify'),
    fs = require('fs'),
    pathTo = require('../lib/path-to');

new Browserify(pathTo('test/tests.js')).bundle(function (err1, buffer) {
    if (err1) {
        throw err1;
    }
    fs.writeFile(pathTo('test/browser/tests.js'), buffer.toString(), 'utf8', function (err2) {
        if (err2) {
            throw err2;
        }
    });
});
