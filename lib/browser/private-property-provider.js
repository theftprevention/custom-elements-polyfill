'use strict';

var common = require('./common'),

    createKey,
    defineProperties = Object.defineProperties,
    defineProperty = Object.defineProperty,
    deletePrivateProperties,
    getDescriptor,
    getDescriptors,
    getPrivateProperties,
    getNames,
    getSymbols,
    hasOwnProperty = common.hasOwnProperty,
    hasPrivateProperties,
    inc,
    Number_toString,
    privateKeys,
    setPrivateProperties,
    Symbol = typeof window.Symbol === 'function' && window.Symbol,
    WeakMap = typeof window.WeakMap === 'function' && window.WeakMap,
    WeakMap_get,
    WeakMap_set;

/**
 * @param {*} target
 * @returns {boolean}
 */
function isObject(target) {
    return target != null && typeof target === 'object';
}

if (Symbol || !WeakMap) {

    getNames = Object.getOwnPropertyNames;
    privateKeys = [];

    if (Symbol) {
        /**
         * @param {string} [name]
         * @returns {Symbol}
         */
        createKey = function createKey(name) {
            var key = Symbol(name || 'private');
            privateKeys[privateKeys.length] = key;
            return key;
        };

        getSymbols = Object.getOwnPropertySymbols;
        Object.getOwnPropertySymbols = function getOwnPropertySymbols() {
            var symbols = getSymbols(arguments[0]),
                p = privateKeys.length,
                s = symbols.length,
                result = [],
                r = 0,
                j, key, symbol;
            while (p--) {
                key = privateKeys[p];
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
    } else {
        inc = (Math.random() * 10000) >>> 0;
        Number_toString = Number.prototype.toString;
        /**
         * @param {string} [name]
         * @returns {string}
         */
        createKey = function createKey(name) {
            var key = 'private:';
            if (name) {
                key += name + ':';
            }
            key += Number_toString.call(inc++, 16);
            privateKeys[privateKeys.length] = key;
            return key;
        };
        Object.getOwnPropertyNames = function getOwnPropertyNames() {
            var names = getNames(arguments[0]),
                p = privateKeys.length,
                s = names.length,
                result = [],
                r = 0,
                j, key, name;
            while (p--) {
                key = privateKeys[p];
                j = 0;
                while (j < s) {
                    name = names[j++];
                    if (name !== key) {
                        result[r++] = name;
                    }
                }
            }
            return result;
        };
    }

    getDescriptor = Object.getOwnPropertyDescriptor;
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor() {
        var p = privateKeys.length,
            key = arguments[1],
            target = arguments[0];
        while (p--) {
            if (key === privateKeys[p]) {
                return void 0;
            }
        }
        return getDescriptor(target, key);
    };
    getDescriptors = Object.getOwnPropertyDescriptors;
    if (getDescriptors) {
        Object.getOwnPropertyDescriptors = function getOwnPropertyDescriptors() {
            var descriptors = getDescriptors(arguments[0]),
                p = privateKeys.length,
                key;
            while (p--) {
                key = privateKeys[p];
                if (descriptors[key]) {
                    delete descriptors[key];
                }
            }
            return descriptors;
        };
    }

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
        return hasPrivateProperties.call(this, owner) ? owner[this] : null;
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
 * Creates a new PrivatePropertyProvider.
 * 
 * @class
 * 
 * @classdesc A dictionary that manages private properties. Key objects ("owners") are
 *   associated with their assigned values in a manner that is safe from memory leaks and
 *   prevents the values from being accessed externally (or from any PrivatePropertyProvider
 *   instance other than the one used to create the association).
 * 
 * @param {string} [name] - An optional name. If the Symbol implementation is used, then this
 *   is the argument sent to the Symbol constructor for the key used by the provider. If the
 *   WeakMap implementation is used, then this parameter is ignored.
 */
function PrivatePropertyProvider(name) {
    var key;
    if (!(this instanceof PrivatePropertyProvider)) {
        return arguments.length > 0 ? new PrivatePropertyProvider(name) : new PrivatePropertyProvider();
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

module.exports = PrivatePropertyProvider;
