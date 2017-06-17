(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
(function (window, undefined) {
    'use strict';

    require('./other-polyfills/Array.from');
    require('./other-polyfills/DOMException');
    require('./other-polyfills/Object.getOwnPropertyDescriptors');

    var common = require('./common'),
        baseElementConstructor,
        builtInElements,
        classes,
        CustomElementRegistry,
        isValidCustomElementName,
        nativeCustomElements,
        reactions,
        shims,

        getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,

        api = {},
        arrayFrom = Array.from,
        defineProperty = Object.defineProperty,
        defineProperties = Object.defineProperties,
        document = window.document,
        EventTargetProto = (window.EventTarget || window.Node).prototype,
        EventTarget_removeEventListener,
        isDocumentReady = common.isDocumentReady,
        isPrototypeOf = common.isPrototypeOf,
        NodeProto = window.Node.prototype,
        Node_compareDocumentPosition = NodeProto.compareDocumentPosition,
        Node_get_ownerDocument = getOwnPropertyDescriptor(NodeProto, 'ownerDocument').get,
        Node_isConnected = getOwnPropertyDescriptor(NodeProto, 'isConnected'),
        onReady,
        registry,
        TypeError = window.TypeError;

    classes = require('./classes');
    isValidCustomElementName = require('./is-valid-custom-element-name');
    nativeCustomElements = require('./native-custom-elements');

    module.exports = defineProperties(api, {
        isValidCustomElementName: {
            enumerable: true,
            value: isValidCustomElementName
        },
        support: {
            enumerable: true,
            value: defineProperties({}, {
                autonomousCustomElements: {
                    enumerable: true,
                    value: !!nativeCustomElements
                },
                classes: {
                    enumerable: true,
                    value: classes.supported
                },
                customizedBuiltInElements: {
                    enumerable: true,
                    value: nativeCustomElements != null && nativeCustomElements.canExtend
                }
            })
        },
        version: {
            enumerable: true,
            value: '0.9.0'
        }
    });
    window.customElementsPolyfill = api;

    // Node.prototype.isConnected polyfill
    if (!Node_isConnected || typeof Node_isConnected.get !== 'function') {
        defineProperty(NodeProto, 'isConnected', {
            configurable: true,
            enumerable: true,
            /**
             * @this {Node}
             * @returns {boolean}
             */
            get: function () {
                var doc;
                if (!isPrototypeOf(NodeProto, this)) {
                    throw new TypeError(common.illegalInvocation);
                }
                doc = Node_get_ownerDocument.call(this);
                return doc && !!(Node_compareDocumentPosition.call(doc, this) & 16);
            }
        });
    }

    if (nativeCustomElements && nativeCustomElements.canExtend) {
        // If a native CustomElementRegistry exists, and it already supports customized
        // built-in elements, then all we need to do is hook into customElements.define()
        // to ensure that any constructors passed to the native define() method are turned
        // into ES6 classes first.
        nativeCustomElements.prototype.define = function define(name, constructor, options) {
            var args = arrayFrom(arguments);
            if (arguments.length > 1) {
                args[1] = classes.proxy(constructor);
            }
            return nativeCustomElements.define.apply(this, args);
        };
        defineProperty(api, 'shim', {
            enumerable: true,
            value: function () { }
        });
        return;
    }

    /*
     * All of the remaining functionality beyond this point assumes that the above check
     * failed; that is, either (a) the native customElements implementation supports
     * autonomous custom elements and NOT customized built-in elements, or (b) there is
     * no native customElements implementation at all.
     */

    baseElementConstructor = require('./base-element-constructor');
    builtInElements = require('./built-in-elements');
    reactions = require('./reactions');

    (function () {

        /**
         * The routine below patches the native HTML element interfaces (HTMLAnchorElement,
         * HTMLDivElement, etc) so they can serve as bases for user-defined classes in
         * cooperation with the ES6 class proxying mechanism defined in the 'classes' module.
         */

        var names = builtInElements.interfaceNames,
            i = 0,
            l = names.length,
            name, interf, proxy;

        window.HTMLElement = classes.proxy((nativeCustomElements ? window.HTMLElement : function () {
            return baseElementConstructor.call(this, HTMLElement);
        }), HTMLElement, 'HTMLElement');

        while (i < l) {
            name = names[i++];
            interf = builtInElements.constructorFromInterfaceName(name);
            proxy = nativeCustomElements && nativeCustomElements.canExtend ? interf : (function (a) {
                return function () {
                    return baseElementConstructor.call(this, a);
                };
            })(interf);
            window[name] = classes.proxy(proxy, interf, name);
        }

    })();

    CustomElementRegistry = require('./custom-element-registry');
    shims = require('./shims');

    registry = new CustomElementRegistry();

    defineProperties(window, {
        CustomElementRegistry: {
            configurable: true,
            value: CustomElementRegistry,
            writable: true
        },
        customElements: {
            configurable: true,
            enumerable: true,
            get: function () {
                return registry;
            }
        }
    });

    defineProperty(api, 'shim', {
        enumerable: true,
        value: shims.shim
    });

    common.mainDocumentReady = isDocumentReady(document);
    reactions.observeDocument(document);

    if (!common.mainDocumentReady) {
        reactions.pushQueue();

        EventTarget_removeEventListener = EventTargetProto.removeEventListener;
        onReady = function () {
            reactions.popQueue();
            common.mainDocumentReady = true;
            EventTarget_removeEventListener.call(document, 'DOMContentLoaded', onReady, false);
        };
        EventTargetProto.addEventListener.call(document, 'DOMContentLoaded', onReady, false);
    }

})(typeof global !== 'undefined' ? global : (typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {})));
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./base-element-constructor":2,"./built-in-elements":3,"./classes":4,"./common":5,"./custom-element-registry":10,"./is-valid-custom-element-name":11,"./native-custom-elements":12,"./other-polyfills/Array.from":13,"./other-polyfills/DOMException":14,"./other-polyfills/Object.getOwnPropertyDescriptors":15,"./reactions":17,"./shims":18}],2:[function(require,module,exports){
'use strict';

var common = require('./common'),
    conformance = require('./conformance'),
    CustomElementDefinition = require('./custom-element-definition'),
    CustomElementProperties = require('./custom-element-properties'),
    reactions = require('./reactions'),
    
    DOMException = window.DOMException,
    getPrototypeOf = Object.getPrototypeOf,
    setPrototypeOf = Object.setPrototypeOf,
    TypeError = window.TypeError;

/**
 * This is the base constructor for all custom elements, and fulfills the steps of the
 *   HTML Standard "HTML element constructor" algorithm for all derived custom element
 *   types.
 * 
 * @param {function} activeFunction - The base interface from which the custom element
 *   being created is derived. For example, if the custom element being created is a
 *   customized built-in element that extends the "button" tag, then this parameter is
 *   a reference to window.HTMLButtonElement. If the custom element being created is an
 *   autonomous custom element, then this parameter is a reference to window.HTMLElement.
 * 
 * @returns {HTMLElement} The constructed custom element, after all remaining
 *   constructors have been run.
 */
module.exports = function baseElementConstructor(activeFunction) {
    var thisPrototype = this instanceof Object ? getPrototypeOf(this) : null,
        definition = thisPrototype ? CustomElementDefinition.fromPrototype(thisPrototype) : null,
        element, prototype, props, i;

    // HTML Standard: "HTML element constructor" algorithm
    // https://html.spec.whatwg.org/#html-element-constructors

    // 1.   Let `registry` be the current global object's CustomElementRegistry object.
    // 2.   If NewTarget is equal to the active function object, then throw a TypeError and
    //      abort these steps.

    // 3.   Let `definition` be the entry in `registry` with constructor equal to NewTarget.
    //      If there is no such definition, then throw a TypeError and abort these steps.
    if (!definition) {
        throw new TypeError(common.illegalConstructor);
    }

    // 4.   If `definition`'s local name is equal to `definition`'s name (i.e., `definition`
    //      is for an autonomous custom element), then:
    //
    // 4.1.     If the active function object is not HTMLElement, then throw a TypeError
    //          and abort these steps.
    //
    // 5.   Otherwise (i.e., if definition is for a customized built-in element):
    //
    // 5.1.     Let `valid local names` be the list of local names for elements defined
    //          in this specification or in other applicable specifications that use the
    //          active function object as their element interface.
    //
    // 5.2.     If `valid local names` does not contain `definition`'s local name, then
    //          throw a TypeError and abort these steps.
    if (activeFunction !== definition.baseInterface) {
        throw new TypeError(common.illegalConstructor);
    }

    // 6.   Let `prototype` be `definition`'s prototype.
    prototype = definition.prototype;

    // 7.   If `definition`'s construction stack is empty, then:
    if (definition.constructionStack.length === 0) {

        // 7.1.     Let `element` be a new element that implements the interface to which the
        //          active function object corresponds, with no attributes, namespace set to
        //          the HTML namespace, local name set to `definition`'s local name, and node
        //          document set to the current global object's associated Document.
        element = definition.createElement(document);
        props = new CustomElementProperties(element, definition);

        if (common.nextElementIsSynchronous) {
            common.nextElementIsSynchronous = false;
            props.synchronous = true;
            conformance.beginCheck(props);
        }

        // 7.2.     Perform `element`.[[SetPrototypeOf]](`prototype`). Rethrow any exceptions.
        setPrototypeOf(element, prototype);

        reactions.observeElement(props.element);

        // 7.3.     Set `element`'s custom element state to "custom".
        // 7.4.     Set `element`'s custom element definition to `definition`.
        definition.finalizeElement(element);

        // 7.5.     Return `element`.
        return element;
    }

    // 8.   Let `element` be the last entry in `definition`'s construction stack.
    i = definition.constructionStack.length - 1;
    props = definition.constructionStack[i];
    element = props.element;

    // 9.   If `element` is an already constructed marker, then throw an "InvalidStateError"
    //      DOMException and abort these steps.
    if (element === common.alreadyConstructedMarker) {
        throw new DOMException("Failed to construct 'CustomElement': Cannot create custom element <" + definition.name + (definition.isBuiltIn ? ' is="' + definition.localName + '"' : '') + "> from within its own custom element constructor.", 'InvalidStateError');
    }

    if (common.nextElementIsSynchronous) {
        common.nextElementIsSynchronous = false;
        props.synchronous = true;
        conformance.beginCheck(props);
    }

    // 10.  Perform `element`.[[SetPrototypeOf]](`prototype`). Rethrow any exceptions.
    setPrototypeOf(element, prototype);

    reactions.observeElement(props.element);

    // 11.  Replace the last entry in `definition`'s construction stack with an
    //      already constructed marker.
    definition.constructionStack[i] = common.alreadyConstructedMarker;

    // 12.  Return `element`.
    return element;
}

},{"./common":5,"./conformance":6,"./custom-element-definition":8,"./custom-element-properties":9,"./reactions":17}],3:[function(require,module,exports){
'use strict';

var common = require('./common'),

    allTagNames,
    constructorsByInterfaceName = {},
    constructorsByTagName = {},
    document = window.document,
    Document_createElement = Document.prototype.createElement,
    getOwnPropertyNames = Object.getOwnPropertyNames,
    hasOwnProperty = common.hasOwnProperty,
    interfaceNames,
    // 'predefinedTagNames' is an object where each key is the name of a native HTML element
    // interface and each value is a string or an array of strings, each of which is the
    // localName of an element that is known to implement that interface.
    // 
    // An empty array signifies that there are no tag names associated with the interface,
    // meaning it will not be included in the mapping. This is generally done for interfaces
    // that are deprecated, obsolete, or abstract.
    predefinedTagNames = {
        HTMLAnchorElement: ['a'],
        HTMLDListElement: ['dl'],
        HTMLDirectoryElement: ['dir'],
        HTMLHeadingElement: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        HTMLKeygenElement: [], // deprecated
        HTMLModElement: ['del', 'ins'],
        HTMLOListElement: ['ol'],
        HTMLParagraphElement: ['p'],
        HTMLQuoteElement: ['blockquote'],
        HTMLTableCaptionElement: ['caption'],
        HTMLTableCellElement: ['td', 'th'],
        HTMLTableColElement: ['col'],
        HTMLTableRowElement: ['tr'],
        HTMLTableSectionElement: ['tbody', 'tfoot', 'thead'],
        HTMLUListElement: ['ul'],
        HTMLUnknownElement: [] // abstract
    },
    props = getOwnPropertyNames(window),
    reg_htmlInterface = /^HTML(.+)Element$/,
    toLower = (function () {
        var S = String,
            t = S.prototype.toLowerCase;
        return function toLower(string) {
            return t.call(S(string));
        };
    })(),

    i = 0,
    l = props.length,
    name, match, interf, tagNames, isPredefined, element, t, tagName;

/**
 * @param {string} interfaceName
 * @returns {?function}
 */
function constructorFromInterfaceName(interfaceName) {
    return constructorsByInterfaceName[interfaceName] || null;
}

/**
 * @param {string} tagName
 * @returns {?function}
 */
function constructorFromTagName(tagName) {
    return constructorsByTagName[tagName] || null;
}

/**
 * @param {string} tagName
 * @returns {boolean}
 */
function isKnownTagName(tagName) {
    return hasOwnProperty(constructorsByTagName, tagName);
}

while (i < l) {
    name = props[i++];
    match = reg_htmlInterface.exec(name);
    interf = match == null ? null : window[name];
    if (interf && hasOwnProperty(interf, 'prototype') && interf.prototype instanceof HTMLElement) {
        constructorsByInterfaceName[name] = interf;
        isPredefined = hasOwnProperty(predefinedTagNames, name);
        if (isPredefined) {
            tagNames = predefinedTagNames[name];
        } else {
            tagNames = [toLower(match[1])];
        }
        t = tagNames.length;
        if (isPredefined) {
            while (t--) {
                constructorsByTagName[tagNames[t]] = interf;
            }
        } else {
            while (t--) {
                tagName = tagNames[t];
                element = Document_createElement.call(document, tagName);
                if (element instanceof interf) {
                    constructorsByTagName[tagName] = interf;
                }
            }
        }
    }
}

allTagNames = getOwnPropertyNames(constructorsByTagName);
interfaceNames = getOwnPropertyNames(constructorsByInterfaceName);

module.exports = {
    constructorFromInterfaceName: constructorFromInterfaceName,
    constructorFromTagName: constructorFromTagName,
    interfaceNames: interfaceNames,
    isKnownTagName: isKnownTagName,
    tagNames: allTagNames
};

},{"./common":5}],4:[function(require,module,exports){
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

},{"./common":5}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

var common = require('./common'),
    CustomElementProperties = require('./custom-element-properties'),

    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    hasOwnProperty = common.hasOwnProperty,

    ElementProto = window.Element.prototype,
    HTMLElement = window.HTMLElement,
    NodeProto = window.Node.prototype,

    Element_removeAttributeNode = ElementProto.removeAttributeNode,
    Element_setAttributeNodeNS = ElementProto.setAttributeNodeNS,
    Element_get_attributes = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'attributes') ? ElementProto : NodeProto, 'attributes').get,

    Node_appendChild = NodeProto.appendChild,
    Node_removeChild = NodeProto.removeChild,
    Node_get_firstChild = getOwnPropertyDescriptor(NodeProto, 'firstChild').get,
    
    conformanceStatus = common.conformanceStatus,
    DOMException = window.DOMException,
    failedToConstruct = "Failed to construct 'CustomElement': ",
    states = common.states,
    TypeError = window.TypeError;

/**
 * @param {CustomElementProperties} props
 * @private
 */
function beginConformanceCheck(props) {
    var element = props.element,
        originalAttributes = [],
        originalChildNodes = [],
        attrs = Element_get_attributes.call(element),
        i, attr, child;

    props.conformanceCheck = conformanceStatus.STARTED;
    props.originalAttributes = originalAttributes;
    props.originalChildNodes = originalChildNodes;
    props.originalDocument = props.ownerDocument;

    common.reactionsEnabled = false;

    i = 0;
    while (attr = attrs[0]) {
        originalAttributes[i++] = Element_removeAttributeNode.call(element, attr);
    }
    i = 0;
    while (child = Node_get_firstChild.call(element)) {
        originalChildNodes[i++] = Node_removeChild.call(element, child);
    }

    common.reactionsEnabled = true;
}
/**
 * @param {CustomElementProperties} props
 * @private
 */
