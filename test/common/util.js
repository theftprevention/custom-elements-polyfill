'use strict';

var deprecatedTagNames = 'acronym,applet,basefont,bgsound,big,blink,center,command,content,dir,element,font,frame,frameset,image,isindex,keygen,listing,marquee,multicol,nextid,nobr,noembed,plaintext,shadow,spacer,strike,tt,xmp'.split(','),

    expect = require('expect.js'),
    tagNames = require('../../data/tag-names').filter(function (tagName) {
        return deprecatedTagNames.indexOf(tagName) === -1;
    }),

    globalEval = window.eval,
    ObjectProto = Object.prototype,

    supportedElements = (function () {
        var unknown = HTMLUnknownElement.prototype,
            elements = {};
        tagNames.forEach(function (tagName) {
            var proto;
            if (tagName === 'body' || tagName === 'head' || tagName === 'html') {
                return;
            }
            proto = Object.getPrototypeOf(document.createElement(tagName));
            if (proto !== unknown) {
                elements[tagName] = proto.constructor;
            }
        });
        return elements;
    })(),
    supportsClasses = (function () {
        try {
            globalEval('(function(){return class A{};})()');
            return true;
        } catch (ex) {
            return false;
        }
    })(),

    Array_concat = Array.prototype.concat,
    Array_slice = Array.prototype.slice,
    assign = Object.assign,
    callbackNames = ['adoptedCallback', 'attributeChangedCallback', 'connectedCallback', 'disconnectedCallback'],
    completedTests = 0,
    container = document.getElementById('test-container'),
    createElement = Document.prototype.createElement,
    defineProperties = Object.defineProperties,
    defineProperty = Object.defineProperty,
    definitions = {},
    documentReady = null,
    domExCodes = {
        IndexSizeError: 1,
        HierarchyRequestError: 3,
        WrongDocumentError: 4,
        InvalidCharacterError: 5,
        NoModificationAllowedError: 7,
        NotFoundError: 8,
        NotSupportedError: 9,
        InvalidStateError: 11,
        SyntaxError: 12,
        InvalidModificationError: 13,
        NamespaceError: 14,
        InvalidAccessError: 15,
        TypeMismatchError: 17,
        SecurityError: 18,
        NetworkError: 19,
        AbortError: 20,
        URLMismatchError: 21,
        QuotaExceededError: 22,
        TimeoutError: 23,
        InvalidNodeTypeError: 24,
        DataCloneError: 25
    },
    elementSources = {
        /**
         * Indicates that the element is created by the JavaScript constructor returned by customElements.get().
         */
        constructor: {
            description: 'the custom element constructor'
        },
        /**
         * Indicates that the element is created by the document.createElement() method.
         */
        createElement: {
            description: 'document.createElement()'
        },
        /**
         * Indicates that the element is written into the source code, and is created by the document parsing algorithm.
         */
        documentParser: {
            description: 'the document parser'
        },
        /**
         * Indicates that the element is created by the HTML fragment parsing algorithm.
         */
        fragmentParser: {
            description: 'the fragment parser'
        }
    },
    Element_setAttribute = Element.prototype.setAttribute,
    failedTests = 0,
    getDescribe = function () { return Mocha.describe; },
    getSpecify = function () { return Mocha.it; },
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors,
    getOwnPropertyNames = Object.getOwnPropertyNames,
    getOwnPropertySymbols = Object.getOwnPropertySymbols || function () { return []; },
    hOP = Object.prototype.hasOwnProperty,
    insertAdjacentHTML = (hOP.call(HTMLElement.prototype, 'insertAdjacentHTML') ? HTMLElement : Element).prototype.insertAdjacentHTML,
    invalidTagNames = [
        'div',
        'hello',
        'Capitalized-Name',
        'name-with-exclamation-point!',
        'name-with:colon'
    ],
    isArray = Array.isArray,
    mochaContainer = document.getElementById('mocha'),
    mochaDescribe = Mocha.describe,
    nameIncrement = 0,
    nativeCustomElements = (supportsClasses && typeof window.CustomElementRegistry === 'function' && window.customElements instanceof window.CustomElementRegistry),
    Node_appendChild = Node.prototype.appendChild,
    Node_removeChild = Node.prototype.removeChild,
    noop = function () {},
    templates = {
        caption: '<table>$</table>',
        col: '<table><colgroup>$</colgroup></table>',
        colgroup: '<table>$</table>',
        tbody: '<table>$</table>',
        td: '<table><tbody><tr>$</tr></tbody></table>',
        tfoot: '<table>$</table>',
        th: '<table><thead><tr>$</tr></thead></table>',
        thead: '<table>$</table>',
        tr: '<table><tbody>$</tbody></table>'
    },
    paramStack = [],
    passedTests = 0,
    reg_obj = /^\[object (.*)\]$/,
    reg_prototypeSuffix = /Prototype$/,
    reg_template = /\$/g,
    reports = [],
    reservedTagNames = [
        'annotation-xml',
        'color-profile',
        'font-face',
        'font-face-format',
        'font-face-name',
        'font-face-src',
        'font-face-uri',
        'missing-glyph'
    ],
    scenarioProps = new WeakMap(),
    validTagNames = [
        'hello-world',
        '\ud83d\udca9-\ud83d\udca9'
    ],
    voidTagNames = 'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'.split(','),

    defaultScenarioParameters = {
        autoCreateElement: true,
        localName: [null].concat(Object.getOwnPropertyNames(supportedElements)),
        asFunction: supportsClasses ? [false, true] : true,
        source: elementSources.constructor
    };

