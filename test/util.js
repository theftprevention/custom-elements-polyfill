'use strict';

require('expect.js')

var builtInElements = require('../lib/browser/built-in-elements'),
    concat,
    container = document.getElementById('test-container'),
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
    invalidTagNames = [
        'div',
        'hello',
        'Capitalized-Name',
        'name-with-exclamation-point!',
        'name-with:colon'
    ],
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
            eval('class A{}');
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
    concat = Array.prototype.concat;
    getOwnPropertyDescriptors = function getOwnPropertyDescriptors(O) {
        var keys = concat.call(getOwnPropertyNames(O), getOwnPropertySymbols(O)),
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
 * 
 * @property {boolean} defineEarly - True if the custom element definition should be registered
 *   before the document is interactive; otherwise, false.
 * @property {?string} localName - The local name. For customized built-in elements, this should
 *   be the local name of the extended element (i.e. 'div'). For autonomous custom elements, this
 *   should be undefined or null.
 */

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
 * @param {object} [options]
 * @returns {function}
 */
function defineElement(options) {
    var isClass = false,
        rewriteAsClass, localName, name, constructor, interfaceConstructor, interfacePrototype, finalConstructor;

    options = Object(options == null ? {} : options);

    rewriteAsClass = supportsClasses ? !!options.asClass : false;
    name = options.name || uniqueCustomElementName();
    localName = options.localName || name;

    interfaceConstructor = builtInElements[localName] || HTMLElement;
    interfacePrototype = interfaceConstructor.prototype;

    if (options.hasOwnProperty('constructor') && typeof options.constructor === 'function') {
        constructor = options.constructor;
        isClass = constructorIsClass(constructor);
        if (isClass) {
            rewriteAsClass = false;
        }
    } else {
        constructor = function () { };
    }
    if (!isClass) {
        constructor.prototype = Object.create(interfacePrototype);
        constructor.prototype.constructor = constructor;
    }

    if (rewriteAsClass) {
        finalConstructor = eval("(function () { return function (a) { return class extends a { constructor() { super(); } }; }; })()")(constructor);
    } else {
        finalConstructor = constructor;
    }

    if (options.hasOwnProperty('prototype') && options.prototype instanceof Object) {
        Object.defineProperties(finalConstructor.prototype, Object.getOwnPropertyDescriptors(options.prototype));
    }

    if (name === localName) {
        customElements.define(name, finalConstructor);
    } else {
        customElements.define(name, finalConstructor, { 'extends': localName });
    }
    return {
        finalConstructor: customElements.get(name),
        name: name,
        originalConstructor: constructor
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
 * @param {string} name
 * @param {function} action
 */
function shouldThrowDOMException(name, action) {
    var code;
    if (typeof name === 'function') {
        action = name;
        name = null;
    }
    if (name) {
        code = domExCodes[name];
        if (!code) {
            throw new Error("'" + name + "' is not a valid DOMException name.");
        }
    }
    return expect(action).to.throwException(function (ex) {
        expect(ex).to.be.a(DOMException);
        if (name) {
            expect(ex.code).to.be(code);
            expect(ex.name).to.be(name);
        }
    });
}

/**
 * @param {function} action
 */
function shouldThrowTypeError(action) {
    return expect(action).to.throwException(function (ex) {
        expect(ex).to.be.a(TypeError);
    });
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

module.exports = {
    constructorIsClass: constructorIsClass,
    defineElement: defineElement,
    domExCodes: domExCodes,
    flattenTitles: flattenTitles,
    invalidTagNames: invalidTagNames,
    log: log,
    permutate: permutate,
    reservedTagNames: reservedTagNames,
    shouldThrowDOMException: shouldThrowDOMException,
    shouldThrowTypeError: shouldThrowTypeError,
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
