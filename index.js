'use strict';

const
    Browserify = require('browserify'),
    fs = require('fs'),
    path = require('path'),
    pathTo = require('./lib/path-to'),
    through = require('through2'),

    browserEntry = pathTo('lib/browser/index.js'),
    func = 'function',
    getOwnPropertyNames = Object.getOwnPropertyNames,
    hasOwnProperty = (function () {
        var hOP = Object.prototype.hasOwnProperty;
        return function (O, p) {
            return hOP.call(O, p);
        };
    })(),
    isArray = Array.isArray,
    pkg = JSON.parse(fs.readFileSync(pathTo('package.json'), 'utf8')),
    reg_version = /\{VERSION_PLACEHOLDER\}/g,
    toLower = (function () {
        var S = String,
            tl = String.prototype.toLowerCase;
        return function (s) {
            return tl.call(S(s));
        };
    })(),
    version = pkg.version,

    polyfillMap = {
        'Array.from': pathTo('lib/browser/other-polyfills/Array.from.js'),
        'DOMException': pathTo('lib/browser/other-polyfills/DOMException.js')
    },
    polyfillNames = getOwnPropertyNames(polyfillMap);

/**
 * A value determining which of the optional extra polyfills, if any, should be bundled with the
 *   custom elements polyfill bundle. It defaults to true.
 * 
 * If this is an array, then it is interpreted as a list of optional polyfills that should be
 *   included in the bundle. Valid values are "Array.from" and "DOMException" (names are
 *   case-insensitive). Any polyfill names not present in the array will be excluded from the final
 *   bundle.
 * 
 * If this is a boolean, then a value of true (the default value) means that all optional polyfills
 *   are included in the output bundle, while false means that none of them are included.
 * 
 * If this is an object, then its "otherPolyfills" property will be interpreted as described above
 *   if it is a boolean or an array. If the object does not have an own property named
 *   "otherPolyfills", then all optional polyfills will be included in the output bundle. The
 *   remaining options are passed directly to the Browserify constructor.
 * 
 * @typedef {(Array|boolean|object)} PolyfillBuildOptions
 */

module.exports = {
    /**
     * Creates a Browserify instance that is pre-populated with the files and settings to create a
     *   bundle containing the custom elements polyfill.
     * 
     * @public
     * @method build
     * 
     * @param {PolyfillBuildOptions} options - See {@link PolyfillBuildOptions}.
     * 
     * @returns {Browserify} - A Browserify instance that is pre-populated with the files necessary
     *   to build the custom elements polyfill. Its 'bundle' method can be used to complete the
     *   build.
     */
    build: function build(options) {
        var browserify, entry, excludes, includes,
            e, i, n, p, has, name, lowerName;

        if (options && typeof options === 'object') {
            if (options['otherPolyfills'] !== void 0) {
                includes = options.otherPolyfills;
            }
        } else {
            includes = options;
            options = {};
        }

        entry = fs
            .createReadStream(browserEntry, { encoding: 'utf8' })
            .pipe(through.obj(function (file, enc, cb) {
                cb(null, file.replace(reg_version, version));
            }));
        options.basedir = path.dirname(browserEntry);
        browserify = new Browserify(entry, options);

        if (includes === false) {
            excludes = polyfillNames;
        } else if (isArray(includes)) {
            e = 0;
            n = includes.length;
            p = polyfillNames.length;
            while (p--) {
                name = polyfillNames[p];
                lowerName = toLower(name);
                i = 0;
                has = false;
                while (i < n) {
                    if (toLower(includes[i++]) === lowerName) {
                        has = true;
                        break;
                    }
                }
                if (!has) {
                    excludes[e++] = name;
                }
            }
        }

        if (excludes) {
            e = excludes.length;
            while (e--) {
                name = excludes[e];
                if (hasOwnProperty(polyfillMap, name)) {
                    browserify.ignore(polyfillMap[name]);
                }
            }
        }

        return browserify;
    },
    isValidCustomElementName: require('./lib/browser/is-valid-custom-element-name'),
    version: version
};
