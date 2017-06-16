'use strict';

var common = require('./common'),

    arrayFrom = Array.from,
    copyProperties = common.copyProperties,
    create = Object.create,
    defineProperty = Object.defineProperty,
    defineProperties = Object.defineProperties,
    Function_toString = Function.prototype.toString,
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getPrototypeOf = Object.getPrototypeOf,
    globalEval = window.eval,
    hasOwnProperty = common.hasOwnProperty,
    ObjectProto = Object.prototype,
    Object_toString = ObjectProto.toString,
    proxies = new Map(),
    reg_ctorName = /^\s*(?:class|function)\s+([^\s\{\(]+)/,
    reg_objName = /^\[object (.+)\]$/,
    String = window.String,
    supportsClasses = (function () {
        try {
            eval('class A{}');
            return true;
        } catch (ex) {
            return false;
        }
    })(),
    toStringTag = window.Symbol && typeof window.Symbol.toStringTag === 'symbol' ? window.Symbol.toStringTag : null,
    TypeError = window.TypeError;

/**
 * @class
 * 
 * @param {function} constructor
 * @param {function} [finalConstructor]
 * @param {string} [name]
 * @param {boolean} [isElementInterface]
 * 
 * @property {function} baseConstructor - The constructor for the class that is extended
 *   by this proxied constructor. This may also be a ProxiedConstructor's "finalConstructor".
 * @property {boolean} baseIsClass - Whether or not the baseConstructor was declared as part
 *   of a "class" declaration.
 * @property {function} finalConstructor - The final proxied constructor, appropriate for
 *   use with the 'new' keyword.
 * @property {boolean} isClass - Whether or not the finalConstructor is part of a "class"
 *   declaration.
 * @property {boolean} isElementInterface - Whether or not this is a proxied constructor for
 *   a built-in element interface (such as HTMLDivElement).
 * @property {string} name - The name of the proxied constructor.
 * @property {function} originalConstructor - The original constructor.
 */
function ClassProxy(constructor, finalConstructor, name, isElementInterface) {

    var constructorBody, hasBase, baseConstructor, basePrototype, prototype, declarationBody,
        source, finalPrototype, descriptor, boundIllegalConstructorError;

    this.originalConstructor = constructor;
    this.name = name || getClassName(constructor);

    proxies.set(constructor, this);
    proxies.set(constructor.prototype, this);

    if (!isElementInterface && isClass(constructor)) {
        finalConstructor = constructor;
    }

    if (finalConstructor) {
        this.finalConstructor = finalConstructor;
        this.originalConstructor = finalConstructor;
        this.isElementInterface = !!isElementInterface;
        this.isClass = supportsClasses && !isElementInterface;

        if (constructor !== finalConstructor) {
            proxies.set(finalConstructor, this);
            copyProperties(constructor, finalConstructor);
            finalConstructor.prototype = constructor.prototype;
            finalConstructor.prototype.constructor = finalConstructor;
            if (this.name && toStringTag && !hasOwnProperty(finalConstructor.prototype, toStringTag)) {
                defineProperty(finalConstructor.prototype, toStringTag, {
                    configurable: true,
                    value: this.name
                });
            }
        }

        return this;
    }

    this.isClass = supportsClasses;

    basePrototype = getPrototypeOf(constructor.prototype);
    if (basePrototype != null && basePrototype !== ObjectProto) {
        hasBase = true;
        baseConstructor = basePrototype.constructor;
        if (typeof baseConstructor !== 'function' || baseConstructor.prototype !== basePrototype) {
            baseConstructor = function () { };
            baseConstructor.prototype = basePrototype;
        }
        this.baseProxy = getOrCreateProxy(baseConstructor);
        baseConstructor = this.baseProxy.finalConstructor;
    }

    prototype = constructor.prototype;
    constructorBody = '';

    if (!this.isClass) {
        constructorBody += 'var x=';
    } else if (hasBase) {
        constructorBody += 'super();';
    }
    constructorBody += 'A.init(this,arguments);';
    if (!this.isClass) {
        constructorBody += 'return x;';
    }

    declarationBody = (this.isClass ? 'class ' + (hasBase ? ' extends B' : '') : 'function()') + '{';
    declarationBody += (this.isClass ? 'constructor(){' : '') + constructorBody + (this.isClass ? '}' : '') + '}';

    source = '(function(){return function(A,B){return ' + declarationBody + ';};})();';

    finalConstructor = globalEval(source)(this, baseConstructor);
    this.finalConstructor = finalConstructor;
    if (!this.isClass) {
        proxies.set(finalConstructor, this);
        descriptor = getOwnPropertyDescriptor(finalConstructor, 'prototype');
        if (!descriptor || descriptor.writable) {
            finalConstructor.prototype = create(basePrototype);
        }
    }
    finalPrototype = finalConstructor.prototype;
    proxies.set(finalPrototype, this);

    copyProperties(constructor, finalConstructor);
    copyProperties(prototype, finalPrototype);
    if (toStringTag && this.name) {
        descriptor = getOwnPropertyDescriptor(this.finalConstructor.prototype, toStringTag);
        if (!descriptor || descriptor.configurable) {
            defineProperty(finalPrototype, toStringTag, {
                configurable: true,
                value: this.name,
                writable: true
            });
        } else if (descriptor && descriptor.writable) {
            finalPrototype[toStringTag] = this.name;
        }
    }

    descriptor = getOwnPropertyDescriptor(finalPrototype, 'constructor');
    if (!descriptor || descriptor.writable) {
        finalPrototype.constructor = finalConstructor;
    } else if (descriptor.configurable) {
        defineProperty(finalPrototype, 'constructor', {
            configurable: true,
            enumerable: descriptor.enumerable,
            value: this.name,
            writable: false
        });
    }

    boundIllegalConstructorError = illegalConstructorError.bind(null, this.name);

    descriptor = getOwnPropertyDescriptor(finalConstructor, 'apply');
    if (!descriptor || descriptor.configurable) {
        defineProperty(finalConstructor, 'apply', {
            configurable: false,
            enumerable: false,
            value: boundIllegalConstructorError,
            writable: false
        });
    }
    descriptor = getOwnPropertyDescriptor(finalConstructor, 'call');
    if (!descriptor || descriptor.configurable) {
        defineProperty(finalConstructor, 'call', {
            configurable: false,
            enumerable: false,
            value: boundIllegalConstructorError,
            writable: false
        });
    }
}

defineProperties(ClassProxy.prototype, {
    constructor: {
        value: ClassProxy
    },
    baseConstructor: {
        get: function () {
            return this.baseProxy ? this.baseProxy.finalConstructor : null;
        }
    },
    baseIsClass: {
        get: function () {
            return this.baseProxy ? this.baseProxy.isClass : false;
        }
    },
    baseProxy: {
        value: null,
        writable: true
    },
    isClass: {
        value: false,
        writable: true
    },

    init: {
        value: function init(thisArg, args) {
            var result;
            args = arrayFrom(args);
            if (!this.isClass && this.baseProxy && !this.baseIsClass) {
                result = this.baseProxy.init(thisArg, args);
            } else {
                result = thisArg;
            }
            this.originalConstructor.apply(result, args);
            return result;
        }
    }
});

/**
 * @param {object} target
 * @returns {string}
 */
function getClassName(target) {
    var constructor, proto, name, match;
    if (!(target instanceof Object)) {
        return null;
    }

    if (typeof target === 'function') {
        constructor = target;
        proto = target.prototype;
        target = null;
        if (!(proto instanceof Object)) {
            return null;
        }
    } else {
        if (toStringTag && hasOwnProperty(target, toStringTag)) {
            name = String(target[toStringTag] || '');
            if (name) {
                return name;
            }
        }
        proto = getPrototypeOf(target);
        if (!proto || proto === ObjectProto) {
            return 'Object';
        }
        constructor = typeof target.constructor === 'function' ? target.constructor : null;
        if (constructor && target === constructor.prototype) {
            target = null;
        }
    }

    if (toStringTag && proto && hasOwnProperty(proto, toStringTag)) {
        name = String(proto[toStringTag] || '');
        if (name) {
            return name;
        }
    }
    if (constructor) {
        name = String(constructor.name || '');
        if (name) {
            return name;
        }
        match = reg_ctorName.exec(Function_toString.call(constructor));
        name = match && match[1];
        if (name) {
            return name;
        }
    }
    match = reg_objName.exec(Object_toString.call(target));
    return (match && match[1]) || null;
}

/**
 * @param {function} constructor
 * @param {function} [elementInterface]
 * @param {string} [elementInterfaceName]
 * @returns {ClassProxy}
 */
function getOrCreateProxy(constructor, elementInterface, elementInterfaceName) {
    var proxy = proxies.get(constructor.prototype) || proxies.get(constructor);
    if (proxy) {
        return proxy;
    }
    if (elementInterface) {
        return new ClassProxy(elementInterface, constructor, elementInterfaceName, true);
    }
    return new ClassProxy(constructor);
}

/**
 * @param {string} [className]
 */
function illegalConstructorError(className) {
    if (!className) {
        className = 'Object';
    }
    throw new TypeError("Failed to construct '" + className + "': Please use the 'new' operator. This DOM object constructor cannot be called as a function.");
}

/**
 * Returns true if the parameter is a function, and was defined using ES6 class
 * syntax; otherwise, returns false.
 * 
 * @param {function} fn
 * @returns {boolean}
 */
function isClass(fn) {
    var protoDescriptor;
    if (!supportsClasses || typeof fn !== 'function') {
        return false;
    }

    // The test to determine whether a function is a class constructor is surprisingly
    // easy: for regular functions, the 'prototype' property is writable. For class
    // constructors, it is not.

    protoDescriptor = getOwnPropertyDescriptor(fn, 'prototype');
    return protoDescriptor ? !protoDescriptor.writable : false;
}

/**
 * @param {function} constructor
 * @param {function} [elementInterface]
 * @param {string} [elementInterfaceName]
 * @returns {function}
 */
function proxy(constructor, elementInterface, elementInterfaceName) {
    if (typeof constructor !== 'function' || !(constructor.prototype instanceof Object)) {
        return constructor;
    }
    return getOrCreateProxy(constructor, elementInterface, elementInterfaceName).finalConstructor;
}

module.exports = {
    getClassName: getClassName,
    isClass: isClass,
    proxy: proxy,
    supported: supportsClasses
};
