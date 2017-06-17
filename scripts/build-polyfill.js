'use strict';

const
    build = require('../index').build(),
    fs = require('fs'),
    pathTo = require('../lib/path-to'),
    minify = require('uglify-js').minify;

build.bundle(function (err, buffer) {
    var content, min, i, l;

    if (err) {
        throw err;
    }

    content = buffer.toString();

    min = minify(content, { warnings: true });
    if (min.error) {
        throw min.error;
    } else if (min.warnings && min.warnings.length) {
        for (i = 0, l = min.warnings.length; i < l; i++) {
            console.warn(min.warnings[i]);
        }
    }

    fs.writeFile(pathTo('dist/custom-elements-polyfill.js'), content, 'utf8');
    fs.writeFile(pathTo('dist/custom-elements-polyfill.min.js'), min.code, 'utf8');
    
});