if (!getOwnPropertyDescriptors) {
    getOwnPropertyDescriptors = function getOwnPropertyDescriptors(O) {
        var keys = Array_concat.call(getOwnPropertyNames(O), getOwnPropertySymbols(O)),
            i = 0,
            l = keys.length,
            result = {},
            key, descriptor;
        while (i < l) {
            key = keys[i++];
            descriptor = getOwnPropertyDescriptor(O, key);
            if (descriptor) {
                result[key] = descriptor;
            }
        }
        return result;
    };
}
if (!Object.assign) {
    defineProperty(Object, 'assign', {
        configurable: true,
        enumerable: false,
        value: function assign(target, varArgs) {
            var to, i, l, source;
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            to = Object(target);
            i = 0;
            l = arguments.length;

            while (i < l) {
                source = arguments[i++];
                if (source != null) {
                    for (var key in source) {
                        if (hOP.call(source, key)) {
                            to[key] = source[key];
                        }
                    }
                }
            }
            return to;
        },
        writable: true
    });
    assign = Object.assign;
}

/**
 * Options used for quickly defining a custom element.
 * @typedef {Object} DefineElementOptions
 * @property {boolean} asFunction - If this is true, then the custom element will be defined using plain "functional" class syntax. If this is false, then the custom element class will be defined using ES6 class syntax if the current environment supports it, or using "functional" class syntax otherwise. Defaults to false.
 * @property {function} baseConstructor - The base class extended by the custom element. If undefined, then HTMLElement is used. If null, then null is used.
 * @property {object} basePrototype - The base prototype extended by the custom element. If undefined, then HTMLElement.prototype is used. If null, then null is used.
 * @property {function} constructor - The custom element constructor function. If not provided, then an empty constructor will be created.
 * @property {string} localName - The localName of the custom element. If provided, it will be used to determine the base class extended by the custom element (unless a 'base' option is explicitly provided).
 * @property {string} name - The name of the custom element. If not provided, then a unique custom element name will be generated automatically.
 * @property {object} prototype - An optional plain object whose own properties will be copied onto the prototype object of the newly defined custom element.
 */

/**
 * Describes the result of defining a custom element.
 * @typedef {DefineElementOptions} DefineElementResult
 * @property {function} definedConstructor - The original constructor passed as the second argument to customElements.define().
 * @property {object} definedPrototype - The prototype of the definedConstructor.
 * @property {function} finalConstructor - The final constructor returned from customElements.get() after the custom element is defined.
 * @property {object} finalPrototype - The prototype of the finalConstructor.
 * @property {boolean} isBuiltIn - Whether or not the definition represents a customized built-in element.
 * @property {*} returnValue - The return value from the call to customElements.define().
 */

/**
 * @param {object} from
 * @param {object} to
 * @returns {object}
 */
function copyProperties(from, to) {
    var toDescriptors = {},
        fromDescriptors = getOwnPropertyDescriptors(from),
        hasOwn, toDescriptor;
    for (var name in fromDescriptors) {
        if (name !== 'arguments' && name !== 'caller' && name !== 'length' && name !== 'prototype' && hasOwnProperty(fromDescriptors, name)) {
            hasOwn = hasOwnProperty(to, name);
            toDescriptor = hasOwn ? getOwnPropertyDescriptor(to, name) : null;
            if (!toDescriptor || toDescriptor.configurable) {
                toDescriptors[name] = fromDescriptors[name];
            } else if (toDescriptor && toDescriptor.writable) {
                to[name] = from[name];
            }
        }
    }
    return defineProperties(to, toDescriptors);
}

