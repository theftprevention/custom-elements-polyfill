'use strict';

const
    build = require('../lib/build'),
    fs = require('fs'),
    path = require('path'),
    minify = require('uglify-js').minify,

    root = path.join(__dirname, '../'),
    src = function (f) { return path.join(root, f); },

    pkg = JSON.parse(fs.readFileSync(src('package.json'), 'utf8')),
    reg_version = /\{VERSION_PLACEHOLDER\}/g;

build(function (err, buffer) {
    var content, min, i, l;

    if (err) {
        throw err;
    }

    content = buffer.toString().replace(reg_version, pkg.version);

    min = minify(content, { warnings: true });
    if (min.error) {
        throw min.error;
    } else if (min.warnings && min.warnings.length) {
        for (i = 0, l = min.warnings.length; i < l; i++) {
            console.warn(min.warnings[i]);
        }
    }

    fs.writeFile(src('dist/custom-elements-polyfill.js'), content, 'utf8');
    fs.writeFile(src('dist/custom-elements-polyfill.min.js'), min.code, 'utf8');
    
});