function disposeConformanceProperties(props) {
    var element = props.element,
        attrs, children, i, l, attr, child;

    if (element && (props.originalAttributes || props.originalChildNodes)) {

        common.reactionsEnabled = false;

        if (props.originalAttributes) {
            // Remove any attributes that were non-conformantly added during the constructor
            attrs = Element_get_attributes.call(element);
            while (attr = attrs[0]) {
                Element_removeAttributeNode.call(element, attr);
            }
            // Restore the original attributes
            attrs = props.originalAttributes;
            i = 0;
            l = attrs.length;
            while (i < l) {
                Element_setAttributeNodeNS.call(element, attrs[i++]);
            }
        }

        if (props.originalChildNodes) {
            // Remove any child nodes that were non-conformantly added during the constructor
            while (child = Node_get_firstChild.call(element)) {
                Node_removeChild.call(element, child);
            }
            // Restore the original child nodes
            children = props.originalChildNodes;
            i = 0;
            l = children.length;
            while (i < l) {
                Node_appendChild.call(element, children[i++]);
            }
        }

        common.reactionsEnabled = true;
    }

    props.originalAttributes = null;
    props.originalChildList = null;
    props.originalDocument = null;
}
/**
 * @param {CustomElementProperties} props
 * @private
 */
function evaluateConformance(props) {
    var element, error, definition;

    // If the custom element has a custom element state that is not 'undefined', then
    // cancel the conformance check and return immediately.
    if (props.state !== states.custom && props.state !== states.undefined) {
        props.conformanceCheck = conformanceStatus.CANCELED;
        return disposeConformanceProperties(props);
    }

    element = props.element;
    error = null;
    definition = props.definition;

    // The remainder of this method executes steps 6.1.3 through 6.1.9 of the DOM Standard
    // "create an element" algorithm.
    // https://dom.spec.whatwg.org/#concept-create-element
    // 
    // Step 6.1.8 is intentionally skipped:
    // 
    //   6.1.8.  If `result`'s namespace is not the HTML namespace, then throw a NotSupportedError.
    // 
    // This check may someday be necessary in native browser implementations if the spec
    // changes, but on the polyfill side, we know that every element implementing the
    // HTMLElement interface belongs to the HTML namespace.

    if (!(element instanceof HTMLElement)) {
        //  6.1.3.  If `result` does not implement the HTMLElement interface, then throw a TypeError.
        error = new TypeError(failedToConstruct + 'The resulting element must implement the HTMLElement interface.');
    } else if (Element_get_attributes.call(element).length > 0) {
        //  6.1.4.  If `result`'s attribute list is not empty, then throw a NotSupportedError.
        error = new DOMException(failedToConstruct + 'The resulting element must not have any attributes.', 'NotSupportedError');
    } else if (Node_get_firstChild.call(element) !== null) {
        //  6.1.5.  If `result` has children, then throw a NotSupportedError.
        error = new DOMException(failedToConstruct + 'The resulting element must not have any child nodes.', 'NotSupportedError');
    } else if (props.parentNodeChanged && Node_get_parentNode.call(element) !== null) {
        //  6.1.6.  If `result`'s parent is not null, then throw a NotSupportedError.
        error = new DOMException(failedToConstruct + 'The resulting element must not have a parent node.', 'NotSupportedError');
    } else if (Node_get_ownerDocument.call(element) !== props.originalDocument) {
        //  6.1.7.  If `result`'s node document is not `document`, then throw a NotSupportedError.
        error = new DOMException(failedToConstruct + 'The resulting element must belong to the same document for which it was created.', 'NotSupportedError');
    } else if (Element_get_localName.call(element) !== definition.localName) {
        //  6.1.9.  If `result`'s local name is not equal to `localName`, then throw a NotSupportedError.
        error = new DOMException(failedToConstruct + "The resulting element's local name must match the local name specified by its custom element definition ('" + definition.localName + "').", 'NotSupportedError');
    }

    if (error) {
        props.conformanceCheck = conformanceStatus.FAILED;
        props.conformanceError = error;
    } else {
        props.conformanceCheck = conformanceStatus.PASSED;
    }
}

module.exports = {
    /**
     * Begins watching the element represented by the given CustomElementProperties
     *   to ensure that its custom element constructor behaves conformantly.
     * 
     * @param {CustomElementProperties} props - The CustomElementProperties of the
     *   custom element whose constructor should be checked for conformance.
     */
    beginCheck: function beginCheck(props) {
        props = CustomElementProperties.get(props);
        if (props && props.conformanceCheck === conformanceStatus.NONE && (props.state === states.custom || props.state === states.undefined) && props.element) {
            beginConformanceCheck(props);
        }
    },
    /**
     * Cancels the conformance check for the element represented by the given
     *   CustomElementProperties, if one is currently in progress.
     * 
     * @param {CustomElementProperties} props - The CustomElementProperties of the
     *   custom element whose conformance check should be canceled.
     */
    cancelCheck: function cancelCheck(props) {
        props = CustomElementProperties.get(props);
        if (props && props.conformanceCheck === conformanceStatus.STARTED) {
            props.conformanceCheck = conformanceStatus.CANCELED;
            disposeConformanceProperties(props);
        }
    },
    /**
     * Determines whether or not the custom element constructor behaved conformantly
     *   when creating the element represented by the given CustomElementProperties.
     * 
     * @param {CustomElementProperties} props - The CustomElementProperties of the
     *   custom element whose conformance result will be returned.
     * 
     * @returns {?DOMException|TypeError} An error explaining how the custom element
     *   constructor behaved non-conformantly, or null if it behaved conformantly.
     */
    getError: function getError(props) {
        props = CustomElementProperties.get(props);
        if (!props) {
            return null;
        }
        if (props.conformanceCheck === conformanceStatus.STARTED) {
            evaluateConformance(props);
            disposeConformanceProperties(props);
        }
        return props.conformanceError || null;
    }
};

},{"./common":5,"./custom-element-properties":9}],7:[function(require,module,exports){
'use strict';

var common = require('./common'),
    CustomElementDefinition = require('./custom-element-definition'),
    CustomElementProperties = require('./custom-element-properties'),
    isValidCustomElementName = require('./is-valid-custom-element-name'),
    nativeCustomElements = require('./native-custom-elements'),
    reactions = require('./reactions'),

    arrayFrom = Array.from,
    Element_setAttributeNS = window.Element.prototype.setAttributeNS,
    HTML_NAMESPACE = common.htmlNamespace,
    setPrototypeOf = Object.setPrototypeOf,
    throwAsync = common.throwAsync;

/**
 * @param {Document} document
 * @param {string} localName
 * @param {string} namespace
 * @param {?string} prefix
 * @param {?string} is
 * @param {boolean} synchronous
 * @param {?CustomElementDefinition} [definition]
 * @param {?function} [fallbackMethod]
 * @param {?object} [fallbackMethodThisArg]
 * @param {?Array} [fallbackMethodArgs]
 * @returns {HTMLElement}
 */
module.exports = function createElement(document, localName, namespace, prefix, is, synchronous, definition, fallbackMethod, fallbackMethodThisArg, fallbackMethodArgs) {

    var couldBeCustomElement = true,
        result, props;

    // Check for an existing definition in the native CustomElementRegistry.
    // If one exists, then defer to the native Document.prototype.createElement or
    // Document.prototype.createElementNS, as appropriate.
    if (!definition && nativeCustomElements && namespace === HTML_NAMESPACE) {
        couldBeCustomElement = is || isValidCustomElementName(localName);
        if (couldBeCustomElement && nativeCustomElements.get(is || localName)) {
            return fallbackMethod.apply(fallbackMethodThisArg, arrayFrom(fallbackMethodArgs));
        }
    }

    // DOM Standard: "Create an element" algorithm
    // https://dom.spec.whatwg.org/#concept-create-element

    // To create an element, given a `document`, `localName`, `namespace`, and optional `prefix`,
    // `is`, and synchronous custom elements flag, run these steps:

    // 1.   If `prefix` was not given, let `prefix` be null.
    prefix = typeof prefix === 'string' ? prefix : null;

    // 2.   If `is` was not given, let `is` be null.
    is = typeof is === 'string' ? is : null;

    // 3.   Let `result` be null.
    result = null;

    // 4.   Let `definition` be the result of looking up a custom element definition given `document`,
    //      `namespace`, `localName`, and `is`.
    if (!definition && couldBeCustomElement) {
        // Skip the definition lookup if we already determined that the "localName" and "is"
        // values could not possibly map to a custom element.
        definition = CustomElementDefinition.lookup(document, namespace, localName, is);
    }

    if (definition && definition.isBuiltIn) {

        //  5.      If `definition` is non-null, and `definition`'s name is not equal to its local name (i.e.,
        //          `definition` represents a customized built-in element), then:

        //  5.1.    Let `interface` be the element interface for localName and the HTML namespace.
        //  5.2.    Set `result` to a new element that implements `interface`, with no attributes, namespace
        //          set to the HTML namespace, namespace prefix set to `prefix`, local name set to `localName`,
        //          custom element state set to "undefined", custom element definition set to null, is value set
        //          to `is`, and node document set to `document`.
        result = definition.createElement(document);
        props = new CustomElementProperties(result, definition);

        if (synchronous) {
            //  5.3.    If the synchronous custom elements flag is set, upgrade `result` using `definition`.
            try {
                reactions.upgradeElement(props, true);
            } catch (ex) {
                throwAsync(ex);
            }
        } else {
            //  5.4.    Otherwise, enqueue a custom element upgrade reaction given `result` and `definition`.
            reactions.enqueueUpgradeReaction(props);
        }
    } else if (definition) {

        //  6.      Otherwise, if `definition` is non-null, then:
        if (synchronous) {

            //  6.1.    If the synchronous custom elements flag is set, then run these subsubsteps while
            //          catching any exceptions:
            try {

                //  6.1.1.  Let `C` be `definition`'s constructor.
                //  6.1.2.  Set `result` to Construct(`C`). Rethrow any exceptions.
                result = definition.constructElement(true);
                props = CustomElementProperties.get(result);

                /* Steps 6.1.3 through 6.1.9 are completed by conformance.getError(). */

                //  6.1.10. Set `result`'s namespace prefix to prefix.
                //  6.1.11. Set `result`'s is value to null.
            } catch (ex) {
                common.nextElementIsSynchronous = false;

                //  6.1.    (continued) If any of these subsubsteps threw an exception, then:
                //  6.1.1E. Report the exception.
                throwAsync(ex);

                //  6.1.2E. Set `result` to a new element that implements the HTMLUnknownElement interface, with no
                //          attributes, namespace set to the HTML namespace, namespace prefix set to `prefix`, local
                //          name set to `localName`, custom element state set to "failed", custom element definition
                //          set to null, is value set to null, and node document set to `document`.
                result = definition.createElement(document);
                props = new CustomElementProperties(result, definition);
                props.state = STATES.FAILED;
                if (!(result instanceof HTMLUnknownElement)) {
                    setPrototypeOf(result, HTMLUnknownElementProto);
                }
            }
        } else {
            //  6.2.    Otherwise:
            //  6.2.1.  Set `result` to a new element that implements the HTMLElement interface, with no attributes,
            //          namespace set to the HTML namespace, namespace prefix set to `prefix`, local name set to
            //          `localName`, custom element state set to "undefined", custom element definition set to null,
            //          is value set to null, and node document set to `document`.
            result = definition.createElement(document);
            props = new CustomElementProperties(result, definition);

            //  6.2.2.  Enqueue a custom element upgrade reaction given `result` and `definition`.
            reactions.enqueueUpgradeReaction(props, definition);
        }
    } else {
        //  7.      Otherwise:
        //  7.1.    Let `interface` be the element interface for `localName` and `namespace`.
        //  7.2.    Set `result` to a new element that implements `interface`, with no attributes, namespace set to
        //          `namespace`, namespace prefix set to `prefix`, local name set to `localName`, custom element state
        //          set to "uncustomized", custom element definition set to null, is value set to `is`, and node
        //          document set to `document`.
        result = fallbackMethod.apply(fallbackMethodThisArg, arrayFrom(fallbackMethodArgs));
        if (is) {
            Element_setAttributeNS.call(result, null, 'is', is);
        }

        //  7.3.    If `namespace` is the HTML namespace, and either `localName` is a valid custom element name or `is`
        //          is non-null, then set `result`'s custom element state to "undefined".

        // The above step is not applicable to the polyfill since it doesn't maintain a custom
        // element state for elements without a matching definition.
    }

    // 8.   Return `result`.
    return result;
};

},{"./common":5,"./custom-element-definition":8,"./custom-element-properties":9,"./is-valid-custom-element-name":11,"./native-custom-elements":12,"./reactions":17}],8:[function(require,module,exports){
'use strict';

/**
 * An object that contains the callbacks associated with a custom
 *   element definition.
 * 
 * @typedef {object} CustomElementCallbacks
 * 
 * @property {?function} adoptedCallback - The custom element's "adoptedCallback" prototype
 *   method.
 * @property {?function} attributeChangedCallback - The custom element's
 *   "attributeChangedCallback" prototype method.
 * @property {?function} connectedCallback - The custom element's "connectedCallback"
 *   prototype method.
 * @property {?function} disconnectedCallback - The custom element's "disconnectedCallback"
 *   prototype method.
 */

var builtInElements = require('./built-in-elements'),
    common = require('./common'),
    conformance = require('./conformance'),
    CustomElementProperties = require('./custom-element-properties'),

    ADOPTED_CALLBACK = common.callbackNames.adopted,
    Array = window.Array,
    document = window.document,
    Document = window.Document,
    Element = window.Element,
    ElementProto = Element.prototype,
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    hasOwnProperty = common.hasOwnProperty,
    HTMLElement = window.HTMLElement,
    HTML_NAMESPACE = common.htmlNamespace,
    NodeProto = window.Node.prototype,
    states = common.states,

    Document_createElementNS = Document.prototype.createElementNS,
    Element_getAttributeNS = ElementProto.getAttributeNS,
    Element_get_localName = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'localName') ? ElementProto : NodeProto, 'localName').get,
    Element_get_namespaceURI = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'namespaceURI') ? ElementProto : NodeProto, 'namespaceURI').get,

    /**
     * A map that associates a custom element constructor with its corresponding
     *   custom element definition.
     * @type {Map}
     */
    defsByConstructor = new Map(),
    /**
     * A dictionary that associates a custom element name with its corresponding
     *   custom element definition.
     * @type {object}
     */
    defsByName = {},
    /**
     * A dictionary that associates a custom element prototype with its
     *   corresponding custom element definition.
     * @type {object}
     */
    defsByPrototype = new Map();

/**
 * Creates a new custom element definition.
 * 
 * @class CustomElementDefinition
 * @classdesc Represents a custom element definition.
 * 
 * @param {string} name - The name of the custom element.
 * @param {string} localName - The local name (tag name) of the custom element.
 * @param {function} constructor - The constructor for the custom element.
 * @param {object} prototype - The custom element's prototype object.
 * @param {Array.<string>} observedAttributes - The list of attributes whose changes
 *   should be observed.
 * @param {CustomElementCallbacks} callbacks - The lifecycle callbacks for the custom
 *   element.
 * 
 * @property {function} baseInterface - The base HTMLElement interface from which this
 *   definition's prototype is derived.
 * @property {CustomElementCallbacks} callbacks - The lifecycle callbacks for the custom
 *   element.
 * @property {Array.<CustomElementProperties>} constructionStack - The definition's
 *   construction stack.
 * @property {function} constructor - The constructor for the custom element.
 * @property {boolean} hasAdoptedCallback - Whether or not this definition contains an
 *   "adoptedCallback" callback method. Used as a shortcut to determine whether the
 *   polyfill should keep track of the ownerDocument for custom elements created using
 *   this definition.
 * @property {boolean} isBuiltIn - Whether or not this definition is a customized built-in
 *   element definition.
 * @property {string} localName - The local name (tag name) of the custom element.
 * @property {string} name - The name of the custom element.
 * @property {Array.<string>} observedAttributes - The list of attributes whose changes
 *   should be observed.
 * @property {object} prototype - The custom element's prototype object.
 */
