/// <reference path="../../node_modules/mocha/mocha.js" />

'use strict';

var builtInElements = require('../lib/browser/built-in-elements'),
    mocha = require('mocha').mocha,
    util = require('./util'),

    flattenTitles = util.flattenTitles,
    log = util.log,
    reports = [],
    TestElement = util.TestElement,
    undefined;

/**
 * @param {Mocha.Test} test
 * @param {Error} [err]
 */
function logResult(test, err) {
    var passed = !err,
        report;
    if (!passed) {
        report = {
            message: err.message || String(err),
            name: flattenTitles(test),
            result: false
        };
        if (err.stack) {
            report.stack = err.stack;
        }
        reports.push(report);
    }
}

function onDocumentReady() {
    log('Document ready.');
}

function runTests() {
    var runner;

    log('Starting tests.');
    util.startTime = new Date();
    runner = mocha.run();

    runner.on('end', function () {
        var results = runner.stats;
        results.reports = reports;
        window.mochaResults = results;
        log('Tests complete: ' + results.failures + ' failed, ' + results.passes + ' passed.');
    });
    runner.on('fail', logResult);
    runner.on('pass', logResult);

    util.permutate({
        defineEarly: [true, false],
        isClass: util.supportsClasses ? [true, false] : false,
        localName: builtInElements.tagNames.concat(null)
    }, [
    'observedAttributes'
    ]).forEach(function (options) {
        new TestElement(options);
    });
    log('Test elements attached.');
}

mocha.setup('bdd');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDocumentReady, false);
} else {
    onDocumentReady();
}

require('./spec-window');
require('./spec-CustomElementRegistry');
require('./spec-CustomElementRegistry-define');
require('./spec-CustomElementRegistry-get');
require('./spec-CustomElementRegistry-whenDefined');

runTests();
