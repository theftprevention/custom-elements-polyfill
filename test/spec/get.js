'use strict';

require('mocha');

var expect = require('expect.js'),
    util = require('../util'),

    defineElement = util.defineElement,
    invalidTagNames = util.invalidTagNames,
    permutate = util.permutate,
    reservedTagNames = util.reservedTagNames,
    shouldThrow = util.shouldThrow,
    supportsClasses = util.supportsClasses,
    uniqueCustomElementName = util.uniqueCustomElementName,
    validTagNames = util.validTagNames;

describe('CustomElementRegistry.prototype.get()', function () {

    permutate({
        asFunction: supportsClasses ? [false, true] : true,
        localName: [null, 'div']
    }).forEach(function (o) {
        context('when invoked with the name of a defined ' + (o.localName ? 'customized built-in' : 'autonomous custom') + ' element (written as ' + (o.asFunction ? 'a function' : 'an ES6 class') + '), should return a value that', function () {
            var def = defineElement(o),
                definedConstructor = def.definedConstructor,
                finalConstructor = customElements.get(def.name);
            
            if (supportsClasses) {
                it('is an ES6 class' + (o.asFunction ? ' (because the current browser supports them)' : ''), function () {
                    expect(finalConstructor).to.be.a('function');
                    expect(Object.getOwnPropertyDescriptor(finalConstructor, 'prototype').writable).to.be(false);
                });
            } else {
                it('is a function', function () {
                    expect(finalConstructor).to.be.a('function');
                });
            }
            it('is ' + (o.asFunction ? 'not ' : '') + 'equal to the constructor originally passed to the define() method', function () {
                var assertion = expect(finalConstructor);
                if (o.asFunction) {
                    expect(finalConstructor).not.to.be(definedConstructor);
                } else {
                    expect(finalConstructor).to.be(definedConstructor);
                }
            });
        });
    });

    context('should return `undefined` when invoked with', function () {
        
        specify('an empty string', function () {
            expect(customElements.get('')).to.be(void 0);
        });

        specify('a valid custom element name that has not yet been used in a custom element definition', function () {
            expect(customElements.get(uniqueCustomElementName())).to.be(void 0);
        });

        context('an invalid custom element name', function () {
            invalidTagNames.forEach(function (name) {
                specify('"' + name + '"', function () {
                    expect(customElements.get(name)).to.be(void 0);
                });
            });
        });

        context('a reserved tag name', function () {
            reservedTagNames.forEach(function (name) {
                specify('"' + name + '"', function () {
                    expect(customElements.get(name)).to.be(void 0);
                });
            });
        });

    });

    context('should throw a TypeError', function () {
        specify('when invoked with an invalid context object', function () {
            shouldThrow(TypeError, function () {
                CustomElementRegistry.prototype.get.call(window, 'a-a');
            });
        });
        specify('when invoked with no arguments', function () {
            shouldThrow(TypeError, function () {
                customElements.get();
            });
        });
    });

});