function CustomElementDefinition(name, localName, constructor, prototype, observedAttributes, callbacks) {
    this.name = name;
    this.localName = localName;
    this.constructor = constructor;
    this.prototype = prototype;
    this.observedAttributes = (observedAttributes instanceof Array && observedAttributes.length > 0) ? observedAttributes : [];
    this.callbacks = callbacks;
    this.constructionStack = [];
    this.hasAdoptedCallback = typeof callbacks[ADOPTED_CALLBACK] === 'function';
    this.isBuiltIn = localName !== name;
    this.baseInterface = (localName === name ? HTMLElement : builtInElements.constructorFromTagName(localName)) || null;

    defsByConstructor.set(constructor, this);
    defsByName[name] = this;
    defsByPrototype.set(prototype, this);
};

/**
 * Constructs a custom element using the constructor associated with the current
 *   CustomElementDefinition and returns the result from the constructor, rethrowing
 *   any exceptions.
 * 
 * @param {boolean} [synchronous] - Whether or not the synchronous custom elements
 *   flag should be set while constructing the custom element. Defaults to false.
 * 
 * @returns {*} The unmodified return value from the custom element constructor.
 */
CustomElementDefinition.prototype.constructElement = function constructElement(synchronous) {
    var hasError = false,
        element, error, props;
    if (synchronous) {
        common.nextElementIsSynchronous = true;
    }
    try {
        element = new this.constructor();
    } catch (ex) {
        hasError = true;
        error = ex;
    }
    props = CustomElementProperties.get(element);
    if (props) {
        if (props.conformanceCheck === conformanceStatus.STARTED) {
            if (hasError) {
                conformance.cancelCheck(props);
            } else {
                error = conformance.getError(props);
                hasError = !!error;
            }
        }
        if (hasError) {
            props.reactionQueue.length = 0;
        }
    }
    if (hasError) {
        throw error;
    }
    return element;
};

/**
 * Creates a new HTML element whose localName (and "is" attribute, if applicable) match
 *   those specified by the current CustomElementDefinition. The created element is not
 *   upgraded.
 * 
 * @param {Document} [doc] - The Document that will be set as the ownerDocument for the
 *   new element. Defaults to the default document for the current browsing context.
 * 
 * @returns {HTMLElement}
 */
CustomElementDefinition.prototype.createElement = function (doc) {
    var element;
    if (!doc) {
        doc = document;
    }
    element = Document_createElementNS.call(doc, HTML_NAMESPACE, this.localName);
    if (this.isBuiltIn) {
        Element_setAttributeNS.call(element, null, 'is', this.name);
    }
    return element;
};

/**
 * Invoked after an element using this CustomElementDefinition is constructed or upgraded.
 * 
 * @param {HTMLElement|CustomElementProperties} element - The element (or the
 *   CustomElementProperties for the element) that was constructed or upgraded.
 */
CustomElementDefinition.prototype.finalizeElement = function (element) {
    var props = CustomElementProperties.get(element);
    if (!props) {
        props = new CustomElementProperties(element, this);
        props.upgradeEnqueued = true;
    }
    props.state = states.custom;
};

/**
 * Returns the CustomElementDefinition associated with the provided constructor function.
 * 
 * @param {function} constructor - The constructor function for which a matching
 *   definition is being searched.
 * 
 * @returns {?CustomElementDefinition} The custom element definition associated
 *   with the provided constructor function, or null if no definition has been
 *   registered with the provided constructor.
 */
CustomElementDefinition.fromConstructor = function (constructor) {
    return defsByConstructor.get(constructor) || null;
};

/**
 * Returns the CustomElementDefinition associated with the provided HTML element.
 * 
 * @param {HTMLElement} element - The HTML element for which a matching
 *   definition is being searched.
 * 
 * @returns {?CustomElementDefinition} The custom element definition associated
 *   with the provided HTML element, or null if no matching definition could
 *   be found for the provided element.
 */
CustomElementDefinition.fromElement = function (element) {
    var localName, name;
    if (!(element instanceof HTMLElement) || Element_get_namespaceURI.call(element) !== HTML_NAMESPACE) {
        return null;
    }
    localName = Element_get_localName.call(element);
    if (localName.indexOf('-') > -1) {
        name = localName;
    } else {
        name = Element_getAttributeNS.call(element, null, 'is');
    }
    return defsByName[name] || null;
};

/**
 * Returns the CustomElementDefinition associated with the provided tag name.
 *   It is assumed that the tag name is a valid custom element name, and has
 *   already been lowercased.
 * 
 * @param {string} tagName - The tag name of the definition to return.
 * 
 * @returns {?CustomElementDefinition} The custom element definition associated
 *   with the provided tag name, or null if no definition has been registered
 *   with the provided tag name.
 */
CustomElementDefinition.fromName = function (name) {
    return defsByName[name] || null;
};

/**
 * Returns the CustomElementDefinition associated with the provided prototype object.
 * 
 * @param {prototype} prototype - The prototype object for which a matching
 *   definition is being searched.
 * 
 * @returns {?CustomElementDefinition} The custom element definition associated with
 *   the provided prototype object, or null if no definition has been registered
 *   with the provided prototype.
 */
CustomElementDefinition.fromPrototype = function (prototype) {
    return defsByPrototype.get(prototype) || null;
};

/**
 * @param {Document} doc
 * @param {string} namespace
 * @param {string} localName
 * @param {string} is
 * @returns {?CustomElementDefinition}
 */
CustomElementDefinition.lookup = function (doc, namespace, localName, is) {

    var definition;

    // HTML Standard: "Look up a custom element definition" algorithm
    // https://html.spec.whatwg.org/multipage/scripting.html#look-up-a-custom-element-definition

    // To look up a custom element definition, given a `document`, `namespace`, `localName`,
    // and `is`, perform the following steps. They will return either a custom element
    // definition or null:

    // 1.   If `namespace` is not the HTML namespace, return null.
    // 2.   If `document` does not have a browsing context, return null.
    if (namespace !== HTML_NAMESPACE || !doc || !doc.defaultView) {
        return null;
    }

    // 3.   Let `registry` be `document`'s browsing context's Window's CustomElementRegistry
    //      object.
    // 4.   If there is a custom element definition in `registry` with name and local name both
    //      equal to `localName`, return that custom element definition.
    // 5.   If there is a custom element definition in `registry` with name equal to `is` and
    //      local name equal to `localName`, return that custom element definition.
    definition = CustomElementDefinition.fromName(localName) || (is ? CustomElementDefinition.fromName(is) : null);
    if (definition && definition.localName === localName) {
        return definition;
    }

    // 6.   Return null.
    return null;
};

