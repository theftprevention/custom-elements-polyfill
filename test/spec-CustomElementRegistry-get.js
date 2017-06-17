/// <reference path="../node_modules/expect.js/index.js" />
/// <reference path="../node_modules/mocha/mocha.js" />

'use strict';

var util = require('./util'),

    shouldThrowTypeError = util.shouldThrowTypeError;

describe('CustomElementRegistry.prototype.get()', function () {
    context('should throw a TypeError', function () {
        specify('when invoked with an invalid context object', function () {
            shouldThrowTypeError(function () {
                CustomElementRegistry.prototype.get.call(window, 'a-a');
            });
        });
        specify('when invoked with no arguments', function () {
            shouldThrowTypeError(function () {
                customElements.get();
            });
        });
    });
});
