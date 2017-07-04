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