module.exports = CustomElementDefinition;

},{"./built-in-elements":3,"./common":5,"./conformance":6,"./custom-element-properties":9}],9:[function(require,module,exports){
'use strict';

var common = require('./common'),
    priv = require('./private-property-provider')('CustomElement'),

    conformanceStatus = common.conformanceStatus,
    getPrototypeOf = Object.getPrototypeOf,
    Node_get_ownerDocument = Object.getOwnPropertyDescriptor(window.Node.prototype, 'ownerDocument').get,
    states = common.states,
    proto;

/**
 * Creates a new property set associated with a custom element.
 * 
 * @classdesc Represents a set of internal properties associated with an individual
 *   instance of a custom element.
 * @class CustomElementProperties
 * 
 * @param {HTMLElement} element - The HTML element.
 * @param {CustomElementDefinition} definition - The custom element definition
 *   used by the element.
 * 
 * @property {number} conformanceCheck - Returns a value indicating the conformance
 *   check status for this custom element.
 * @property {?DOMException|TypeError} conformanceError - If the custom element
 *   failed a conformance check, this property contains an error explaining why.
 * @property {CustomElementDefinition} definition - The custom element definition
 *   used by the element.
 * @property {HTMLElement} element - The HTML element.
 * @property {?Array.<Attr>} originalAttributes - An array containing the custom
 *   element's original attribute nodes from before its constructor was run. This
 *   is only populated while the custom element's constructor is being checked for
 *   conformance.
 * @property {?Array.<Node>} originalChildNodes - An array containing the custom
 *   element's original child nodes from before its constructor was run. This is
 *   only populated while the custom element's constructor is being checked for
 *   conformance.
 * @property {?Document} originalDocument - The original Document under which the
 *   custom element was created. This is only populated while the custom element's
 *   constructor is being checked for conformance.
 * @property {Document} ownerDocument - The Document to which the custom element
 *   belongs. This is used to trigger the "adoptedCallback" whenever the element's
 *   "connectedCallback" is fired and it is discovered that the element's
 *   ownerDocument has changed.
 * @property {?boolean} parentNodeChanged - Whether the parentNode has been
 *   changed within the custom element constructor. This determines the return
 *   value of Node.prototype.parentNode for custom elements whose constructors are
 *   being checked for conformance.
 * @property {Array.<function>} reactionQueue - The custom element reaction queue
 *   for the element.
 * @property {string} state - The custom element state; either "undefined", "failed",
 *   "uncustomized", or "custom".
 * @property {boolean} synchronous - Whether the synchronous custom elements flag
 *   was set while the custom element was being created.
 * @property {boolean} upgradeEnqueued - True if the custom element either (a) has
 *   an upgrade reaction in its reactionQueue, or (b) has already been upgraded;
 *   otherwise, false.
 */
function CustomElementProperties(element, definition) {
    priv.set(element, this);
    this.definition = definition;
    this.element = element;
    this.ownerDocument = Node_get_ownerDocument.call(element);
    this.reactionQueue = [];
}
proto = CustomElementProperties.prototype;

proto.conformanceCheck = conformanceStatus.NONE;
proto.conformanceError = null;
proto.originalAttributes = null;
proto.originalChildNodes = null;
proto.originalDocument = null;
proto.parentNodeChanged = null;
proto.state = states.undefined;
proto.synchronous = false;
proto.upgradeEnqueued = false;

/**
 * Returns the custom element property set associated with the provided element,
 *   or null if the element is not associated with a custom element property set.
 *   Unlike the 'getOrCreate' method, this method will not create a new property
 *   set for the element, nor will it attempt to find a matching custom element
 *   definition.
 * 
 * @param {HTMLElement} element - The element whose property set will be retrieved.
 * 
 * @returns {?CustomElementProperties} The instance of CustomElementProperties
 *   associated with the provided element, or null if the provided element is not
 *   associated with a custom element property set.
 */
CustomElementProperties.get = function get(element) {
    return element == null ? null : (getPrototypeOf(element) === proto ? element : priv.get(element));
};

module.exports = CustomElementProperties;

},{"./common":5,"./private-property-provider":16}],10:[function(require,module,exports){
'use strict';

var builtInElements = require('./built-in-elements'),
    classes = require('./classes'),
    common = require('./common'),
    CustomElementDefinition = require('./custom-element-definition'),
    isValidCustomElementName = require('./is-valid-custom-element-name'),
    nativeCustomElements = require('./native-custom-elements'),
    reactions = require('./reactions'),

    Array = window.Array,
    ObjectProto = window.Object.prototype,

    arrayFrom = Array.from,
    callbackNames = common.callbackNames.all,
    document = window.document,
    Document_getElementsByTagName = window.Document.prototype.getElementsByTagName,
    DOMException = window.DOMException,
    Element_getAttributeNS = window.Element.prototype.getAttributeNS,
    hasOwnProperty = common.hasOwnProperty,
    isArray = Array.isArray,
    isPrototypeOf = common.isPrototypeOf,
    isRunning = false,
    nativeConstructors = [],
    Promise = window.Promise,
    Promise_reject = Promise.reject.bind(Promise),
    Promise_resolve = Promise.resolve.bind(Promise),
    /**
     * A dictionary where each key is the name of a custom element whose definition
     *   is being awaited, and each value is a function that resolves the Promise
     *   that was created for the definition.
     * @type {object}
     */
    promiseResolvers = {},
    /**
     * A dictionary where each key is the name of a custom element whose definition
     *   is being awated, and each value is a Promise that will be resolved once a
     *   custom element with that name is defined within the registry.
     * @type {object}
     */
    promises = {},
    CustomElementRegistry,
    instance,
    String = window.String,
    TypeError = window.TypeError;

/**
 * An optional set of options used when defining a custom element via
 *   CustomElementRegistry.prototype.define().
 * 
 * @typedef {object} ElementDefinitionOptions
 * 
 * @property {string} extends - The name of the built-in element that
 *   the new custom element will extend.
 */

/**
 * @param {string} method
 * @param {string} msg
 * @returns {string}
 */
function methodError(method, msg) {
    return "Failed to execute '" + method + "' on 'CustomElementRegistry': " + msg;
}

/**
 * @returns {string}
 */
function constructorInUseError() {
    return methodError('define', 'The provided constructor has already been used with this registry.');
}

/**
 * @param {string} method
 * @param {string} tagName
 * @returns {string}
 */
function invalidNameError(method, tagName) {
    return methodError(method, '"' + tagName + '" is not a valid custom element name');
}

/**
 * @param {string} tagName
 * @returns {string}
 */
function nameInUseError(tagName) {
    return methodError('define', 'The custom element name "' + tagName + '" has already been used with this registry.');
}

/**
 * @param {string} name
 * @returns {?Promise}
 */
function resolveWhenDefinedPromise(name) {
    var promise, resolve;
    if (hasOwnProperty(promiseResolvers, name)) {
        promise = promises[name];
        resolve = promiseResolvers[name];
        if (typeof resolve === 'function') {
            resolve();
        }
        delete promiseResolvers[name];
        delete promises[name];
    }
    return promise;
}

/**
 * @param {string} name
 * @param {function} resolve
 */
function whenDefinedExecutor(name, resolve) {
    promiseResolvers[name] = resolve;
}

CustomElementRegistry = (function () {

    function CustomElementRegistry() {
        if (instance) {
            // Don't allow CustomElementRegistry to be created from user code
            throw new TypeError(common.illegalConstructor);
        }
        instance = this;
    }

    if (classes.supported) {
        // If ES6 classes are supported, we need to ensure that CustomElementRegistry
        // is defined as a class, so its 'prototype' property is not writable.
        return eval("(function(){return function(init){return class CustomElementRegistry{constructor(){init.call(this);}};};})()")(CustomElementRegistry);
    }

    return CustomElementRegistry;

})();

/**
 * Registers a new custom element definition.
 * @param {string} name - The name of the custom element.
 * @param {function} constructor - The constructor function for the custom element.
 * @param {ElementDefinitionOptions} [options] - An optional set of options.
 */
CustomElementRegistry.prototype.define = function define(name, constructor, options) {

    var validateArguments, extend, localName, prototype, callbacks, callbackName,
        observedAttributes, attributes, definition, upgradeCandidates, i, l, args,
        candidates, c;

    if (this !== instance) {
        throw new TypeError(methodError('define', common.illegalInvocation));
    }

    if (typeof constructor === 'function') {
        constructor = classes.proxy(constructor);
    }
    extend = (options && hasOwnProperty(options, 'extends') && options.extends != null) ? String(options.extends) : null;
    name = String(name);
    validateArguments = nativeCustomElements ? !!extend : true;

    // HTML Standard: "Custom Element Definition" algorithm
    // https://html.spec.whatwg.org/multipage/scripting.html#element-definition

    // 1.   If IsConstructor(`constructor`) is false, then throw a TypeError and
    //      abort these steps.
    // 2.   If `name` is not a valid custom element name, then throw a "SyntaxError"
    //      DOMException and abort these steps.

    // Argument validations (including steps 1 and 2 of the algorithm) only take
    // place if the definition process can't be handed off to the native
    // customElements implementation.
    if (validateArguments) {
        if (arguments.length < 2) {
            throw new TypeError(methodError('define', '2 arguments required, but only ' + arguments.length + ' present.'));
        }
        if (options != null && !(options instanceof Object)) {
            throw new TypeError(methodError('define', "Parameter 3 ('options') is not an object."));
        }
        if (typeof constructor !== 'function') {
            throw new TypeError(methodError('define', "Parameter 2 ('constructor') is not a function."));
        }
        if (!isValidCustomElementName(name)) {
            throw new DOMException(invalidNameError('define', name), 'SyntaxError');
        }
    }

    // 3.   If this CustomElementRegistry contains an entry with name `name`,
    //      then throw a "NotSupportedError" DOMException and abort these steps.
    if (CustomElementDefinition.fromName(name) || (nativeCustomElements && nativeCustomElements.get(name))) {
        // If a native customElements implementation exists and the current definition
        // is for an autonomous custom element, then the check for an existing definition
        // via Definition.fromName() has already been made, and we don't need to repeat it.
        throw new DOMException(nameInUseError(name), 'NotSupportedError');
    }

    // 4.   If this CustomElementRegistry contains an entry with constructor
    //      `constructor`, then throw a "NotSupportedError" DOMException and
    //      abort these steps.
    if (CustomElementDefinition.fromConstructor(constructor)) {
        throw new DOMException(constructorInUseError(), 'NotSupportedError');
    } else if (nativeCustomElements) {
        i = nativeConstructors.length;
        while (i--) {
            if (nativeConstructors[i] === constructor) {
                throw new DOMException(constructorInUseError(), 'NotSupportedError');
            }
        }
    }

    if (nativeCustomElements && !extend) {
        // At this point, if a native customElements implementation exists, and the
        // definition is for an autonomous custom element, then we defer to the
        // native define() method.
        args = [];
        i = arguments.length;
        while (i--) {
            args[i] = i === 1 ? constructor : arguments[i];
        }
        isRunning = true;
        try {
            nativeCustomElements.define.apply(nativeCustomElements.instance, args);
        } finally {
            isRunning = false;
        }
        constructor = nativeCustomElements.get(name);
        if (constructor) {
            nativeConstructors[nativeConstructors.length] = constructor;
            resolveWhenDefinedPromise(name);
        }
        return;
    }

    // 5.   Let `localName` be `name`.
    localName = name;

    // 6.   Let `extends` be the value of the 'extends' member of `options`, or
    //      null if no such member exists.
    // 7.   If `extends` is not null, then:
    if (extend) {
        // 7.1.     If `extends` is a valid custom element name, then throw a "NotSupportedError"
        //          DOMException.
        if (isValidCustomElementName(extend)) {
            throw new DOMException(methodError('define', "The tag name specified in the 'extends' option (\"" + extend + "\") cannot be a custom element name."), 'NotSupportedError');
        }
        // 7.2.     If the element interface for `extends` and the HTML namespace is
        //          HTMLUnknownElement (e.g., if `extends` does not indicate an element
        //          definition in this specification), then throw a "NotSupportedError"
        //          DOMException.
        if (!builtInElements.isKnownTagName(extend)) {
            throw new DOMException(methodError('define', "The tag name specified in the 'extends' option (\"" + extend + "\") is not the name of a built-in element."), 'NotSupportedError');
        }
        // 7.3.     Let `localName` be `extends`.
        localName = extend;
    }

    // 8.   If this CustomElementRegistry's "element definition is running" flag is set,
    //      then throw a "NotSupportedError" DOMException and abort these steps.
    if (isRunning) {
        throw new DOMException(methodError('define', "The registry is currently processing another custom element definition."), 'NotSupportedError');
    }

    // 9.   Set this CustomElementRegistry's "element definition is running" flag.
    isRunning = true;

    // 10.  Run the following substeps while catching any exceptions:
    try {
        // 10.1.    Let `prototype` be Get(`constructor`, "prototype"). Rethrow any exceptions.
        prototype = constructor.prototype;

        // 10.2.    If Type(`prototype`) is not Object, then throw a TypeError exception.
        if (prototype == null || !isPrototypeOf(ObjectProto, prototype)) {
            throw new TypeError(methodError('define', "The 'prototype' property of the provided constructor is not an object. (Is the constructor a bound function?)"));
        }

        // 10.3.    `Let lifecycleCallbacks` be a map with the four keys "connectedCallback",
        //          "disconnectedCallback", "adoptedCallback", and "attributeChangedCallback",
        //          each of which belongs to an entry whose value is null.
        callbacks = {};

        // 10.4.    For each of the four keys `callbackName` in `lifecycleCallbacks`, in the order
        //          listed in the previous step:
        i = callbackNames.length;
        while (i--) {
            callbackName = callbackNames[i];

            // 10.4.1.  Let `callbackValue` be Get(`prototype`, `callbackName`). Rethrow any exceptions.
            var callback = prototype[callbackName];

            // 10.4.2.  If `callbackValue` is not undefined, then set the value of the entry in
            //          `lifecycleCallbacks` with key `callbackName` to the result of converting
            //          `callbackValue` to the Web IDL `Function` callback type. Rethrow any exceptions
            //          from the conversion.
            if (callback !== void 0 && typeof callback !== 'function') {
                throw new TypeError(methodError('define', "The provided constructor's '" + callbackName + "' prototype property is not a function."));
            }
            callbacks[callbackName] = callback || null;
        }

        // 10.5.    Let `observedAttributes` be an empty `sequence<DOMString>`.
        observedAttributes = null;

        // 10.6.    If the value of the entry in `lifecycleCallbacks` with key "attributeChangedCallback"
        //          is not null, then:
        if (callbacks.attributeChangedCallback != null) {
            // 10.6.1.  Let `observedAttributesIterable` be Get(`constructor`, "observedAttributes"). Rethrow
            //          any exceptions.
            attributes = constructor.observedAttributes;

            // 10.6.2.  If `observedAttributesIterable` is not undefined, then set `observedAttributes` to the
            //          result of converting `observedAttributesIterable` to a `sequence<DOMString>`. Rethrow
            ///         any exceptions from the conversion.
            if (attributes !== void 0) {
                if (!isArray(attributes)) {
                    try {
                        attributes = arrayFrom(attributes);
                    } catch (e) {
                        throw new TypeError(methodError('define', "The provided constructor's 'observedAttributes' property is not an Array (or an Array-like object)."));
                    }
                }
                observedAttributes = [];
                i = 0;
                l = attributes.length;
                while (i < l) {
                    observedAttributes[i] = String(attributes[i]);
                    i++;
                }
            }
        }

    } finally {
        // 10.  (continued)
        //      Then, perform the following substep, regardless of whether the above
        //      steps threw an exception or not:
        //
        //      1.  Unset this CustomElementRegistry's "element definition is running" flag.
        isRunning = false;

        // 10.  (continued)
        //      Finally, if the first set of substeps threw an exception, then rethrow
        //      that exception, and terminate this algorithm. Otherwise, continue onward.
    }

    // 11.  Let `definition` be a new custom element definition with name `name`, local
    //      name `localName`, constructor `constructor`, prototype `prototype`, observed
    //      attributes `observedAttributes`, and lifecycle callbacks `lifecycleCallbacks`.
    definition = new CustomElementDefinition(name, localName, constructor, prototype, observedAttributes, callbacks);

    // 12.  Add `definition` to this CustomElementRegistry.
    // (Step 12 is completed within the Definition() constructor.)

    // 13.  Let `document` be this CustomElementRegistry's relevant global object's
    //      associated Document.
    // 14.  Let `upgrade candidates` be all elements that are shadow-including descendants
    //      of `document`, whose namespace is the HTML namespace and whose local name is
    //      `localName`, in shadow-including tree order. Additionally, if `extends` is
    //      non-null, only include elements whose 'is' value is equal to `name`.
    upgradeCandidates = Document_getElementsByTagName.call(document, localName);
    if (extend) {
        candidates = [];
        c = 0;
        i = 0;
        l = upgradeCandidates.length;
        while (i < l) {
            if (Element_getAttributeNS.call(upgradeCandidates[i], null, 'is') === definition.name) {
                candidates[c++] = upgradeCandidates[i];
            }
            i++;
        }
        upgradeCandidates = candidates;
    }

    // 15.  For each element `element` in `upgrade candidates`, enqueue a custom element
    //      upgrade reaction given `element` and `definition`.
    l = upgradeCandidates.length;
    i = 0;
    reactions.pushQueue();
    while (i < l) {
        reactions.enqueueUpgradeReaction(upgradeCandidates[i++], definition);
    }
    reactions.popQueue();

    // 16.  If this CustomElementRegistry's when-defined promise map contains an entry
    //      with key `name`:
    // 16.1.    Let `promise` be the value of that entry.
    // 16.2.    Resolve `promise` with `undefined`.
    // 16.3.    Delete the entry with key `name` from this CustomElementRegistry's
    //          when-defined promise map.
    resolveWhenDefinedPromise(name);
};

/**
 * Returns the constructor for the custom element in this CustomElementRegistry with
 *   the provided name, or undefined if this registry does not contain a custom element
 *   definition with the provided name.
 *
 * @param {string} name - The name of the custom element whose constructor will be
 *   retrieved.
 * @returns {function} The constructor for the custom element in this CustomElementRegistry
 *   with the provided name, or undefined if this registry does not contain a custom
 *   element definition with the provided name.
 */
CustomElementRegistry.prototype.get = function get(name) {
    var definition;
    if (this !== instance) {
        throw new TypeError(methodError('get', common.illegalInvocation));
    }
    if (arguments.length === 0) {
        throw new TypeError(methodError('get', '1 argument required, but only 0 present.'));
    }
    if (nativeCustomElements) {
        definition = nativeCustomElements.get(name);
        if (definition) {
            return definition;
        }
    }
    definition = CustomElementDefinition.fromName(String(name));
    return definition ? definition.constructor : void 0;
};

/**
 * Returns a Promise that is resolved when a custom element is registered with this
 * CustomElementRegistry that has the provided name.
 * 
 * @param {string} name - The name of the custom element whose definition is being awaited.
 * @returns {Promise} A Promise that is resolved with no value when a custom element is
 *   registered with this CustomElementRegistry that has the provided name. If the given
 *   name is not a valid custom element name, then the returned Promise is rejected immediately.
 */
CustomElementRegistry.prototype.whenDefined = function whenDefined(name) {
    var promise;

    if (this !== instance) {
        return Promise_reject(new TypeError(methodError('whenDefined', common.illegalInvocation)));
    }
    if (arguments.length === 0) {
        return Promise_reject(new TypeError(methodError('whenDefined', '1 argument required, but only 0 present.')))
    }

    name = String(name);

    // HTML Standard: CustomElementRegistry.prototype.whenDefined() specification
    // https://html.spec.whatwg.org/multipage/scripting.html#dom-customelementregistry-whendefined

    // 1.   If `name` is not a valid custom element name, then return a new promise
    //      rejected with a "SyntaxError" DOMException and abort these steps.
    if (!isValidCustomElementName(name)) {
        return Promise_reject(new DOMException(invalidNameError('whenDefined', name), 'SyntaxError'));
    }

    // 2.   If this CustomElementRegistry contains an entry with name `name`, then return
    //      a new promise resolved with `undefined` and abort these steps.
    if (CustomElementDefinition.fromName(name) || (nativeCustomElements && nativeCustomElements.get(name))) {
        return Promise_resolve();
    }

    // 3.   Let `map` be this CustomElementRegistry's when-defined promise map.
    // 4.   If `map` does not contain an entry with key `name`, create an entry in `map`
    //      with key `name` and whose value is a new promise.
    // 5.   Let `promise` be the value of the entry in `map` with key `name`.
    if (hasOwnProperty(promises, name)) {
        promise = promises[name];
    } else {
        promise = new Promise(whenDefinedExecutor.bind(null, name));
        promises[name] = promise;
    }

    // 6.   Return `promise`.
    return promise;
};

module.exports = CustomElementRegistry;

},{"./built-in-elements":3,"./classes":4,"./common":5,"./custom-element-definition":8,"./is-valid-custom-element-name":11,"./native-custom-elements":12,"./reactions":17}],11:[function(require,module,exports){
'use strict';

var reg_reservedTagNames = /^(?:annotation-xml|color-profile|font-face(?:-(?:src|uri|format|name))?|missing-glyph)$/,
    reg_validCustomElementName = (function () {
        var supportsRegexUnicodeFlag = (function () {
            try {
                new RegExp('1', 'u');
                return true;
            } catch (ex) {
                return false;
            }
        })();

        // If the browser supports the 'u' flag, then the '\u{xxxxx}' token is used to
        // detect code points in the astral plane. The browser's implementation is likely
        // to be faster than the fallback regular expression in the 'else' block.
        if (supportsRegexUnicodeFlag) {
            return new RegExp('^[a-z][\\-\\.0-9_a-z\\xB7\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}]*-[\\-\\.0-9_a-z\\xB7\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}]*$', 'u');
        } else {
            return /^[a-z](?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*\-(?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
        }
    })();

/**
 * Determines whether the provided tag name is a valid custom element name.
 * @param {string} tagName - The tag name.
 * @returns {boolean}
 */
function isValidCustomElementName(tagName) {
    return (!reg_reservedTagNames.test(tagName) && reg_validCustomElementName.test(tagName));
}

module.exports = isValidCustomElementName;

},{}],12:[function(require,module,exports){
'use strict';

var classes = require('./classes'),
    globalEval = window.eval,
    instance, prototype, define, get, whenDefined;

// If the browser doesn't support ES6 classes, then it's guaranteed that the browser
// also doesn't have a native custom elements implementation.
if (classes.supported && typeof window.CustomElementRegistry === 'function' && window.customElements instanceof window.CustomElementRegistry) {
    instance = window.customElements;
    prototype = window.CustomElementRegistry.prototype;
    define = prototype.define.bind(instance);
    get = prototype.get.bind(instance);
    whenDefined = prototype.whenDefined.bind(instance);

    module.exports = {
        canExtend: (function () {
            var name = 'custom-elements-polyfill-test',
                constructor, e;
            try {
                constructor = globalEval("(function(){return class extends HTMLDivElement{constructor(){super();}};})()");
                define(name, constructor, { 'extends': 'div' });
                e = new constructor();
                return (e && e instanceof HTMLDivElement && e.tagName === 'DIV' && e.getAttribute('is') === name);
            } catch (ex) {
                return false;
            }
        })(),
        define: define,
        'get': get,
        instance: instance,
        prototype: prototype,
        whenDefined: whenDefined
    };
} else {
    module.exports = false;
}

},{"./classes":4}],13:[function(require,module,exports){
module.exports = (function () {
    var toStr, isCallable, toInteger, maxSafeInteger, toLength, from;
    if (typeof Array.from === 'function') {
        return Array.from;
    }

    toStr = Object.prototype.toString,
    isCallable = function (fn) {
        return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    toInteger = function (value) {
        var number = Number(value);
        if (isNaN(number)) { return 0; }
        if (number === 0 || !isFinite(number)) { return number; }
        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    maxSafeInteger = Math.pow(2, 53) - 1;
    toLength = function (value) {
        var len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
    };
    from = function from(arrayLike) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Browser_compatibility
        // Production steps of ECMA-262, Edition 6, 22.1.2.1
        // Reference: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from

        var C, items, mapFn, T, len, A, k, kValue;

        // 1. Let C be the this value.
        C = this;

        // 2. Let items be ToObject(arrayLike).
        items = Object(arrayLike);

        // 3. ReturnIfAbrupt(items).
        if (arrayLike == null) {
            throw new TypeError("Array.from requires an array-like object - not null or undefined");
        }

        // 4. If mapfn is undefined, then let mapping be false.
        mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        if (typeof mapFn !== 'undefined') {
            // 5. else
            // 5. a. If IsCallable(mapfn) is false, throw a TypeError exception.
            if (!isCallable(mapFn)) {
                throw new TypeError('Array.from: when provided, the second argument must be a function');
            }

            // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 2) {
                T = arguments[2];
            }
        }

        // 10. Let lenValue be Get(items, "length").
        // 11. Let len be ToLength(lenValue).
        len = toLength(items.length);

        // 13. If IsConstructor(C) is true, then
        // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
        // 14. b. Else, Let A be ArrayCreate(len).
        A = isCallable(C) ? Object(new C(len)) : new Array(len);

        // 16. Let k be 0.
        k = 0;
        // 17. Repeat, while k < len (also steps a - h)
        while (k < len) {
            kValue = items[k];
            if (mapFn) {
                A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
            } else {
                A[k] = kValue;
            }
            k += 1;
        }
        // 18. Let putStatus be Put(A, "length", len, true).
        A.length = len;
        // 20. Return A.
        return A;
    };
    Object.defineProperty(Array, 'from', {
        configurable: true,
        enumerable: false,
        value: from,
        writable: true
    });
    return from;
}());

},{}],14:[function(require,module,exports){
(function (global){
(function (window) {
    'use strict';

    var constructorError = "Failed to construct 'DOMException': Please use the 'new' operator, this DOM object constructor cannot be called as a function.",
        defineProperties = Object.defineProperties,
        defineProperty = Object.defineProperty,
        DOMException = window.DOMException,
        Error = window.Error,
        hasOwnProperty = (function () {
            var hOP = Object.prototype.hasOwnProperty;
            return function (O, p) {
                return hOP.call(O, p);
            };
        })(),
        nativePrototype = typeof DOMException === 'function' ? DOMException.prototype : null,
        nativeConstructor = nativePrototype ? (function () {
            try {
                new DOMException('', 'SyntaxError');
                return DOMException;
            } catch (e) {
                return null;
            }
        })() : null,
        ILLEGAL_INVOCATION = 'Illegal invocation',
        String = window.String,
        TypeError = window.TypeError,

        get_code, get_message, get_name,
        codes, props, names, i, l, constants, code;

    if (nativeConstructor && nativePrototype) {
        module.exports = DOMException;
        return;
    } else if (nativePrototype) {
        get_code = Object.getOwnPropertyDescriptor(nativePrototype, 'code').get;
        get_message = Object.getOwnPropertyDescriptor(nativePrototype, 'message').get;
        get_name = Object.getOwnPropertyDescriptor(nativePrototype, 'name').get;
    }

    props = new WeakMap();

    DOMException = function DOMException(message, name) {
        var err;
        if (!(this instanceof DOMException) || props.has(this)) {
            throw new TypeError(constructorError);
        }
        if (nativePrototype) {
            try {
                get_code.call(this);
            } catch (ex) {
                err = ex;
            }
            if (!err) {
                throw new TypeError(constructorError);
            }
        }
        Error.call(this);
        name = (name === undefined) ? 'Error' : String(name);
        props.set(this, {
            code: hasOwnProperty(codes, name) ? codes[name].code : 0,
            message: message === undefined ? '' : String(message),
            name: name
        });
        if (hasOwnProperty(this, 'message')) {
            delete this.message;
        }
        if (hasOwnProperty(this, 'name')) {
            delete this.name;
        }
    };

    module.exports = DOMException;
    defineProperty(window, 'DOMException', {
        configurable: true,
        enumerable: false,
        value: DOMException,
        writable: true
    });

    if (nativePrototype) {
        DOMException.prototype = defineProperties(nativePrototype, {
            constructor: {
                configurable: true,
                enumerable: false,
                value: DOMException,
                writable: true
            },
            code: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = props.get(this);
                    return p ? p.code : get_code.call(this);
                }
            },
            message: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = props.get(this);
                    return p ? p.message : get_message.call(this);
                }
            },
            name: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = props.get(this);
                    return p ? p.name : get_name.call(this);
                }
            }
        });

        return;
    }

    codes = {
        IndexSizeError: { code: 1, constant: 'INDEX_SIZE_ERR' },
        HierarchyRequestError: { code: 3, constant: 'HIERARCHY_REQUEST_ERR' },
        WrongDocumentError: { code: 4, constant: 'WRONG_DOCUMENT_ERR' },
        InvalidCharacterError: { code: 5, constant: 'INVALID_CHARACTER_ERR' },
        NoModificationAllowedError: { code: 7, constant: 'NO_MODIFICATION_ALLOWED_ERR' },
        NotFoundError: { code: 8, constant: 'NOT_FOUND_ERR' },
        NotSupportedError: { code: 9, constant: 'NOT_SUPPORTED_ERR' },
        InvalidStateError: { code: 11, constant: 'INVALID_STATE_ERR' },
        SyntaxError: { code: 12, constant: 'SYNTAX_ERR' },
        InvalidModificationError: { code: 13, constant: 'INVALID_MODIFICATION_ERR' },
        NamespaceError: { code: 14, constant: 'NAMESPACE_ERR' },
        InvalidAccessError: { code: 15, constant: 'INVALID_ACCESS_ERR' },
        TypeMismatchError: { code: 17, constant: 'TYPE_MISMATCH_ERR' },
        SecurityError: { code: 18, constant: 'SECURITY_ERR' },
        NetworkError: { code: 19, constant: 'NETWORK_ERR' },
        AbortError: { code: 20, constant: 'ABORT_ERR' },
        URLMismatchError: { code: 21, constant: 'URL_MISMATCH_ERR' },
        QuotaExceededError: { code: 22, constant: 'QUOTA_EXCEEDED_ERR' },
        TimeoutError: { code: 23, constant: 'TIMEOUT_ERR' },
        InvalidNodeTypeError: { code: 24, constant: 'INVALID_NODE_TYPE_ERR' },
        DataCloneError: { code: 25, constant: 'DATA_CLONE_ERR' }
    };
    names = Object.getOwnPropertyNames(codes);

    DOMException.prototype = Object.create(Error.prototype, {
        constructor: {
            configurable: true,
            enumerable: false,
            value: DOMException,
            writable: true
        },
        code: {
            configurable: true,
            enumerable: true,
            get: function () {
                var p = this instanceof DOMException ? props.get(this) : null;
                if (!p) {
                    throw new TypeError(ILLEGAL_INVOCATION);
                }
                return p.code;
            }
        },
        message: {
            configurable: true,
            enumerable: true,
            get: function () {
                var p = this instanceof DOMException ? props.get(this) : null;
                if (!p) {
                    throw new TypeError(ILLEGAL_INVOCATION);
                }
                return p.message;
            }
        },
        name: {
            configurable: true,
            enumerable: true,
            get: function () {
                var p = this instanceof DOMException ? props.get(this) : null;
                if (!p) {
                    throw new TypeError(ILLEGAL_INVOCATION);
                }
                return p.name;
            }
        }
    });

    constants = {};
    i = 0;
    l = names.length;
    while (i < l) {
        code = codes[names[i++]];
        constants[code.constant] = {
            configurable: false,
            enumerable: true,
            value: code.code,
            writable: false
        };
    }

    defineProperties(DOMException, constants);
    defineProperties(DOMException.prototype, constants);

})(typeof global !== 'undefined' ? global : (typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {})));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],15:[function(require,module,exports){
module.exports = (function () {
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
        getOwnPropertyNames = Object.getOwnPropertyNames,
        getOwnPropertySymbols = Object.getOwnPropertySymbols;

    if (typeof Object.getOwnPropertyDescriptors !== 'function') {
        Object.defineProperty(Object, 'getOwnPropertyDescriptors', {
            configurable: true,
            /**
             * @param {object} O
             * @returns {object}
             */
            value: function getOwnPropertyDescriptors(O) {
                var names = getOwnPropertyNames(O),
                    i = 0,
                    l = names.length,
                    result = {},
                    name;
                while (i < l) {
                    name = names[i++];
                    result[name] = getOwnPropertyDescriptor(O, name);
                }
                if (getOwnPropertySymbols) {
                    names = getOwnPropertySymbols;
                    i = 0;
                    l = names.length;
                    while (i < l) {
                        name = names[i++];
                        result[name] = getOwnPropertyDescriptor(O, name);
                    }
                }
                return result;
            },
            writable: true
        });
    }

    return Object.getOwnPropertyDescriptors;
    
})();

},{}],16:[function(require,module,exports){
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

},{"./common":5}],17:[function(require,module,exports){
'use strict';

var common = require('./common'),
    CustomElementDefinition = require('./custom-element-definition'),
    CustomElementProperties = require('./custom-element-properties'),
    PrivatePropertyProvider = require('./private-property-provider'),

    ADOPTED_CALLBACK = common.callbackNames.adopted,
    ATTRIBUTE_CALLBACK = common.callbackNames.attributeChanged,
    CONNECTED_CALLBACK = common.callbackNames.connected,
    DISCONNECTED_CALLBACK = common.callbackNames.disconnected,

    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    hasOwnProperty = common.hasOwnProperty,
    isPrototypeOf = common.isPrototypeOf,

    Attr = window.Attr,
    AttrProto = Attr.prototype,
    DocumentProto = window.Document.prototype,
    Element = window.Element,
    ElementProto = Element.prototype,
    HTMLElement = window.HTMLElement,
    MutationObserver = window.WebKitMutationObserver || window.MutationObserver,
    MutationObserver_takeRecords = MutationObserver.prototype.takeRecords,
    NodeProto = window.Node.prototype,

    Attr_get_localName = getOwnPropertyDescriptor(hasOwnProperty(AttrProto, 'localName') ? AttrProto : NodeProto, 'localName').get,
    Attr_get_namespaceURI = getOwnPropertyDescriptor(hasOwnProperty(AttrProto, 'namespaceURI') ? AttrProto : NodeProto, 'namespaceURI').get,
    Attr_get_value = getOwnPropertyDescriptor(AttrProto, 'value').get,

    elementTypeWithChildrenProperty = hasOwnProperty(ElementProto, 'children') ? Element : HTMLElement,
    Element_getAttributeNS = ElementProto.getAttributeNS,
    Element_get_attributes = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'attributes') ? ElementProto : NodeProto, 'attributes').get,
    Element_get_children = getOwnPropertyDescriptor(elementTypeWithChildrenProperty.prototype, 'children').get,

    Node_get_isConnected = getOwnPropertyDescriptor(NodeProto, 'isConnected').get,
    Node_get_nodeType = getOwnPropertyDescriptor(NodeProto, 'nodeType').get,
    Node_get_ownerDocument = getOwnPropertyDescriptor(NodeProto, 'ownerDocument').get,

    arrayContains = common.arrayContains,
    Array_shift = window.Array.prototype.shift,
    DOMException = window.DOMException,
    enabledDescriptor,
    isDocumentReady = common.isDocumentReady,
    setTimeout = window.setTimeout,
    states = common.states,
    throwAsync = common.throwAsync,

    /**
     * Indicates whether the backup element queue is currently being processed.
     * @type {boolean}
     */
    processingBackupElementQueue = false,
    /**
     * True if either the processAttributeRecords() method or the processChildListRecords()
     *   method is currently running; otherwise, false.
     * @type {boolean}
     */
    enqueueingFromMutationObserver = false,
    /**
     * The backup element queue.
     * @type {ElementQueue}
     */
    backupElementQueue,
    /**
     * The stack of all active element queues.
     * @type {Array.<ElementQueue>}
     */
    elementQueues = [],
    /**
     * The topmost element queue in the stack, or null if no element queues
     *   are in the stack.
     * @type {?ElementQueue}
     */
    currentElementQueue = null,
    /**
     * A single MutationObserver that watches for changed attributes that occur
     *   on defined custom elements.
     * @type {MutationObserver}
     */
    attributeObserver,
    /**
     * A single MutationObserver that watches documents for connected and disconnected custom elements.
     * @type {MutationObserver}
     */
    childListObserver,
    /**
     * The options used when adding a document to the childListObserver.
     * @type {object}
     */
    childListObserverOptions = {
        childList: true,
        subtree: true
    },
    /**
     * Contains weak references to the documents that are being observed by
     *   the childListObserver.
     */
    documents = new PrivatePropertyProvider(),
    /**
     * Contains any MutationRecords taken from the global attributeObserver which
     *   have been suspended until there are no more element queues in the reaction
     *   stack.
     * @type {Array.<MutationRecord>}
     */
    suspendedAttributeRecords = [],
    /**
     * Contains any MutationRecords taken from the global childListObserver which
     *   have been suspended until there are no more element queues in the reaction
     *   stack.
     * @type {Array.<MutationRecord>}
     */
    suspendedChildListRecords = [],
    /**
     * False if custom element reactions are currently prevented from being
     *   enqueued; otherwise, true.
     * @type {boolean}
     */
    reactionsEnabled = true;

