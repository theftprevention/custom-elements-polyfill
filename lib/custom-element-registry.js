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

    if (common.supportsClasses) {
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
        return Promise_reject(new TypeError(methodError('whenDefined', '1 argument required, but only 0 present.')));
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
