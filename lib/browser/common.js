'use strict';

var defineProperties = Object.defineProperties,
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors,
    hOP = Object.prototype.hasOwnProperty,
    iPO = Object.prototype.isPrototypeOf,

    abs = Math.abs,
    alreadyConstructedMarker = {},
    document = window.document,
    Document_get_readyState = getOwnPropertyDescriptor(window.Document.prototype, 'readyState').get,
    floor = Math.floor,
    isFinite = window.isFinite,
    isNaN = window.isNaN,
    mainDocumentReady = false,
    max = Math.max,
    maxSafeInteger = Math.pow(2, 53) - 1,
    min = Math.min,
    /**
     * Indicates whether the synchronous custom elements flag should be set for
     * the next custom element to be created.
     * @type {boolean}
     */
    nextElementIsSynchronous = false,
    Number = window.Number,
    shimStack = 0;

/**
 * @private
 * @param {object} value
 * @returns {number}
 */
function toLength(value) {
    var len = Number(value);
    if (isNaN(len)) {
        return 0;
    }
    if (len === 0 || !isFinite(len)) {
        return len;
    }
    len = (len > 0 ? 1 : -1) * floor(abs(len));
    return min(max(len, 0), maxSafeInteger);
}

/**
 * Determines whether an array contains a specific value.
 * 
 * @param {Array} array - The array or array-like object to search.
 * @param {object} value - The value to search for in the array.
 * 
 * @returns {boolean}
 */
function arrayContains(array, value) {
    var i;
    if (array == null) {
        return false;
    }
    i = toLength(array.length);
    while (i--) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
}

/**
 * @param {object} from
 * @param {object} to
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
            } else if (toDescriptor.writable) {
                to[name] = from[name];
            }
        }
    }
    defineProperties(to, toDescriptors);
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
 * @param {Document} doc
 * @returns {boolean}
 */
function isDocumentReady(doc) {
    if (doc === document && !mainDocumentReady) {
        return false;
    }
    return (Document_get_readyState.call(doc) !== 'loading');
}

/**
 * @param {object} proto
 * @param {object} O
 * @returns {boolean}
 */
function isPrototypeOf(proto, O) {
    return iPO.call(proto, O);
}

module.exports = defineProperties({}, {
    alreadyConstructedMarker: {
        value: alreadyConstructedMarker
    },
    arrayContains: {
        value: arrayContains
    },
    callbackNames: {
        value: {
            adopted: 'adoptedCallback',
            attributeChanged: 'attributeChangedCallback',
            connected: 'connectedCallback',
            disconnected: 'disconnectedCallback',

            all: ['adoptedCallback', 'attributeChangedCallback', 'connectedCallback', 'disconnectedCallback']
        }
    },
    conformanceStatus: {
        value: {
            NONE: 0,
            STARTED: 1,
            CANCELED: 2,
            FAILED: 3,
            PASSED: 4
        }
    },
    copyProperties: {
        value: copyProperties
    },
    decrementShimStack: {
        value: function () {
            shimStack--;
        }
    },
    hasOwnProperty: {
        value: hasOwnProperty
    },
    htmlNamespace: {
        value: 'http://www.w3.org/1999/xhtml'
    },
    illegalConstructor: {
        value: 'Illegal constructor'
    },
    illegalInvocation: {
        value: 'Illegal invocation'
    },
    incrementShimStack: {
        value: function () {
            shimStack++;
        }
    },
    isDocumentReady: {
        value: isDocumentReady
    },
    isPrototypeOf: {
        value: isPrototypeOf
    },
    mainDocumentReady: {
        get: function () {
            return mainDocumentReady;
        },
        set: function (value) {
            mainDocumentReady = !!value;
        }
    },
    nextElementIsSynchronous: {
        get: function () {
            return nextElementIsSynchronous;
        },
        set: function (value) {
            nextElementIsSynchronous = !!value;
        }
    },
    states: {
        value: {
            /**
             * Indicates an autonomous custom element or customized built-in element
             * which has been successfully constructed or upgraded in accordance with
             * its custom element definition.
             */
            custom: 'custom',
            /**
             * Indicates an autonomous custom element or customized built-in element
             * which could not be constructed or upgraded because its custom element
             * constructor threw an exception.
             */
            failed: 'failed',
            /**
             * Indicates a built-in element or HTMLUnknownElement, i.e. an element that
             * is not (and cannot be) customized.
             */
            uncustomized: 'uncustomized',
            /**
             * Indicates an autonomous custom element or customized built-in element
             * which has not yet been upgraded.
             */
            undefined: 'undefined'
        }
    },
    throwAsync: {
        value: function throwAsync(error) {
            setTimeout(function () { throw this; }.bind(error));
        }
    },
    usingReactionApi: {
        get: function () {
            return shimStack > 0;
        }
    }
});