/**
 * @param {object} O
 * @param {string} p
 * @returns {string}
 */
function hasOwnProperty(O, p) {
    return hOP.call(O, p);
}

/**
 * @param {function} constructor
 * @returns {boolean}
 */
function constructorIsClass(constructor) {
    var descriptor;
    if (!supportsClasses || typeof constructor !== 'function') {
        return false;
    }
    descriptor = Object.getOwnPropertyDescriptor(constructor, 'prototype');
    return descriptor ? !descriptor.writable : false;
}

/**
 * Defines a custom element using the provided options.
 * @param {DefineElementOptions} [options]
 * @returns {DefineElementResult}
 */
function defineElement(options) {
    var isClass = false,
        rewrite = true,
        base = false,
        localName, name, baseConstructor, basePrototype, customConstructor,
        source, definedConstructor, returnValue, finalConstructor;

    options = Object(options == null ? {} : options);

    isClass = supportsClasses ? !options.asFunction : false;
    name = options.name || uniqueCustomElementName();

    if (options.constructor !== Object && typeof options.constructor === 'function') {
        customConstructor = options.constructor;
        if (constructorIsClass(customConstructor)) {
            isClass = true;
            rewrite = false;
        } else {
            basePrototype = customConstructor.prototype == null ? null : Object.getPrototypeOf(customConstructor.prototype);
            if (basePrototype === null || basePrototype === ObjectProto) {
                baseConstructor = void 0;
                basePrototype = void 0;
            } else {
                baseConstructor = basePrototype.constructor;
                rewrite = false;
            }
        }
    }

    if (options.baseConstructor && baseConstructor === void 0 && (options.baseConstructor == null || typeof options.baseConstructor === 'function')) {
        baseConstructor = options.baseConstructor || null;
    }
    if (options.basePrototype && basePrototype === void 0 && (options.basePrototype == null || options.basePrototype instanceof Object)) {
        basePrototype = options.basePrototype || null;
    }

    localName = options.localName || name;

    if (baseConstructor !== void 0 && basePrototype === void 0) {
        basePrototype = baseConstructor.prototype;
    } else if (baseConstructor === void 0 && basePrototype !== void 0) {
        baseConstructor = basePrototype.constructor;
    } else if (baseConstructor === void 0 && basePrototype === void 0) {
        baseConstructor = HTMLElement;
        basePrototype = HTMLElement.prototype;
    }

    base = !!(baseConstructor && basePrototype);

    if (rewrite) {
        if (isClass) {
            source = '(function(){return function(a,b,c){return class';
            if (base) {
                source += ' extends c';
            }
            source += '{constructor(){';
            if (base) {
                source += 'super();';
            }
            if (customConstructor) {
                source += 'a.apply(this,b(arguments));';
            }
            source += '}};};})()';
            definedConstructor = globalEval(source)(customConstructor,Array.from,baseConstructor);
        } else {
            definedConstructor = customConstructor || function () { };
            if (basePrototype) {
                definedConstructor.prototype = Object.create(basePrototype);
                definedConstructor.prototype.constructor = definedConstructor;
            }
        }
    } else {
        definedConstructor = customConstructor;
    }

    if (options.prototype && options.prototype instanceof Object) {
        copyProperties(options.prototype, definedConstructor.prototype);
    }

    if (name === localName) {
        returnValue = customElements.define(name, definedConstructor);
    } else {
        returnValue = customElements.define(name, definedConstructor, { 'extends': localName });
    }

    finalConstructor = customElements.get(name);

    return assign({}, options, {
        definedConstructor: definedConstructor,
        definedPrototype: definedConstructor.prototype,
        finalConstructor: finalConstructor,
        finalPrototype: finalConstructor.prototype,
        isBuiltIn: (name !== localName),
        localName: localName,
        name: name,
        returnValue: returnValue
    });
}

/**
 * @param {string} localName
 * @param {boolean} [capitalize]
 * @returns {string}
 */
function describeLocalName(localName, capitalize) {
    return (capitalize ? 'A' : 'a') + (localName ? ' customized <' + localName + '>' : 'n autonomous custom') + ' element';
}

/**
 * @param {ErrorEvent} event
 */
function handleErrorEvent(event) {
    if (!event.defaultPrevented) {
        event.preventDefault();
    }
}

