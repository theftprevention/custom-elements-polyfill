(function (global, undefined) {
    'use strict';

    var Array = global.Array,
        arrayContains,
        arrayFrom = Array.from,

        constructorIsClass = function constructorIsClass(constructor) { return false; },
        copyProperties,
        elementConstructorFromTagName,
        elementConstructorsByName = {},
        elementConstructorsByTagName = {},
        isKnownTagName,

        Array = global.Array,
        arrayContains,
        arrayFrom = Array.from,

        Object = global.Object,
        ObjectProto = Object.prototype,
        Object_toString = ObjectProto.toString,
        create = Object.create,
        defineProperties = Object.defineProperties,
        defineProperty = Object.defineProperty,
        hasOwnProperty,
        getOwnPropertyNames = Object.getOwnPropertyNames,
        getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
        getOwnPropertyDescriptors,
        getPrototypeOf,
        setPrototypeOf = Object.setPrototypeOf,

        document = global.document,
        Document = global.Document,
        DocumentProto = Document.prototype,
        Document_createElement = DocumentProto.createElement,
        Document_createElementNS = DocumentProto.createElementNS,
        Document_get_readyState = getOwnPropertyDescriptor(DocumentProto, 'readyState').get,

        DOMException = global.DOMException,

        Element = global.Element,
        ElementProto = global.Element.prototype,
        Element_getAttribute = ElementProto.getAttribute,
        Element_getAttributeNode = ElementProto.getAttributeNode,
        Element_getAttributeNodeNS = ElementProto.getAttributeNodeNS,
        Element_getAttributeNS = ElementProto.getAttributeNS,
        Element_hasAttribute = ElementProto.hasAttribute,
        Element_hasAttributeNS = ElementProto.hasAttributeNS,
        Element_removeAttribute = ElementProto.removeAttribute,
        Element_removeAttributeNode = ElementProto.removeAttributeNode,
        Element_removeAttributeNS = ElementProto.removeAttributeNS,
        Element_setAttribute = ElementProto.setAttribute,
        Element_setAttributeNode = ElementProto.setAttributeNode,
        Element_setAttributeNodeNS = ElementProto.setAttributeNodeNS,
        Element_setAttributeNS = ElementProto.setAttributeNS,

        Function_toString = global.Function.prototype.toString,

        /**
         * @param {function} constructor
         * @returns {function}
         */
        getProxiedConstructor = function getProxiedConstructor(constructor) { return constructor },
        globalEval = global.eval,

        HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml',

        HTMLElement = global.HTMLElement,
        HTMLElementProto = HTMLElement.prototype,

        HTMLUnknownElement = global.HTMLUnknownElement,
        HTMLUnknownElementProto = HTMLUnknownElement.prototype,

        ILLEGAL_CONSTRUCTOR = 'Illegal constructor',
        ILLEGAL_INVOCATION = 'Illegal invocation',
        isConnected,
        isPrototypeOf,
        MutationObserver = global.WebKitMutationObserver || global.MutationObserver,
        /**
         * The native CustomElementRegistry object (window.customElements), or null
         *   if no native implementation exists.
         *
         * @property {boolean} canExtend - Whether or not the native CustomElementRegistry
         *   implementation supports customized built-in elements.
         * @property {object} instance - The window.customElements instance.
         * @property {object} prototype - The native CustomElementRegistry.prototype object.
         */
        native,

        Node = global.Node,
        NodeProto = Node.prototype,
        Node_appendChild = NodeProto.appendChild,
        Node_removeChild = NodeProto.removeChild,
        Node_replaceChild = NodeProto.replaceChild,

        EventTarget = global.EventTarget,
        EventTarget_addEventListener = (EventTarget || Node).prototype.addEventListener,
        EventTarget_removeEventListener = (EventTarget || Node).prototype.removeEventListener,
        
        supportsClasses = (function () {
            try {
                eval('class A{}');
                return true;
            } catch (ex) {
                return false;
            }
        })(),
        SyntaxError = global.SyntaxError,
        TypeError = global.TypeError;

    (function setup() {

        /**
         * Determines whether an array contains a specific value.
         * 
         * @param {Array} array - The array to search.
         * @param {object} value - The value to search for in the array.
         * 
         * @returns {boolean}
         */
        arrayContains = function arrayContains(array, value) {
            var i;
            array = array instanceof Array ? array : (array == null ? null : arrayFrom(array));
            if (!array) {
                return false;
            }
            i = array.length;
            while (i--) {
                if (array[i] === value) {
                    return true;
                }
            }
            return false;
        };

        arrayFrom = arrayFrom || (function Array_from_polyfill() {

            var toStr = ObjectProto.toString,
                isCallable = function (fn) {
                    return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
                },
                toInteger = function (value) {
                    var number = Number(value);
                    if (isNaN(number)) { return 0; }
                    if (number === 0 || !isFinite(number)) { return number; }
                    return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
                },
                maxSafeInteger = Math.pow(2, 53) - 1,
                toLength = function (value) {
                    var len = toInteger(value);
                    return Math.min(Math.max(len, 0), maxSafeInteger);
                };

            function from(arrayLike) {
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
            Array.from = from;
            return from;
        }());

        constructorIsClass = (function () {
            if (!supportsClasses) {
                return function constructorIsClass(fn) { return false; };
            }

            return function constructorIsClass(fn) {
                var protoDescriptor;
                if (typeof fn !== 'function') {
                    return false;
                }

                // The test to determine whether a function is a class constructor is surprisingly
                // easy: for regular functions, the 'prototype' property is writable. For class
                // constructors, it is not.

                protoDescriptor = getOwnPropertyDescriptor(fn, 'prototype');
                return protoDescriptor ? !protoDescriptor.writable : false;
            };
        })();

        /**
         * @param {object} from
         * @param {object} to
         */
        copyProperties = function copyProperties(from, to) {
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
        };

        getOwnPropertyDescriptors = (function () {
            if (typeof Object.getOwnPropertyDescriptors === 'function') {
                return Object.getOwnPropertyDescriptors;
            }
            /** @returns {object} */
            return function getOwnPropertyDescriptors(O) {
                var names = getOwnPropertyNames(O),
                    i = 0,
                    l = names.length,
                    result = {},
                    name;
                while (i < l) {
                    name = names[i++];
                    result[name] = getOwnPropertyDescriptor(O, name);
                }
                return result;
            };
        })();

        getPrototypeOf = (function () {
            var _getPrototypeOf = Object.getPrototypeOf;
            if (typeof _getPrototypeOf !== 'function') {
                _getPrototypeOf = function (O) {
                    return O.__proto__;
                };
            }
            return _getPrototypeOf;
        })();

        hasOwnProperty = (function () {
            var _h = ObjectProto.hasOwnProperty;
            return function (O, prop) {
                return _h.call(O, prop);
            };
        })();

        isPrototypeOf = (function () {
            var _isPrototypeOf = ObjectProto.isPrototypeOf;
            /**
             * @param {object} parent
             * @param {object} child
             * @returns {boolean}
             */
            return function (parent, child) {
                return _isPrototypeOf.call(parent, child);
            };
        })();

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
            return {
                canExtend: (function () {
                    var name = 'custom-elements-polyfill-test',
                        tag = 'div',
                        constructor,
                        /// <var type="HTMLElement" />
                        e;
                    try {
                        constructor = eval("var a=class extends HTMLDivElement{constructor(){super();}};a;");
                        define(name, constructor, { 'extends': tag });
                        e = new constructor();
                        return (e && e instanceof global.HTMLDivElement && e.tagName.toLowerCase() === tag && Element_getAttribute.call(e, 'is') === name);
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
        })() : null;

    })();
    
    (function setupBuiltInElements() {

        var reg_htmlInterface = /^HTML(.+)Element$/,
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
            comparisonInterface = (HTMLUnknownElement || HTMLElement).prototype;

        getOwnPropertyNames(global).forEach(function (name) {
            var match = reg_htmlInterface.exec(name),
                interf, tags, isPredefined, element, i, l;
            if (!match) {
                return;
            }
            interf = global[name];
            if (!hasOwnProperty(interf, 'prototype') || !(interf.prototype instanceof HTMLElement)) {
                return;
            }
            elementConstructorsByName[name] = interf;
            tags = predefinedTagNames[name];
            isPredefined = hasOwnProperty(predefinedTagNames, name);
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
                    element = Document_createElementNS.call(document, HTML_NAMESPACE, tags[i]);
                    if (getPrototypeOf(element) === comparisonInterface) {
                        tags.pop();
                    }
                }
            }
            for (i = 0, l = tags.length; i < l; i++) {
                elementConstructorsByTagName[tags[i]] = interf;
            }
        });

        /**
         * @param {string} tagName
         * @returns {?function}
         */
        elementConstructorFromTagName = function (tagName) {
            return elementConstructorsByTagName[String(tagName)] || null;
        };

        /**
         * @param {string} tagName
         * @returns {boolean}
         */
        isKnownTagName = function (tagName) {
            return hasOwnProperty(elementConstructorsByTagName, tagName);
        };

    })();

    (function constructorProxies() {

        var proxies = new Map(),
            reg_ctorName = /^\s*(?:class|function)\s+([^\s\{\(]+)/,
            reg_objName = /^\[object (.+)\]$/,
            toStringTag = (typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol') ? Symbol.toStringTag : null;

        /**
         * @param {function} constructor
         * @returns {string}
         */
        function getConstructorName(constructor) {
            var match, obj;
            if (typeof constructor === 'function') {
                match = constructor.name;
                if (match && typeof match === 'string') {
                    return match;
                }
                match = reg_ctorName.exec(Function_toString.call(constructor));
                obj = constructor.prototype;
            } else {
                obj = constructor;
            }
            if (!match && obj instanceof Object) {
                if (toStringTag) {
                    match = obj[toStringTag];
                    if (match && typeof match === 'string') {
                        return match;
                    }
                }
                match = reg_objName.exec(Object_toString.call(obj));
            }
            return match ? (match[1] || null) : null;
        }

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
        function ConstructorProxy(constructor, finalConstructor, name, isElementInterface) {
            
            var constructorBody, hasBase, baseConstructor, basePrototype, prototype, declarationBody, source;
            
            this.originalConstructor = constructor;
            this.name = name || getConstructorName(constructor);

            proxies.set(constructor, this);
            proxies.set(constructor.prototype, this);
            
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

            this.finalConstructor = globalEval(source)(this, baseConstructor);
            
            copyProperties(constructor, this.finalConstructor);
            if (!this.isClass) {
                if (hasBase) {
                    this.finalConstructor.prototype = Object.create(basePrototype);
                }
                defineProperties(this.finalConstructor, {
                    apply: {
                        value: ConstructorProxy.prototype.apply.bind(this)
                    },
                    call: {
                        value: ConstructorProxy.prototype.call.bind(this)
                    }
                });
            }
            copyProperties(prototype, this.finalConstructor.prototype);
            if (this.name && toStringTag && !hasOwnProperty(this.finalConstructor.prototype, toStringTag)) {
                defineProperty(this.finalConstructor.prototype, toStringTag, {
                    configurable: true,
                    value: this.name
                });
            }

            proxies.set(this.finalConstructor.prototype, this);

            try {
                this.finalConstructor.prototype.constructor = this.finalConstructor;
            } catch (ex) { }
        }

        defineProperties(ConstructorProxy.prototype, {
            constructor: {
                value: ConstructorProxy
            },
            baseConstructor: {
                get: function () {
                    return this.baseProxy ? this.baseProxy.finalConstructor : null;
                }
                //value: null,
                //writable: true
            },
            baseIsClass: {
                get: function () {
                    return this.baseProxy ? this.baseProxy.isClass : false;
                }
                //value: false,
                //writable: true
            },
            baseProxy: {
                value: null,
                writable: true
            },
            isClass: {
                value: false,
                writable: true
            },

            apply: {
                value: function apply(thisArg, args) {
                    throw new TypeError("Class constructor " + (this.name ? this.name + ' ' : '') + "cannot be invoked without 'new'");
                }
            },
            call: {
                value: function call(thisArg, args) {
                    throw new TypeError("Class constructor " + (this.name ? this.name + ' ' : '') + "cannot be invoked without 'new'");
                }
            },

            init: {
                value: function a(thisArg, args) {
                    var baseResult, result;
                    args = arrayFrom(args);
                    if (!this.isClass && this.baseProxy && !this.baseIsClass) {
                        baseResult = this.baseProxy.init(thisArg, args);
                    } else {
                        baseResult = thisArg;
                    }
                    result = this.originalConstructor.apply(baseResult, args);
                    if (result === undefined) {
                        result = baseResult;
                    }
                    return result;
                }
            }
        });

        /**
         * @param {function} constructor
         * @param {function} [elementInterface]
         * @param {string} [elementInterfaceName]
         * @returns {?ConstructorProxy}
         */
        function getOrCreateProxy(constructor, elementInterface, elementInterfaceName) {
            var proxy = proxies.get(constructor.prototype) || proxies.get(constructor),
                isClass;
            if (proxy) {
                return proxy;
            }
            if (elementInterface) {
                return new ConstructorProxy(elementInterface, constructor, elementInterfaceName, true);
            } else {
                // Constructors that are already part of an ES6 class declaration don't
                // need to be proxied.
                isClass = constructorIsClass(constructor);
                return new ConstructorProxy(constructor, isClass ? constructor : null);
            }
        }

        getProxiedConstructor = function getProxiedConstructor(constructor, elementInterface, elementInterfaceName) {
            return getOrCreateProxy(constructor, elementInterface, elementInterfaceName).finalConstructor;
        };

    })();

    if (native && native.canExtend) {
        // If a native CustomElementRegistry exists, all we need to do is hook into
        // customElements.define() to ensure that any constructors passed to the native
        // define() method are turned into ES6 classes first.
        native.prototype.define = function define(name, constructor, options) {
            var args = arrayFrom(arguments);
            if (arguments.length > 1 && typeof constructor === 'function') {
                args[1] = getProxiedConstructor(constructor);
            }
            return native.define.apply(this, args);
        };
        return native.instance;
    }

    /*
     * All of the remaining functionality beyond this point assumes that the above check
     * failed; that is, either (a) the native customElements implementation supports
     * autonomous custom elements and NOT customized built-in elements, or (b) there is
     * no native customElements implementation at all.
     */

    (function customElementsPolyfill() {
        
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

        /**
         * An optional set of options used when defining a custom element via
         *   CustomElementRegistry.define().
         * 
         * @typedef {object} ElementDefinitionOptions
         * 
         * @property {string} extends - The name of the built-in element that
         *   the new custom element will extend.
         */

        var ADOPTED_CALLBACK = 'adoptedCallback',
            ATTRIBUTE_CALLBACK = 'attributeChangedCallback',
            CONNECTED_CALLBACK = 'connectedCallback',
            DISCONNECTED_CALLBACK = 'disconnectedCallback',
            CALLBACK_NAMES = [CONNECTED_CALLBACK, DISCONNECTED_CALLBACK, ADOPTED_CALLBACK, ATTRIBUTE_CALLBACK],
            /**
             * An enumeration containing the available custom element states.
             */
            STATES = {
                /**
                 * Indicates a custom element which was successfully upgraded with a
                 *   matching definition.
                 * @type {string}
                 */
                /// <field type="String">
                ///     Indicates a custom element which was successfully upgraded with a
                ///     matching definition.
                /// </field>
                CUSTOM: 'custom',
                /**
                 * Indicates a custom element which has a matching definition, but whose
                 *   upgrade reaction threw an error or was otherwise unsuccessful.
                 * @type {string}
                 */
                /// <field type="String">
                ///     Indicates a custom element which has a matching definition, but whose
                ///     upgrade reaction threw an error or was otherwise unsuccessful.
                /// </field>
                FAILED: 'failed',
                /**
                 * Indicates a custom element which has a matching definition, but has not
                 *   yet been upgraded.
                 * @type {string}
                 */
                /// <field type="String">
                ///     Indicates a custom element which has a matching definition, but has not
                ///     yet been upgraded.
                /// </field>
                UNCUSTOMIZED: 'uncustomized',
                /**
                 * Indicates a custom element which has no matching definition.
                 * @type {string}
                 */
                /// <field type="String">
                ///     Indicates a custom element which has no matching definition.
                /// </field>
                UNDEFINED: 'undefined'
            },
            Definition,
            DocumentInfo,
            CustomElementRegistry, registry,
            Reaction, CallbackReaction, UpgradeReaction,
            CustomElementProperties, reactionStack,
            /**
             * A unique marker placed in the construction stack of a custom element
             *   definition which indicates that a custom element has been
             *   successfully constructed.
             */
            ALREADY_CONSTRUCTED = {},
            /**
             * Whether or not an API marked with the [CEReactions] extended attribute is
             *   currently in use.
             * @type {boolean}
             */
            usingReactionApi = false,
            supportsUnicodeFlag = (function detectUnicodeFlagSupport() {
                try {
                    new RegExp('1', 'u');
                    return true;
                } catch (ex) {
                    return false;
                }
            })(),
            reg_reservedTagNames = /^(?:annotation-xml|color-profile|font-face(?:-(?:src|uri|format|name))?|missing-glyph)$/,
            reg_validCustomElementName = (function () {
                // If the browser supports the 'u' flag, we use '\u{xxxxx}' to detect code points
                // in the astral plane. The browser's implementation is likely to be faster than
                // the fallback regular expression in the 'else' block.
                if (supportsUnicodeFlag) {
                    return new RegExp('^[a-z][\\-\\.0-9_a-z\\xB7\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}]*-[\\-\\.0-9_a-z\\xB7\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}]*$', 'u');
                } else {
                    return /^[a-z](?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*\-(?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
                }
            })(),
            ArrayProto = Array.prototype,
            Array_shift = ArrayProto.shift,
            elementTypeWithChildrenProperty = hasOwnProperty(ElementProto, 'children') ? Element : HTMLElement,
            Node_get_childNodes = getOwnPropertyDescriptor(NodeProto, 'childNodes').get,
            Node_get_firstChild = getOwnPropertyDescriptor(NodeProto, 'firstChild').get,
            Node_get_ownerDocument = getOwnPropertyDescriptor(NodeProto, 'ownerDocument').get,
            Node_get_parentNode = getOwnPropertyDescriptor(NodeProto, 'parentNode').get,
            Node_get_nodeType = getOwnPropertyDescriptor(NodeProto, 'nodeType').get,
            Node_get_isConnected = (getOwnPropertyDescriptor(NodeProto, 'isConnected') || {}).get || function () {
                var doc = Node_get_ownerDocument.call(this);
                return doc && Boolean(doc.compareDocumentPosition(this) & 16);
            },
            Attr = global.Attr,
            AttrProto = Attr.prototype,
            Attr_get_localName = getOwnPropertyDescriptor(hasOwnProperty(AttrProto, 'localName') ? AttrProto : NodeProto, 'localName').get,
            Attr_get_namespaceURI = getOwnPropertyDescriptor(hasOwnProperty(AttrProto, 'namespaceURI') ? AttrProto : NodeProto, 'namespaceURI').get,
            Attr_get_value = getOwnPropertyDescriptor(AttrProto, 'value').get,
            Element_get_attributes = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'attributes') ? ElementProto : NodeProto, 'attributes').get,
            Element_get_children = getOwnPropertyDescriptor(elementTypeWithChildrenProperty.prototype, 'children').get,
            Element_get_localName = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'localName') ? ElementProto : NodeProto, 'localName').get,
            Element_get_namespaceURI = getOwnPropertyDescriptor(hasOwnProperty(ElementProto, 'namespaceURI') ? ElementProto : NodeProto, 'namespaceURI').get,
            String = global.String,
            String_split = String.prototype.split,
            currentElementIsSynchronous = false,
            mainDocumentReady = false,
            shim;

        (function DOMExceptionPolyfill() {
            var codes, props, constructDOMException, names, i, descriptors, code,
                hasDOMException = (function () {
                    if (typeof DOMException !== 'function') {
                        return false;
                    }
                    try {
                        new DOMException('', 'SyntaxError');
                    } catch (e) {
                        return false;
                    }
                    return true;
                })();
            if (hasDOMException) {
                return;
            }
            props = new WeakMap();
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
            names = getOwnPropertyNames(codes);
            constructDOMException = function constructDOMException(err, message, name) {
                if (!(err instanceof DOMException) || props.has(err)) {
                    throw new TypeError("Failed to construct 'DOMException': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
                }
                name = (name === undefined) ? 'Error' : String(name);
                props.set(err, {
                    code: hasOwnProperty(codes, name) ? codes[name].code : 0,
                    message: message === undefined ? '' : String(message),
                    name: name
                });
            };
            if (supportsClasses) {
                DOMException = eval('(function () { return function (Error, constructDOMException) { return class DOMException extends Error { constructor(message, name) { super(message); constructDOMException(this, message, name); } }; }; })()')(Error, constructDOMException);
            } else {
                DOMException = function DOMException(message, name) {
                    constructDOMException(this, message, name);
                    Error.call(this);
                };
                DOMException.prototype = create(Error.prototype);
                DOMException.prototype.constructor = DOMException;
            }

            descriptors = {};
            i = names.length;
            while (i--) {
                code = codes[names[i]];
                descriptors[code.constant] = {
                    enumerable: true,
                    value: code.code
                };
            }

            defineProperties(DOMException, descriptors);
            defineProperties(DOMException.prototype, descriptors);
            defineProperties(DOMException.prototype, {
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

            global.DOMException = DOMException;
        })();

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
         * Determines whether the provided tag name is a valid custom element name.
         * @param {string} tagName - The tag name.
         * @returns {boolean}
         */
        function isValidCustomElementName(tagName) {
            return (!reg_reservedTagNames.test(tagName) && reg_validCustomElementName.test(tagName));
        }

        function createElementInternal(document, localName, namespace, prefix, is, synchronous, fallbackMethod, fallbackMethodThisArg, fallbackMethodArgs, definition) {
            /// <signature>
            /// <param name="document" type="Document" />
            /// <param name="localName" type="string" />
            /// <param name="namespace" type="string" />
            /// <param name="prefix" type="string" />
            /// <param name="is" type="string" />
            /// <param name="synchronous" type="boolean" />
            /// <param name="fallbackMethod" type="function" />
            /// <param name="fallbackMethodThisArg" type="object" />
            /// <param name="fallbackMethodArgs" type="Array" />
            /// <returns type="Element" />
            /// </signature>
            /// <signature>
            /// <param name="document" type="Document" />
            /// <param name="localName" type="string" />
            /// <param name="namespace" type="string" />
            /// <param name="prefix" type="string" />
            /// <param name="is" type="string" />
            /// <param name="synchronous" type="boolean" />
            /// <param name="definition" type="Definition" />
            /// <returns type="Element" />
            /// </signature>

            var couldBeCustomElement = true,
                result, props;

            // Check for an existing definition in the native CustomElementRegistry.
            // If one exists, then defer to the native Document.prototype.createElement or
            // Document.prototype.createElementNS, as appropriate.
            if (!definition && native && namespace === HTML_NAMESPACE) {
                couldBeCustomElement = is || isValidCustomElementName(localName);
                if (couldBeCustomElement && native.get(is || localName)) {
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
                definition = Definition.lookup(document, namespace, localName, is);
            }

            if (definition && definition.isBuiltIn) {

                //  5.      If `definition` is non-null, and `definition`'s name is not equal to its local name (i.e.,
                //          `definition` represents a customized built-in element), then:

                //  5.1.    Let `interface` be the element interface for localName and the HTML namespace.
                //  5.2.    Set `result` to a new element that implements `interface`, with no attributes, namespace
                //          set to the HTML namespace, namespace prefix set to `prefix`, local name set to `localName`,
                //          custom element state set to "undefined", custom element definition set to null, is value set
                //          to `is`, and node document set to `document`.
                props = definition.createElement(document);
                result = props.element;

                if (synchronous) {
                    //  5.3.    If the synchronous custom elements flag is set, upgrade `result` using `definition`.
                    try {
                        definition.upgradeElement(props, true);
                    } catch (ex) {
                        throwAsync(ex);
                    }
                } else {
                    //  5.4.    Otherwise, enqueue a custom element upgrade reaction given `result` and `definition`.
                    reactionStack.enqueueUpgradeReaction(props, definition);
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

                        /* Steps 6.1.3 through 6.1.9 are completed by CustomElementProperties.prototype.finishConformanceCheck(). */

                        //  6.1.10. Set `result`'s namespace prefix to prefix.
                        //  6.1.11. Set `result`'s is value to null.
                    } catch (ex) {
                        //  6.1.    (continued) If any of these subsubsteps threw an exception, then:
                        //  6.1.1E. Report the exception.
                        throwAsync(ex);

                        //  6.1.2E. Set `result` to a new element that implements the HTMLUnknownElement interface, with no
                        //          attributes, namespace set to the HTML namespace, namespace prefix set to `prefix`, local
                        //          name set to `localName`, custom element state set to "failed", custom element definition
                        //          set to null, is value set to null, and node document set to `document`.
                        props = definition.createElement(document);
                        result = props.element;
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
                    props = definition.createElement(document);
                    result = props.element;

                    //  6.2.2.  Enqueue a custom element upgrade reaction given `result` and `definition`.
                    reactionStack.enqueueUpgradeReaction(props, definition);
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
        }

        /**
         * @param {function} activeFunction
         * @returns {HTMLElement}
         */
        function elementConstructor(activeFunction) {
            var thisPrototype = this instanceof Object ? getPrototypeOf(this) : null,
                /**
                 * The definition found for the element being created.
                 * @type {Definition}
                 */
                definition = thisPrototype ? Definition.fromPrototype(thisPrototype) : null,
                /**
                 * The element being created.
                 * @type {HTMLElement}
                 */
                element,
                prototype, props, i;

            // HTML Standard: "HTML element constructor" algorithm
            // https://html.spec.whatwg.org/#html-element-constructors

            // 1.   Let `registry` be the current global object's CustomElementRegistry object.
            // 2.   If NewTarget is equal to the active function object, then throw a TypeError and
            //      abort these steps.

            // 3.   Let `definition` be the entry in `registry` with constructor equal to NewTarget.
            //      If there is no such definition, then throw a TypeError and abort these steps.
            if (!definition) {
                throw new TypeError(ILLEGAL_CONSTRUCTOR);
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
                throw new TypeError(ILLEGAL_CONSTRUCTOR);
            }

            // 6.   Let `prototype` be `definition`'s prototype.
            prototype = definition.prototype;

            // 7.   If `definition`'s construction stack is empty, then:
            if (definition.constructionStack.length === 0) {

                // 7.1.     Let `element` be a new element that implements the interface to which the
                //          active function object corresponds, with no attributes, namespace set to
                //          the HTML namespace, local name set to `definition`'s local name, and node
                //          document set to the current global object's associated Document.
                props = definition.createElement(document);
                element = props.element;

                if (currentElementIsSynchronous) {
                    currentElementIsSynchronous = false;
                    props.synchronous = true;
                    props.beginConformanceCheck();
                }

                // 7.2.     Perform `element`.[[SetPrototypeOf]](`prototype`). Rethrow any exceptions.
                setPrototypeOf(element, prototype);

                reactionStack.observeElement(props.element);

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
            if (element === ALREADY_CONSTRUCTED) {
                throw new DOMException("Failed to construct 'CustomElement': Cannot create custom element <" + definition.name + (definition.isBuiltIn ? ' is="' + definition.localName + '"' : '') + "> from within its own custom element constructor.", 'InvalidStateError');
            }

            if (currentElementIsSynchronous) {
                currentElementIsSynchronous = false;
                props.synchronous = true;
                props.beginConformanceCheck();
            }

            // 10.  Perform `element`.[[SetPrototypeOf]](`prototype`). Rethrow any exceptions.
            setPrototypeOf(element, prototype);

            reactionStack.observeElement(props.element);

            // 11.  Replace the last entry in `definition`'s construction stack with an
            //      already constructed marker.
            definition.constructionStack[i] = ALREADY_CONSTRUCTED;

            // 12.  Return `element`.
            return element;
        }

        /**
         * @param {Error} error
         */
        function throwAsync(error) {
            setTimeout((function () { throw this; }).bind(error));
        }

        (function nativeInterfaces() {

            var names = getOwnPropertyNames(elementConstructorsByName),
                l = names.length,
                name, interf, proxy;

            global.HTMLElement = getProxiedConstructor((native ? global.HTMLElement : function () {
                return elementConstructor.call(this, HTMLElement);
            }), HTMLElement, 'HTMLElement');

            for (var i = 0; i < l; i++) {
                name = names[i];
                interf = elementConstructorsByName[name];
                proxy = native && native.canExtend ? interf : (function (a) {
                    return function () {
                        return elementConstructor.call(this, a);
                    };
                })(interf);
                global[name] = getProxiedConstructor(proxy, interf, name);
            }

        })();

        DocumentInfo = (function def_DocumentInfo() {

            var map = new WeakMap();

            /**
             * Contains information about a Document.
             * @class
             * 
             * @param {Document} document - The Document associated with the DocumentInfo.
             * 
             * @property {Document} document - The Document associated with the DocumentInfo.
             * @property {number} throwOnDynamicMarkupInsertionCounter - A counter that
             *   is used to prevent a custom element constructor from being able to use
             *   the Document.prototype.open(), Document.prototype.close(), and
             *   Document.prototype.write() methods when the constructor is invoked by
             *   the parser.
             */
            function DocumentInfo(document) {
                map.set(document, this);
                this.document = document;
                this.throwOnDynamicMarkupInsertionCounter = 0;
                reactionStack.observeDocument(document);
            }
            DocumentInfo.prototype.throwOnDynamicMarkupInsertionCounter = 0;

            /**
             * @param {Node} node
             * @returns {?DocumentInfo}
             */
            DocumentInfo.get = function get(node) {
                var doc;
                if (node instanceof Document) {
                    doc = node;
                } else if (node instanceof Node) {
                    doc = Node_get_ownerDocument.call(node);
                }
                return doc ? (map.get(doc) || null) : null;
            };
            /**
             * @param {Node} node
             * @returns {?DocumentInfo}
             */
            DocumentInfo.getOrCreate = function get(node) {
                var info = null,
                    doc;
                if (node instanceof Document) {
                    doc = node;
                } else if (node instanceof Node) {
                    doc = Node_get_ownerDocument.call(node);
                }
                if (doc) {
                    info = map.get(doc) || new DocumentInfo(doc);
                }
                return info;
            };

            return DocumentInfo;

        })();

        Reaction = (function def_Reaction() {

            /**
             * The base class for an item within a custom element reaction queue.
             * @class
             * 
             * @property {boolean} fromMutationRecord - Whether or not this custom
             *   element reaction was enqueued as a side effect of processing a
             *   MutationRecord.
             */
            function Reaction() { }
            defineProperties(Reaction.prototype, {
                constructor: {
                    value: Reaction
                },
                apply: {
                    /**
                     * When overridden in a derived class, applies the effect of this
                     *   Reaction to the custom element represented by the provided
                     *   CustomElementProperties.
                     * 
                     * @param {CustomElementProperties} props - The CustomElementProperties
                     *   for the element to which the reaction will be applied.
                     */
                    value: function apply(props) { }
                },
                fromMutationRecord: {
                    value: false,
                    writable: true
                }
            });

            return Reaction;

        })();

        CallbackReaction = (function def_CallbackReaction() {

            /**
             * A custom element reaction that invokes a callback function on the element.
             * @class
             * @extends Reaction
             * 
             * @param {function} callback - A reference to the callback function that will be
             *   invoked on the target element.
             * @param {Array} [args] - An optional array of arguments that will be sent to
             *   the invoked callback.
             * @param {boolean} [fromMutationRecord] - Whether or not this custom
             *   element reaction was enqueued as a side effect of processing a
             *   MutationRecord.
             *
             * @property {function} callback - A reference to the callback function that
             *   will be invoked on the target element.
             * @property {Array} args - An array of arguments that will be sent to the
             *   invoked callback, or null if the callback is to be invoked with no
             *   arguments.
             */
            function CallbackReaction(callback, args, fromMutationRecord) {
                this.callback = callback;
                if (typeof args === 'boolean') {
                    this.args = null;
                    this.fromMutationRecord = args;
                } else {
                    this.args = args || null;
                    this.fromMutationRecord = !!fromMutationRecord;
                }
            }
            CallbackReaction.prototype = create(Reaction.prototype);
            defineProperties(CallbackReaction.prototype, {
                constructor: {
                    value: CallbackReaction
                },
                apply: {
                    /**
                     * Invokes the callback assigned to this CallbackReaction on the custom element
                     *   represented by the provided CustomElementProperties.
                     * 
                     * @param {CustomElementProperties} props - The CustomElementProperties for the
                     *   HTML element that will be the target of the invoked callback.
                     */
                    value: function apply(props) {
                        var error;
                        try {
                            this.callback.apply(props.element, this.args);
                        } catch (ex) {
                            error = ex;
                        }
                        if (error) {
                            throwAsync(error);
                        }
                    }
                }
            });

            return CallbackReaction;

        })();

        UpgradeReaction = (function def_UpgradeReaction() {

            /**
             * A custom element reaction that upgrades an element to assume the prototype
             *   of a registered Definition.
             * @class
             * @extends Reaction
             * 
             * @param {Definition} definition - The custom element definition that will be
             *   used to upgrade the target element.
             * @param {boolean} [fromMutationRecord] - Whether or not this custom
             *   element reaction was enqueued as a side effect of processing a
             *   MutationRecord.
             * 
             * @property {Definition} definition - The custom element definition that will
             *   be used to upgrade the target element.
             */
            function UpgradeReaction(definition, fromMutationRecord) {
                this.definition = definition;
                this.fromMutationRecord = !!fromMutationRecord;
            }
            UpgradeReaction.prototype = create(Reaction.prototype);
            defineProperties(UpgradeReaction.prototype, {
                constructor: {
                    value: UpgradeReaction
                },
                apply: {
                    /**
                     * Upgrades the custom element represented by the provided CustomElementProperties
                     *   in accordance with its custom element definition.
                     * 
                     * @param {CustomElementProperties} props - The CustomElementProperties for the
                     *   custom element that will be upgraded.
                     */
                    value: function apply(props) {
                        this.definition.upgradeElement(props);
                    }
                }
            });

            return UpgradeReaction;

        })();

        CustomElementProperties = (function def_CustomElementProperties() {

            var map = new WeakMap(),
                failedToConstruct = "Failed to construct 'CustomElement': ",
                proto;

            /**
             * @param {CustomElementProperties} props
             */
            function disposeConformanceProperties(props) {
                var element, attrs, children, i, l, attr, child;

                if (!props.checkingConformance) {
                    return;
                }

                reactionStack.disableReactions();
                element = props.element;
                attrs = Element_get_attributes.call(element);

                // Remove any attributes and child nodes that were non-conformantly added
                // during the constructor
                while (attr = attrs[0]) {
                    Element_removeAttributeNode.call(element, attr);
                }
                while (child = Node_get_firstChild.call(element)) {
                    Node_removeChild.call(element, child);
                }

                // Restore the original attributes and child nodes
                attrs = props.originalAttributes;
                if (attrs) {
                    i = 0;
                    l = attrs.length;
                    while (i < l) {
                        Element_setAttributeNodeNS.call(element, attrs[i++]);
                    }
                }
                children = props.originalChildNodes;
                if (children) {
                    i = 0;
                    l = children.length;
                    while (i < l) {
                        Node_appendChild.call(element, children[i++]);
                    }
                }

                if (props.isConformant === false) {
                    props.reactionQueue.length = 0;
                }

                reactionStack.enableReactions();

                props.checkingConformance = false;
                props.originalAttributes = null;
                props.originalChildList = null;
                props.originalDocument = null;
            }

            /**
             * Creates a new property set associated with a custom element.
             * 
             * @classdesc Represents a set of internal properties associated with an individual
             *   instance of a custom element.
             * @class
             * 
             * @param {HTMLElement} element - The HTML element.
             * @param {Definition} [definition] - The custom element definition used by the
             *   element. If this is omitted, then the definition will be looked up.
             * 
             * @property {boolean} checkingConformance - Indicates whether the
             *   custom element's constructor is being checked for conformance while it is
             *   running.
             * @property {Definition} definition - The custom element definition used by the
             *   element.
             * @property {HTMLElement} element - The HTML element.
             * @property {?boolean} isConformant - Indicates whether the custom element's
             *   constructor passed the conformance check. This is null if the constructor was
             *   not checked for conformance, or if the check is still in progress.
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
             * @property {Array.<Reaction>} reactionQueue - The custom element reaction queue
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
                /// <summary>
                ///     Creates a new property set associated with a custom element
                /// </summary>
                /// <param name="element" type="HTMLElement">
                ///     The HTML element.
                /// </param>
                /// <param name="definition" type="Definition" optional="true">
                ///     The custom element definition used by the element. If this is omitted, then
                ///     the definition will be looked up.
                /// </param>
                /// <field name="checkingConformance" type="Boolean">
                ///     Indicates whether the custom element's constructor is being checked for
                ///     conformance while it is running.
                /// </field>
                /// <field name="definition" type="Definition" mayBeNull="true">
                ///     The custom element definition used by the element.
                /// </field>
                /// <field name="element" type="HTMLElement">
                ///     The HTML element.
                /// </field>
                /// <field name="isConformant" type="Boolean" mayBeNull="true">
                ///     Indicates whether the custom element's constructor passed the conformance
                ///     check. This is null if the constructor was not checked for conformance, or
                ///     if the check is still in progress.
                /// </field>
                /// <field name="originalAttributes" type="Array" elementType="Attr" mayBeNull="true">
                ///     An array containing the custom element's original attribute nodes from
                ///     before its constructor was run. This is only populated while the custom
                ///     element's constructor is being checked for conformance.
                /// </field>
                /// <field name="originalChildNodes" type="Array" elementType="Node" mayBeNull="true">
                ///     An array containing the custom element's original child nodes from before
                ///     its constructor was run. This is only populated while the custom element's
                ///     constructor is being checked for conformance.
                /// </field>
                /// <field name="originalDocument" type="Document" mayBeNull="true">
                ///     The original Document under which the custom element was created. This is
                ///     only populated while the custom element's constructor is being checked for
                ///     conformance.
                /// </field>
                /// <field name="ownerDocument" type="Document">
                ///     The Document to which the custom element belongs. This is used to trigger
                ///     the "adoptedCallback" whenever the element's "connectedCallback" is
                ///     fired and it is discovered that the element's ownerDocument has changed.
                /// </field>
                /// <field name="parentNodeChanged" type="Boolean" mayBeNull="true">
                ///     Whether the parentNode has been changed within the custom element
                ///     constructor. This determines the return value of Node.prototype.parentNode
                ///     for custom elements whose constructors are being checked for conformance.
                /// </field>
                /// <field name="reactionQueue" type="Array" elementType="Reaction">
                ///     The custom element reaction queue for the element.
                /// </field>
                /// <field name="state" type="String">
                ///     The custom element state; either "undefined", "failed", "uncustomized",
                ///     or "custom".
                /// </field>
                /// <field name="synchronous" type="Boolean">
                ///     Whether the synchronous custom elements flag was set while the custom
                ///     element was being created.
                /// </field>
                /// <field name="upgradeEnqueued" type="Boolean">
                ///     True if the custom element either (a) has an upgrade reaction in its
                ///     reactionQueue, or (b) has already been upgraded; otherwise, false.
                /// </field>
                map.set(element, this);
                this.definition = definition || Definition.fromElement(element);
                this.element = element;
                this.ownerDocument = Node_get_ownerDocument.call(element);
                this.reactionQueue = [];
            }
            proto = CustomElementProperties.prototype;

            proto.checkingConformance = false;
            proto.isConformant = null;
            proto.originalAttributes = null;
            proto.originalChildNodes = null;
            proto.originalDocument = null;
            proto.parentNodeChanged = null;
            proto.state = STATES.UNDEFINED;
            proto.synchronous = false;
            proto.upgradeEnqueued = false;

            proto.beginConformanceCheck = function beginConformanceCheck() {
                var element, originalAttributes, originalChildNodes, attrs, attr, child, i;

                if (this.checkingConformance || typeof this.isConformant === 'boolean') {
                    return;
                }

                element = this.element;
                originalAttributes = [];
                originalChildNodes = [];

                this.checkingConformance = true;
                this.originalAttributes = originalAttributes;
                this.originalChildNodes = originalChildNodes;
                this.originalDocument = this.ownerDocument;

                reactionStack.disableReactions();

                attrs = Element_get_attributes.call(element);
                i = 0;
                while (attr = attrs[0]) {
                    originalAttributes[i++] = Element_removeAttributeNode.call(element, attr);
                }
                i = 0;
                while (child = Node_get_firstChild.call(element)) {
                    originalChildNodes[i++] = Node_removeChild.call(element, child);
                }

                reactionStack.enableReactions();
            };
            proto.cancelConformanceCheck = function cancelConformanceCheck() {
                disposeConformanceProperties(this);
            };
            proto.finishConformanceCheck = function finishConformanceCheck() {
                var element = this.element,
                    definition = this.definition;

                // If the custom element is not currently being checked for constructor conformance,
                // then return immediately.
                if (!this.checkingConformance || this.isConformant !== null) {
                    return;
                }
                // If the custom element has a custom element state that is not 'undefined', then
                // cancel the conformance check and return immediately.
                if (this.state !== STATES.CUSTOM && this.state !== STATES.UNDEFINED) {
                    disposeConformanceProperties(this);
                    return;
                }

                this.isConformant = false;

                // The remainder of this method executes steps 6.1.3 through 6.1.9 of the DOM Standard
                // "create an element" algorithm.
                // https://dom.spec.whatwg.org/#concept-create-element

                try {

                    //  6.1.3.  If `result` does not implement the HTMLElement interface, then throw a TypeError.
                    if (!(element instanceof HTMLElement)) {
                        throw new TypeError(failedToConstruct + 'The resulting element must implement the HTMLElement interface.');
                    }

                    //  6.1.4.  If `result`'s attribute list is not empty, then throw a NotSupportedError.
                    if (Element_get_attributes.call(element).length > 0) {
                        throw new DOMException(failedToConstruct + 'The resulting element must not have any attributes.', 'NotSupportedError');
                    }

                    //  6.1.5.  If `result` has children, then throw a NotSupportedError.
                    if (Node_get_firstChild.call(element) !== null) {
                        throw new DOMException(failedToConstruct + 'The resulting element must not have any child nodes.', 'NotSupportedError');
                    }

                    //  6.1.6.  If `result`'s parent is not null, then throw a NotSupportedError.
                    if (this.parentNodeChanged && Node_get_parentNode.call(element) !== null) {
                        throw new DOMException(failedToConstruct + 'The resulting element must not have a parent node.', 'NotSupportedError');
                    }

                    //  6.1.7.  If `result`'s node document is not `document`, then throw a NotSupportedError.
                    if (Node_get_ownerDocument.call(element) !== this.originalDocument) {
                        throw new DOMException(failedToConstruct + 'The resulting element must belong to the same document for which it was created.', 'NotSupportedError');
                    }

                    //  6.1.8.  If `result`'s namespace is not the HTML namespace, then throw a NotSupportedError.

                    /* Skipping the namespaceURI check because every element that implements HTMLElement is
                       within the HTML namespace. */

                    //  6.1.9.  If `result`'s local name is not equal to `localName`, then throw a NotSupportedError.
                    if (Element_get_localName.call(element) !== definition.localName) {
                        throw new DOMException(failedToConstruct + "The resulting element's local name must match the local name specified by its custom element definition ('" + definition.localName + "').", 'NotSupportedError');
                    }

                    this.isConformant = true;

                } finally {
                    
                    disposeConformanceProperties(this);

                }
            };

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
            CustomElementProperties.get = function (element) {
                return element instanceof CustomElementProperties ? element : (map.get(element) || null);
            };
            
            return CustomElementProperties;

        })();

        reactionStack = (function def_reactionStack() {

            /**
             * Indicates whether the backup element queue is currently being processed.
             * @type {boolean}
             */
            var processingBackupElementQueue = false,
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
                /// <var type="Array" elementType="ElementQueue">
                ///     The stack of all active element queues.
                /// </var>
                elementQueues = [],
                /**
                 * The topmost element queue in the stack, or null if no element queues
                 *   are in the stack.
                 * @type {?ElementQueue}
                 */
                /// <var type="ElementQueue">
                ///     The topmost element queue in the stack, or null if no element
                ///     queues are in the stack.
                /// </var>
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
                observedDocuments = new WeakMap(),
                /**
                 * Contains any MutationRecords taken from the global attributeObserver which
                 *   are suspended until there are no more element queues in the reaction stack.
                 * @type {Array.<MutationRecord>}
                 */
                /// <var type="Array" elementType="MutationRecord">
                ///     Contains any MutationRecords taken from the global attributeObserver which
                ///     are suspended until there are no more element queues in the reaction stack.
                /// </var>
                suspendedAttributeRecords = [],
                /**
                 * Contains any MutationRecords taken from the global childListObserver which
                 *   are suspended until there are no more element queues in the reaction stack.
                 * @type {Array.<MutationRecord>}
                 */
                /// <var type="Array" elementType="MutationRecord">
                ///     Contains any MutationRecords taken from the global childListObserver which
                ///     are suspended until there are no more element queues in the reaction stack.
                /// </var>
                suspendedChildListRecords = [],
                /**
                 * False if custom element reactions are currently prevented from being
                 *   enqueued; otherwise, true.
                 * @type {boolean}
                 */
                reactionsEnabled = true;

            /**
             * Represents a queue of custom elements with pending reactions.
             * 
             * @property {Array.<CustomElementProperties>} elements - The custom elements in the queue.
             */
            function ElementQueue() {
                /// <summary>
                ///     Represents a queue of custom elements with pending reactions.
                /// </summary>
                /// <field name="elements" type="Array" elementType="CustomElementProperties">
                ///     The custom elements in the queue.
                /// </field>
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
                attributeObserver.takeRecords();
                childListObserver.takeRecords();
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
                backupElementQueue.invoke();
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
                if (!props || props.state === STATES.FAILED) {
                    return;
                }

                element = props.element;

                // HTML Standard: "Enqueue a Custom Element Callback Reaction" algorithm
                // https://html.spec.whatwg.org/multipage/scripting.html#enqueue-a-custom-element-callback-reaction

                // To enqueue a custom element callback reaction, given a custom element `element`,
                // a callback name `callbackName`, and a list of arguments `args`, run the following
                // steps:

                // 1.   Let `definition` be `element`'s custom element definition.
                definition = props.definition || Definition.fromElement(element);

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
                props.reactionQueue[props.reactionQueue.length] = new CallbackReaction(callback, args, enqueueingFromMutationObserver);

                // 6.   Enqueue an element on the appropriate element queue given `element`.
                enqueueElement(props);

            }
            /**
             * Enqueues an upgrade reaction on the specified element.
             * 
             * @param {HTMLElement|CustomElementProperties} element - The custom element (or the
             *   CustomElementProperties for the element) that will be upgraded. If an HTML element
             *   with no matching custom element definition is provided, then no action is taken.
             * @param {Definition} [definition] - The custom element definition that will be used
             *   to upgrade the target element. If omitted, it will be looked up.
             */
            function enqueueUpgradeReaction(element, definition) {
                var props;

                if (!reactionsEnabled) {
                    return;
                }

                props = CustomElementProperties.get(element);
                if (!props) {
                    if (!definition) {
                        definition = Definition.fromElement(element);
                    }
                    if (!definition) {
                        return;
                    }
                    props = new CustomElementProperties(element, definition);
                }
                if (props.upgradeEnqueued) {
                    return;
                }

                if (!definition) {
                    definition = props.definition || Definition.fromElement(props.element);
                }

                if (!enqueueingFromMutationObserver && elementQueues.length > 0) {
                    enqueuePendingMutationRecords();
                }

                props.upgradeEnqueued = true;

                // HTML Standard: "Enqueue a custom element upgrade reaction" algorithm
                // https://html.spec.whatwg.org/multipage/scripting.html#enqueue-a-custom-element-upgrade-reaction

                // 1.   Add a new upgrade reaction to `element`'s custom element reaction queue,
                //      with custom element definition `definition`.
                props.reactionQueue.push(new UpgradeReaction(definition, enqueueingFromMutationObserver));

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
                var definition, props, ownerDocument, docInfo, children, l, i;

                if (Node_get_nodeType.call(node) !== 1) {
                    return;
                }

                definition = Definition.fromElement(node);

                if (definition) {
                    props = CustomElementProperties.get(node);
                    if (!props) {
                        props = new CustomElementProperties(node, definition);
                        upgraded[upgraded.length] = props;
                        ownerDocument = Node_get_ownerDocument.call(node);
                        if (!isDocumentReady(ownerDocument) && !usingReactionApi) {
                            docInfo = DocumentInfo.getOrCreate(ownerDocument);
                            if (docInfo) {
                                docInfo.throwOnDynamicMarkupInsertionCounter += 1;
                            }
                            reactionStack.push();
                            try {
                                definition.upgradeElement(props, true);
                            } catch (ex) {
                                throwAsync(ex);
                            }
                            reactionStack.pop();
                            if (docInfo) {
                                docInfo.throwOnDynamicMarkupInsertionCounter -= 1;
                            }
                        } else {
                            enqueueUpgradeReaction(props, definition);
                        }
                    } else {
                        if (props.checkingConformance) {
                            props.parentNodeChanged = true;
                        }
                        if (props.state !== STATES.FAILED && props.state !== STATES.UNCUSTOMIZED && !arrayContains(connected, props) && !arrayContains(upgraded, props)) {
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
                var childListRecords = childListObserver.takeRecords(),
                    c = childListRecords.length,
                    attributeRecords = attributeObserver.takeRecords(),
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
                var records = attributeObserver.takeRecords(),
                    l = records.length,
                    s = suspendedAttributeRecords.length,
                    i = 0;
                while (i < l) {
                    suspendedAttributeRecords[s + i] = records[i];
                    i++;
                }
                records = childListObserver.takeRecords();
                l = records.length;
                s = suspendedChildListRecords.length;
                i = 0;
                while (i < l) {
                    suspendedChildListRecords[s + i] = records[i];
                    i++;
                }
            }

            backupElementQueue = new ElementQueue();
            attributeObserver = new MutationObserver(enqueueAttributeRecords);
            childListObserver = new MutationObserver(enqueueChildListRecords);

            return {
                disableReactions: disableReactions,
                enableReactions: enableReactions,
                enqueueCallbackReaction: enqueueCallbackReaction,
                enqueueUpgradeReaction: enqueueUpgradeReaction,
                /**
                 * Watches the provided Document (or the ownerDocument of the provided Node)
                 *   for connected and disconnected custom elements.
                 * 
                 * @param {Node|Document} node - The document to observe, or the Node whose
                 *   ownerDocument should be observed.
                 */
                observeDocument: function observeDocument(node) {
                    var document;
                    if (node instanceof Document) {
                        document = node;
                    } else if (node instanceof Node) {
                        document = Node_get_ownerDocument.call(node);
                    }
                    if (!document || observedDocuments.has(document)) {
                        return;
                    }
                    childListObserver.observe(document, childListObserverOptions);
                    observedDocuments.set(document, true);
                },
                /**
                 * Watches the provided custom element for attribute changes.
                 * 
                 * @param {HTMLElement|CustomElementProperties} element - The custom element (or the
                 *   CustomElementProperties for the element) to observe.
                 */
                observeElement: function observeElement(element) {
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
                },
                /**
                 * Pops the current element queue off of the reaction stack and invokes the
                 *   enqueued reactions for all elements within it.
                 */
                pop: function pop() {
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
                },
                /**
                 * Adds a new element queue to the end of the reaction stack.
                 */
                push: function push() {
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
            };

        })();
        
        Definition = (function def_Definition() {
            
            /**
             * A map that associates a custom element constructor with its corresponding
             *   custom element definition.
             * @type {Map}
             */
            var defsByConstructor = new Map(),
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
             * Represents a custom element definition.
             * @class
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
            function Definition(name, localName, constructor, prototype, observedAttributes, callbacks) {
                this.name = name;
                this.localName = localName;
                this.constructor = constructor;
                this.prototype = prototype;
                this.observedAttributes = (observedAttributes instanceof Array && observedAttributes.length > 0) ? observedAttributes : [];
                this.callbacks = callbacks;
                this.constructionStack = [];
                this.hasAdoptedCallback = typeof callbacks[ADOPTED_CALLBACK] === 'function';
                this.isBuiltIn = localName !== name;
                this.baseInterface = (localName === name ? HTMLElement : elementConstructorFromTagName(localName)) || null;

                defsByConstructor.set(constructor, this);
                defsByName[name] = this;
                defsByPrototype.set(prototype, this);
            };

            /**
             * Constructs a custom element using the current Definition's constructor,
             *   and returns the result from the constructor, rethrowing any exceptions.
             * 
             * @param {boolean} [synchronous] - Whether or not the synchronous custom elements
             *   flag is set.
             * 
             * @returns {HTMLElement} The constructed custom element.
             */
            Definition.prototype.constructElement = function (synchronous) {
                var hasError = false,
                    element, error,
                    /** @type {CustomElementProperties} */
                    props;
                currentElementIsSynchronous = !!synchronous;
                try {
                    element = new this.constructor();
                } catch (ex) {
                    hasError = true;
                    error = ex;
                }
                currentElementIsSynchronous = false;
                if (element instanceof HTMLElement) {
                    props = CustomElementProperties.get(element);
                }
                if (hasError) {
                    if (props && props.checkingConformance) {
                        props.cancelConformanceCheck();
                    }
                    throw error;
                }
                if (props && props.checkingConformance) {
                    props.finishConformanceCheck();
                }
                return element;
            };

            /**
             * @param {Document} [document]
             * @returns {CustomElementProperties}
             */
            Definition.prototype.createElement = function (document) {
                return new CustomElementProperties(this.createElementRaw(document), this);
            };

            /**
             * @param {Document} [document]
             * @returns {HTMLElement}
             */
            Definition.prototype.createElementRaw = function (document) {
                var element;
                if (!document) {
                    document = global.document;
                }
                element = Document_createElementNS.call(document, HTML_NAMESPACE, this.localName);
                if (this.isBuiltIn) {
                    Element_setAttributeNS.call(element, null, 'is', this.name);
                }
                return element;
            };

            /**
             * Invoked after an element using this Definition is constructed or upgraded.
             * 
             * @param {HTMLElement|CustomElementProperties} element - The element (or the
             *   CustomElementProperties for the element) that was constructed or upgraded.
             */
            Definition.prototype.finalizeElement = function (element) {
                var props = CustomElementProperties.get(element);
                if (!props) {
                    props = new CustomElementProperties(element, this);
                    props.upgradeEnqueued = true;
                }
                props.state = STATES.CUSTOM;
            };

            /**
             * Upgrades a pre-existing custom element using this Definition.
             * 
             * @param {CustomElementProperties} props - The CustomElementProperties for the
             *   custom element that will be upgraded.
             * @param {boolean} [synchronous] - Whether or not the synchronous custom elements
             *   flag is set.
             */
            Definition.prototype.upgradeElement = function (props, synchronous) {

                var attributes, attribute, i, l,
                    constructError, constructResult;

                // HTML Standard: "Upgrade a Custom Element" algorithm
                // https://html.spec.whatwg.org/multipage/scripting.html#concept-upgrade-an-element

                // To upgrade an element, given as input a custom element definition `definition`
                // and an element `element`, run the following steps:

                // 1.   If `element` is custom, abort these steps.
                // 2.   If `element`'s custom element state is "failed", then abort these steps.
                if (props.state === STATES.CUSTOM || props.state === STATES.FAILED) {
                    return;
                }

                // 3.   For each `attribute` in `element`'s attribute list, in order, enqueue a
                //      custom element callback reaction with `element`, callback name
                //      "attributeChangedCallback", and an argument list containing `attribute`'s
                //      local name, null, `attribute`'s value, and `attribute`'s namespace.
                attributes = Element_get_attributes.call(props.element);
                for (i = 0, l = attributes.length; i < l; i++) {
                    attribute = attributes[i];
                    reactionStack.enqueueCallbackReaction(props, ATTRIBUTE_CALLBACK, [
                        Attr_get_localName.call(attribute),
                        null,
                        Attr_get_value.call(attribute),
                        Attr_get_namespaceURI.call(attribute)
                    ]);
                }

                // 4.   If `element` is connected, then enqueue a custom element callback reaction
                //      with `element`, callback name "connectedCallback", and an empty argument list.
                if (Node_get_isConnected.call(props.element)) {
                    reactionStack.enqueueCallbackReaction(props, CONNECTED_CALLBACK);
                }

                // 5.   Add `element` to the end of `definition`'s construction stack.
                this.constructionStack.push(props);

                // 6.   Let `C` be `definition`'s constructor.
                // 7.   Let `constructResult` be Construct(`C`).
                try {
                    constructResult = this.constructElement(!!synchronous);
                } catch (ex) {
                    constructError = ex;
                }

                // 8.   Remove the last entry from the end of `definition`'s construction stack.
                this.constructionStack.pop();

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
                this.finalizeElement(props);
            };

            /**
             * Returns the Definition associated with the provided constructor function.
             * 
             * @param {function} constructor - The constructor function for which a matching
             *   definition is being searched.
             * 
             * @returns {?Definition} The custom element definition associated
             *   with the provided constructor function, or null if no definition has been
             *   registered with the provided constructor.
             */
            Definition.fromConstructor = function (constructor) {
                return defsByConstructor.get(constructor) || null;
            };

            /**
             * Returns the Definition associated with the provided HTML element.
             * 
             * @param {HTMLElement} element - The HTML element for which a matching
             *   definition is being searched.
             * 
             * @returns {?Definition} The custom element definition associated with
             *   the provided HTML element, or null if no matching definition could
             *   be found for the provided element.
             */
            Definition.fromElement = function (element) {
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
             * Returns the Definition associated with the provided tag name.
             *   It is assumed that the tag name is a valid custom element name, and has
             *   already been lowercased.
             * 
             * @param {string} tagName - The tag name of the definition to return.
             * 
             * @returns {?Definition} The custom element definition associated
             *   with the provided tag name, or null if no definition has been registered
             *   with the provided tag name.
             */
            Definition.fromName = function (name) {
                return defsByName[name] || null;
            };

            /**
             * Returns the Definition associated with the provided prototype object.
             * 
             * @param {prototype} prototype - The prototype object for which a matching
             *   definition is being searched.
             * 
             * @returns {?Definition} The custom element definition associated with the
             *   provided prototype object, or null if no definition has been registered
             *   with the provided prototype.
             */
            Definition.fromPrototype = function (prototype) {
                return defsByPrototype.get(prototype) || null;
            };

            /**
             * @param {Document} doc
             * @param {string} namespace
             * @param {string} localName
             * @param {string} is
             * @returns {?Definition}
             */
            Definition.lookup = function (doc, namespace, localName, is) {

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
                definition = Definition.fromName(localName) || (is ? Definition.fromName(is) : null);
                if (definition && definition.localName === localName) {
                    return definition;
                }

                // 6.   Return null.
                return null;
            };

            return Definition;

        })();

        CustomElementRegistry = (function def_CustomElementRegistry() {

            var isRunning = false,
                nativeConstructors = [],
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
                promises = {};

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

            /**
             * A registry that manages definitions for registered custom elements.
             * @class
             */
            function CustomElementRegistry() {
                if (registry) {
                    // Don't allow CustomElementRegistry to be created from user code
                    throw new TypeError(ILLEGAL_CONSTRUCTOR);
                }
                registry = this;
            };

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

                if (!(this instanceof CustomElementRegistry)) {
                    throw new TypeError(methodError('define', "'this' is not a CustomElementRegistry object."));
                }

                if (typeof constructor === 'function') {
                    constructor = getProxiedConstructor(constructor);
                }
                extend = (options && hasOwnProperty(options, 'extends') && options.extends != null) ? String(options.extends) : null;
                name = String(name);
                validateArguments = native ? !!extend : true;

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
                if (Definition.fromName(name) || (native && native.get(name))) {
                    // If a native customElements implementation exists and the current definition
                    // is for an autonomous custom element, then the check for an existing definition
                    // via Definition.fromName() has already been made, and we don't need to repeat it.
                    throw new DOMException(nameInUseError(name), 'NotSupportedError');
                }

                // 4.   If this CustomElementRegistry contains an entry with constructor
                //      `constructor`, then throw a "NotSupportedError" DOMException and
                //      abort these steps.
                if (Definition.fromConstructor(constructor)) {
                    throw new DOMException(constructorInUseError(), 'NotSupportedError');
                } else if (native) {
                    i = nativeConstructors.length;
                    while (i--) {
                        if (nativeConstructors[i] === constructor) {
                            throw new DOMException(constructorInUseError(), 'NotSupportedError');
                        }
                    }
                }

                if (native && !extend) {
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
                        native.define.apply(native.instance, args);
                    } finally {
                        isRunning = false;
                    }
                    constructor = native.get(name);
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
                    if (!isKnownTagName(extend)) {
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
                    if (!(prototype instanceof Object)) {
                        throw new TypeError(methodError('define', "The 'prototype' property of the provided constructor is not an object. (Is the constructor a bound function?)"));
                    }

                    // 10.3.    `Let lifecycleCallbacks` be a map with the four keys "connectedCallback",
                    //          "disconnectedCallback", "adoptedCallback", and "attributeChangedCallback",
                    //          each of which belongs to an entry whose value is null.
                    callbacks = {};

                    // 10.4.    For each of the four keys `callbackName` in `lifecycleCallbacks`, in the order
                    //          listed in the previous step:
                    i = CALLBACK_NAMES.length;
                    while (i--) {
                        callbackName = CALLBACK_NAMES[i];

                        // 10.4.1.  Let `callbackValue` be Get(`prototype`, `callbackName`). Rethrow any exceptions.
                        var callback = prototype[callbackName];

                        // 10.4.2.  If `callbackValue` is not undefined, then set the value of the entry in
                        //          `lifecycleCallbacks` with key `callbackName` to the result of converting
                        //          `callbackValue` to the Web IDL `Function` callback type. Rethrow any exceptions
                        //          from the conversion.
                        if (callback !== undefined && typeof callback !== 'function') {
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
                        if (attributes !== undefined) {
                            if (!(attributes instanceof Array)) {
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
                definition = new Definition(name, localName, constructor, prototype, observedAttributes, callbacks);

                // 12.  Add `definition` to this CustomElementRegistry.
                // (Step 12 is completed within the Definition() constructor.)

                // 13.  Let `document` be this CustomElementRegistry's relevant global object's
                //      associated Document.
                // 14.  Let `upgrade candidates` be all elements that are shadow-including descendants
                //      of `document`, whose namespace is the HTML namespace and whose local name is
                //      `localName`, in shadow-including tree order. Additionally, if `extends` is
                //      non-null, only include elements whose 'is' value is equal to `name`.
                upgradeCandidates = document.getElementsByTagName(localName);
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
                reactionStack.push();
                while (i < l) {
                    reactionStack.enqueueUpgradeReaction(upgradeCandidates[i++], definition);
                }
                reactionStack.pop();

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
                if (!(this instanceof CustomElementRegistry)) {
                    throw new TypeError(methodError('get', "'this' is not a CustomElementRegistry object."));
                }
                if (arguments.length === 0) {
                    throw new TypeError(methodError('get', '1 argument required, but only 0 present.'));
                }
                if (native) {
                    definition = native.get(name);
                    if (definition) {
                        return definition;
                    }
                }
                definition = Definition.fromName(String(name));
                return definition ? definition.constructor : undefined;
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

                if (!(this instanceof CustomElementRegistry)) {
                    return Promise.reject(new TypeError(methodError('whenDefined', "'this' is not a CustomElementRegistry object.")));
                }
                if (arguments.length === 0) {
                    return Promise.reject(new TypeError(methodError('whenDefined', '1 argument required, but only 0 present.')))
                }

                name = String(name);

                // HTML Standard: CustomElementRegistry.prototype.whenDefined() specification
                // https://html.spec.whatwg.org/multipage/scripting.html#dom-customelementregistry-whendefined

                // 1.   If `name` is not a valid custom element name, then return a new promise
                //      rejected with a "SyntaxError" DOMException and abort these steps.
                if (!isValidCustomElementName(name)) {
                    return Promise.reject(new DOMException(invalidNameError('whenDefined', name), 'SyntaxError'));
                }

                // 2.   If this CustomElementRegistry contains an entry with name `name`, then return
                //      a new promise resolved with `undefined` and abort these steps.
                if (Definition.fromName(name) || (native && native.get(name))) {
                    return Promise.resolve();
                }

                // 3.   Let `map` be this CustomElementRegistry's when-defined promise map.
                // 4.   If `map` does not contain an entry with key `name`, create an entry in `map`
                //      with key `name` and whose value is a new promise.
                // 5.   Let `promise` be the value of the entry in `map` with key `name`.
                if (!hasOwnProperty(promises, name)) {
                    promise = promises[name];
                } else {
                    promise = new Promise(whenDefinedExecutor.bind(null, name));
                    promises[name] = promise;
                }

                // 6.   Return `promise`.
                return promise;
            };

            global.CustomElementRegistry = CustomElementRegistry;

            defineProperty(global, 'customElements', {
                configurable: true,
                enumerable: true,
                writable: false,
                value: new CustomElementRegistry()
            });

            return CustomElementRegistry;

        })();

        shim = (function def_Shims() {

            var Document_adoptNode = DocumentProto.adoptNode,
                Document_close = DocumentProto.close,
                Document_importNode = DocumentProto.importNode,
                Document_open = DocumentProto.open,
                Document_write = DocumentProto.write,
                Document_writeln = DocumentProto.writeln,
                HTMLDocument = global.HTMLDocument,
                Node_cloneNode = NodeProto.cloneNode,
                shimMap = new WeakMap(),
                shimStack = 0;

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
                    isHtmlElement = couldBeElement ? node instanceof HTMLElement : false,
                    isElement = isHtmlElement ? true : (nodeType === 1 ? true : (couldBeElement ? node instanceof Element : false)),
                    isDocument = isElement ? false : (nodeType === 9 || (nodeType == null && node instanceof Document));

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
                        definition = Definition.lookup(doc, namespace, localName, is);
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
                DocumentInfo.getOrCreate(thisArg);
                while (i--) {
                    DocumentInfo.getOrCreate(args[i]);
                }
            }
            /**
             * Refreshes the "usingReactionApi" global variable.
             */
            function refreshShimStack() {
                usingReactionApi = (shimStack > 0);
            }

            function beginReactionShim() {
                shimStack++;
                refreshShimStack();
                reactionStack.push();
            }
            function endReactionShim() {
                reactionStack.pop();
                shimStack = Math.max(shimStack - 1, 0);
                refreshShimStack();
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
                    if (shimmedProps.hasOwnProperty(name)) {
                        // If the member has already been shimmed, then abort.
                        return;
                    }
                }
                shimmedProps[name] = true;

                newDescriptor = {
                    configurable: true,
                    enumerable: descriptor.enumerable
                };
                if (typeof customShim !== 'function' && customShim instanceof Object) {
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

                if (properties instanceof Array) {
                    l = properties.length;
                    while (l--) {
                        shimMember(target, String(properties[l]));
                    }
                    return;
                }

                properties = Object(properties);
                names = getOwnPropertyNames(properties);
                shimmedProps = getShimmedPropertyNames(target);
                l = names.length;
                for (i = 0; i < l; i++) {
                    name = names[i];
                    shim = properties[name];
                    if (hasOwnProperty(target, name) && !hasOwnProperty(shimmedProps, name) && (typeof shim === 'function' || (shim instanceof Object && typeof shim.get === 'function' || typeof shim.set === 'function'))) {
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
                if (!(target instanceof Object)) {
                    return;
                }
                
                while (i < l) {
                    arg = arguments[i++];
                    if (arg instanceof Object) {
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

            shim(global.CharacterData,
                'after', 'before', 'remove', 'replaceWith');
            shim(DocumentProto,
                'alinkColor', 'append', 'bgColor', 'body', 'designMode', 'dir', 'execCommand', 'fgColor', 'linkColor',
                'prepend', 'title', 'vlinkColor',
                {
                    adoptNode: function adoptNode(node) {
                        var currentDocument = Node_get_ownerDocument.call(node),
                            oldDocument = (node instanceof Node) ? currentDocument : null,
                            result = Document_adoptNode.apply(this, arrayFrom(arguments));
                        if (currentDocument === this && this !== oldDocument) {
                            reactionStack.enqueueCallbackReaction(node, ADOPTED_CALLBACK, [oldDocument, this]);
                        }
                        return result;
                    },
                    close: function close() {
                        var info = DocumentInfo.getOrCreate(this);
                        if (info && info.throwOnDynamicMarkupInsertionCounter > 0) {
                            throw new DOMException(getDocumentMarkupInsertionError('close'), 'InvalidStateError');
                        }
                        return Document_close.apply(this, arrayFrom(arguments));
                    },
                    createElement: function createElement(tagName, options) {
                        var isHtmlDocument = this instanceof HTMLDocument,
                            localName, is, element;
                        if (isHtmlDocument) {
                            reactionStack.observeDocument(this);
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
                        element = createElementInternal(this, localName, HTML_NAMESPACE, null, is, true, Document_createElement, this, arguments);
                        endReactionShim();
                        return element;
                    },
                    createElementNS: function createElementNS(namespaceURI, qualifiedName, options) {
                        var isHtmlDocument = this instanceof HTMLDocument,
                            name = String(qualifiedName),
                            parts = String_split.call(name, ':'),
                            l = parts.length,
                            localName = parts[l > 1 ? 1 : 0],
                            prefix = l > 1 ? parts[0] : null,
                            is, element;
                        if (isHtmlDocument) {
                            reactionStack.observeDocument(this);
                        }
                        if (!isHtmlDocument || arguments.length < 2 || parts.length > 2) {
                            return Document_createElementNS.apply(this, arrayFrom(arguments));
                        }
                        options = options == null ? null : options.valueOf();
                        if (options != null) {
                            is = String(options instanceof Object && options.is !== undefined ? options.is : options);
                        }
                        beginReactionShim();
                        element = createElementInternal(this, localName, namespaceURI, prefix, is, true, Document_createElementNS, this, arguments);
                        endReactionShim();
                        return element;
                    },
                    importNode: function importNode(node, deep) {
                        var isNode = this instanceof Document && node instanceof Node,
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
                        var info;
                        if (args.length > 2) {
                            // Defer to the native Document.prototype.open(). When called with 3 arguments, it
                            // should instead act as an alias for Window.prototype.open().
                            return Document_open.apply(this, arrayFrom(arguments));
                        }
                        info = DocumentInfo.getOrCreate(this);
                        if (info && info.throwOnDynamicMarkupInsertionCounter > 0) {
                            throw new DOMException(getDocumentMarkupInsertionError('open'), 'InvalidStateError');
                        }
                        return Document_open.apply(this, arrayFrom(arguments));
                    },
                    write: function write() {
                        var info = DocumentInfo.getOrCreate(this);
                        if (info && info.throwOnDynamicMarkupInsertionCounter > 0) {
                            throw new DOMException(getDocumentMarkupInsertionError('write'), 'InvalidStateError');
                        }
                        return Document_write.apply(this, arrayFrom(arguments));
                    },
                    writeln: function writeln() {
                        var info = DocumentInfo.getOrCreate(this);
                        if (info && info.throwOnDynamicMarkupInsertionCounter > 0) {
                            throw new DOMException(getDocumentMarkupInsertionError('writeln'), 'InvalidStateError');
                        }
                        return Document_writeln.apply(this, arrayFrom(arguments));
                    }
                });
            shim(global.DocumentFragment,
                'append', 'prepend');
            shim(global.DocumentType,
                'after', 'before', 'remove', 'replaceWith');
            shim(global.DOMTokenList,
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
            shim(global.NamedNodeMap,
                'setNamedItem', 'setNamedItemNS', 'removeNamedItem', 'removeNamedItemNS');
            shim(NodeProto, 'appendChild', 'insertBefore', 'nodeValue', 'normalize', 'removeChild', 'replaceChild',
                'textContent',
                {
                    cloneNode: function cloneNode(deep) {
                        var isNode = this instanceof Node,
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
            shim(global.Range,
                'cloneContents', 'deleteContents', 'extractContents', 'insertNode', 'surroundContents');

            // Read-only properties of Node.prototype with new behavior
            defineProperties(NodeProto, {
                isConnected: {
                    configurable: true,
                    enumerable: true,
                    get: function () {
                        var props;
                        if (!(this instanceof Node)) {
                            throw new TypeError(ILLEGAL_INVOCATION);
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
                    if (!(this instanceof Node)) {
                        throw new TypeError(ILLEGAL_INVOCATION);
                    }
                    props = CustomElementProperties.get(this);
                    if (props && props.checkingConformance && !props.parentNodeChanged) {
                        return null;
                    }
                    parentNode = Node_get_parentNode.call(this);
                    return parentNode instanceof Element ? parentNode : null;
                }
            });

            shim(global.HTMLAnchorElement,
                'coords', 'charset', 'download', 'hreflang', 'name', 'ping', 'referrerPolicy', 'rel', 'relList', 'rev',
                'shape', 'target', 'text', 'type',
                // The remaining members are part of the HTMLHyperlinkElementUtils interface
                'hash', 'host', 'hostname', 'href', 'password', 'pathname', 'port', 'protocol', 'search', 'username');
            shim(global.HTMLAreaElement,
                'alt', 'coords', 'download', 'ping', 'referrerPolicy', 'rel', 'relList', 'shape', 'target',
                // The remaining members are part of the HTMLHyperlinkElementUtils interface
                'hash', 'host', 'hostname', 'href', 'password', 'pathname', 'peort', 'protocol', 'search', 'username');
            shim(global.HTMLBaseElement,
                'href', 'target');
            shim(global.HTMLBodyElement,
                'background', 'bgColor', 'aLink', 'link', 'text', 'vLink');
            shim(global.HTMLButtonElement,
                'autofocus', 'disabled', 'formAction', 'formEnctype', 'formMethod', 'formNoValidate', 'formTarget',
                'menu', 'name', 'type', 'value');
            shim(global.HTMLCanvasElement,
                'height', 'width');
            shim(global.HTMLDetailsElement,
                'open');
            shim(global.HTMLDialogElement,
                'close', 'open', 'show', 'showModal');
            shim(global.HTMLDivElement,
                'align');
            shim(HTMLElement,
                'accessKey', 'contentEditable', 'contextMenu', 'dir', 'draggable', 'dropzone', 'hidden', 'innerText',
                'lang', 'spellcheck', 'tabIndex', 'title', 'translate');
            shim(global.HTMLEmbedElement,
                'align', 'name');
            shim(global.HTMLFieldSetElement,
                'disabled', 'name');
            shim(global.HTMLFontElement,
                'color', 'face', 'size');
            shim(global.HTMLFormElement,
                'acceptCharset', 'action', 'autocomplete', 'encoding', 'enctype', 'method', 'name', 'noValidate', 'reset',
                'target');
            shim(global.HTMLFrameElement,
                'cols', 'rows');
            shim(global.HTMLFrameSetElement,
                'frameBorder', 'longDesc', 'marginHeight', 'marginWidth', 'name', 'noResize', 'scrolling', 'src');
            shim(global.HTMLHRElement,
                'align', 'color', 'noShade', 'size', 'width');
            shim(global.HTMLIFrameElement,
                'align', 'allowFullscreen', 'allowPaymentRequest', 'allowUserMedia', 'frameBorder', 'height', 'longDesc',
                'marginHeight', 'marginWidth', 'name', 'referrerPolicy', 'sandbox', 'scrolling', 'src', 'srcdoc', 'width');
            // Image extends HTMLImageElement, and doesn't have any [CEReactions] members of its own
            shim(global.HTMLImageElement,
                'align', 'alt', 'border', 'crossOrigin', 'height', 'hspace', 'isMap', 'longDesc', 'lowsrc', 'name',
                'referrerPolicy', 'sizes', 'src', 'srcset', 'useMap', 'vspace', 'width');
            shim(global.HTMLInputElement,
                'accept', 'alt', 'autocomplete', 'autofocus', 'defaultChecked', 'defaultValue', 'dirName', 'disabled',
                'formAction', 'formEnctype', 'formMethod', 'formNoValidate', 'formTarget', 'height', 'inputMode', 'max',
                'maxLength', 'min', 'minLength', 'multiple', 'name', 'pattern', 'placeholder', 'readOnly', 'required',
                'size', 'src', 'step', 'type', 'value', 'width');
            shim(global.HTMLLegendElement,
                'align');
            shim(global.HTMLLIElement,
                'value');
            shim(global.HTMLLinkElement,
                'as', 'charset', 'crossOrigin', 'href', 'hreflang', 'integrity', 'media', 'nonce', 'referrerPolicy', 'rel',
                'relList', 'rev', 'target', 'type', 'sizes');
            shim(global.HTMLMapElement,
                'name');
            shim(global.HTMLMarqueeElement,
                'behavior', 'bgColor', 'direction', 'height', 'hspace', 'loop', 'scrollAmount', 'scrollDelay', 'trueSpeed',
                'vspace', 'width');
            shim(global.HTMLMediaElement,
                'autoplay', 'controls', 'crossOrigin', 'defaultMuted', 'loop', 'preload', 'src');
            shim(global.HTMLMenuElement,
                'label', 'type');
            shim(global.HTMLMenuItemElement,
                'checked', 'default', 'disabled', 'icon', 'label', 'radiogroup', 'type');
            shim(global.HTMLMetaElement,
                'scheme');
            shim(global.HTMLMeterElement,
                'high', 'low', 'max', 'min', 'optimum', 'value');
            shim(global.HTMLModElement,
                'cite', 'dateTime');
            shim(global.HTMLObjectElement,
                'align', 'archive', 'border', 'code', 'codeBase', 'codeType', 'data', 'declare', 'height', 'hspace', 'name',
                'standby', 'type', 'typeMustMatch', 'useMap', 'vspace', 'width')
            shim(global.HTMLOListElement,
                'reversed', 'start', 'type');
            shim(global.HTMLOptGroupElement,
                'disabled', 'label');
            shim(global.HTMLOptionElement,
                'defaultSelected', 'disabled', 'label', 'text', 'value');
            shim(global.HTMLOptionsCollection,
                'add', 'length', 'remove');
            shim(global.HTMLOutputElement,
                'defaultValue', 'htmlFor', 'name', 'value');
            shim(global.HTMLParagraphElement,
                'align');
            shim(global.HTMLParamElement,
                'name', 'type', 'value', 'valueType');
            shim(global.HTMLQuoteElement,
                'cite');
            shim(global.HTMLScriptElement,
                'async', 'charset', 'crossOrigin', 'defer', 'event', 'htmlFor', 'integrity', 'noModule', 'nonce', 'src',
                'text', 'type');
            shim(global.HTMLSelectElement,
                'add', 'autocomplete', 'autofocus', 'disabled', 'length', 'multiple', 'name', 'remove', 'required', 'size');
            shim(global.HTMLSlotElement,
                'name');
            shim(global.HTMLSourceElement,
                'media', 'sizes', 'src', 'srcset', 'type');
            shim(global.HTMLStyleElement,
                'media', 'nonce', 'type');
            shim(global.HTMLTableCaptionElement,
                'align');
            shim(global.HTMLTableCellElement,
                'align', 'axis', 'abbr', 'bgColor', 'ch', 'chOff', 'colSpan', 'headers', 'height', 'noWrap', 'rowSpan', 'scope',
                'vAlign', 'width');
            shim(global.HTMLTableColElement,
                'align', 'ch', 'chOff', 'span', 'vAlign', 'width');
            shim(global.HTMLTableElement,
                'align', 'bgColor', 'border', 'caption', 'cellPadding', 'cellSpacing', 'deleteCaption', 'deleteTFoot',
                'deleteTHead', 'deleteRow', 'frame', 'rules', 'summary', 'tHead', 'tFoot', 'width');
            shim(global.HTMLTableRowElement,
                'align', 'bgColor', 'ch', 'chOff', 'vAlign');
            shim(global.HTMLTableSectionElement,
                'align', 'ch', 'chOff', 'deleteRow', 'vAlign');
            shim(global.HTMLTextAreaElement,
                'autocomplete', 'autofocus', 'cols', 'defaultValue', 'dirName', 'disabled', 'inputMode', 'maxLength', 'minLength',
                'name', 'placeholder', 'readOnly', 'required', 'rows', 'value', 'wrap');
            shim(global.HTMLTimeElement,
                'dateTime');
            shim(global.HTMLTitleElement,
                'text');
            shim(global.HTMLTrackElement,
                'default', 'kind', 'label', 'src', 'srclang');
            shim(global.HTMLVideoElement,
                'height', 'playsInline', 'poster', 'width');

            return shim;

        })();

        (function API() {

            var api = {},
                support = {};

            defineProperties(support, {
                autonomousCustomElements: {
                    enumerable: true,
                    value: !!native
                },
                classes: {
                    enumerable: true,
                    value: supportsClasses
                },
                customizedBuiltInElements: {
                    enumerable: true,
                    value: native != null && native.canExtend
                }
            });

            defineProperties(api, {
                shim: {
                    enumerable: true,
                    value: shim
                },
                support: {
                    enumerable: true,
                    value: support
                },
                version: {
                    enumerable: true,
                    value: '{VERSION_PLACEHOLDER}'
                }
            });

            global.customElementsPolyfill = api;

        })();

        (function Initialization() {
            mainDocumentReady = isDocumentReady(document);
            DocumentInfo.getOrCreate(document);
            if (!mainDocumentReady) {
                reactionStack.push();
                EventTarget_addEventListener.call(document, 'DOMContentLoaded', function onReady() {
                    reactionStack.pop();
                    mainDocumentReady = true;
                }, false);
            }
        })();

    })();

    return global.customElements;

})(window);