/**
 * Creates a new DocumentProperties instance for the specified document, and
 *   observes the document for custom element reaction triggers.
 * 
 * @class DocumentProperties
 * @classdesc Contains information about a Document.
 * 
 * @param {Document} document - The Document.
 * 
 * @property {number} throwOnDynamicMarkupInsertionCounter - A counter that
 *   is used to prevent a custom element constructor from being able to use
 *   the Document.prototype.open(), Document.prototype.close(), and
 *   Document.prototype.write() methods when the constructor is invoked by
 *   the parser.
 */
function DocumentProperties(document) {
    documents.set(document, this);
    this.throwOnDynamicMarkupInsertionCounter = 0;
    childListObserver.observe(document, childListObserverOptions);
}

/**
 * Creates a new ElementQueue.
 * 
 * @class ElementQueue
 * @classdesc Represents a queue of custom elements with pending reactions.
 * 
 * @property {Array.<CustomElementProperties>} elements - The custom elements in the queue.
 */
function ElementQueue() {
    this.elements = [];
}
/**
 * Adds a custom element to this ElementQueue.
 * 
 * @param {CustomElementProperties} props - The CustomElementProperties for
 *   the custom element to enqueue.
 */
ElementQueue.prototype.enqueueElement = function (props) {
    if (!enqueueingFromMutationObserver) {
        enqueuePendingMutationRecords();
    }
    this.elements[this.elements.length] = props;
};
/**
 * Processes the elements within the element queue, invoking the reactions in
 *   the reaction queues for each element within.
 */
ElementQueue.prototype.invoke = function () {

    var elements = this.elements,
        l = elements.length,
        i = 0,
        props, reactions, reaction;

    enqueuePendingMutationRecords();

    // HTML Standard: "Invoke custom element reactions" algorithm
    // https://html.spec.whatwg.org/multipage/scripting.html#invoke-custom-element-reactions

    // To invoke custom element reactions in an element queue `queue`, run the
    // following steps:

    // 1.   For each custom element `element` in `queue`:
    while (i < l) {

        props = elements[i++];

        // 1.1.     Let `reactions` be `element`'s custom element reaction queue.
        reactions = props.reactionQueue;

        // 1.2.     Repeat until `reactions` is empty:
        while (reactions.length > 0) {
            // 1.2.1.   Remove the first element of `reactions`, and let `reaction`
            //          be that element. Switch on `reaction`'s type:
            // 
            //          Upgrade reaction:
            //              Upgrade `element` using `reaction`'s custom element definition.
            // 
            //          Callback reaction:
            //              Invoke `reaction`'s callback function with `reaction`'s
            //              arguments, and with `element` as the callback 'this' value.
            // 
            //          If this throws any exception, then report the exception.
            reaction = Array_shift.call(reactions);
            try {
                reaction.apply(props);
            } catch (ex) {
                throwAsync(ex);
            }
        }
    }

    elements.length = 0;
};

/**
 * @param {MutationObserver} observer
 * @returns {Array.<MutationRecord>}
 */
function takeRecords(observer) {
    return MutationObserver_takeRecords.call(observer);
}

/**
 * Enqueues or suspends any pending MutationRecords, and then prevents any
 *   further custom element reactions from being enqueued until the
 *   'enableReactions' method is called.
 */