/**
 * Disables the global error handler established by Mocha while running the provided callback.
 * 
 * @param {function} callback - The callback to execute while Mocha's global error handler is disabled.
 * @returns {*} - The return value from the executed callback.
 */
function ignoreErrors(callback) {
    var oldHandler = window.onerror,
        result;
    window.onerror = null;
    window.addEventListener('error', handleErrorEvent, false);
    try {
        result = callback();
    } finally {
        window.removeEventListener('error', handleErrorEvent, false);
        window.onerror = oldHandler;
    }
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
}

/**
 * @param {*} obj
 * @returns {string}
 */
function nameOf(obj) {
    var t, m;
    if (obj == null) {
        return String(obj);
    }
    t = typeof obj;
    if (t !== 'object') {
        return t;
    }
    m = reg_obj.exec(Object.prototype.toString.call(obj));
    return m ? m[1].replace(reg_prototypeSuffix, '') : t;
}

/**
 * @param {function} callback 
 */
function onDocumentReady(callback) {
    if (documentReady) {
        callback.call(void 0, documentReady);
    } else {
        document.addEventListener('DOMContentLoaded', callback, false);
    }
}

/**
 * @param {Mocha.Test} test
 * @param {Error} [err]
 */
function onTestComplete(test, err) {
    var passed = !err,
        report;
    completedTests++;
    if (passed) {
        passedTests++;
    } else {
        failedTests++;
        report = {
            message: err.message || String(err),
            name: flattenTitles(test),
            result: false
        };
        if (err.stack) {
            report.stack = err.stack;
        }
        console.error(test);
        reports.push(report);
    }
}

/**
 * @typedef {Object} PermutatedProperty
 * @property {number} index
 * @property {number} maxIndex
 * @property {Array} values
 */

/**
 * @param {PermutatedProperty} prop
 * @returns {*}
 */
function getCurrentValue(prop) {
    return prop.values[prop.index];
}

/**
 * Creates an array containing all possible permutations of the properties of the provided object.
 * 
 * @param {object} obj - The object used to generate the permutations. Only the object's enumerable Array properties are permutated. Its remaining own properties will be present in each 
 * 
 * @returns {Array.<Object>} - An array where each element is a permutation of the properties from the original object.
 */
function permutate(obj) {
    var key, keys, objIsArray, permutation, prop, props, result, template, value,
        i, k, l, p, r;
    if (obj == null) {
        return [{}];
    }

    objIsArray = isArray(obj);
    keys = [];
    k = 0;
    props = [];
    p = 0;
    template = objIsArray ? [] : {};
    for (key in obj) {
        keys[k++] = key;
        value = obj[key];
        l = isArray(value) ? value.length : 0;
        if (l > 0) {
            prop = {
                index: 0,
                maxIndex: l - 1,
                values: Array_slice.call(value)
            };
            defineProperty(template, key, {
                get: getCurrentValue.bind(null, prop)
            });
            props[p++] = prop;
        } else {
            template[key] = value;
        }
    }

    if (p === 0) {
        return objIsArray ? Array_slice.call(obj) : [assign({}, obj)];
    }

    result = [];
    r = 0;
    while (prop) {
        i = 0;
        permutation = {};
        while (i < k) {
            key = keys[i++];
            permutation[key] = template[key];
        }
        result[r++] = permutation;

        i = 0;
        while (i < p) {
            prop = props[i];
            if (prop.index < prop.maxIndex) {
                prop.index++;
                while (i--) {
                    props[i].index = 0;
                }
                break;
            }
            prop = null;
            i++;
        }
    }
    return result;
}

/**
 * Creates a new callback.
 * 
 * @class Callback
 * @classdesc Represents a custom element lifecycle callback.
 * 
 * @param {string} name - The name of the callback.
 * @param {Array} args - The arguments passed to or expected by the callback.
 * 
 * @property {string} name - The name of the callback.
 * @property {Array} [args] - The arguments passed to (or expected by) the callback.
 */
function Callback(name, args) {
    this.name = name;
    this.args = args || [];
}

/**
 * Determines whether or not two Callbacks are equal.
 * 
 * @param {Callback} other - The other Callback to compare to the current instance.
 * 
 * @returns {boolean} - True if the other Callback is equal to the current instance; otherwise, false.
 */
Callback.prototype.equals = function equals(other) {
    var i;
    if (this.name !== other.name || this.args.length !== other.args.length) {
        return false;
    }
    i = this.args.length;
    while (i--) {
        if (this.args[i] !== other.args[i]) {
            return false;
        }
    }
    return true;
};

