'use strict';

var common = require('./common'),
    CustomElementDefinition = require('./custom-element-definition'),
    CustomElementProperties = require('./custom-element-properties'),
    PrivatePropertyStore = require('./private-property-store'),

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
    documents = new PrivatePropertyStore('DocumentProperties'),
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

    props = CustomElementProperties.get(element);
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
