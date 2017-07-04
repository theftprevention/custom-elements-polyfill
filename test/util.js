'use strict';

var expect = require('expect.js'),

    ObjectProto = Object.prototype,

    Array_concat = Array.prototype.concat,
    Array_slice = Array.prototype.slice,
    callbackNames = ['adoptedCallback', 'attributeChangedCallback', 'connectedCallback', 'disconnectedCallback'],
    container = document.getElementById('test-container'),
    defineProperties = Object.defineProperties,
    defineProperty = Object.defineProperty,
    definitions = {},
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
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors,
    getOwnPropertyNames = Object.getOwnPropertyNames,
    getOwnPropertySymbols = Object.getOwnPropertySymbols || function () { return []; },
    getPrototypeOf = Object.getPrototypeOf,
    globalEval = window.eval,
    hOP = Object.prototype.hasOwnProperty,
    invalidTagNames = [
        'div',
        'hello',
        'Capitalized-Name',
        'name-with-exclamation-point!',
        'name-with:colon'
    ],
    isArray = Array.isArray,
    nameIncrement = 0,
    reg_n1 = /[^a-zA-Z]([a-z])/g,
    reg_n2 = /[^\w\$\-]/g,
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
    supportsClasses = (function () {
        try {
            globalEval('(function(){return class A{};})()');
            return true;
        } catch (ex) {
            return false;
        }
    })(),
    startTime = null,
    validTagNames = [
        'hello-world',
        '\ud83d\udca9-\ud83d\udca9'
    ];

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

/**
 * @typedef {object} TestDefinitionOptions
 * @property {boolean} defineEarly - True if the custom element definition should be registered before the document is interactive; otherwise, false.
 * @property {?string} localName - The local name. For customized built-in elements, this should be the local name of the extended element (i.e. 'div'). For autonomous custom elements, this should be undefined or null.
 */

/**
 * Options used for quickly defining a custom element.
 * @typedef {object} DefineElementOptions
 * @property {boolean} asFunction - If this is true, then the custom element will be defined using plain "functional" class syntax. If this is false, then the custom element class will be defined using ES6 class syntax if the current environment supports it, or using "functional" class syntax otherwise. Defaults to false.
 * @property {function} base - The base class extended by the custom element. If not provided, then this will be the base element interface represented by the 'localName' option (i.e. HTMLDivElement for a localName of "div"), or HTMLElement if no localName is provided.
 * @property {function} constructor - The custom element constructor function. If not provided, then an empty constructor will be created.
 * @property {string} name - The name of the custom element. If not provided, then a unique custom element name will be generated automatically.
 * @property {string} localName - The localName of the custom element. If provided, it will be used to determine the base class extended by the custom element (unless a 'base' option is explicitly provided).
 * @property {object} prototype - An optional plain object whose own properties will be copied onto the prototype object of the newly defined custom element.
 */

/**
 * Describes the result of defining a custom element.
 * @typedef {object} DefineElementResult
 * @property {function} definedConstructor - The original constructor passed as the second argument to customElements.define().
 * @property {function} finalConstructor - The final constructor returned from customElements.get() after the custom element is defined.
 * @property {string} name - The custom element name.
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
        localName, name, base, interfaceConstructor, interfacePrototype, customConstructor,
        source, definedConstructor, returnValue;

    options = Object(options == null ? {} : options);
    
    isClass = supportsClasses ? !options.asFunction : false;
    name = options.name || uniqueCustomElementName();

    if (options.hasOwnProperty('constructor') && typeof options.constructor === 'function') {
        customConstructor = options.constructor;
        if (constructorIsClass(customConstructor)) {
            isClass = true;
            rewrite = false;
        } else {
            base = getPrototypeOf(customConstructor.prototype);
            if (base === null || base === ObjectProto) {
                base = void 0;
            } else {
                base = null;
                rewrite = false;
            }
        }
    }

    if (options.hasOwnProperty('base') && base === void 0 && (options.base == null || typeof options.base === 'function')) {
        base = options.base || null;
    }

    if (options.localName) {
        localName = options.localName;
    } else {
        localName = name;
        if (base === void 0) {
            base = HTMLElement;
        }
    }

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
            definedConstructor = globalEval(source)(customConstructor,Array.from,base);
        } else {
            definedConstructor = customConstructor || function () { };
            if (base && base.prototype instanceof Object) {
                definedConstructor.prototype = Object.create(base.prototype);
                definedConstructor.prototype.constructor = definedConstructor;
            }
        }
    } else {
        definedConstructor = customConstructor;
    }

    if (options.hasOwnProperty('prototype') && options.prototype instanceof Object) {
        copyProperties(options.prototype, definedConstructor.prototype);
    }

    if (name === localName) {
        returnValue = customElements.define(name, definedConstructor);
    } else {
        returnValue = customElements.define(name, definedConstructor, { 'extends': localName });
    }

    return {
        definedConstructor: definedConstructor,
        finalConstructor: customElements.get(name),
        name: name,
        returnValue: returnValue
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
}

/**
 * @param {string} [message]
 */
function log(message) {
    var buffer = '',
        timestamp, i;
    if (!startTime) {
        startTime = new Date();
    }
    timestamp = String((+new Date) - startTime);
    i = timestamp.length;
    while (i < 8) {
        buffer += ' ';
        i++;
    }
    console.log('[' + buffer + timestamp + ']' + (arguments.length > 0 ? ' ' + message : ''));
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
    var descriptor, descriptors, key, keys, objIsArray, permutation, prop, props, result, template, value,
        i, k, l, p, r;
    if (obj == null) {
        return [{}];
    }

    objIsArray = isArray(obj);
    descriptors = getOwnPropertyDescriptors(obj);
    keys = Array_concat.call(getOwnPropertyNames(descriptors), getOwnPropertySymbols(descriptors));
    i = 0;
    k = keys.length;
    props = [];
    p = 0;
    template = objIsArray ? [] : {};
    while (i < k) {
        key = keys[i++];
        descriptor = descriptors[key];
        if (descriptor.enumerable) {
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
    }

    if (p === 0) {
        return objIsArray ? Array_slice.call(obj) : [obj];
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
            value: options.basePrototype || HTMLElement.prototype
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

module.exports = {
    constructorIsClass: constructorIsClass,
    container: container,
    defineElement: defineElement,
    domExCodes: domExCodes,
    flattenTitles: flattenTitles,
    invalidTagNames: invalidTagNames,
    log: log,
    permutate: permutate,
    reservedTagNames: reservedTagNames,
    shouldRejectWith: shouldRejectWith,
    shouldResolveWith: shouldResolveWith,
    shouldThrow: shouldThrow,
    supportsClasses: supportsClasses,
    TestElement: TestElement,
    uniqueCustomElementName: uniqueCustomElementName,
    validTagNames: validTagNames
};
Object.defineProperties(module.exports, {
    startTime: {
        get: function () {
            if (!startTime) {
                startTime = new Date();
            }
            return startTime;
        },
        set: function (value) {
            startTime = value;
        }
    }
});