/**
 * @param {string} name
 * @param {Array} args
 */
function reportCallback(name, args) {
    var callback = new Callback(name, args);
    
}

/**
 * Asserts that the given promise is eventually rejected, optionally asserting that the rejection value is of a specified type and has a specified 'name' property.
 * 
 * @param {Promise} promise - The promise.
 * @param {?function} errorType - The expected type of the error.
 * @param {string} errorName - The expected name of the error.
 * @param {function} callback - The callback that is executed when the promise is resolved or rejected. Its arguments are (1) the assertion error, if one was thrown, and (2) the rejection value, if the promise was rejected.
 */
function shouldRejectWith(promise, errorType, errorName, callback) {
    expect(promise).to.be.a(Promise);
    if (typeof errorName === 'function') {
        callback = errorName;
        errorName = null;
    }
    promise.then(function () {
        callback(new Error('Expected Promise to be rejected; was resolved instead'));
    }, function (value) {
        var isDOMException = errorType === DOMException,
            code;
        if (errorType) {
            try {
                expect(value).to.be.a(errorType);
                if (errorName) {
                    expect(value.name).to.be(errorName);
                    if (errorType === DOMException) {
                        code = domExCodes[errorName];
                        if (code) {
                            expect(value.code).to.be(code);
                        }
                    }
                }
            } catch (ex) {
                callback(ex, value);
            }
        }
        callback(null, value);
    });
}

/**
 * Asserts that the given promise is eventually resolved, optionally asserting that the resolved value is of a specified type.
 * 
 * @param {Promise} promise - The promise.
 * @param {function|string} resolvedType - The expected type of the resolved value.
 * @param {function} callback - The callback that is executed when the promise is resolved or rejected. Its arguments are (1) the assertion error, if one was thrown, and (2) the resolved value, if the promise was resolved.
 */
function shouldResolveWith(promise, resolvedType, callback) {
    expect(promise).to.be.a(Promise);
    promise.then(function (value) {
        if (resolvedType) {
            try {
                expect(value).to.be.a(resolvedType);
            } catch (ex) {
                callback(ex, value);
                return;
            }
        }
        callback(null, value);
    }, function (error) {
        callback(new Error('Expected Promise to be resolved; was rejected instead' + (error ? ' (' + String(error) + ')' : '')));
    });
}

/**
 * Asserts that executing the provided function should throw an error, optionally asserting the type and name of the thrown error.
 * 
 * @param {function} errorType - The expected type of the thrown error.
 * @param {string} errorName - The expected name of the thrown error.
 * @param {function} action - The function whose execution is expected to throw an error.
 */
function shouldThrow(errorType, errorName, action) {
    var code, callback;
    if (arguments.length === 1) {
        action = errorType;
        errorType = null;
    } else if (typeof errorName === 'function') {
        action = errorName;
        errorName = null;
    } else if (errorName) {
        code = domExCodes[name];
    }
    if (errorType || errorName) {
        return expect(action).to.throwException(function (ex) {
            if (errorType) {
                expect(ex).to.be.a(errorType);
            }
            if (errorName) {
                expect(ex.name).to.be(errorName);
                if (code) {
                    expect(ex.code).to.be(code);
                }
            }
        });
    }
    return expect(action).to.throwException();
}

/**
 * @returns {string}
 */
function uniqueCustomElementName() {
    return 'test-' + (++nameIncrement);
}