function disableReactions() {
    if (!reactionsEnabled) {
        return;
    }
    reactionsEnabled = false;
    if (elementQueues.length > 0) {
        enqueuePendingMutationRecords();
    } else {
        suspendMutationRecords();
    }
}
/**
 * Re-enables the enqueueing of all custom element reactions. If any
 *   MutationRecords were suspended when reactions were disabled, they will
 *   now be enqueued in the backup element queue.
 */
function enableReactions() {
    if (reactionsEnabled) {
        return;
    }
    takeRecords(attributeObserver);
    takeRecords(childListObserver);
    reactionsEnabled = true;
    if (elementQueues.length === 0) {
        enqueueSuspendedMutationRecords();
    }
}

/**
 * Adds an element to either the current element queue or the backup element
 *   queue, as necessary.
 * 
 * @param {CustomElementProperties} props - The CustomElementProperties
 *   for the custom element to enqueue.
 */
function enqueueElement(props) {

    // HTML Standard "Enqueue an element on the appropriate element queue" algorithm
    // https://html.spec.whatwg.org/multipage/scripting.html#enqueue-an-element-on-the-appropriate-element-queue

    // To enqueue an element on the appropriate element queue, given an element `element`,
    // run the following steps:

    // 1.   If the custom element reactions stack is empty, then:
    if (!currentElementQueue) {

        // 1.1.     Add `element` to the backup element queue.
        backupElementQueue.enqueueElement(props);

        // 1.2.     If the processing the backup element queue flag is set, abort this algorithm.
        if (processingBackupElementQueue) {
            return;
        }

        // 1.3.     Set the 'processing the backup element queue' flag.
        processingBackupElementQueue = true;

        // 1.4.     Queue a microtask to perform the following steps:
        // 1.4.1.   Invoke custom element reactions in the backup element queue.
        // 1.4.2.   Unset the 'processing the backup element queue flag'.
        setTimeout(processBackupElementQueue);

        return;
    }

    // 2.   Otherwise, add `element` to the current element queue.
    currentElementQueue.enqueueElement(props);
}
/**
 * This method is queued as a microtask (or, for our purposes, as a timeout), and
 *   runs steps 1.4.1. and 1.4.2. from the "Enqueue an element on the appropriate
 *   element queue" algorithm.
 */
function processBackupElementQueue() {
    // 1.4.1.   Invoke custom element reactions in the backup element queue.
    backupElementQueue.invoke();
    // 1.4.2.   Unset the 'processing the backup element queue flag'.
    processingBackupElementQueue = false;
}

/**
 * Enqueues a callback reaction on the specified element.
 * 
 * @param {HTMLElement|CustomElementProperties} element - The custom element (or the
 *   CustomElementProperties for the element) whose callback will be invoked. If an
 *   HTML element with no matching custom element definition is provided, then no
 *   action will be taken.
 * @param {string} callbackName - The name of the callback to invoke on the element.
 * @param {Array} [args] - An optional array of arguments to send to the callback.
 */
function enqueueCallbackReaction(element, callbackName, args) {
    var props, definition, callbacks, callback, ownerDocument, attributeName;

    if (!reactionsEnabled) {
        return;
    }

    props = CustomElementProperties.get(element)
    if (!props || props.state === states.failed) {
        return;
    }

    element = props.element;

    // HTML Standard: "Enqueue a Custom Element Callback Reaction" algorithm
    // https://html.spec.whatwg.org/multipage/scripting.html#enqueue-a-custom-element-callback-reaction

    // To enqueue a custom element callback reaction, given a custom element `element`,
    // a callback name `callbackName`, and a list of arguments `args`, run the following
    // steps:

    // 1.   Let `definition` be `element`'s custom element definition.
    definition = props.definition || CustomElementDefinition.fromElement(element);

    // 2.   Let `callback` be the value of the entry in `definition`'s lifecycle callbacks
    //      with key `callbackName`.
    callbacks = definition.callbacks;
    callback = callbacks[callbackName];

    if (definition.hasAdoptedCallback) {
        // A quick interruption to perform some intermediate steps needed by the
        // polyfill for definitions that contain an "adoptedCallback".

        if (callbackName === ADOPTED_CALLBACK) {

            // If the "adoptedCallback" is being fired, update the internal
            // "ownerDocument" property immediately.
            props.ownerDocument = Node_get_ownerDocument.call(props.element);

        } else if (callbackName === CONNECTED_CALLBACK) {
            ownerDocument = Node_get_ownerDocument.call(props.element);
            if (props.ownerDocument !== ownerDocument) {
                // If a "connectedCallback" is being fired, and the HTML element's
                // ownerDocument is different from the one we have in its internal
                // property set, then ensure that an adoptedCallback is enqueued before
                // before the connectedCallback.
                enqueueCallbackReaction(props, ADOPTED_CALLBACK, [props.ownerDocument, ownerDocument]);

                // We need to do this even if the definition does not contain a
                // connectedCallback, because elements can be adopted by a document
                // simply by being inserted into a node that belongs to that document,
                // without ever having explicitly invoked Document.prototype.adoptNode().
            }
        }
    }

    // 3.   If `callback` is null, then abort these steps.
    if (callback == null) {
        return;
    }

    // 4.   If `callbackName` is "attributeChangedCallback", then:
    if (callbackName === ATTRIBUTE_CALLBACK) {

        // 4.1.     Let `attributeName` be the first element of args.
        attributeName = args[0];

        // 4.2.     If `definition`'s observed attributes does not contain `attributeName`,
        //          then abort these steps.
        if (!arrayContains(definition.observedAttributes, attributeName)) {
            return;
        }
    }

    if (!enqueueingFromMutationObserver && elementQueues.length > 0) {
        enqueuePendingMutationRecords();
    }

    // 5.   Add a new callback reaction to `element`'s custom element reaction queue,
    //      with callback function `callback` and arguments `args`.
    props.reactionQueue[props.reactionQueue.length] = invokeCallback.bind(null, callback, props, args);

    // 6.   Enqueue an element on the appropriate element queue given `element`.
    enqueueElement(props);

}
/**
 * Enqueues an upgrade reaction on the specified element.
 * 
 * @param {CustomElementProperties} props - The CustomElementProperties for the element
 *   that will be upgraded.
 */
function enqueueUpgradeReaction(props) {
    var definition;

    if (!reactionsEnabled || props.upgradeEnqueued) {
        return;
    }

    props.upgradeEnqueued = true;
    definition = props.definition || Definition.fromElement(props.element);

    if (!enqueueingFromMutationObserver && elementQueues.length > 0) {
        enqueuePendingMutationRecords();
    }

    // HTML Standard: "Enqueue a custom element upgrade reaction" algorithm
    // https://html.spec.whatwg.org/multipage/scripting.html#enqueue-a-custom-element-upgrade-reaction

    // 1.   Add a new upgrade reaction to `element`'s custom element reaction queue,
    //      with custom element definition `definition`.
    props.reactionQueue[props.reactionQueue.length] = upgradeElement.bind(null, props);

    // 2.   Enqueue an element on the appropriate element queue given `element`.
    enqueueElement(props);
}

/**
 * Takes the appropriate actions for a node that was recently connected to the
 *    document, as well as for all of its descendants.
 * 
 * @param {Node} node - The node that was connected.
 * @param {Array.<CustomElementProperties>} connected - An ongoing list of custom
 *   elements for which a connectedCallback should be enqueued.
 * @param {Array.<CustomElementProperties>} upgraded - An ongoing list of custom
 *   elements that are being upgraded by the current call to
 *   enqueueChildListRecords.
 */
function enqueueAddedNode(node, connected, upgraded) {
    var definition, props, ownerDocument, docProps, children, l, i;

    if (Node_get_nodeType.call(node) !== 1) {
        return;
    }

    definition = CustomElementDefinition.fromElement(node);

    if (definition) {
        props = CustomElementProperties.get(node);
        if (!props) {
            props = new CustomElementProperties(node, definition);
            upgraded[upgraded.length] = props;
            ownerDocument = Node_get_ownerDocument.call(node);
            if (!isDocumentReady(ownerDocument) && !common.usingReactionApi) {
                docProps = documents.get(ownerDocument) || new DocumentProperties(ownerDocument);
                if (docProps) {
                    docProps.throwOnDynamicMarkupInsertionCounter += 1;
                }
                pushQueue();
                try {
                    upgradeElement(props, true);
                } catch (ex) {
                    throwAsync(ex);
                }
                popQueue();
                if (docProps) {
                    docProps.throwOnDynamicMarkupInsertionCounter -= 1;
                }
            } else {
                enqueueUpgradeReaction(props);
            }
        } else {
            props.parentNodeChanged = true;
            if (props.state !== states.failed && props.state !== states.uncustomized && !arrayContains(connected, props) && !arrayContains(upgraded, props)) {
                connected[connected.length] = props;
            }
        }
    }

    children = node instanceof elementTypeWithChildrenProperty ? Element_get_children.call(node) : [];
    l = children.length;

    for (i = 0; i < l; i++) {
        enqueueAddedNode(children[i], connected, upgraded);
    }
}
/**
 * Takes the appropriate actions for a node that was recently disconnected from
 *   the document, as well as for all of its descendants.
 * 
 * @param {Node} node - The node that was disconnected.
 */
function enqueueRemovedNode(node) {
    var props, children, l, i;

    if (Node_get_nodeType.call(node) !== 1) {
        return;
    }

    props = CustomElementProperties.get(node);
    if (props) {
        enqueueCallbackReaction(props, DISCONNECTED_CALLBACK);
    }
    if (node instanceof elementTypeWithChildrenProperty) {
        children = Element_get_children.call(node);
        for (i = 0, l = children.length; i < l; i++) {
            enqueueRemovedNode(children[i]);
        }
    }
}
/**
 * Enqueues any appropriate "attributeChangedCallback" reactions based on the
 *   provided collection of MutationRecord objects.
 * 
 * @param {Array.<MutationRecord>} records - The mutation records that will
 *   be processed.
 */
function enqueueAttributeRecords(records) {
    var l = records.length,
        i, record;
    if (l === 0 || !reactionsEnabled) {
        return;
    }
    enqueueingFromMutationObserver = true;
    for (i = 0; i < l; i++) {
        record = records[i];
        enqueueCallbackReaction(record.target, ATTRIBUTE_CALLBACK, [
            record.attributeName,
            record.oldValue,
            Element_getAttributeNS.call(record.target, record.attributeNamespace, record.attributeName),
            record.attributeNamespace
        ]);
    }
    enqueueingFromMutationObserver = false;
}
/**
 * Enqueues any appropriate custom element reactions based on the provided
 *   collection of MutationRecord objects.
 * 
 * @param {Array.<MutationRecord>} records - The mutation records that will
 *   be processed.
 */
function enqueueChildListRecords(records) {
    var l = records.length,
        /// <var type="Array" elementType="CustomElementProperties" />
        connected = [],
        /// <var type="Array" elementType="CustomElementProperties" />
        upgraded = [],
        i, record, j, k, added, removed;

    if (l === 0 || !reactionsEnabled) {
        return;
    }

    enqueueingFromMutationObserver = true;

    for (i = 0; i < l; i++) {
        record = records[i];

        // 1. Enqueue upgrade reactions for added elements that have not yet been upgraded
        added = record.addedNodes;
        k = added.length;
        for (j = 0; j < k; j++) {
            enqueueAddedNode(added[j], connected, upgraded);
        }

        // 2. Enqueue disconnectedCallbacks for removed custom elements
        removed = record.removedNodes;
        k = removed.length;
        for (j = 0; j < k; j++) {
            enqueueRemovedNode(removed[j]);
        }
    }

    // 3. Enqueue connectedCallbacks for added elements that have already been upgraded
    l = connected.length;
    for (i = 0; i < l; i++) {
        enqueueCallbackReaction(connected[i], CONNECTED_CALLBACK);
    }

    enqueueingFromMutationObserver = false;
}
/**
 * Takes all pending MutationRecords directly from the global attributeObserver
 *   and childListObserver, and immediately enqueues any custom element reactions
 *   derived from those records.
 */
function enqueuePendingMutationRecords() {
    var childListRecords = takeRecords(childListObserver),
        c = childListRecords.length,
        attributeRecords = takeRecords(attributeObserver),
        a = attributeRecords.length;
    if (c > 0) {
        enqueueChildListRecords(childListRecords);
    }
    if (a > 0) {
        enqueueAttributeRecords(attributeRecords);
    }
}
/**
 * Empties the lists of suspended MutationRecords, and enqueues any custom element
 *   reactions derived from the records in those lists.
 */
function enqueueSuspendedMutationRecords() {
    var c = suspendedChildListRecords.length,
        a = suspendedAttributeRecords.length;
    if (c > 0) {
        enqueueChildListRecords(suspendedChildListRecords);
        suspendedChildListRecords.length = 0;
    }
    if (a > 0) {
        enqueueAttributeRecords(suspendedAttributeRecords);
        suspendedAttributeRecords.length = 0;
    }
}
/**
 * Takes all pending MutationRecords from the global MutationObservers, and
 *   suspends those records until there are no more element queues in the
 *   reaction stack, when they will then be enqueued into the backup
 *   element queue.
 */
function suspendMutationRecords() {
    var records = takeRecords(attributeObserver),
        l = records.length,
        s = suspendedAttributeRecords.length,
        i = 0;
    while (i < l) {
        suspendedAttributeRecords[s + i] = records[i];
        i++;
    }
    records = takeRecords(childListObserver);
    l = records.length;
    s = suspendedChildListRecords.length;
    i = 0;
    while (i < l) {
        suspendedChildListRecords[s + i] = records[i];
        i++;
    }
}

/**
 * Invokes the provided callback function using the provided custom element as the
 *   context ('this') object, and with optional array of arguments.
 *
 * @param {function} callback - The callback to invoke.
 * @param {CustomElementProperties} props - The CustomElementProperties of the element
 *   that will be used as the context ('this') object for the callback.
 * @param {Array} [args] - An optional array containing the arguments to send to
 *   the callback function.
 * 
 * @returns {*} The return value of the invoked callback.
 */
function invokeCallback(callback, props, args) {
    return callback.apply(props.element, args);
}
/**
 * Upgrades the specified custom element in accordance with its associated custom
 *   element definition.
 * 
 * @param {CustomElementProperties} props - The CustomElementProperties of the
 *   element that will be upgraded.
 * @param {boolean} [synchronous] - Whether or not the synchronous custom elements
 *   flag should be set during the upgrade. Defaults to false.
 */
function upgradeElement(props, synchronous) {
    var definition = props.definition,
        attributes, attribute, i, l,
        constructError, constructResult;

    // HTML Standard: "Upgrade a Custom Element" algorithm
    // https://html.spec.whatwg.org/multipage/scripting.html#concept-upgrade-an-element

    // To upgrade an element, given as input a custom element definition `definition`
    // and an element `element`, run the following steps:

    // 1.   If `element` is custom, abort these steps.
    // 2.   If `element`'s custom element state is "failed", then abort these steps.
    if (props.state === states.custom || props.state === states.failed) {
        return;
    }

    // 3.   For each `attribute` in `element`'s attribute list, in order, enqueue a
    //      custom element callback reaction with `element`, callback name
    //      "attributeChangedCallback", and an argument list containing `attribute`'s
    //      local name, null, `attribute`'s value, and `attribute`'s namespace.
    attributes = Element_get_attributes.call(props.element);
    i = 0;
    l = attributes.length;
    while (i < l) {
        attribute = attributes[i++];
        enqueueCallbackReaction(props, ATTRIBUTE_CALLBACK, [
            Attr_get_localName.call(attribute),
            null,
            Attr_get_value.call(attribute),
            Attr_get_namespaceURI.call(attribute)
        ]);
    }

    // 4.   If `element` is connected, then enqueue a custom element callback reaction
    //      with `element`, callback name "connectedCallback", and an empty argument list.
    if (Node_get_isConnected.call(props.element)) {
        enqueueCallbackReaction(props, CONNECTED_CALLBACK);
    }

    // 5.   Add `element` to the end of `definition`'s construction stack.
    definition.constructionStack.push(props);

    // 6.   Let `C` be `definition`'s constructor.
    // 7.   Let `constructResult` be Construct(`C`).
    common.nextElementIsSynchronous = true;
    try {
        constructResult = definition.constructElement();
    } catch (ex) {
        constructError = ex;
    }
    common.nextElementIsSynchronous = false;

    // 8.   Remove the last entry from the end of `definition`'s construction stack.
    definition.constructionStack.pop();

    // 9.   If `constructResult` is an abrupt completion, then:
    if (constructError) {

        // 9.1.     Set `element`'s custom element state to "failed".
        props.state = STATES.FAILED;

        // 9.2.     Return `constructResult` (i.e., rethrow the exception), and terminate
        //          these steps.
        throw constructError;
    }

    // 10.  If SameValue(constructResult.[[value]], `element`) is false, then throw an
    //      "InvalidStateError" DOMException and terminate these steps.
    if (constructResult !== props.element) {
        throw new DOMException("Custom element constructors cannot return a different object.", 'InvalidStateError');
    }

    // 11.  Set `element`'s custom element state to "custom".
    // 12.  Set `element`'s custom element definition to `definition`.
    definition.finalizeElement(props);
}

