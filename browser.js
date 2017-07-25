(function (window, undefined) {
    'use strict';

    require('./lib/other-polyfills/Array.from');
    require('./lib/other-polyfills/DOMException');

    var common = require('./lib/common'),

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

    classes = require('./lib/classes');
    isValidCustomElementName = require('./lib/is-valid-custom-element-name');
    nativeCustomElements = require('./lib/native-custom-elements');

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
                    value: common.supportsClasses
                },
                customizedBuiltInElements: {
                    enumerable: true,
                    value: nativeCustomElements != null && nativeCustomElements.canExtend
                }
            })
        },
        version: {
            enumerable: true,
            value: '{VERSION_PLACEHOLDER}'
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

    baseElementConstructor = require('./lib/base-element-constructor');
    builtInElements = require('./lib/built-in-elements');
    reactions = require('./lib/reactions');

    (function () {

        /*
         * The routine below patches the native HTML element interfaces (HTMLAnchorElement,
         * HTMLDivElement, etc) so they can serve as bases for user-defined classes in
         * cooperation with the ES6 class proxying mechanism defined in the 'classes' module.
         */

        var interfaces = builtInElements.interfaces,
            i = 0,
            l = interfaces.length,
            HTMLElement = window.HTMLElement,
            name, interf, ctor, finalConstructor;

        window.HTMLElement = classes.proxy(HTMLElement, (nativeCustomElements ? window.HTMLElement : function () {
            return baseElementConstructor.call(this, HTMLElement);
        }));

        while (i < l) {
            interf = interfaces[i++];
            name = interf.name;
            if (name) {
                ctor = interf.constructor;
                finalConstructor = nativeCustomElements && nativeCustomElements.canExtend ? ctor : (function (a) {
                    return function () {
                        return baseElementConstructor.call(this, a);
                    };
                })(ctor);
                window[name] = classes.proxy(ctor, finalConstructor);
            }
        }

    })();

    CustomElementRegistry = require('./lib/custom-element-registry');
    shims = require('./lib/shims');

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
