/// <reference path="../node_modules/expect.js/index.js" />
/// <reference path="../node_modules/mocha/mocha.js" />

'use strict';

var expect = require('expect.js') || window.expect,
    mocha = require('mocha') || window.mocha;

describe('The global (window) object', function () {
    describe('\'CustomElementRegistry\' property', function () {
        var descriptor = Object.getOwnPropertyDescriptor(window, 'CustomElementRegistry');
        it('should exist', function () {
            expect(descriptor).to.be.an('object');
        });
        it('should be configurable', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should not be enumerable', function () {
            expect(descriptor.enumerable).to.be(false);
        });
        it('should be writable', function () {
            expect(descriptor.writable).to.be(true);
        });
        it('should be a function', function () {
            expect(descriptor.value).to.be.a('function');
        });
    });
    describe('\'customElements\' property', function () {
        var descriptor = Object.getOwnPropertyDescriptor(window, 'customElements');
        it('should exist', function () {
            expect(descriptor).to.be.an('object');
        });
        it('should be configurable', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should be enumerable', function () {
            expect(descriptor.enumerable).to.be(true);
        });
        it('should have a get() accessor', function () {
            expect(descriptor.get).to.be.a('function');
        });
        it('should not have a set() accessor', function () {
            expect(descriptor.set).to.be(undefined);
        });
        describe('get() accessor', function () {
            var reg1 = descriptor.get.call(),
                reg2 = descriptor.get.call();
            it('should return an instance of CustomElementRegistry', function () {
                expect(reg1).to.be.a(CustomElementRegistry);
            });
            it('should return a reference to the same instance of CustomElementRegistry each time it is invoked', function () {
                expect(reg2).to.equal(reg1);
            });
        });
    });
});
