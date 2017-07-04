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
    'standby', 'type', 'typeMustMatch', 'useMap', 'vspace', 'width');
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
