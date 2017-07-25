'use strict';

const
    customElementsPolyfill = require('../index'),
    eslint = require('eslint').linter,
    fs = require('fs'),
    moduleDeps = require('module-deps'),
    path = require('path'),
    through = require('through2'),
    uglify = require('uglify-js'),
    
    root = path.join(__dirname, '../'),
    
    eslintConfig = {
        env: {
            browser: true
        },
        extends: "eslint:recommended",
        rules: {
            "indent": ["error", 4],
            "linebreak-style": ["error", "unix"],
            "semi": ["error", "always"]
        }
    },
    entry = path.join(root, 'browser.js'),
    reg_slash = /\\/g;

/**
 * @typedef {Object} Deferred
 * @property {Promise} promise
 * @property {function} reject
 * @property {function} resolve
 */

/**
 * A file descriptor created by module-deps.
 * @typedef {Object} Depfile
 * @property {Object} deps
 * @property {Boolean} entry
 * @property {String} id
 * @property {String} source
 */

/**
 * @param {Error} err 
 */
function onError(err) {
    console.error(err);
    process.exit(-1);
}

/**
 * Returns an object containing a new Promise, as well as its 'resolve'
 * and 'reject' methods.
 * 
 * @returns {Deferred}
 */
function defer() {
    var resolve, reject,
        promise = new Promise(function (y, n) {
            resolve = y;
            reject = n;
        });
    return {
        promise: promise,
        resolve: resolve,
        reject: reject
    };
}

/**
 * Runs ESLint against the provided file.
 * 
 * @param {Depfile} file
 * @param {string} enc
 * @param {function} callback
 */
function lintFile(file, enc, callback) {
    var issues = eslint.verify(file.source, eslintConfig, file.id),
        id;
    if (issues.length > 0) {
        id = path.relative(root, file.id).replace(reg_slash, '/');
        issues.forEach(function (i) {
            console.log('[build-polyfill]   ' + id + ':' + i.line + ',' + i.column);
            console.log('[build-polyfill]     ' + (i.severity === 2 ? 'Error' : 'Warning') + ': ' + i.message + ' (' + i.ruleId + ')');
        });
    }
    callback(null, file);
}

/**
 * Runs ESLint against each individual file in the dependency graph.
 * 
 * @returns {Promise} - A Promise that is resolved with no value when all files have been linted.
 */
function lint() {
    var deferred = defer(),
        deps = moduleDeps();

    console.log('[build-polyfill] Linting...');

    deps.pipe(through.obj(lintFile));

    deps.on('error', deferred.reject)
        .on('end', deferred.resolve)
        .end(entry);

    return deferred.promise;
}

/**
 * Builds the polyfill bundle, and saves the output bundle as a single file in the "/dist" directory.
 * 
 * @returns {Promise} - A Promise that is resolved with the full source code of the completed bundle.
 */
function bundle() {
    var build = customElementsPolyfill.build(),
        deferred = defer(),
        reject = deferred.reject,
        resolve = deferred.resolve;
    
    console.log('[build-polyfill] Bundling...');

    build.bundle(function (err1, buffer) {
        var source;

        if (err1) {
            reject(err1);
            return;
        }

        source = buffer.toString();
        try {
            fs.writeFile(path.join(root, 'dist/custom-elements-polyfill.js'), source, 'utf8', function (err2) {
                if (err2) {
                    reject(err2);
                } else {
                    resolve(source);
                }
            });
        } catch (ex) {
            reject(ex);
        }
    });

    return deferred.promise;
}

/**
 * Minifies the polyfill bundle, and saves the minified output as a single file in the "/dist" directory.
 * 
 * @param {string} source - The full source code of the polyfill bundle.
 * @returns {Promise} - A Promise that is resolved with the full source code of the polyfill bundle.
 */
function minify(source) {
    var deferred = defer(),
        reject = deferred.reject,
        resolve = deferred.resolve,
        minified;
    
    console.log('[build-polyfill] Minifying...');

    minified = uglify.minify(source);
    if (minified.error) {
        reject(minified.error);
        return;
    }

    try {
        fs.writeFile(path.join(root, 'dist/custom-elements-polyfill.min.js'), minified.code, 'utf8', function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(source);
            }
        });
    } catch (ex) {
        reject(ex);
    }

    return deferred.promise;
}

module.exports = lint()
    .then(bundle, onError)
    .then(minify, onError)
    .then(function () { console.log('[build-polyfill] Polyfill build complete.'); }, onError);
