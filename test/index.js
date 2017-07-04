'use strict';

require('mocha');

var expect = require('expect.js'),
    util = require('./util'),

    mochaContainer = document.getElementById('mocha'),
    flattenTitles = util.flattenTitles,
    log = util.log,
    ready = false,
    reports = [],
    TestElement = util.TestElement;

/**
 * @param {Error} error
 * @param {string} [title]
 */
function internalError(error, title) {
    var now = new Date(),
        description, div, h2, pre;

    if (error instanceof Error) {
        title = title || error.message;
        description = error.stack;
    } else if (arguments.length > 1) {
        description = error;
    } else {
        title = error;
    }

    div = document.createElement('div');
    div.className = 'test fail';

    h2 = document.createElement('h2');
    h2.appendChild(document.createTextNode(title));
    div.appendChild(h2);

    if (description) {
        pre = document.createElement('pre');
        pre.className = 'error';
        pre.appendChild(document.createTextNode(description));
        div.appendChild(pre);
    }

    mochaContainer.appendChild(div);

    window.mochaResults = {
        duration: now - util.startTime,
        end: now,
        failures: 1,
        passes: 0,
        pending: 0,
        reports: [
            {
                message: error.message || title,
                name: title,
                result: false,
                stack: description
            }
        ],
        start: util.startTime,
        suites: 0,
        tests: 1
    };
}

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
    runner = mocha.run();

    runner.on('end', function () {
        var results = runner.stats;
        results.reports = reports;
        window.mochaResults = results;
        log('Tests complete: ' + results.failures + ' failed, ' + results.passes + ' passed, ' + (results.failures + results.passes) + ' total');
    });
    runner.on('fail', logResult);
    runner.on('pass', logResult);

    //util.permutate({
    //    defineEarly: [true, false],
    //    isClass: util.supportsClasses ? [true, false] : false,
    //    localName: builtInElements.tagNames.concat(null)
    //}, [
    //'observedAttributes'
    //]).forEach(function (options) {
    //    new TestElement(options);
    //});
    //log('Test elements attached.');
}

util.startTime = new Date();
mocha.setup('bdd');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDocumentReady, false);
} else {
    onDocumentReady();
}

try {
    require('../dist/custom-elements-polyfill.min.js');
    try {

        require('./spec/global');
        require('./spec/CustomElementRegistry');
        require('./spec/define');
        require('./spec/get');
        require('./spec/whenDefined');

        require('./spec/constructors');

        ready = true;

    } catch (error) {
        internalError(error, 'Tests failed to load');
    }
} catch (error) {
    internalError(error, 'Polyfill failed to load');
}

if (ready) {
    runTests();
}
