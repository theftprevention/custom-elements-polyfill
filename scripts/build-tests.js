'use strict';

const
    Browserify = require('browserify'),
    fs = require('fs'),
    path = require('path'),

    root = path.join(__dirname, '../');

var browserify = new Browserify(path.join(root, 'test/index.js'), {
    noParse: [
        path.join(root, 'dist/custom-elements-polyfill.js'),
        path.join(root, 'dist/custom-elements-polyfill.min.js')
    ]
});

console.log('[build-tests] Bundling tests...');

browserify.bundle(function (err1, buffer) {
    if (err1) {
        throw err1;
    }
    fs.writeFile(path.join(root, 'test/browser/tests.js'), buffer.toString(), 'utf8', function (err2) {
        if (err2) {
            throw err2;
        }
        console.log('[build-tests] Test build complete.');
    });
});
