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
