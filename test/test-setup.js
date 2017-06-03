/// <reference path="../dist/custom-elements-polyfill.js" />
/// <reference path="../lib/expect.js" />
/// <reference path="../lib/mocha.min.js" />

(function (global, undefined) {
    'use strict';

    /**
     * @typedef {object} TestDefinitionOptions
     * 
     * @property {boolean} defineEarly - True if the custom element definition should be registered
     *   before the document is interactive; otherwise, false.
     * @property {?string} localName - The local name. For customized built-in elements, this should
     *   be the local name of the extended element (i.e. 'div'). For autonomous custom elements, this
     *   should be undefined or null.
     */
    
    var builtInElements = {},
        comparisonInterface = (HTMLUnknownElement || HTMLElement).prototype,
        container = document.getElementById('test-container'),
        createElement = Document.prototype.createElement.bind(document),
        definitions = {},
        descriptors = {},
        expect = window.expect,
        getOwnPropertyDescriptors = (function () {
            if (typeof Object.getOwnPropertyDescriptors === 'function') {
                return Object.getOwnPropertyDescriptors;
            }
            /** @returns {object} */
            return function getOwnPropertyDescriptors(O) {
                var names = Object.getOwnPropertyNames(O),
                    i = 0,
                    l = names.length,
                    result = {},
                    name;
                while (i < l) {
                    name = names[i++];
                    result[name] = Object.getOwnPropertyDescriptor(O, name);
                }
                return result;
            };
        })(),
        interfacesByPrototype = new Map(),
        Mocha = global.Mocha,
        mocha = global.mocha,
        nameIncrement = 0,
        predefinedTagNames = {
            HTMLAnchorElement: 'a',
            HTMLDListElement: 'dl',
            HTMLDirectoryElement: 'dir',
            HTMLHeadingElement: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            HTMLKeygenElement: null,
            HTMLModElement: ['del', 'ins'],
            HTMLOListElement: 'ol',
            HTMLParagraphElement: 'p',
            HTMLQuoteElement: 'blockquote',
            HTMLTableCaptionElement: 'caption',
            HTMLTableCellElement: ['td', 'th'],
            HTMLTableColElement: 'col',
            HTMLTableRowElement: 'tr',
            HTMLTableSectionElement: ['tbody', 'tfoot', 'thead'],
            HTMLUListElement: 'ul',
            HTMLUnknownElement: null
        },
        reports = [],
        tagNamesByPrototype = new Map(),
        reg_htmlInterface = /^HTML(.+)Element$/,
        reg_n1 = /[^a-zA-Z]([a-z])/g,
        reg_n2 = /[^\w\$\-]/g,
        supportsClasses = (function () {
            try {
                eval('class A{}');
                return true;
            } catch (ex) {
                return false;
            }
        })(),
        native = supportsClasses ? (function () {
            var instance, prototype, define, get, whenDefined;
            if (typeof global.CustomElementRegistry !== 'function' || !(global.customElements instanceof global.CustomElementRegistry)) {
                return null;
            }
            instance = global.customElements;
            prototype = global.CustomElementRegistry.prototype;
            define = prototype.define.bind(instance);
            get = prototype.get.bind(instance);
            whenDefined = prototype.whenDefined.bind(instance);
            return Object.defineProperties({}, {
                canExtend: {
                    value: (function () {
                        var name = 'custom-elements-polyfill-test',
                            tag = 'div',
                            constructor,
                            /// <var type="HTMLElement" />
                            e;
                        try {
                            constructor = eval("var a=class extends HTMLDivElement{constructor(){super();}};a;");
                            define(name, constructor, { 'extends': tag });
                            e = new constructor();
                            return (e && e instanceof global.HTMLDivElement && e.tagName.toLowerCase() === tag && e.getAttribute('is') === name);
                        } catch (ex) {
                            return false;
                        }
                    })()
                },
                define: {
                    value: define
                },
                'get': {
                    value: get
                },
                instance: {
                    value: instance
                },
                prototype: {
                    value: prototype
                },
                whenDefined: {
                    value: whenDefined
                }
            });
        })() : null,
        INDEX_SIZE_ERR = { code: 1, name: 'IndexSizeError' },
        HIERARCHY_REQUEST_ERR = { code: 3, name: 'HierarchyRequestError' },
        WRONG_DOCUMENT_ERR = { code: 4, name: 'WrongDocumentError' },
        INVALID_CHARACTER_ERR = { code: 5, name: 'InvalidCharacterError' },
        NO_MODIFICATION_ALLOWED_ERR = { code: 7, name: 'NoModificationAllowedError' },
        NOT_FOUND_ERR = { code: 8, name: 'NotFoundError' },
        NOT_SUPPORTED_ERR = { code: 9, name: 'NotSupportedError' },
        INVALID_STATE_ERR = { code: 11, name: 'InvalidStateError' },
        SYNTAX_ERR = { code: 12, name: 'SyntaxError' },
        INVALID_MODIFICATION_ERR = { code: 13, name: 'InvalidModificationError' },
        NAMESPACE_ERR = { code: 14, name: 'NamespaceError' },
        INVALID_ACCESS_ERR = { code: 15, name: 'InvalidAccessError' },
        TYPE_MISMATCH_ERR = { code: 17, name: 'TypeMismatchError' },
        SECURITY_ERR = { code: 18, name: 'SecurityError' },
        NETWORK_ERR = { code: 19, name: 'NetworkError' },
        ABORT_ERR = { code: 20, name: 'AbortError' },
        URL_MISMATCH_ERR = { code: 21, name: 'URLMismatchError' },
        QUOTA_EXCEEDED_ERR = { code: 22, name: 'QuotaExceededError' },
        TIMEOUT_ERR = { code: 23, name: 'TimeoutError' },
        INVALID_NODE_TYPE_ERR = { code: 24, name: 'InvalidNodeTypeError' },
        DATA_CLONE_ERR = { code: 25, name: 'DataCloneError' };

    /**
     * @param {object} [options]
     * @returns {function}
     */
    function defineElement(options) {
        var isClass, localName, name, constructor, interfaceConstructor, interfacePrototype;

        options = Object(options == null ? {} : options);

        isClass = supportsClasses ? !!options.isClass : false;
        name = options.name || uniqueCustomElementName();
        localName = options.localName || name;

        interfaceConstructor = builtInElements[localName] || HTMLElement;
        interfacePrototype = interfaceConstructor.prototype;

        constructor = options.hasOwnProperty('constructor') && typeof options.constructor === 'function' ? options.constructor : function () { };
        constructor.prototype = Object.create(interfacePrototype);
        constructor.prototype.constructor = constructor;

        if (isClass) {
            constructor = eval("(function () { return function (a) { return class extends a { constructor() { super(); } }; }; })()")(constructor);
        }

        if (options.hasOwnProperty('prototype') && options.prototype instanceof Object) {
            Object.defineProperties(constructor.prototype, Object.getOwnPropertyDescriptors(options.prototype));
        }

        if (name === localName) {
            customElements.define(name, constructor);
        } else {
            customElements.define(name, constructor, { 'extends': localName });
        }
        return {
            constructor: customElements.get(name),
            name: name
        };
    }

    /**
     * @param {Mocha.Test} test
     * @returns {string}
     */
    function flattenTitles(test) {
        var titles = [test.title];
        while (test.parent && test.parent.title) {
            titles.push(test.parent.title);
            test = test.parent;
        }
        return titles.reverse().join(' ');
    };

    /**
     * @param {object} obj
     * @param {Array.<string>} [arrayProperties]
     * @returns {Array}
     */
    function permutate(obj, arrayProperties) {
        var value, result, i, l, p, q, r, newObj, permutations;
        if (obj == null) {
            return [];
        }
        if (!(arrayProperties instanceof Array)) {
            arrayProperties = null;
        }
        obj = Object(obj);
        for (var prop in obj) {
            value = obj[prop];
            if (value instanceof Array && (!arrayProperties || arrayProperties.indexOf(prop) === -1)) {
                result = [];
                r = 0;
                for (i = 0, l = value.length; i < l; i++) {
                    newObj = {};
                    for (var copyProp in obj) {
                        if (prop !== copyProp) {
                            newObj[copyProp] = obj[copyProp];
                        }
                    }
                    newObj[prop] = value[i];
                    permutations = permutate(newObj, arrayProperties);
                    for (p = 0, q = permutations.length; p < q; p++) {
                        result[r++] = permutations[p];
                    }
                }
                return result;
            }
        }
        return [obj];
    }

    /**
     * @param {string} src
     */
    function loadScript(src) {
        var s = document.head.getElementsByTagName('script')[0],
            p = document.createElement('script');
        p.src = src;
        document.head.insertBefore(p, s);
    }

    /**
     * @param {Mocha.Test} test
     * @param {Error} [err]
     */
    function logResult(test, err) {
        var passed = !err,
            result = {
                name: flattenTitles(test),
                result: passed
            };
        if (!passed && err) {
            if (err.message) {
                result.message = err.message;
            } else {
                result.message = String(err);
            }
            if (result.stack) {
                result.stack = err.stack;
            }
        }
        reports.push(result);
    }

    function runTests() {
        var runner = mocha.run();
        runner.on('end', function () {
            var results = runner.stats;
            results.reports = reports;
            global.mochaResults = results;
        });
        runner.on('fail', logResult);
        runner.on('pass', logResult);
        return runner;
    }

    /**
     * @param {function|object} interf
     * @returns {Array.<string>}
     */
    function tagNamesFromInterface(interf) {
        if (typeof interf === 'function') {
            interf = interf.prototype;
        }
        if (!(interf instanceof Object)) {
            return null;
        }
        return tagNamesByPrototype.get(interf) || [];
    }

    /**
     * @param {string} tagName
     * @returns {string}
     */
    function tagNameToClassName(tagName) {
        var name = tagName.toLowerCase()
            .replace(reg_n1, uc)
            .replace(reg_n2, '');
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    /**
     * @returns {string}
     */
    function uniqueCustomElementName() {
        return 'test-' + (++nameIncrement);
    }

    /**
     * Represents a single custom element definition against which a series of tests is
     *   performed.
     * @class
     * 
     * @param {TestDefinitionOptions} options
     * 
     * @property {object} basePrototype - The base prototype from which the custom element's
     *   prototype is derived.
     * @property {boolean} defineEarly - True if the custom element definition should be registered
     *   before the document is interactive; otherwise, false.
     * @property {boolean} isClass - True if the custom element should be defined as an ES6 class;
     *   otherwise, false.
     * @property {string} localName - The local name. For autonomous custom elements, this is equal
     *   to the 'name'; for customized built-in elements, it is not.
     * @property {string} name - The custom element name.
     */
    function TestElement(options) {
        var name = uniqueCustomElementName(),
            localName = options.localName || name,
            element;

        Object.defineProperties(this, {
            basePrototype: {
                enumerable: true,
                value: (builtInElements[localName] || HTMLElement).prototype
            },
            localName: {
                enumerable: true,
                value: localName
            },
            name: {
                enumerable: true,
                value: name
            }
        });

        definitions[name] = this;
        if (localName !== 'body' && localName !== 'head' && localName !== 'html') {
            element = document.createElement(localName);
            if (localName !== name) {
                element.setAttribute('is', name);
            }
            container.appendChild(element);
        }
    }

    Object.getOwnPropertyNames(global).forEach(function (prop) {
        var match = reg_htmlInterface.exec(prop),
            interf, proto, tags, isPredefined, element, i, l;
        if (!match) {
            return;
        }
        interf = global[prop];
        if (!interf.hasOwnProperty('prototype') || !(interf.prototype instanceof HTMLElement)) {
            return;
        }
        interfacesByPrototype.set(interf.prototype, interf);
        tags = predefinedTagNames[prop];
        isPredefined = predefinedTagNames.hasOwnProperty(prop);
        if (!isPredefined) {
            tags = match[1].toLowerCase();
        }
        if (tags instanceof Array) {
            tags = tags.map(function (t) { return String(t); });
        } else if (typeof tags === 'string') {
            tags = [tags];
        } else {
            tags = [];
        }
        if (tags.length === 0) {
            return;
        }
        if (!isPredefined) {
            i = tags.length;
            while (i--) {
                element = createElement(tags[i]);
                if (Object.getPrototypeOf(element) === comparisonInterface) {
                    tags.pop();
                }
            }
        }
        for (i = 0, l = tags.length; i < l; i++) {
            descriptors[tags[i]] = {
                enumerable: true,
                value: interf
            };
        }
        tagNamesByPrototype.set(interf.prototype, tags);
    });
    Object.defineProperties(builtInElements, descriptors);

    global.util = Object.defineProperties({}, {
        builtInElements: {
            enumerable: true,
            value: builtInElements
        },
        defineElement: {
            enumerable: true,
            value: defineElement
        },
        native: {
            enumerable: true,
            value: native
        },
        permutate: {
            enumerable: true,
            value: permutate
        },
        runTests: {
            enumerable: true,
            value: runTests
        },
        supportsClasses: {
            enumerable: true,
            value: supportsClasses
        }
    });

    // expect.js extensions
    Object.defineProperties(Object.getPrototypeOf(expect().to), {
        throwDOMException: {
            configurable: true,
            enumerable: true,
            value: function throwDOMException(type) {
                var code, name;
                if (type && typeof type.code === 'number' && typeof type.name === 'string') {
                    code = type.code;
                    name = type.name;
                }
                return this.throwException(function (ex) {
                    expect(ex).to.be.a(DOMException);
                    if (code && name) {
                        expect(ex.code).to.be(code);
                        expect(ex.name).to.be(name);
                    }
                });
            },
            writable: true
        }
    });

    mocha.setup('bdd');
    
    describe('window.CustomElementRegistry', function () {
        it('should be a function', function () {
            expect(CustomElementRegistry).to.be.a('function');
        });
        it('should have a prototype object', function () {
            expect(CustomElementRegistry.prototype).to.be.an('object');
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

    describe('window.customElements', function () {
        it('should be an instance of CustomElementRegistry', function () {
            expect(customElements).to.be.a(CustomElementRegistry);
        });
    });

    describe('CustomElementRegistry.prototype.define()', function () {
        var descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, 'define');

        it('should be a property of CustomElementRegistry.prototype', function () {
            expect(descriptor).to.be.an('object');
        });
        it('should be a configurable property', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should be an enumerable property', function () {
            expect(descriptor.enumerable).to.be(true);
        });
        it('should be a writable property', function () {
            expect(descriptor.writable).to.be(true);
        });
        it('should be a function', function () {
            expect(CustomElementRegistry.prototype.define).to.be.a('function');
        });

        context('should throw a TypeError', function () {
            specify('when invoked with an invalid context object', function () {
                expect(function () {
                    CustomElementRegistry.prototype.define.call(window);
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
            specify('when invoked with no arguments', function () {
                expect(function () {
                    customElements.define();
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
            specify('when invoked with only 1 argument', function () {
                expect(function () {
                    customElements.define(uniqueCustomElementName());
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
            specify('when invoked with a second argument ("constructor") that is not a function', function () {
                expect(function () {
                    customElements.define(uniqueCustomElementName(), 42);
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
            specify('when invoked with a third argument ("options") that is not an object', function () {
                expect(function () {
                    customElements.define(uniqueCustomElementName(), function () { }, 42);
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
            specify('when constructor.prototype is not an object', function () {
                expect(function () {
                    var f = function () { };
                    f.prototype = null;
                    customElements.define(uniqueCustomElementName(), f);
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });

            [
                'adoptedCallback',
                'attributeChangedCallback',
                'connectedCallback',
                'disconnectedCallback'
            ].forEach(function (callbackName) {
                specify('when constructor.prototype has a property named "' + callbackName + '" that is not undefined and is not a function', function () {
                    expect(function () {
                        var f = function () { };
                        f.prototype[callbackName] = null;
                        customElements.define(uniqueCustomElementName(), f);
                    }).to.throwException(function (e) {
                        expect(e).to.be.a(TypeError);
                    });
                });
            });
            specify('when constructor.prototype.attributeChangedCallback is defined, and the constructor has a property named "observedAttributes" that is not undefined and cannot be converted to an array of strings', function () {
                expect(function () {
                    var f = function () { };
                    f.prototype.attributeChangedCallback = function () { };
                    f.observedAttributes = null;
                    customElements.define(uniqueCustomElementName(), f);
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
        });
        context('should throw a "NotSupportedError" DOMException', function () {

            permutate({
                leftExtends: [null, 'div'],
                leftIsClass: supportsClasses ? [true, false] : false,
                rightExtends: [null, 'div'],
                rightIsClass: supportsClasses ? [true, false] : false
            }).forEach(function (o) {
                var name = uniqueCustomElementName(),
                    leftOpts = { isClass: o.leftIsClass, localName: o.leftExtends, name: name },
                    leftType = (o.leftExtends ? 'a customized built-in element' : 'an autonomous custom element') + ' (using ' + (o.leftIsClass ? 'ES6 class' : 'function') + ' syntax)',
                    rightOpts = { isClass: o.rightIsClass, localName: o.rightExtends, name: name },
                    rightType = (o.leftExtends === o.rightExtends ? 'another' : ('a' + (o.rightExtends ? '' : 'n'))) + (o.rightExtends ? ' customized built-in element' : ' autonomous custom element') + ' definition (using ' + (o.rightIsClass ? 'ES6 class' : 'function') + ' syntax)';
                defineElement(rightOpts);
                specify('when defining ' + leftType + ' whose name is already in use by ' + rightType, function () {
                    expect(function () {
                        defineElement(leftOpts);
                    }).to.throwDOMException(NOT_SUPPORTED_ERR);
                });
            });

            context('when defining an autonomous custom element', function () {
                context('whose constructor is already in use', function () {
                    specify('by another autonomous custom element definition', function () {
                        var c = function () { };
                        customElements.define(uniqueCustomElementName(), c);
                        expect(function () {
                            customElements.define(uniqueCustomElementName(), c);
                        }).to.throwDOMException(NOT_SUPPORTED_ERR);
                    });
                    specify('by a customized built-in element definition', function () {
                        var c = function () { };
                        customElements.define(uniqueCustomElementName(), c, { 'extends': 'div' });
                        expect(function () {
                            customElements.define(uniqueCustomElementName(), c);
                        }).to.throwDOMException(NOT_SUPPORTED_ERR);
                    });
                });
                context('whose name is already in use', function () {
                    specify('by another autonomous custom element definition', function () {
                        var name = uniqueCustomElementName();
                        customElements.define(name, function () { });
                        expect(function () {
                            customElements.define(name, function () { });
                        }).to.throwDOMException(NOT_SUPPORTED_ERR);
                    });
                    specify('by a customized built-in element definition', function () {
                        var name = uniqueCustomElementName();
                        customElements.define(name, function () { }, { 'extends': 'div' });
                        expect(function () {
                            customElements.define(name, function () { });
                        }).to.throwDOMException(NOT_SUPPORTED_ERR);
                    });
                });
            });
            context('when defining a customized built-in element', function () {
                context('whose constructor is already in use', function () {
                    if (supportsClasses) {
                        context('by an autonomous custom element definition', function () {
                            
                        });
                    } else {
                        specify('by an autonomous custom element definition', function () {
                            var c = function () { };
                            customElements.define(uniqueCustomElementName(), c);
                            expect(function () {
                                customElements.define(uniqueCustomElementName(), c, { 'extends': 'div' });
                            }).to.throwDOMException(NOT_SUPPORTED_ERR);
                        });
                        specify('by another customized built-in element definition', function () {
                            var c = function () { };
                            customElements.define(uniqueCustomElementName(), c, { 'extends': 'div' });
                            expect(function () {
                                customElements.define(uniqueCustomElementName(), c, { 'extends': 'div' });
                            }).to.throwDOMException(NOT_SUPPORTED_ERR);
                        });
                    }
                });
                context('whose name is already in use', function () {
                    specify('by an autonomous custom element definition', function () {
                        var name = uniqueCustomElementName();
                        customElements.define(name, function () { });
                        expect(function () {
                            customElements.define(name, function () { }, { 'extends': 'div' });
                        }).to.throwDOMException(NOT_SUPPORTED_ERR);
                    });
                    specify('by another customized built-in element definition', function () {
                        var name = uniqueCustomElementName();
                        customElements.define(name, function () { }, { 'extends': 'div' });
                        expect(function () {
                            customElements.define(name, function () { }, { 'extends': 'div' });
                        }).to.throwDOMException(NOT_SUPPORTED_ERR);
                    });
                });
            });
        });
        context('should throw a "SyntaxError" DOMException', function () {
            var
                invalidTagNames = [
                    'div',
                    'hello',
                    'Capitalized-Name',
                    'name-with-exclamation-point!',
                    'name-with:colon'
                ],
                reservedTagNames = [
                    'annotation-xml',
                    'color-profile',
                    'font-face',
                    'font-face-format',
                    'font-face-name',
                    'font-face-src',
                    'font-face-uri',
                    'missing-glyph'
                ];
            context('when defining an autonomous custom element with an invalid name', function () {
                invalidTagNames.forEach(function (name) {
                    specify('<' + name + '>', function () {
                        expect(function () {
                            customElements.define(name, function () { });
                        }).to.throwDOMException(SYNTAX_ERR);
                    });
                });
            });
            context('when defining a customized built-in element with an invalid name', function () {
                invalidTagNames.forEach(function (name) {
                    specify('<div is="' + name + '">', function () {
                        expect(function () {
                            customElements.define(name, function () { }, { 'extends': 'div' });
                        }).to.throwDOMException(SYNTAX_ERR);
                    });
                });
            });
            context('when defining an autonomous custom element with a reserved tag name', function () {
                reservedTagNames.forEach(function (name) {
                    specify('<' + name + '>', function () {
                        expect(function () {
                            customElements.define(name, function () { });
                        }).to.throwDOMException(SYNTAX_ERR);
                    });
                });
            });
            context('when defining a customized built-in element with a reserved tag name', function () {
                reservedTagNames.forEach(function (name) {
                    specify('<div is="' + name + '">', function () {
                        expect(function () {
                            customElements.define(name, function () { });
                        }).to.throwDOMException(SYNTAX_ERR);
                    });
                });
            });
        });
    });

    describe('CustomElementRegistry.prototype.get()', function () {
        var descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, 'get');

        it('should be a property of CustomElementRegistry.prototype', function () {
            expect(descriptor).to.be.an('object');
        });
        it('should be a configurable property', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should be an enumerable property', function () {
            expect(descriptor.enumerable).to.be(true);
        });
        it('should be a writable property', function () {
            expect(descriptor.writable).to.be(true);
        });
        it('should be a function', function () {
            expect(CustomElementRegistry.prototype.define).to.be.a('function');
        });
    });

    describe('CustomElementRegistry.prototype.whenDefined()', function () {
        var descriptor = Object.getOwnPropertyDescriptor(CustomElementRegistry.prototype, 'whenDefined');

        it('should be a property of CustomElementRegistry.prototype', function () {
            expect(descriptor).to.be.an('object');
        });
        it('should be a configurable property', function () {
            expect(descriptor.configurable).to.be(true);
        });
        it('should be an enumerable property', function () {
            expect(descriptor.enumerable).to.be(true);
        });
        it('should be a writable property', function () {
            expect(descriptor.writable).to.be(true);
        });
        it('should be a function', function () {
            expect(CustomElementRegistry.prototype.define).to.be.a('function');
        });
    });

    //permutate({
    //    defineEarly: [true, false],
    //    isClass: supportsClasses ? [true, false] : false,
    //    localName: Object.getOwnPropertyNames(builtInElements).concat(null)
    //}, [
    //    'observedAttributes'
    //]).forEach(function (options) {
    //    new TestElementDefinition(options);
    //});

})(window);