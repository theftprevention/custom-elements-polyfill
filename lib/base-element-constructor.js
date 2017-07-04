'use strict';

var common = require('./common'),
    conformance = require('./conformance'),
    CustomElementDefinition = require('./custom-element-definition'),
    CustomElementProperties = require('./custom-element-properties'),
    reactions = require('./reactions'),
    
    ALREADY_CONSTRUCTED = Object.create(null),
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
    var thisPrototype = this == null ? null : getPrototypeOf(this),
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
    if (element === ALREADY_CONSTRUCTED) {
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
    definition.constructionStack[i] = ALREADY_CONSTRUCTED;

    // 12.  Return `element`.
    return element;
};