/**
 * Ensures that the provided Document (or the ownerDocument of the provided Node)
 *   is being watched for connected and disconnected custom elements, and that its
 *   'throw on dynamic markup insertion counter' has been initialized.
 * 
 * @param {Node|Document} node - The document to observe, or the Node whose
 *   ownerDocument should be observed.
 * 
 * @returns {?DocumentProperties} The DocumentProperties for the document, containing
 *   its 'throw on dynamic markup insertion' counter. Returns null if no document
 *   could be derived from the parameter.
 */
function observeDocument(node) {
    var document;
    if (isPrototypeOf(DocumentProto, node)) {
        document = node;
    } else if (isPrototypeOf(NodeProto, node)) {
        document = Node_get_ownerDocument.call(node);
    }
    if (!document) {
        return null;
    }
    return documents.get(document) || new DocumentProperties(document);
}
/**
 * Watches the provided custom element for attribute changes.
 * 
 * @param {HTMLElement|CustomElementProperties} element - The custom element (or the
 *   CustomElementProperties for the element) to observe.
 */
function observeElement(element) {
    var props = CustomElementProperties.get(element),
        definition = props ? props.definition : null;
    if (!definition || definition.observedAttributes.length < 1) {
        return;
    }
    attributeObserver.observe(props.element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: definition.observedAttributes
    });
}
/**
 * Pops the current element queue off of the reaction stack and invokes the
 *   enqueued reactions for all elements within it.
 */
function popQueue() {
    var l = elementQueues.length,
        queue;

    if (l > 0) {
        enqueuePendingMutationRecords();
        queue = elementQueues[--l];
        elementQueues.length = l;
        currentElementQueue = l > 0 ? elementQueues[l - 1] : null;
        queue.invoke();
        if (l < 1) {
            // If the reaction stack has no more element queues, then enqueue any
            // MutationRecords that were suspended previously.
            enqueueSuspendedMutationRecords();
        }
    }
}
/**
 * Adds a new element queue to the end of the reaction stack.
 */
function pushQueue() {
    var queue = new ElementQueue(),
        l = elementQueues.length;

    if (l === 0) {
        suspendMutationRecords();
    } else {
        enqueuePendingMutationRecords();
    }

    elementQueues[l] = queue;
    currentElementQueue = queue;
}

backupElementQueue = new ElementQueue();
attributeObserver = new MutationObserver(enqueueAttributeRecords);
childListObserver = new MutationObserver(enqueueChildListRecords);

enabledDescriptor = {
    get: function () {
        return reactionsEnabled;
    },
    set: function (value) {
        value = !!value;
        if (value === reactionsEnabled) {
            return;
        }
        value ? enableReactions() : disableReactions();
    }
};

Object.defineProperty(common, 'reactionsEnabled', enabledDescriptor);

module.exports = Object.defineProperties({}, {
    enabled: enabledDescriptor,

    enqueueCallbackReaction: {
        value: enqueueCallbackReaction
    },
    enqueueUpgradeReaction: {
        value: enqueueUpgradeReaction
    },

    observeDocument: {
        value: observeDocument
    },
    observeElement: {
        value: observeElement
    },
    popQueue: {
        value: popQueue
    },
    pushQueue: {
        value: pushQueue
    },

    upgradeElement: upgradeElement
});

},{"./common":5,"./custom-element-definition":8,"./custom-element-properties":9,"./private-property-provider":16}],18:[function(require,module,exports){
'use strict';

var common = require('./common'),
    createElementInternal = require('./create-element'),
    CustomElementDefinition = require('./custom-element-definition'),
    CustomElementProperties = require('./custom-element-properties'),
    reactions = require('./reactions'),

    DocumentProto = window.Document.prototype,
    ElementProto = window.Element.prototype,
    HTMLDocumentProto = window.HTMLDocument.prototype,
    HTMLElementProto = window.HTMLElement.prototype,
    Object = window.Object,
    NodeProto = window.Node.prototype,
    String = window.String,

    defineProperties = Object.defineProperties,
    defineProperty = Object.defineProperty,
    getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
    getOwnPropertyNames = Object.getOwnPropertyNames,
    hasOwnProperty = common.hasOwnProperty,
    isPrototypeOf = common.isPrototypeOf,

    Document_adoptNode = DocumentProto.adoptNode,
    Document_close = DocumentProto.close,
    Document_createElement = DocumentProto.createElement,
    Document_createElementNS = DocumentProto.createElementNS,
    Document_importNode = DocumentProto.importNode,
    Document_open = DocumentProto.open,
    Document_write = DocumentProto.write,
    Document_writeln = DocumentProto.writeln,

    Element_getAttributeNS = ElementProto.getAttributeNS,
    Element_setAttributeNode = ElementProto.setAttributeNode,
    Element_get_attributes = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'attributes') ? ElementProto : NodeProto, 'attributes').get,
    Element_get_localName = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'localName') ? ElementProto : NodeProto, 'localName').get,
    Element_get_namespaceURI = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'namespaceURI') ? ElementProto : NodeProto, 'namespaceURI').get,

    Node_appendChild = NodeProto.appendChild,
    Node_cloneNode = NodeProto.cloneNode,
    Node_get_childNodes = getOwnPropertyDescriptor(NodeProto, 'childNodes').get,
    Node_get_isConnected = getOwnPropertyDescriptor(NodeProto, 'isConnected').get,
    Node_get_ownerDocument = getOwnPropertyDescriptor(NodeProto, 'ownerDocument').get,
    Node_get_parentNode = getOwnPropertyDescriptor(NodeProto, 'parentNode').get,
    Node_get_nodeType = getOwnPropertyDescriptor(NodeProto, 'nodeType').get,

    String_split = String.prototype.split,

    ADOPTED_CALLBACK = common.callbackNames.adopted,
    arrayFrom = Array.from,
    DOMException = window.DOMException,
    HTML_NAMESPACE = common.htmlNamespace,
    isArray = Array.isArray,
    shimMap = new WeakMap(),
    TypeError = window.TypeError,
    undefined = void 0;

/**
 * @param {Node} node
 * @param {Document} doc
 * @param {boolean} [deep]
 * @param {?number} [nodeType]
 * @returns {Node}
 */
function cloneNode(node, doc, deep, nodeType) {
    // 'nodeType' may be passed as an optimization to skip the 'instanceof HTMLElement'
    // test if we've already checked its nodeType (and verified that it is not 1).
    var localName, namespace, is, definition, copy, attributes, children, i, l,
        couldBeElement = (nodeType == null || nodeType === 1),
        isHtmlElement = couldBeElement ? isPrototypeOf(HTMLElementProto, node) : false,
        isElement = isHtmlElement ? true : (nodeType === 1 ? true : (couldBeElement ? isPrototypeOf(ElementProto, node) : false)),
        isDocument = isElement ? false : (nodeType === 9 || (nodeType == null && isPrototypeOf(DocumentProto, node)));

    // DOM Standard: "Clone a node" algorithm
    // https://dom.spec.whatwg.org/#concept-node-clone

    // To clone a `node`, with an optional `document` and `clone children flag`, run these steps:

    //  1.  If `document` is not given, let `document` be `node`'s node document.
    if (!doc) {
        doc = Node_get_ownerDocument.call(node);
    }

    if (isElement) {
        //  2.      If `node` is an element, then:
        //  2.1.    Let `copy` be the result of creating an element, given `document`, `node`'s local name,
        //          `node`'s namespace, `node`'s namespace prefix, and the value of `node`'s "is" attribute
        //          if present (or null if not). The synchronous custom elements flag should be unset.
        //  2.2.    For each `attribute` in `node`'s attribute list:
        //  2.2.1.      Let `copyAttribute` be a clone of `attribute`.
        //  2.2.2.      Append `copyAttribute` to `copy`.

        // Step 2.2. is only performed for custom elements, since non-custom elements
        // are sent to the native Node.prototype.cloneNode.

        if (isHtmlElement) {
            localName = Element_get_localName.call(node);
            namespace = Element_get_namespaceURI.call(node);
            is = Element_getAttributeNS.call(node, null, 'is') || null;
            definition = CustomElementDefinition.lookup(doc, namespace, localName, is);
        }
        if (definition) {
            // Invoke the "create an element" algorithm if `node` is a custom element.
            // We can safely pass the "prefix" argument as null, since we know we're
            // creating a custom element in this case.
            copy = createElementInternal(doc, localName, namespace, null, is, false, definition);
            attributes = Element_get_attributes.call(copy);
            for (i = 0, l = attributes.length; i < l; i++) {
                Element_setAttributeNode.call(copy, Node_cloneNode.call(attributes[i]));
            }
        } else {
            copy = Node_cloneNode.call(node, false);
        }
    } else {
        //  3.  Otherwise, let `copy` be a node that implements the same interfaces as `node`,
        //      and fulfills these additional requirements, switching on `node`:

        // Requirements omitted. If `node` is not an Element, then we simply defer to the
        // native Node.prototype.cloneNode().
        copy = Node_cloneNode.call(node, false);
    }

    //  4.  Set `copy`'s node document and `document` to `copy`, if `copy` is a document, and
    //      set `copy`'s node document to `document` otherwise.
    if (isDocument) {
        doc = copy;
    }

    //  5.  Run any cloning steps defined for `node` in other applicable specifications and
    //      pass `copy`, `node`, `document` and the `clone children flag` if set, as parameters.

    if (deep) {
        //  6.  If the `clone children flag` is set, clone all the children of `node` and append
        //      them to `copy`, with `document` as specified and the `clone children flag` being set.
        children = Node_get_childNodes.call(node);
        for (i = 0, l = children.length; i < l; i++) {
            Node_appendChild.call(copy, cloneNode(children[i], doc, true));
        }
    }

    //  7.  Return `copy`.
    return copy;
}

/**
 * @param {string} method
 * @returns {string}
 */
function getDocumentMarkupInsertionError(method) {
    return "Failed to execute '" + method + "' on 'Document': " + method + "() may not be invoked on a Document from within the constructor of a custom element belonging to that Document.";
}

/**
 * @param {object} target
 * @returns {object}
 */
function getShimmedPropertyNames(target) {
    var names = shimMap.get(target);
    if (!names) {
        names = {};
        shimMap.set(target, names);
    }
    return names;
}
/**
 * @param {object} thisArg
 * @param {Array} args
 */
function observeInvolvedDocuments(thisArg, args) {
    var i = args.length;
    reactions.observeDocument(thisArg);
    while (i--) {
        reactions.observeDocument(args[i]);
    }
}

function beginReactionShim() {
    common.incrementShimStack();
    reactions.pushQueue();
}
function endReactionShim() {
    reactions.popQueue();
    common.decrementShimStack();
}

/**
 * @param {function} method
 * @param {object} thisArg
 * @param {Array} args
 */
function invokeShim(method, thisArg, args) {
    observeInvolvedDocuments(thisArg, args);
    beginReactionShim();
    try {
        return method.apply(thisArg, args);
    } finally {
        endReactionShim();
    }
}

/**
 * @param {object} target
 * @param {string} name
 * @param {function|object} [customShim]
 * @param {object} [shimmedProps]
 */
function shimMember(target, name, customShim, shimmedProps) {
    var descriptor = getOwnPropertyDescriptor(target, name),
        isDataDescriptor = descriptor && hasOwnProperty(descriptor, 'value'),
        oldMethod = descriptor && (isDataDescriptor ? descriptor.value : descriptor.set),
        newDescriptor, newGetter, newMethod;

    if (!descriptor || !descriptor.configurable || (isDataDescriptor && typeof oldMethod !== 'function')) {
        // Abort if the property is not found or is not configurable.
        // Data descriptors with non-function values don't need to be shimmed, and neither
        // do accessor descriptors with no setter methods.
        return;
    }

    if (!shimmedProps) {
        shimmedProps = getShimmedPropertyNames(target);
        if (hasOwnProperty(shimmedProps, name)) {
            // If the member has already been shimmed, then abort.
            return;
        }
    }
    shimmedProps[name] = true;

    newDescriptor = {
        configurable: true,
        enumerable: descriptor.enumerable
    };
    if (customShim && typeof customShim !== 'function') {
        if (typeof customShim.get === 'function') {
            newGetter = customShim.get;
        }
        customShim = (typeof customShim.set === 'function') ? customShim.set : null;
    }

    if (oldMethod) {
        newMethod = (function () {
            var invoke = invokeShim.bind(null, (customShim || oldMethod));
            return function () {
                return invoke(this, arrayFrom(arguments));
            };
        })();
    }

    if (isDataDescriptor) {
        newDescriptor.value = newMethod;
        newDescriptor.writable = descriptor.writable;
    } else {
        newDescriptor.get = newGetter || descriptor.get;
        if (newMethod) {
            newDescriptor.set = newMethod;
        }
    }

    defineProperty(target, name, newDescriptor);
}
/**
 * @param {object} target
 * @param {Array.<string>|object} properties
 */
function shimMembers(target, properties) {
    var names, name, shim, shimmedProps, i, l;

    if (isArray(properties)) {
        i = properties.length;
        while (i--) {
            shimMember(target, String(properties[i]));
        }
        return;
    }

    properties = Object(properties);
    names = getOwnPropertyNames(properties);
    shimmedProps = getShimmedPropertyNames(target);
    i = 0;
    l = names.length;
    while (i < l) {
        name = names[i++];
        shim = properties[name];
        if (hasOwnProperty(target, name) && !hasOwnProperty(shimmedProps, name) && (typeof shim === 'function' || (shim && typeof shim.get === 'function' || typeof shim.set === 'function'))) {
            shimMember(target, name, shim, shimmedProps);
        }
    }
}

/**
 * Shims the method or property on the specified target object with the provided
 *   name to allow it to trigger custom element reactions in accordance with the
 *   [CEReactions] WebIDL extended attribute.
 * 
 * @param {object|function} target - The target object whose method or property
 *   will be shimmed, or the constructor function whose prototype method or
 *   property will be shimmed.
 * @param {string|object} property - The name of a property or method to shim,
 *   or an object where each property is a property name, and each value is a
 *   custom shim for that property (either a function or an object with 'get' and
 *   'set' function properties).
 * @param {...string|object} [properties...]
 */
function shim() {
    var l = arguments.length,
        i = 1,
        members = [],
        m = 0,
        target, arg, member;

    if (l < 2) {
        return;
    }
    target = arguments[0];
    if (typeof target === 'function') {
        target = target.prototype;
    }
    if (target == null || typeof target !== 'object') {
        return;
    }

    while (i < l) {
        arg = arguments[i++];
        if (arg != null && typeof arg === 'object') {
            shimMembers(target, arg);
        } else {
            member = String(arg || '');
            if (member) {
                members[m++] = member;
            }
        }
    }
    shimMembers(target, members);
}

