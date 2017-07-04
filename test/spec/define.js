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

describe('CustomElementRegistry.prototype.define()', function () {

    context('should return `undefined`', function () {
        permutate({
            asFunction: supportsClasses ? [false, true] : true,
            localName: [null, 'div']
        }).forEach(function (o) {
            specify('when defining a valid ' + (o.localName ? 'customized built-in' : 'autonomous custom') + ' element (written as ' + (o.asFunction ? 'a function' : 'an ES6 class') + ')', function () {
                expect(defineElement(o).returnValue).to.be(void 0);
            });
        });
    });

    context('should throw a TypeError', function () {
        specify('when invoked with an invalid context object', function () {
            shouldThrow(TypeError, function () {
                CustomElementRegistry.prototype.define.call(window);
            });
        });
        specify('when invoked with no arguments', function () {
            shouldThrow(TypeError, function () {
                customElements.define();
            });
        });
        specify('when invoked with only 1 argument', function () {
            shouldThrow(TypeError, function () {
                customElements.define(uniqueCustomElementName());
            });
        });
        specify('when invoked with a second argument ("constructor") that is not a function', function () {
            shouldThrow(TypeError, function () {
                customElements.define(uniqueCustomElementName(), 42);
            });
        });
        specify('when invoked with a third argument ("options") that is not an object', function () {
            shouldThrow(TypeError, function () {
                customElements.define(uniqueCustomElementName(), function () { }, 42);
            });
        });
        specify('when constructor.prototype is not an object', function () {
            shouldThrow(TypeError, function () {
                var f = function () { };
                f.prototype = null;
                customElements.define(uniqueCustomElementName(), f);
            });
        });
        ['adoptedCallback', 'attributeChangedCallback', 'connectedCallback', 'disconnectedCallback'].forEach(function (callbackName) {
            specify('when constructor.prototype has a property named "' + callbackName + '" that is not undefined and is not a function', function () {
                shouldThrow(TypeError, function () {
                    var f = function () { };
                    f.prototype[callbackName] = null;
                    customElements.define(uniqueCustomElementName(), f);
                });
            });
        });
        specify('when constructor.prototype.attributeChangedCallback is defined, and the constructor has a property named "observedAttributes" that is not undefined and cannot be converted to an array of strings', function () {
            shouldThrow(TypeError, function () {
                var f = function () { };
                f.prototype.attributeChangedCallback = function () { };
                f.observedAttributes = null;
                customElements.define(uniqueCustomElementName(), f);
            });
        });
    });

    context('should throw a "NotSupportedError" DOMException', function () {
        specify('when the tag name specified in the \'extends\' option is a valid custom element name', function () {
            shouldThrow(DOMException, 'NotSupportedError', function () {
                customElements.define(uniqueCustomElementName(), function () { }, { 'extends': uniqueCustomElementName() });
            });
        });
        specify('when the tag name specified in the \'extends\' option is not the name of a built-in element', function () {
            shouldThrow(DOMException, 'NotSupportedError', function () {
                customElements.define(uniqueCustomElementName(), function () { }, { 'extends': 'foo' });
            });
        });
        specify('when invoked while the CustomElementRegistry is already processing a custom element definition', function () {
            /*
             * The CustomElementRegistry has an internal "element definition is running" flag which is
             * activated after the arguments to the define() method are validated. Invoking the define()
             * method while this flag is set throws a "NotSupportedError" DOMException.
             *
             * After setting this flag, one of the next steps in the Custom Element Definition algorithm
             * is to cycle through the four callback names, and check the prototype object for a function
             * property with each name. The Get(O, P) operation (https://tc39.github.io/ecma262/#sec-get-o-p)
             * is used for each callback name, where O is the custom element's prototype object, and P is
             * the name of the callback. This operation invokes accessor descriptors on defined properties.
             *
             * For our test, a property named "adoptedCallback" is defined on the prototype object, and is
             * given a get() accessor. An initial call to customElements.define() -- the last line in the
             * expect(){} block below -- uses this prototype object in its definition. During this first
             * definition, the "element definition is running" flag is set, and then the prototype is
             * searched for callback methods. This is when the get() accessor for the "adoptedCallback"
             * property is invoked, which then makes the second call to customElements.define() and causes
             * the DOMException to be thrown.
             */
            shouldThrow(DOMException, 'NotSupportedError', function () {
                var TestClass = function () { };
                Object.defineProperty(TestClass.prototype, 'adoptedCallback', {
                    get: function () {
                        customElements.define(uniqueCustomElementName(), function () { });
                        return undefined;
                    }
                });
                customElements.define(uniqueCustomElementName(), TestClass);
            });
        });

        context('for duplicate constructors', function () {
            permutate({
                firstExtends: [null, 'div'],
                firstIsFunction: supportsClasses ? [false, true] : true,
                secondExtends: [null, 'div'],
                secondIsFunction: supportsClasses ? [false, true] : true
            }).forEach(function (o) {
                var firstType, secondType, def;
                if (o.firstIsFunction === o.secondIsFunction) {
                    firstType = (o.firstExtends === o.secondExtends ? 'another' : ('a' + (o.secondExtends ? '' : 'n'))) + (o.secondExtends ? ' customized built-in' : ' autonomous custom') + ' element';
                    secondType = (o.firstExtends ? 'a customized built-in' : 'an autonomous custom') + ' element';
                    def = defineElement({ asFunction: o.firstIsFunction, localName: o.firstExtends });
                    specify('when defining ' + secondType + ' with a constructor that is already in use by ' + firstType + ' (and both are written as ' + (o.firstIsFunction ? 'functions' : 'ES6 classes') + ')', function () {
                        shouldThrow(DOMException, 'NotSupportedError', function () {
                            defineElement({ asFunction: o.secondIsFunction, localName: o.secondExtends, constructor: def.finalConstructor });
                        });
                    });
                }
            });
        });

        context('for duplicate names', function () {
            permutate({
                firstExtends: [null, 'div'],
                firstIsFunction: supportsClasses ? [false, true] : true,
                secondExtends: [null, 'div'],
                secondIsFunction: supportsClasses ? [false, true] : true
            }).forEach(function (o) {
                var firstType = (o.firstExtends === o.secondExtends ? 'another' : ('a' + (o.secondExtends ? '' : 'n'))) + (o.secondExtends ? ' customized built-in' : ' autonomous custom') + ' element (written as ' + (o.secondIsFunction ? 'a function' : 'an ES6 class') + ')',
                    secondType = (o.firstExtends ? 'a customized built-in' : 'an autonomous custom') + ' element (written as ' + (o.firstIsFunction ? 'a function' : 'an ES6 class') + ')',
                    def = defineElement({ asFunction: o.firstIsFunction, localName: o.firstExtends });
                specify('when defining ' + secondType + ' with a name that is already in use by ' + firstType, function () {
                    shouldThrow(DOMException, 'NotSupportedError', function () {
                        defineElement({ asFunction: o.secondIsFunction, localName: o.secondExtends, name: def.name });
                    });
                });
            });
        });

    });

    context('should throw a "SyntaxError" DOMException', function () {

        context('when defining an autonomous custom element with an invalid name', function () {
            invalidTagNames.forEach(function (name) {
                specify('"' + name + '"', function () {
                    shouldThrow(DOMException, 'SyntaxError', function () {
                        customElements.define(name, function () { });
                    });
                });
            });
        });

        context('when defining a customized built-in element with an invalid name', function () {
            invalidTagNames.forEach(function (name) {
                specify('"' + name + '"', function () {
                    shouldThrow(DOMException, 'SyntaxError', function () {
                        customElements.define(name, function () { }, { 'extends': 'div' });
                    });
                });
            });
        });

        context('when defining an autonomous custom element with a reserved tag name', function () {
            reservedTagNames.forEach(function (name) {
                specify('"' + name + '"', function () {
                    shouldThrow(DOMException, 'SyntaxError', function () {
                        customElements.define(name, function () { });
                    });
                });
            });
        });

        context('when defining a customized built-in element with a reserved tag name', function () {
            reservedTagNames.forEach(function (name) {
                specify('"' + name + '"', function () {
                    shouldThrow(DOMException, 'SyntaxError', function () {
                        customElements.define(name, function () { });
                    });
                });
            });
        });

    });

});
