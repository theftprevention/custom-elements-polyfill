'use strict';

var common = require('./common'),
    priv = require('./private-property-store')('CustomElement'),

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
