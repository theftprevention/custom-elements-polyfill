'use strict';

require('mocha');

var expect = require('expect.js'),
    util = require('../common/util'),

    defineElement = util.defineElement,
    domExCodes = util.domExCodes,
    invalidTagNames = util.invalidTagNames,
    permutate = util.permutate,
    reservedTagNames = util.reservedTagNames,
    shouldRejectWith = util.shouldRejectWith,
    shouldResolveWith = util.shouldResolveWith,
    supportsClasses = util.supportsClasses,
    uniqueCustomElementName = util.uniqueCustomElementName,
    validTagNames = util.validTagNames;

describe('CustomElementRegistry.prototype.whenDefined()', function () {

    context('should return a Promise that is resolved with `undefined`', function () {

        permutate({
            asFunction: supportsClasses ? [false, true] : true,
            localName: [null, 'div'],
            defineFirst: [true, false]
        }).forEach(function (o) {
            var options = o,
                name = uniqueCustomElementName(),
                defType = o.asFunction ? 'a function' : 'an ES6 class',
                elementType = (o.localName ? 'a customized built-in' : 'an autonomous custom') + ' element',
                defOrder = o.defineFirst ? 'already defined' : 'defined later on';

            options.name = name;
            specify('when invoked with the name of ' + elementType + ' (written as ' + defType + ') that is ' + defOrder, function (done) {
                var promise;
                if (options.defineFirst) {
                    defineElement(options);
                }
                promise = customElements.whenDefined(name);
                shouldResolveWith(promise, 'undefined', done);
                if (!options.defineFirst) {
                    setTimeout(defineElement, 1, options);
                }
            });
        });

    });

    context('should return a Promise that is rejected with a TypeError', function () {
        specify('when invoked with an invalid context object', function (done) {
            var promise = CustomElementRegistry.prototype.whenDefined.call(window, 'a-a');
            shouldRejectWith(promise, TypeError, done);
        });
        specify('when invoked with no arguments', function (done) {
            var promise = customElements.whenDefined();
            shouldRejectWith(promise, TypeError, done);
        });
    });

    context('should return a Promise that is rejected with a "SyntaxError" DOMException', function () {
        specify('when invoked with an empty string', function (done) {
            var promise = customElements.whenDefined('');
            shouldRejectWith(promise, DOMException, 'SyntaxError', done);
        });

        context('when invoked with an invalid name', function () {
            invalidTagNames.forEach(function (name) {
                specify('"' + name + '"', function (done) {
                    var promise = customElements.whenDefined(name);
                    shouldRejectWith(promise, DOMException, 'SyntaxError', done);
                });
            });
        });

        context('when invoked with a reserved tag name', function () {
            reservedTagNames.forEach(function (name) {
                specify('"' + name + '"', function (done) {
                    var promise = customElements.whenDefined(name);
                    shouldRejectWith(promise, DOMException, 'SyntaxError', done);
                });
            });
        });

    });
});