shim(window.CharacterData,
    'after', 'before', 'remove', 'replaceWith');
shim(DocumentProto,
    'alinkColor', 'append', 'bgColor', 'body', 'designMode', 'dir', 'execCommand', 'fgColor', 'linkColor',
    'prepend', 'title', 'vlinkColor',
    {
        adoptNode: function adoptNode(node) {
            var currentDocument = Node_get_ownerDocument.call(node),
                oldDocument = isPrototypeOf(NodeProto, node) ? currentDocument : null,
                result = Document_adoptNode.apply(this, arrayFrom(arguments));
            if (currentDocument === this && this !== oldDocument) {
                reactions.enqueueCallbackReaction(node, ADOPTED_CALLBACK, [oldDocument, this]);
            }
            return result;
        },
        close: function close() {
            var docProps = reactions.observeDocument(this);
            if (docProps && docProps.throwOnDynamicMarkupInsertionCounter > 0) {
                throw new DOMException(getDocumentMarkupInsertionError('close'), 'InvalidStateError');
            }
            return Document_close.apply(this, arrayFrom(arguments));
        },
        createElement: function createElement(tagName, options) {
            var isHtmlDocument = isPrototypeOf(HTMLDocumentProto, this),
                localName, is, element;
            if (isHtmlDocument) {
                reactions.observeDocument(this);
            }
            if (!isHtmlDocument || arguments.length === 0) {
                return Document_createElement.apply(this, arrayFrom(arguments));
            }
            localName = String(tagName);
            options = options == null ? null : options.valueOf();
            if (options != null) {
                is = String(options instanceof Object && options.is !== undefined ? options.is : options);
            }
            beginReactionShim();
            element = createElementInternal(this, localName, HTML_NAMESPACE, null, is, true, null, Document_createElement, this, arguments);
            endReactionShim();
            return element;
        },
        createElementNS: function createElementNS(namespaceURI, qualifiedName, options) {
            var isHtmlDocument = isPrototypeOf(HTMLDocumentProto, this),
                name = String(qualifiedName),
                parts = String_split.call(name, ':'),
                l = parts.length,
                localName = parts[l > 1 ? 1 : 0],
                prefix = l > 1 ? parts[0] : null,
                is, element;
            if (isHtmlDocument) {
                reactions.observeDocument(this);
            }
            if (!isHtmlDocument || arguments.length < 2 || parts.length > 2) {
                return Document_createElementNS.apply(this, arrayFrom(arguments));
            }
            options = options == null ? null : options.valueOf();
            if (options != null) {
                is = String(options instanceof Object && options.is !== undefined ? options.is : options);
            }
            beginReactionShim();
            element = createElementInternal(this, localName, namespaceURI, prefix, is, true, null, Document_createElementNS, this, arguments);
            endReactionShim();
            return element;
        },
        importNode: function importNode(node, deep) {
            var isNode = isPrototypeOf(DocumentProto, this) && isPrototypeOf(NodeProto, node),
                nodeType = isNode ? Node_get_nodeType.call(node) : null;

            // importNode works similarly to Node.prototype.cloneNode, with two extra stipulations:
            //  1. The resulting node's ownerDocument must be the current context object
            //  2. The `node` parameter may not be a Document node (nodeType 9), nor may it be
            //     a shadow root (nodeType 11).
            if (nodeType == null || nodeType === 9 || nodeType === 11) {
                return Document_importNode.apply(this, arrayFrom(arguments));
            }
            return cloneNode(node, this, deep, nodeType);
        },
        open: function open() {
            var docProps;
            if (args.length > 2) {
                // Defer to the native Document.prototype.open(). When called with 3 arguments, it
                // should instead act as an alias for Window.prototype.open().
                return Document_open.apply(this, arrayFrom(arguments));
            }
            docProps = reactions.observeDocument(this);
            if (docProps && docProps.throwOnDynamicMarkupInsertionCounter > 0) {
                throw new DOMException(getDocumentMarkupInsertionError('open'), 'InvalidStateError');
            }
            return Document_open.apply(this, arrayFrom(arguments));
        },
        write: function write() {
            var docProps = reactions.observeDocument(this);
            if (docProps && docProps.throwOnDynamicMarkupInsertionCounter > 0) {
                throw new DOMException(getDocumentMarkupInsertionError('write'), 'InvalidStateError');
            }
            return Document_write.apply(this, arrayFrom(arguments));
        },
        writeln: function writeln() {
            var docProps = reactions.observeDocument(this);
            if (docProps && docProps.throwOnDynamicMarkupInsertionCounter > 0) {
                throw new DOMException(getDocumentMarkupInsertionError('writeln'), 'InvalidStateError');
            }
            return Document_writeln.apply(this, arrayFrom(arguments));
        }
    });
shim(window.DocumentFragment,
    'append', 'prepend');
shim(window.DocumentType,
    'after', 'before', 'remove', 'replaceWith');
shim(window.DOMTokenList,
    'add', 'remove', 'replace', 'toggle', 'value');
shim(ElementProto,
    'after', 'append', 'before', 'prepend', 'remove', 'removeAttribute', 'removeAttributeNS', 'replaceWith',
    'setAttribute', 'setAttributeNS', 'setAttributeNode', 'setAttributeNodeNS', 'slot', 'removeAttributeNode',
    'insertAdjacentElement');
// The properties and methods shimmed in the next statement are supposed to belong
// to Element.prototype according to the specification, but in IE 11 they belong to
// HTMLElement.prototype instead.
shim(hasOwnProperty(ElementProto, 'id') ? ElementProto : HTMLElementProto,
    'children', 'classList', 'className', 'id');
shim(window.NamedNodeMap,
    'setNamedItem', 'setNamedItemNS', 'removeNamedItem', 'removeNamedItemNS');
shim(NodeProto, 'appendChild', 'insertBefore', 'nodeValue', 'normalize', 'removeChild', 'replaceChild',
    'textContent',
    {
        cloneNode: function cloneNode(deep) {
            var isNode = isPrototypeOf(NodeProto, this),
                nodeType = isNode ? Node_get_nodeType.call(this) : null;
            if (nodeType == null || nodeType === 11) {
                // A nodeType of 11 indicates a shadow root, which can't be cloned. In cases
                // where a shadow root is passed, we defer to the native Node.prototype.cloneNode()
                // to come up with the error.
                return Node_cloneNode.apply(this, arrayFrom(arguments));
            }
            return cloneNode(this, null, deep, nodeType);
        }
    });
shim(window.Range,
    'cloneContents', 'deleteContents', 'extractContents', 'insertNode', 'surroundContents');

// Read-only properties of Node.prototype with new behavior
defineProperties(NodeProto, {
    isConnected: {
        configurable: true,
        enumerable: true,
        get: function () {
            var props;
            if (!isPrototypeOf(NodeProto, this)) {
                throw new TypeError(common.illegalInvocation);
            }
            props = CustomElementProperties.get(this);
            return (props && props.checkingConformance && !props.parentNodeChanged) ? false : Node_get_isConnected.call(this);
        }
    },
    parentNode: {
        configurable: true,
        enumerable: true,
        get: function () {
            var props = CustomElementProperties.get(this);
            if (props && props.checkingConformance && !props.parentNodeChanged) {
                return null;
            }
            return Node_get_parentNode.call(this);
        }
    }
});
// IE 11 mistakenly defines "parentElement" on HTMLElement.prototype instead of Node.prototype
defineProperty(hasOwnProperty(HTMLElementProto, 'parentElement') ? HTMLElementProto : NodeProto, 'parentElement', {
    configurable: true,
    enumerable: true,
    get: function () {
        var props, parentNode;
        if (!isPrototypeOf(NodeProto, this)) {
            throw new TypeError(common.illegalInvocation);
        }
        props = CustomElementProperties.get(this);
        if (props && props.checkingConformance && !props.parentNodeChanged) {
            return null;
        }
        parentNode = Node_get_parentNode.call(this);
        return parentNode instanceof Element ? parentNode : null;
    }
});

shim(window.HTMLAnchorElement,
    'coords', 'charset', 'download', 'hreflang', 'name', 'ping', 'referrerPolicy', 'rel', 'relList', 'rev',
    'shape', 'target', 'text', 'type',
    // The remaining members are part of the HTMLHyperlinkElementUtils interface
    'hash', 'host', 'hostname', 'href', 'password', 'pathname', 'port', 'protocol', 'search', 'username');
shim(window.HTMLAreaElement,
    'alt', 'coords', 'download', 'ping', 'referrerPolicy', 'rel', 'relList', 'shape', 'target',
    // The remaining members are part of the HTMLHyperlinkElementUtils interface
    'hash', 'host', 'hostname', 'href', 'password', 'pathname', 'peort', 'protocol', 'search', 'username');
shim(window.HTMLBaseElement,
    'href', 'target');
shim(window.HTMLBodyElement,
    'background', 'bgColor', 'aLink', 'link', 'text', 'vLink');
shim(window.HTMLButtonElement,
    'autofocus', 'disabled', 'formAction', 'formEnctype', 'formMethod', 'formNoValidate', 'formTarget',
    'menu', 'name', 'type', 'value');
shim(window.HTMLCanvasElement,
    'height', 'width');
shim(window.HTMLDetailsElement,
    'open');
shim(window.HTMLDialogElement,
    'close', 'open', 'show', 'showModal');
shim(window.HTMLDivElement,
    'align');
shim(HTMLElementProto,
    'accessKey', 'contentEditable', 'contextMenu', 'dir', 'draggable', 'dropzone', 'hidden', 'innerText',
    'lang', 'spellcheck', 'tabIndex', 'title', 'translate');
shim(window.HTMLEmbedElement,
    'align', 'name');
shim(window.HTMLFieldSetElement,
    'disabled', 'name');
shim(window.HTMLFontElement,
    'color', 'face', 'size');
shim(window.HTMLFormElement,
    'acceptCharset', 'action', 'autocomplete', 'encoding', 'enctype', 'method', 'name', 'noValidate', 'reset',
    'target');
shim(window.HTMLFrameElement,
    'cols', 'rows');
shim(window.HTMLFrameSetElement,
    'frameBorder', 'longDesc', 'marginHeight', 'marginWidth', 'name', 'noResize', 'scrolling', 'src');
shim(window.HTMLHRElement,
    'align', 'color', 'noShade', 'size', 'width');
shim(window.HTMLIFrameElement,
    'align', 'allowFullscreen', 'allowPaymentRequest', 'allowUserMedia', 'frameBorder', 'height', 'longDesc',
    'marginHeight', 'marginWidth', 'name', 'referrerPolicy', 'sandbox', 'scrolling', 'src', 'srcdoc', 'width');
// Image extends HTMLImageElement, and doesn't have any [CEReactions] members of its own
shim(window.HTMLImageElement,
    'align', 'alt', 'border', 'crossOrigin', 'height', 'hspace', 'isMap', 'longDesc', 'lowsrc', 'name',
    'referrerPolicy', 'sizes', 'src', 'srcset', 'useMap', 'vspace', 'width');
shim(window.HTMLInputElement,
    'accept', 'alt', 'autocomplete', 'autofocus', 'defaultChecked', 'defaultValue', 'dirName', 'disabled',
    'formAction', 'formEnctype', 'formMethod', 'formNoValidate', 'formTarget', 'height', 'inputMode', 'max',
    'maxLength', 'min', 'minLength', 'multiple', 'name', 'pattern', 'placeholder', 'readOnly', 'required',
    'size', 'src', 'step', 'type', 'value', 'width');
shim(window.HTMLLegendElement,
    'align');
shim(window.HTMLLIElement,
    'value');
shim(window.HTMLLinkElement,
    'as', 'charset', 'crossOrigin', 'href', 'hreflang', 'integrity', 'media', 'nonce', 'referrerPolicy', 'rel',
    'relList', 'rev', 'target', 'type', 'sizes');
shim(window.HTMLMapElement,
    'name');
shim(window.HTMLMarqueeElement,
    'behavior', 'bgColor', 'direction', 'height', 'hspace', 'loop', 'scrollAmount', 'scrollDelay', 'trueSpeed',
    'vspace', 'width');
shim(window.HTMLMediaElement,
    'autoplay', 'controls', 'crossOrigin', 'defaultMuted', 'loop', 'preload', 'src');
shim(window.HTMLMenuElement,
    'label', 'type');
shim(window.HTMLMenuItemElement,
    'checked', 'default', 'disabled', 'icon', 'label', 'radiogroup', 'type');
shim(window.HTMLMetaElement,
    'scheme');
shim(window.HTMLMeterElement,
    'high', 'low', 'max', 'min', 'optimum', 'value');
shim(window.HTMLModElement,
    'cite', 'dateTime');
shim(window.HTMLObjectElement,
    'align', 'archive', 'border', 'code', 'codeBase', 'codeType', 'data', 'declare', 'height', 'hspace', 'name',
    'standby', 'type', 'typeMustMatch', 'useMap', 'vspace', 'width')
shim(window.HTMLOListElement,
    'reversed', 'start', 'type');
shim(window.HTMLOptGroupElement,
    'disabled', 'label');
shim(window.HTMLOptionElement,
    'defaultSelected', 'disabled', 'label', 'text', 'value');
shim(window.HTMLOptionsCollection,
    'add', 'length', 'remove');
shim(window.HTMLOutputElement,
    'defaultValue', 'htmlFor', 'name', 'value');
shim(window.HTMLParagraphElement,
    'align');
shim(window.HTMLParamElement,
    'name', 'type', 'value', 'valueType');
shim(window.HTMLQuoteElement,
    'cite');
shim(window.HTMLScriptElement,
    'async', 'charset', 'crossOrigin', 'defer', 'event', 'htmlFor', 'integrity', 'noModule', 'nonce', 'src',
    'text', 'type');
shim(window.HTMLSelectElement,
    'add', 'autocomplete', 'autofocus', 'disabled', 'length', 'multiple', 'name', 'remove', 'required', 'size');
shim(window.HTMLSlotElement,
    'name');
shim(window.HTMLSourceElement,
    'media', 'sizes', 'src', 'srcset', 'type');
shim(window.HTMLStyleElement,
    'media', 'nonce', 'type');
shim(window.HTMLTableCaptionElement,
    'align');
shim(window.HTMLTableCellElement,
    'align', 'axis', 'abbr', 'bgColor', 'ch', 'chOff', 'colSpan', 'headers', 'height', 'noWrap', 'rowSpan', 'scope',
    'vAlign', 'width');
shim(window.HTMLTableColElement,
    'align', 'ch', 'chOff', 'span', 'vAlign', 'width');
shim(window.HTMLTableElement,
    'align', 'bgColor', 'border', 'caption', 'cellPadding', 'cellSpacing', 'deleteCaption', 'deleteTFoot',
    'deleteTHead', 'deleteRow', 'frame', 'rules', 'summary', 'tHead', 'tFoot', 'width');
shim(window.HTMLTableRowElement,
    'align', 'bgColor', 'ch', 'chOff', 'vAlign');
shim(window.HTMLTableSectionElement,
    'align', 'ch', 'chOff', 'deleteRow', 'vAlign');
shim(window.HTMLTextAreaElement,
    'autocomplete', 'autofocus', 'cols', 'defaultValue', 'dirName', 'disabled', 'inputMode', 'maxLength', 'minLength',
    'name', 'placeholder', 'readOnly', 'required', 'rows', 'value', 'wrap');
shim(window.HTMLTimeElement,
    'dateTime');
shim(window.HTMLTitleElement,
    'text');
shim(window.HTMLTrackElement,
    'default', 'kind', 'label', 'src', 'srclang');
shim(window.HTMLVideoElement,
    'height', 'playsInline', 'poster', 'width');

module.exports = {
    shim: shim
};

},{"./common":5,"./create-element":7,"./custom-element-definition":8,"./custom-element-properties":9,"./reactions":17}]},{},[1]);