/**
 * Represents a test scenario consisting of a custom element definition and a sample element.
 * 
 * @property {boolean} asFunction - If this is true, then the custom element will be defined using plain "functional" class syntax. If this is false, then the custom element class will be defined using ES6 class syntax if the current environment supports it, or using "functional" class syntax otherwise. Defaults to false.
 * @property {boolean} autoCreateElement - Whether or not the scenario's test element is created automatically before the test starts.
 * @property {function} baseConstructor - The base class extended by the custom element. If undefined, then HTMLElement is used. If null, then null is used.
 * @property {object} basePrototype - The base prototype extended by the custom element. If undefined, then HTMLElement.prototype is used. If null, then null is used.
 * @property {function} constructor - The custom element constructor function. If not provided, then an empty constructor will be created.
 * @property {boolean} createBeforeDefined - Whether the element is created before its custom element definition is processed.
 * @property {boolean} createBeforeDocumentReady - Whether the element is created before the DOMContentLoaded event.
 * @property {boolean} defineBeforeDocumentReady - Whether the custom element definition is processed before the DOMContentLoaded event.
 * @property {boolean} defined - Whether the custom element definition has been processed.
 * @property {DefineElementResult} definition - The result of processing the custom element definition.
 * @property {function} definedConstructor - The original constructor passed as the second argument to customElements.define.
 * @property {object} definedPrototype - The prototype of the definedConstructor.
 * @property {string} description - A text description of the scenario.
 * @property {HTMLElement} element - The test element.
 * @property {function} finalConstructor - The final constructor returned from customElements.get after the custom element is defined.
 * @property {object} finalPrototype - The prototype of the finalConstructor.
 * @property {boolean} isBuiltIn - Whether or not the definition represents a customized built-in element.
 * @property {boolean} isVoid - Whether or not the element is void.
 * @property {string} localName - The localName of the custom element. If provided, it will be used to determine the base class extended by the custom element unless a 'base' option is explicitly provided.
 * @property {string} name - The name of the custom element. If not provided, then a unique custom element name will be generated automatically.
 * @property {string} outerHTML - The outer HTML of the test element.
 * @property {object} prototype - An optional plain object whose own properties will be copied onto the prototype object of the newly defined custom element
 * @property {*} returnValue - The return value from the call to customElements.define.
 * @property {string} selector - A CSS selector that matches the test element.
 * @property {{description: string}} source - The source of the element's creation.
 * @property {boolean} synchronous - Whether or not the synchronous custom elements flag is expected to be set while the custom element constructor is running.
 * @property {Promise} whenReady - A Promise that is resolved when the test scenario is ready.
 */
function ElementScenario(options) {
    var promise,
        props = {
            constructorError: null,
            definition: null,
            element: null,
            promise: null
        };

    assign(this, options);
    scenarioProps.set(this, props);

    if (!this.name) {
        this.name = uniqueCustomElementName();
    }
    if (!this.localName) {
        this.localName = this.name;
    }

    if (!this.basePrototype) {
        if (this.baseConstructor && this.baseConstructor.prototype) {
            this.basePrototype = this.baseConstructor.prototype;
        } else if (this.isBuiltIn) {
            this.basePrototype = supportedElements[this.localName].prototype;
        } else {
            this.basePrototype = HTMLElement.prototype;
        }
    }
    
    promise = new Promise(initializeScenario.bind(null, this, props));
    props.promise = promise;
}
Object.defineProperties(ElementScenario.prototype, {
    cleanup: {
        value: function cleanup() {
            var props = scenarioProps.get(this),
                element, child;
            if (!props) {
                return;
            }
            element = props.element;
            if (element) {
                child = element;
                while (child.parentNode) {
                    if (child.parentNode === container) {
                        Node_removeChild.call(container, child);
                        break;
                    }
                    child = child.parentNode;
                }
                props.element = null;
            }
        },
        writable: true
    },
    clone: {
        value: function clone(options) {
            if (options) {
                options = assign({}, this, options);
            } else {
                options = this;
            }
            return new ElementScenario(options);
        },
        writable: true
    },
    constructor: {
        value: void 0,
        writable: true
    },
    createElement: {
        /**
         * @returns {HTMLElement}
         */
        value: function createElement() {
            return this.element;
        },
        writable: true
    },
    definition: {
        get: function () {
            return scenarioProps.get(this).definition;
        },
        set: noop
    },
    description: {
        get: function () {
            var createdBy = 'created by ' + this.source.description,
                definedAs = 'defined as a' + (this.asFunction ? ' function' : 'n ES6 class'),
                description = '';
            if (this.createBeforeDefined != null && this.createBeforeDocumentReady != null && this.defineBeforeDocumentReady != null) {
                if (this.createBeforeDocumentReady === this.defineBeforeDocumentReady) {
                    description += (this.createBeforeDefined ? createdBy + ' and then ' + definedAs : definedAs + ' and then ' + createdBy) + ' ';
                    description += (this.createBeforeDocumentReady ? 'before' : 'after') + ' the document is ready';
                } else {
                    description += (this.createBeforeDefined ? createdBy : definedAs) + ' ';
                    description += ((this.createBeforeDefined ? this.createBeforeDocumentReady : this.defineBeforeDocumentReady) ? 'before' : 'after') + ' ';
                    description += 'the document is ready and ';
                    description += (this.createBeforeDefined ? definedAs : createdBy) + ' ';
                    description += ((this.createBeforeDefined ? this.defineBeforeDocumentReady : this.createBeforeDocumentReady) ? 'before' : 'after') + ' ';
                    description += 'the document is ready';
                }
            } else {
                description += definedAs + ' and ' + createdBy;
            }
            return description;
        },
        set: noop
    },
    element: {
        get: function () {
            var props = scenarioProps.get(this);
            if (!props.promise) {
                return null;
            }
            if (props.constructorError) {
                throw props.constructorError;
            }
            if (!props.element) {
                createScenarioElement(this, props);
                if (props.constructorError) {
                    throw props.constructorError;
                }
            }
            return props.element;
        },
        set: noop
    },
    isBuiltIn: {
        get: function () {
            return this.name !== this.localName;
        },
        set: noop
    },
    isVoid: {
        get: function () {
            return voidTagNames.indexOf(this.localName) > -1;
        },
        set: noop
    },
    outerHTML: {
        get: function () {
            var html, template;
            if (this.isBuiltIn) {
                html = '<' + this.localName + ' is="' + this.name + '"' + (this.isVoid ? ' />' : '></' + this.localName + '>');
                template = templates[this.localName];
                if (template) {
                    html = template.replace(reg_template, html);
                }
            } else {
                html = '<' + this.name + '></' + this.name + '>';
            }
            return html;
        },
        set: noop
    },
    selector: {
        get: function () {
            return this.localName + (this.isBuiltIn ? '[is="' + this.name + '"]' : '');
        },
        set: noop
    },
    synchronous: {
        get: function () {
            if (this.source === elementSources.createElement) {
                return true;
            }
            if (this.source === elementSources.documentParser) {
                return this.defineBeforeDocumentReady;
            }
            return false;
        },
        set: noop
    },
    test: {
        value: function (title, fn) {
            var scenario = this;
            return specify(title, function () {
                this.scenario = scenario;
                return scenario.whenReady.then(fn.bind(scenario));
            });
        },
        writable: true
    },
    whenReady: {
        get: function () {
            return scenarioProps.get(this).promise;
        },
        set: noop
    }
});

