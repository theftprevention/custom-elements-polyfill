'use strict';

var concat = Array.prototype.concat,
    createKey,
    defineProperties = Object.defineProperties,
    defineProperty = Object.defineProperty,
    deletePrivateProperties,
    getDescriptor,
    getDescriptors,
    getDescriptorsNew,
    getPrivateProperties,
    getNames,
    getSymbols,
    getSymbolsNew,
    hasOwnProperty = (function () {
        var hOP = Object.prototype.hasOwnProperty;
        return function hasOwnProperty(O, p) {
            return hOP.call(O, p);
        };
    })(),
    hasPrivateProperties,
    privateSymbols,
    setPrivateProperties,
    Symbol = typeof window.Symbol === 'function' && window.Symbol,
    WeakMap = window.WeakMap,
    WeakMap_get,
    WeakMap_set;

/**
 * @param {*} target
 * @returns {boolean}
 */
function isObject(target) {
    var t = target != null && typeof target;
    return t === 'function' || t === 'object';
}

if (Symbol) {

    getDescriptors = Object.getOwnPropertyDescriptors;
    getSymbols = Object.getOwnPropertySymbols;
    privateSymbols = [];

    /**
     * @param {string} [name]
     * @returns {Symbol}
     */
    createKey = function createKey(name) {
        var key = Symbol(name || 'private');
        privateSymbols[privateSymbols.length] = key;
        return key;
    };
    /**
     * @param {object} O
     * @returns {Array.<Symbol>}
     */
    getSymbolsNew = function getOwnPropertySymbols(O) {
        var symbols = getSymbols(O),
            p = privateSymbols.length,
            s = symbols.length,
            result = [],
            r = 0,
            j, key, symbol;
        while (p--) {
            key = privateSymbols[p];
            j = 0;
            while (j < s) {
                symbol = symbols[j++];
                if (symbol !== key) {
                    result[r++] = symbol;
                }
            }
        }
        return result;
    };

    if (getDescriptors) {
        /**
         * @param {obejct} O
         * @returns {object}
         */
        getDescriptorsNew = function getOwnPropertyDescriptors(O) {
            var descriptors = getDescriptors(O),
                p = privateSymbols.length,
                key;
            while (p--) {
                key = privateSymbols[p];
                if (descriptors[key]) {
                    delete descriptors[key];
                }
            }
            return descriptors;
        };
    } else {
        getDescriptor = Object.getOwnPropertyDescriptor;
        getNames = Object.getOwnPropertyNames;
        /**
         * @param {obejct} O
         * @returns {object}
         */
        getDescriptorsNew = function getOwnPropertyDescriptors(O) {
            var keys = concat.call(getNames(O), getSymbolsNew(O)),
                i = 0,
                l = keys.length,
                result = {},
                key, descriptor;
            while (i < l) {
                key = keys[i++];
                descriptor = getDescriptor(O, key);
                if (descriptor) {
                    result[key] = descriptor;
                }
            }
            return result;
        };
    }
    defineProperties(Object, {
        getOwnPropertyDescriptors: {
            configurable: true,
            writable: true,
            value: getDescriptorsNew
        },
        getOwnPropertySymbols: {
            configurable: true,
            writable: true,
            value: getSymbolsNew
        }
    });

    /**
     * @param {object} owner
     * @returns {boolean}
     * 
     * @this {Symbol}
     */
    deletePrivateProperties = function deletePrivateProperties(owner) {
        if (hasPrivateProperties.call(this, owner)) {
            return delete owner[this];
        }
    };
    /**
     * @param {object} owner
     * @returns {*}
     * 
     * @this {Symbol}
     */
    getPrivateProperties = function getPrivateProperties(owner) {
        return hasPrivateProperties.call(this, owner) ? owner[this] : void 0;
    };
    /**
     * @param {object} owner
     * @returns {boolean}
     * 
     * @this {Symbol}
     */
    hasPrivateProperties = function hasPrivateProperties(owner) {
        return isObject(owner) && hasOwnProperty(owner, this);
    };
    /**
     * @param {object} owner
     * @param {*} value
     * 
     * @this {Symbol}
     */
    setPrivateProperties = function setPrivateProperties(owner, value) {
        if (isObject(owner)) {
            defineProperty(owner, this, {
                configurable: true,
                value: value,
                writable: true
            });
        }
    };

} else {

    WeakMap_get = WeakMap.prototype.get;
    WeakMap_set = WeakMap.prototype.set;

    /**
     * @returns {WeakMap}
     */
    createKey = function () {
        return new WeakMap();
    };
    deletePrivateProperties = WeakMap.prototype.delete;
    /**
     * @param {object} owner
     * @returns {*}
     * 
     * @this {WeakMap}
     */
    getPrivateProperties = function getPrivateProperties(owner) {
        return hasPrivateProperties.call(this, owner) ? WeakMap_get.call(this, owner) : null;
    };
    hasPrivateProperties = WeakMap.prototype.has;
    /**
     * @param {object} owner
     * @param {*} value
     * 
     * @this {WeakMap}
     */
    setPrivateProperties = function setPrivateProperties(owner, value) {
        if (isObject(owner)) {
            WeakMap_set.call(this, owner, value);
        }
    };

}

/**
 * Creates a new PrivatePropertyStore.
 * 
 * @class
 * 
 * @classdesc A dictionary that manages private properties. Key objects ("owners") are
 *   associated with their assigned values in a manner that is safe from memory leaks and
 *   prevents the values from being accessed externally (or from any PrivatePropertyStore
 *   instance other than the one used to create the association).
 * 
 * @param {string} [name] - An optional name. If the Symbol implementation is used, then this
 *   is the argument sent to the Symbol constructor for the key used by the store. If the
 *   WeakMap implementation is used, then this parameter is ignored.
 */
function PrivatePropertyStore(name) {
    var key;
    if (!(this instanceof PrivatePropertyStore)) {
        return arguments.length > 0 ? new PrivatePropertyStore(name) : new PrivatePropertyStore();
    }
    key = createKey(arguments.length > 0 ? name : '');
    return defineProperties(this, {
        'delete': {
            value: deletePrivateProperties.bind(key)
        },
        get: {
            value: getPrivateProperties.bind(key)
        },
        has: {
            value: hasPrivateProperties.bind(key)
        },
        set: {
            value: setPrivateProperties.bind(key)
        }
    });
}

module.exports = PrivatePropertyStore;
