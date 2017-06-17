/// <reference path="../node_modules/expect.js/index.js" />
/// <reference path="../node_modules/mocha/mocha.js" />

'use strict';

var util = require('./util'),

    defineElement = util.defineElement,
    invalidTagNames = util.invalidTagNames,
    permutate = util.permutate,
    reservedTagNames = util.reservedTagNames,
    shouldThrowDOMException = util.shouldThrowDOMException,
    shouldThrowTypeError = util.shouldThrowTypeError,
    supportsClasses = util.supportsClasses,
    uniqueCustomElementName = util.uniqueCustomElementName,
    validTagNames = util.validTagNames;

describe('CustomElementRegistry.prototype.define()', function () {
    context('should throw a TypeError', function () {
        specify('when invoked with an invalid context object', function () {
            shouldThrowTypeError(function () {
                CustomElementRegistry.prototype.define.call(window);
            });
        });
        specify('when invoked with no arguments', function () {
            shouldThrowTypeError(function () {
                customElements.define();
            });
        });
        specify('when invoked with only 1 argument', function () {
            shouldThrowTypeError(function () {
                customElements.define(uniqueCustomElementName());
            });
        });
        specify('when invoked with a second argument ("constructor") that is not a function', function () {
            shouldThrowTypeError(function () {
                customElements.define(uniqueCustomElementName(), 42);
            });
        });
        specify('when invoked with a third argument ("options") that is not an object', function () {
            shouldThrowTypeError(function () {
                customElements.define(uniqueCustomElementName(), function () { }, 42);
            });
        });
        specify('when constructor.prototype is not an object', function () {
            shouldThrowTypeError(function () {
                var f = function () { };
                f.prototype = null;
                customElements.define(uniqueCustomElementName(), f);
            });
        });
        ['adoptedCallback', 'attributeChangedCallback', 'connectedCallback', 'disconnectedCallback'].forEach(function (callbackName) {
            specify('when constructor.prototype has a property named "' + callbackName + '" that is not undefined and is not a function', function () {
                shouldThrowTypeError(function () {
                    var f = function () { };
                    f.prototype[callbackName] = null;
                    customElements.define(uniqueCustomElementName(), f);
                });
            });
        });
        specify('when constructor.prototype.attributeChangedCallback is defined, and the constructor has a property named "observedAttributes" that is not undefined and cannot be converted to an array of strings', function () {
            shouldThrowTypeError(function () {
                var f = function () { };
                f.prototype.attributeChangedCallback = function () { };
                f.observedAttributes = null;
                customElements.define(uniqueCustomElementName(), f);
            });
        });
    });
    context('should throw a "NotSupportedError" DOMException', function () {
        var name = uniqueCustomElementName();
        specify('when the tag name specified in the \'extends\' option is a valid custom element name ("' + name + '")', function () {
            shouldThrowDOMException('NotSupportedError', function () {
                customElements.define(uniqueCustomElementName(), function () { }, { 'extends': name });
            });
        });
        specify('when the tag name specified in the \'extends\' option is not the name of a built-in element ("foo")', function () {
            shouldThrowDOMException('NotSupportedError', function () {
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
            shouldThrowDOMException('NotSupportedError', function () {
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
                firstIsClass: supportsClasses ? [true, false] : false,
                secondExtends: [null, 'div'],
                secondIsClass: supportsClasses ? [true, false] : false
            }).forEach(function (o) {
                var firstType, secondType, def;
                if (o.firstIsClass === o.secondIsClass) {
                    firstType = (o.firstExtends === o.secondExtends ? 'another' : ('a' + (o.secondExtends ? '' : 'n'))) + (o.secondExtends ? ' customized built-in element' : ' autonomous custom element');
                    secondType = (o.firstExtends ? 'a customized built-in element' : 'an autonomous custom element');
                    def = defineElement({ isClass: o.firstIsClass, localName: o.firstExtends });
                    specify('when defining ' + secondType + ' with a constructor that is already in use by ' + firstType + ' (and both are defined as ' + (o.firstIsClass ? 'ES6 classes' : 'functions') + ')', function () {
                        shouldThrowDOMException('NotSupportedError', function () {
                            defineElement({ isClass: o.secondIsClass, localName: o.secondExtends, constructor: o.firstIsClass ? def.finalConstructor : def.originalConstructor });
                        });
                    });
                }
            });
        });
        context('for duplicate names', function () {
            permutate({
                firstExtends: [null, 'div'],
                firstIsClass: supportsClasses ? [true, false] : false,
                secondExtends: [null, 'div'],
                secondIsClass: supportsClasses ? [true, false] : false
            }).forEach(function (o) {
                var firstType = (o.firstExtends === o.secondExtends ? 'another' : ('a' + (o.secondExtends ? '' : 'n'))) + (o.secondExtends ? ' customized built-in element' : ' autonomous custom element') + ' (defined as ' + (o.secondIsClass ? 'an ES6 class' : 'a function') + ')',
                    secondType = (o.firstExtends ? 'a customized built-in element' : 'an autonomous custom element') + ' (as ' + (o.firstIsClass ? 'an ES6 class' : 'a function') + ')',
                    def = defineElement({ isClass: o.firstIsClass, localName: o.firstExtends });
                specify('when defining ' + secondType + ' with a name that is already in use by ' + firstType, function () {
                    shouldThrowDOMException('NotSupportedError', function () {
                        defineElement({ isClass: o.secondIsClass, localName: o.secondExtends, name: def.name });
                    });
                });
            });
        });
    });
    context('should throw a "SyntaxError" DOMException', function () {
        context('when defining an autonomous custom element with an invalid name', function () {
            invalidTagNames.forEach(function (name) {
                specify('<' + name + '>', function () {
                    shouldThrowDOMException('SyntaxError', function () {
                        customElements.define(name, function () { });
                    });
                });
            });
        });
        context('when defining a customized built-in element with an invalid name', function () {
            invalidTagNames.forEach(function (name) {
                specify('<div is="' + name + '">', function () {
                    shouldThrowDOMException('SyntaxError', function () {
                        customElements.define(name, function () { }, { 'extends': 'div' });
                    });
                });
            });
        });
        context('when defining an autonomous custom element with a reserved tag name', function () {
            reservedTagNames.forEach(function (name) {
                specify('<' + name + '>', function () {
                    shouldThrowDOMException('SyntaxError', function () {
                        customElements.define(name, function () { });
                    });
                });
            });
        });
        context('when defining a customized built-in element with a reserved tag name', function () {
            reservedTagNames.forEach(function (name) {
                specify('<div is="' + name + '">', function () {
                    shouldThrowDOMException('SyntaxError', function () {
                        customElements.define(name, function () { });
                    });
                });
            });
        });
    });
    context('should not throw an exception', function () {

    });
});
