'use strict';

var common = require('./common'),
    CustomElementDefinition = require('./custom-element-definition'),
    CustomElementProperties = require('./custom-element-properties'),
    isValidCustomElementName = require('./is-valid-custom-element-name'),
    nativeCustomElements = require('./native-custom-elements'),
    reactions = require('./reactions'),
    reportError = require('./report-error'),

    arrayFrom = Array.from,
    Element_setAttributeNS = window.Element.prototype.setAttributeNS,
    HTML_NAMESPACE = common.htmlNamespace,
    HTMLUnknownElement = window.HTMLUnknownElement,
    HTMLUnknownElementProto = HTMLUnknownElement.prototype,
    setPrototypeOf = Object.setPrototypeOf;

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
                reportError(ex);
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

                //  6.1.    (continued) If any of these subsubsteps threw an exception, then:
                //  6.1.1E. Report the exception.
                reportError(ex);

                //  6.1.2E. Set `result` to a new element that implements the HTMLUnknownElement interface, with no
                //          attributes, namespace set to the HTML namespace, namespace prefix set to `prefix`, local
                //          name set to `localName`, custom element state set to "failed", custom element definition
                //          set to null, is value set to null, and node document set to `document`.
                result = definition.createElement(document);
                props = new CustomElementProperties(result, definition);
                props.state = common.states.failed;
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