/**
 * @param {Object} [params]
 * @returns {ElementScenario}
 */
function createScenario(params) {
    return new ElementScenario(params);
}

/**
 * @param {object} [params]
 * @returns {Array.<ElementScenario>}
 */
function createScenarios(params) {
    if (params) {
        params = assign({}, defaultScenarioParameters, Object(params));
    } else {
        params = defaultScenarioParameters;
    }
    return permutate(params)
        .filter(isScenarioPossible)
        .map(createScenario);
}

/**
 * @param {ElementScenario} scenario
 * @returns {boolean}
 */
function isScenarioPossible(scenario) {
    if (scenario.source === elementSources.constructor && scenario.createBeforeDefined) {
        // These permutations are skipped because the custom element constructor doesn't
        // exist until after the custom element is defined.
        return false;
    }
    if (scenario.source === elementSources.documentParser) {
        if (!!scenario.createBeforeDocumentReady || (scenario.createBeforeDefined && !scenario.defineBeforeDocumentReady)) {
            // These permutations are skipped because it would result in an element being
            // created after the document becomes interactive, in which case the source of
            // its creation is not actually the document parser.
            return false;
        }
    }
    if (scenario.source === elementSources.fragmentParser && scenario.createBeforeDocumentReady) {
        // These permutations are skipped because creating an element after the document
        // is interactive would make use of the fragment parser, not the document parser.
        return false;
    }
    if (scenario.createBeforeDocumentReady !== scenario.defineBeforeDocumentReady && scenario.createBeforeDefined !== scenario.createBeforeDocumentReady) {
        // These permutations are skipped because they are logically impossible; for example,
        // if the element is defined after the document is ready, then it cannot be created
        // before both the document is ready and before it is defined.
        return false;
    }
    return true;
}

/**
 * @param {ElementScenario} scenario
 * @param {{constructorError: Error, definition: DefineElementResult, element: HTMLElement, promise: Promise}} props
 * @returns {HTMLElement}
 */
