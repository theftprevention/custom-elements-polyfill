'use strict';

require('mocha');

var expect = require('expect.js'),
    util,

    loaded = false,
    mochaContainer = document.getElementById('mocha'),
    reportContainer,
    runner = null,
    startTime = new Date();

/**
 * @param {Error} error
 * @param {string} [title]
 */
function initError(error, title) {
    var now = new Date(),
        div, h2, pre;

    div = document.createElement('div');
    div.className = 'test fail';

    h2 = document.createElement('h2');
    h2.appendChild(document.createTextNode(title));
    div.appendChild(h2);

    if (error.stack) {
        pre = document.createElement('pre');
        pre.className = 'error';
        pre.appendChild(document.createTextNode(error.stack));
        div.appendChild(pre);
    }

    mochaContainer.appendChild(div);

    window.mochaResults = {
        duration: now - startTime,
        end: now,
        failures: 1,
        passes: 0,
        pending: 0,
        reports: [
            {
                message: error.message || title,
                name: title,
                result: false,
                stack: error.stack
            }
        ],
        start: startTime,
        suites: 0,
        tests: 1
    };
}

mocha.setup('bdd');

try {

    util = require('./common/util');

    try {
        require('../dist/custom-elements-polyfill.js');

        try {
            require('./spec/global');
            require('./spec/CustomElementRegistry');
            require('./spec/define');
            require('./spec/get');
            require('./spec/whenDefined');

            require('./spec/constructors');

            loaded = true;
        } catch (error) {
            initError(error, 'Tests failed to load');
        }

    } catch (error) {
        initError(error, 'Polyfill failed to load');
    }

} catch (error) {
    initError(error, 'Test utility library failed to load');
}

if (loaded) {

    util.runner = runner = mocha.run();
    window.onerror = null;
    reportContainer = document.getElementById('mocha-report');
    mochaContainer.removeChild(reportContainer);

    runner.on('end', function () {
        var stats = runner.stats;

        mochaContainer.appendChild(reportContainer);

        // Sauce labs has trouble with large error lists and may refuse to show them.
        stats.reports = util.reports.slice(0, 10);
        window.mochaResults = stats;

        console.group('Tests complete');
        console.log('Passed: %o', stats.passes);
        console.log('Failed: %o', stats.failures);
        console.groupEnd();
    });
    runner.on('fail', util.onTestComplete);
    runner.on('pass', util.onTestComplete);

}
