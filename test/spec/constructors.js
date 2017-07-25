'use strict';

require('mocha');

var expect = require('expect.js'),
    util = require('../common/util'),
    
    assign = Object.assign,
    conformanceErrors = [
        // A custom element constructor should throw an error when it...
        Object.defineProperties({
            action: 'returns an object that is not an instance of HTMLElement',
            errorType: TypeError,
        }, {
            constructor: {
                get: function () {
                    return function () {
                        return new Date();
                    }
                }
            }
        }),
        Object.defineProperties({
            value: 'returns an element that has attributes',
            errorType: DOMException,
            errorName: 'NotSupportedError'
        }, {
            constructor: {
                get: function () {
                    return function () {
                        this.setAttribute('data-a', '1');
                    }
                }
            }
        }),
        Object.defineProperties({
            value: 'returns an element that has childNodes',
            errorType: DOMException,
            errorName: 'NotSupportedError'
        }, {
            constructor: {
                get: function () {
                    return function () {
                        this.appendChild(document.createTextNode('Hello world'));
                    }
                }
            }
        }),
        Object.defineProperties({
            action: 'returns an element that has a parentNode',
            errorType: DOMException,
            errorName: 'NotSupportedError'
        }, {
            constructor: {
                get: function () {
                    return function () {
                        document.body.appendChild(this);
                    }
                }
            }
        }),
        Object.defineProperties({
            action: 'returns an element with a different ownerDocument',
            errorType: DOMException,
            errorName: 'NotSupportedError'
        }, {
            constructor: {
                get: function () {
                    return function () {
                        otherDocument.adoptNode(this);
                    }
                }
            }
        }),
        Object.defineProperties({
            action: 'returns an element with a different localName',
            errorType: DOMException,
            errorName: 'NotSupportedError'
        }, {
            constructor: {
                get: function () {
                    return function () {
                        return document.createElement('test');
                    }
                }
            }
        })
        /*
         * REVIEW: No test is performed to ensure that the element's namespaceURI is
         * equal to the HTML namespace. I can't think of a way to change the
         * namespaceURI in a manner that won't cause any of the other conformance
         * checks to fail.
         */
    ],
    conformanceParameters = {
        createBeforeDefined: false,
        createBeforeDocumentReady: true,
        defineBeforeDocumentReady: true
    },
    constructorParameters = {
        createBeforeDefined: [true, false],
        createBeforeDocumentReady: [true, false],
        defineBeforeDocumentReady: [true, false],
        source: [
            util.elementSources.constructor,
            util.elementSources.createElement,
            util.elementSources.documentParser,
            util.elementSources.fragmentParser
        ]
    },
    container = util.container,
    createScenarios = util.createScenarios,
    describeLocalName = util.describeLocalName,
    ElementScenario = util.ElementScenario,
    forEachCustomElement = util.forEachCustomElement,
    ignoreErrors = util.ignoreErrors,
    localNames = (util.nativeCustomElements ? [] : [null]).concat(Object.getOwnPropertyNames(util.supportedElements)),
    nameOf = util.nameOf,
    otherDocument = document.implementation.createHTMLDocument('Test'),
    scenariosByLocalName = {},
    shouldThrow = util.shouldThrow;

describe('The custom element constructor', function () {

    function BaseClass() {}

    localNames.forEach(function (localName) {

        describe('for ' + describeLocalName(localName), function () {

            var elementInterface = localName ? util.supportedElements[localName] : HTMLElement;

            constructorParameters.localName = localName;
            describe('should result in an element that implements the ' + nameOf(elementInterface.prototype) + ' interface', function () {
                createScenarios(constructorParameters).forEach(function (scenario) {
                    scenario.test('when ' + scenario.description, function () {
                        expect(scenario.element).to.be.an(elementInterface);
                    });
                });
            });

            conformanceParameters.autoCreateElement = false;
            conformanceParameters.baseConstructor = BaseClass;
            conformanceParameters.basePrototype = BaseClass.prototype;
            conformanceParameters.localName = localName;
            conformanceParameters.source = util.elementSources.createElement;

            describe('created via document.createElement()', function () {
                describe('should fail if it returns an object that is not an instance of HTMLElement', function () {
                    createScenarios(conformanceParameters).forEach(function (scenario) {
                        scenario.test('when defined as a' + (scenario.asFunction ? ' function' : 'n ES6 class'), function () {
                            var instance = customElements.get(scenario.name),
                                element;
                            ignoreErrors(function () {
                                if (scenario.isBuiltIn) {
                                    element = document.createElement(scenario.localName, { is: scenario.name });
                                } else {
                                    element = document.createElement(scenario.localName);
                                }
                            });
                            expect(element).not.to.be.an(instance);
                        });
                    });
                });
            });
            //conformanceErrors.forEach(function (e) {
            //    
            //    describe('should throw a ' + (e.errorName ? '"' + e.errorName + '" ' : '') + nameOf(e.errorType) + ' when it is invoked via document.createElement() and ' + e.action, function () {
            //        new ElementScenario(conformanceParameters).test
            //    });
            //});

        });
    });

});