function createScenarioElement(scenario, props) {
    var source = scenario.source,
        constructor, element, oldErrorHandler;
    if (!props) {
        props = scenarioProps.get(scenario);
    }
    oldErrorHandler = window.onerror;
    window.onerror = null;
    window.addEventListener('error', handleErrorEvent, false);
    try {
        if (source === elementSources.constructor) {
            constructor = customElements.get(scenario.name);
            element = new constructor();
        } else if (source === elementSources.createElement) {
            if (scenario.isBuiltIn) {
                element = document.createElement(scenario.localName, { is: scenario.name });
            } else {
                element = document.createElement(scenario.name);
            }
        } else if (source === elementSources.documentParser) {
            insertAdjacentHTML.call(container, 'beforeend', scenario.outerHTML);
            element = container.querySelector(scenario.selector);
        } else if (source === elementSources.fragmentParser) {
            container.insertAdjacentHTML('beforeend', scenario.outerHTML);
            element = container.querySelector(scenario.selector);
        }
    } catch (e) {
        element = null;
        props.constructorError = e;
    }
    window.onerror = oldErrorHandler;
    window.removeEventListener('error', handleErrorEvent, false);
    props.element = element;
    return element;
}

/**
 * @param {ElementScenario} scenario
 * @param {{constructorError: Error, definition: DefineElementResult, element: HTMLElement, promise: Promise}} props
 */
function defineScenarioElement(scenario, props) {
    if (!props) {
        props = scenarioProps.get(scenario);
    }
    if (props.definition) {
        throw new Error("defineScenarioElement() was called after the definition was already processed.");
    }
    props.definition = defineElement(scenario);
}

/**
 * @param {ElementScenario} scenario
 * @param {{constructorError: Error, definition: DefineElementResult, element: HTMLElement, promise: Promise}} props
 * @param {function} resolve
 * @param {function} reject
 */
function initializeScenario(scenario, props, resolve, reject) {
    var documentReady = (document.readyState !== 'loading'),
        waiting = false,
        shouldCreateElement, createdTooLate, definedTooLate;

    if (!props) {
        props = scenarioProps.get(scenario);
    }

    shouldCreateElement = Boolean(scenario.autoCreateElement && !props.element && (documentReady || scenario.createBeforeDocumentReady));
    // Sanity check
    if (documentReady) {
        createdTooLate = (scenario.createBeforeDocumentReady && scenario.autoCreateElement && !props.element && !props.constructorError);
        definedTooLate = (scenario.defineBeforeDocumentReady && !props.definition);
        if (createdTooLate || definedTooLate) {
            console.log(scenario);
            console.log(props);
            return reject(new Error('Failed to ' + (createdTooLate ? 'create' : '') + (definedTooLate ? (createdTooLate ? ' and ' : '') + 'define' : '') + ' before the DOMContentLoaded event.'));
        }
    }

    if (scenario.createBeforeDefined && shouldCreateElement) {
        createScenarioElement(scenario, props);
    }
    if (!props.definition) {
        if (documentReady || scenario.defineBeforeDocumentReady) {
            defineScenarioElement(scenario, props);
        } else {
            waiting = true;
            onDocumentReady(initializeScenario.bind(void 0, scenario, props, resolve, reject));
        }
    }
    if (!scenario.createBeforeDefined && shouldCreateElement) {
        createScenarioElement(scenario);
    }
    if (!waiting) {
        resolve();
    }
}

onDocumentReady(function (event) {
    documentReady = event;
});

module.exports = {
    constructorIsClass: constructorIsClass,
    container: container,
    createElement: createElement,
    createScenarios: createScenarios,
    defaultScenarioParameters: defaultScenarioParameters,
    defineElement: defineElement,
    describeLocalName: describeLocalName,
    domExCodes: domExCodes,
    ElementScenario: ElementScenario,
    elementSources: elementSources,
    flattenTitles: flattenTitles,
    ignoreErrors: ignoreErrors,
    invalidTagNames: invalidTagNames,
    insertAdjacentHTML: insertAdjacentHTML,
    mochaContainer: mochaContainer,
    nameOf: nameOf,
    nativeCustomElements: nativeCustomElements,
    onDocumentReady: onDocumentReady,
    onTestComplete: onTestComplete,
    permutate: permutate,
    reports: reports,
    reservedTagNames: reservedTagNames,
    runner: null,
    shouldRejectWith: shouldRejectWith,
    shouldResolveWith: shouldResolveWith,
    shouldThrow: shouldThrow,
    supportedElements: supportedElements,
    supportsClasses: supportsClasses,
    uniqueCustomElementName: uniqueCustomElementName,
    validTagNames: validTagNames,
};
defineProperties(module.exports, {
    completedTests: {
        get: function () {
            return completedTests;
        }
    },
    failedTests: {
        get: function () {
            return failedTests;
        }
    },
    isDocumentReady: {
        get: function () {
            return !!documentReady;
        }
    },
    passedTests: {
        get: function () {
            return passedTests;
        }
    }
});
