/// <reference path="../node_modules/expect.js/index.js" />
/// <reference path="../node_modules/mocha/mocha.js" />

'use strict';

var expect = require('expect.js') || window.expect,
    mocha = require('mocha') || window.mocha,
    Promise = require('es6-promise/auto') || window.Promise,
    util = require('./util'),

    domExCodes = util.domExCodes,
    invalidTagNames = util.invalidTagNames,
    reservedTagNames = util.reservedTagNames,
    validTagNames = util.validTagNames;

describe('CustomElementRegistry.prototype.whenDefined()', function () {
    context('should return a Promise that is rejected with a TypeError', function () {
        specify('when invoked with an invalid context object', function (done) {
            var promise = CustomElementRegistry.prototype.whenDefined.call(window, 'a-a');
            expect(promise).to.be.a(Promise);
            promise.then(function () {
                done(new Error('Expected Promise to be rejected; was resolved instead'));
            }, function (err) {
                var result;
                try {
                    expect(err).to.be.a(TypeError);
                } catch (ex) {
                    result = ex;
                }
                done(result);
            });
        });
        specify('when invoked with no arguments', function (done) {
            var promise = customElements.whenDefined();
            expect(promise).to.be.a(Promise);
            promise.then(function () {
                done(new Error('Expected Promise to be rejected; was resolved instead'));
            }, function (err) {
                var result;
                try {
                    expect(err).to.be.a(TypeError);
                } catch (ex) {
                    result = ex;
                }
                done(result);
            });
        });
    });
    context('should return a Promise that is rejected with a "SyntaxError" DOMException', function () {
        context('when invoked with an invalid name', function () {
            invalidTagNames.forEach(function (name) {
                specify('"' + name + '"', function (done) {
                    var promise = customElements.whenDefined(name);
                    expect(promise).to.be.a(Promise);
                    promise.then(function () {
                        done(new Error('Expected Promise to be rejected; was resolved instead'));
                    }, function (err) {
                        var result;
                        try {
                            expect(err).to.be.a(DOMException);
                            expect(err.name).to.be('SyntaxError');
                            expect(err.code).to.be(domExCodes.SyntaxError);
                        } catch (ex) {
                            result = ex;
                        }
                        done(result);
                    });
                });
            });
        });
        context('when invoked with a reserved tag name', function () {
            reservedTagNames.forEach(function (name) {
                specify('"' + name + '"', function (done) {
                    var promise = customElements.whenDefined(name);
                    expect(promise).to.be.a(Promise);
                    promise.then(function () {
                        done(new Error('Expected Promise to be rejected; was resolved instead'));
                    }, function (err) {
                        var result;
                        try {
                            expect(err).to.be.a(DOMException);
                            expect(err.name).to.be('SyntaxError');
                            expect(err.code).to.be(domExCodes.SyntaxError);
                        } catch (ex) {
                            result = ex;
                        }
                        done(result);
                    });
                });
            });
        });
    });
});
