'use strict';

var common = require('./common'),
    PrivatePropertyStore = require('./private-property-store'),

    Object = window.Object,

    arrayFrom = Array.from,
    copyProperties = common.copyProperties,
    defineProperties = Object.defineProperties,
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getPrototypeOf = Object.getPrototypeOf,
    globalEval = window.eval,
    ObjectProto = Object.prototype,
    Object_create = Object.create,
    proxies = new PrivatePropertyStore('ClassProxy'),
    supportsClasses = common.supportsClasses;

/**
 * Creates a new ClassProxy.
 * 
 * @class ClassProxy
 * @classdesc Represents a function that is rewritten as an ES6 class.
 * 
 * @param {function} constructor
 * @param {function} [finalConstructor]
 * 
 * @property {function} finalConstructor - The final proxied constructor, appropriate for
 *   use with the 'new' keyword.
 * @property {boolean} isClass - Whether or not the finalConstructor is part of a "class"
 *   declaration.
 * @property {boolean} isElementInterface - Whether or not the current ClassProxy
 *   represents a built-in HTML element interface that has been patched for use as a base
 *   class.
 * @property {function} originalConstructor - The original constructor.
 * @property {boolean} wasFunction - Whether or not the originalConstructor is a function
 *   (and not an ES6 class).
 */
function ClassProxy(constructor, finalConstructor) {

    var prototype = (finalConstructor || constructor).prototype,
        baseConstructor, basePrototype, initializer, source;

    this.originalConstructor = constructor;
    this.wasFunction = !isClass(constructor);

    proxies.set(constructor, this);
    proxies.set(prototype, this);

    if (finalConstructor) {
        this.finalConstructor = finalConstructor;
        if (constructor !== finalConstructor) {
            this.isElementInterface = true;
            this.finalConstructor.prototype = prototype;
            this.isClass = false;
            proxies.set(finalConstructor, this);
        } else {
            this.isClass = supportsClasses;
        }
        return this;
    } else if (!this.wasFunction) {
        this.finalConstructor = constructor;
        this.isClass = true;
        return this;
    }

    this.isClass = supportsClasses;
    basePrototype = getPrototypeOf(prototype);
    
    if (basePrototype != null && basePrototype !== ObjectProto) {
        this.baseProxy = proxies.get(basePrototype);
        if (!this.baseProxy) {
            baseConstructor = basePrototype.constructor;
            if (typeof baseConstructor !== 'function' || baseConstructor.prototype !== basePrototype) {
                baseConstructor = function () { };
                baseConstructor.prototype = basePrototype;
            }
            this.baseProxy = new ClassProxy(baseConstructor);
        }
        baseConstructor = this.baseProxy.finalConstructor;
    } else if (this.isClass) {
        baseConstructor = constructor;
        basePrototype = baseConstructor.prototype;
    } else {
        basePrototype = Object_create(prototype);
    }

    if (!this.isClass && this.baseProxy && this.baseProxy.isElementInterface) {
        initializer = initElementSubclass.bind(null, constructor, this.baseProxy.finalConstructor);
    } else {
        initializer = initDefault.bind(null, constructor);
    }

    if (this.isClass) {
        source = '(function(){return function(init,base){return class extends base{constructor(){super();init(this,arguments);}};};})();';
        this.finalConstructor = globalEval(source)(initializer, baseConstructor);
    } else {
        this.finalConstructor = (function (init) {
            return function () { return init(this, arguments); };
        })(initializer);
        this.finalConstructor.prototype = this.baseProxy ? Object_create(basePrototype) : prototype;
        this.finalConstructor.prototype.constructor = constructor;
    }

    proxies.set(this.finalConstructor, this);

    constructor.prototype = this.finalConstructor.prototype;
    constructor.prototype.constructor = this.originalConstructor;
    copyProperties(constructor, this.finalConstructor);

    if (this.baseProxy) {
        copyProperties(prototype, this.finalConstructor.prototype);
        proxies.set(this.finalConstructor.prototype, this);
    }
}

defineProperties(ClassProxy.prototype, {
    constructor: {
        value: ClassProxy
    },

    baseProxy: {
        enumerable: true,
        value: null,
        writable: true
    },
    finalConstructor: {
        enumerable: true,
        value: null,
        writable: true
    },
    isClass: {
        enumerable: true,
        value: false,
        writable: true
    },
    isElementInterface: {
        enumerable: true,
        value: false,
        writable: true
    },
    originalConstructor: {
        enumerable: true,
        value: null,
        writable: true
    },
    wasFunction: {
        enumerable: true,
        value: false,
        writable: true
    }
});

/**
 * @param {function} constructor
 * @param {*} thisArg
 * @param {Array} args
 * @returns {object}
 */
function initDefault(constructor, thisArg, args) {
    constructor.apply(thisArg, arrayFrom(args));
    return thisArg;
}

/**
 * @param {function} constructor
 * @param {function} preConstructor
 * @param {*} thisArg
 * @param {Array} args
 * @returns {object}
 */
function initElementSubclass(constructor, preConstructor, thisArg, args) {
    var result = preConstructor.call(thisArg);
    constructor.apply(result, arrayFrom(args));
    return result;
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
 * @param {function} [finalConstructor]
 * @returns {function}
 */
function proxy(constructor, finalConstructor) {
    var proxy = proxies.get(constructor);
    if (proxy) {
        return proxy.finalConstructor;
    }
    if (typeof constructor !== 'function' || !(constructor.prototype instanceof Object)) {
        return constructor;
    }
    return new ClassProxy(constructor, finalConstructor).finalConstructor;
}

module.exports = {
    isClass: isClass,
    proxy: proxy
};
