/// <reference path="../node_modules/expect.js/index.js" />
/// <reference path="../node_modules/mocha/mocha.js" />

'use strict';

var util = require('./util'),
        
    supportsClasses = util.supportsClasses;

describe('CustomElementRegistry', function () {
    describe('\'prototype\' property', function () {
        var descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry, 'prototype');
        it('should exist', function () {
            expect(descriptor).to.not.be(undefined);
        });
        it('should not be configurable', function () {
            expect(descriptor.configurable).to.be(false);
        });
        it('should not be enumerable', function () {
            expect(descriptor.configurable).to.be(false);
        });
        it('should ' + (supportsClasses ? 'not ' : '') + 'be writable (since the current browser ' + (supportsClasses ? 'supports' : 'does not support') + ' ES6 classes)', function () {
            expect(descriptor.writable).to.be(!supportsClasses);
        });
        it('should be an object', function () {
            expect(descriptor.value).to.be.an(Object);
        });
    });
    context('should throw a TypeError', function () {
        specify('when invoked with the new keyword', function () {
            expect(function () {
                return new CustomElementRegistry();
            }).to.throwException(function (e) {
                expect(e).to.be.a(TypeError);
            });
        });
        specify('when invoked without the new keyword', function () {
            expect(CustomElementRegistry).to.throwException(function (e) {
                expect(e).to.be.a(TypeError);
            });
        });
    });
});

describe('CustomElementRegistry.prototype', function () {
    describe('\'define\' property', function () {
        var descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, 'define');
        it('should exist', function () {
            expect(descriptor).to.not.be(void 0);
        });
        it('should be configurable', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should be enumerable', function () {
            expect(descriptor.enumerable).to.be(true);
        });
        it('should be writable', function () {
            expect(descriptor.writable).to.be(true);
        });
        it('should be a function', function () {
            expect(descriptor.value).to.be.a('function');
        });
    });
    describe('\'get\' property', function () {
        var descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, 'get');
        it('should exist', function () {
            expect(descriptor).to.not.be(undefined);
        });
        it('should be configurable', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should be enumerable', function () {
            expect(descriptor.enumerable).to.be(true);
        });
        it('should be writable', function () {
            expect(descriptor.writable).to.be(true);
        });
        it('should be a function', function () {
            expect(descriptor.value).to.be.a('function');
        });
    });
    describe('\'whenDefined\' property', function () {
        var descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, 'whenDefined');
        it('should exist', function () {
            expect(descriptor).to.not.be(undefined);
        });
        it('should be configurable', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should be enumerable', function () {
            expect(descriptor.enumerable).to.be(true);
        });
        it('should be writable', function () {
            expect(descriptor.writable).to.be(true);
        });
        it('should be a function', function () {
            expect(descriptor.value).to.be.a('function');
        });
    });
});
