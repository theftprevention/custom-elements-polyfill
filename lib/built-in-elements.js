'use strict';

/**
 * @typedef {Object} ElementInterface
 * @property {function} constructor
 * @property {string} name
 * @property {object} prototype
 * @property {Array.<string>} tagNames
 */

var common = require('./common'),
    isValidCustomElementName = require('./is-valid-custom-element-name'),
    PrivatePropertyStore = require('./private-property-store'),
    tagNames = require('../data/tag-names'),
    
    createElement = Document.prototype.createElement.bind(document),
    getPrototypeOf = Object.getPrototypeOf,
    hasOwnProperty = common.hasOwnProperty,
    HTMLElement = window.HTMLElement,
    HTMLElementProto = HTMLElement.prototype,
    interfaces = [],
    interfacesByName = Object.create(null),
    interfacesByTagName = Object.create(null),
    isPrototypeOf = common.isPrototypeOf,
    nameOf = common.nameOf,
    priv = new PrivatePropertyStore('ElementInterface'),
    reg_capital = /^[A-Z]/,
    reg_htmlInterface = /^HTML(.+)Element$/,
    String = window.String,
    
    HTMLElementInterface = createInterface(HTMLElementProto, HTMLElement, 'HTMLElement'),
    HTMLUnknownElementInterface = createInterface(HTMLUnknownElement.prototype, HTMLUnknownElement, 'HTMLUnknownElement'),

    I = 0,
    props, ctor, interf, name, proto, tagName, x, y;

/**
 * @param {ElementInterface} interf
 * @param {string} tagName
 */
function addTagName(interf, tagName) {
    interfacesByTagName[tagName] = interf;
    interf.tagNames[interf.tagNames.length] = tagName;
}

/**
 * @param {object} prototype
 * @param {function} [constructor]
 * @param {string} [name]
 * @returns {?ElementInterface}
 */
function createInterface(prototype, constructor, name) {
    var interf;
    constructor = constructor || prototype.constructor;
    if (!name) {
        name = nameOf(prototype);
        if (!reg_capital.test(name) || name === 'Object') {
            name = null;
        }
    }
    interf = {
        constructor: constructor,
        name: name,
        prototype: prototype,
        tagNames: []
    };
    interfaces[I++] = interf;
    priv.set(constructor, interf);
    priv.set(prototype, interf);
    if (name) {
        interfacesByName[name] = interf;
    }
    return interf;
}

/**
 * @param {object} prototype
 * @param {function} [constructor]
 * @param {string} [name]
 * @returns {?ElementInterface}
 */
function getOrCreateInterface(prototype, constructor, name) {
    var interf = priv.get(prototype);
    if (interf) {
        if (constructor) {
            priv.set(constructor, interf);
        }
        return interf;
    }
    if (!isPrototypeOf(HTMLElementProto, prototype)) {
        if (name) {
            interfacesByName[name] = null;
        }
        return null;
    }
    return createInterface(prototype, constructor, name);
}

/**
 * @param {string} tagName
 * @param {string} [name]
 * @returns {?ElementInterface}
 */
function getOrCreateInterfaceFromTagName(tagName, name) {
    var proto, interf;
    if (hasOwnProperty(interfacesByTagName, tagName)) {
        return interfacesByTagName[tagName];
    }
    try {
        proto = getPrototypeOf(createElement(tagName));
    } catch (ex) {
        interfacesByTagName[tagName] = null;
        return null;
    }
    interf = getOrCreateInterface(proto, proto.constructor, name);
    return interf === HTMLUnknownElementInterface ? null : interf;
}

// Loop through all window properties that appear to be an HTML element interface.
props = Object.getOwnPropertyNames(window);
x = 0;
y = props.length;
while (x < y) {
    name = props[x++];
    if (reg_htmlInterface.test(name)) {
        ctor = window[name];
        if (ctor && !priv.has(ctor)) {
            getOrCreateInterface(ctor.prototype, ctor, name);
        }
    }
}

// Add some other known interfaces by name.
createInterface(Image.prototype, Image, 'Image');
createInterface(Option.prototype, Option, 'Option');
if (window.Audio) {
    getOrCreateInterface(Audio.prototype, Audio, 'Audio');
}

// Loop through all predefined tag names and determine which ones are supported.
x = 0;
y = tagNames.length;
while (x < y) {
    tagName = tagNames[x++];
    /*
     * No need to use getOrCreateInterfaceFromTagName here because these tag names came
     * from ../data/tag-names.js. They're trusted to be valid HTML tag names, meaning
     * we can do the same operations from getOrCreateInterfaceFromTagName() but faster
     * (since we're not using a try / catch block).
     */
    proto = getPrototypeOf(createElement(tagName));
    interf = getOrCreateInterface(proto, proto.constructor, name);
    if (interf === HTMLUnknownElementInterface) {
        interf = null;
    }
    if (interf) {
        addTagName(interf, tagName);
    } else {
        interfacesByTagName[tagName] = null;
    }
}

module.exports = {
    /**
     * Returns the constructor for the built-in HTML element type associated with the given interface name (i.e. "HTMLDivElement"), or null if the current browser does not recognize the interface name.
     * 
     * @param {string} interfaceName - The interface name (i.e. "HTMLDivElement") whose constructor should be returned.
     * 
     * @returns {?function} - The constructor for the built-in HTML element type associated with the given interface name, or null if the current browser does not recognize the interface name.
     */
    constructorFromInterfaceName: function constructorFromInterfaceName(interfaceName) {
        var n = interfacesByName[interfaceName];
        return (n && n.constructor) || null;
    },
    /**
     * Returns the constructor for the built-in HTML element type associated with the given prototype interface object, or null if the current browser does not recognize the prototype interface object.
     * 
     * @param {object} prototype - The prototype interface object whose constructor should be returned.
     * 
     * @returns {?function} - The constructor for the built-in HTML element type associated with the given prototype interface object, or null if the current browser does not recognize the prototype interface object.
     */
    constructorFromPrototype: function constructorFromPrototype(prototype) {
        var n = priv.get(prototype);
        return (n && n.constructor) || null;
    },
    /**
     * Returns the constructor for the built-in HTML element type associated with the given tag name (i.e. "div"), or null if the current browser does not recognize the tag name.
     * 
     * @param {string} tagName - The tag name (i.e. "div") whose constructor should be returned.
     * 
     * @returns {?function} - The constructor for the built-in HTML element type associated with the given tag name, or null if the current browser does not recognize the tag name.
     */
    constructorFromTagName: function constructorFromTagName(tagName) {
        var n = getOrCreateInterfaceFromTagName(tagName);
        return (n && n.constructor) || null;
    },
    /**
     * An array containing all of the element interfaces that have been detected.
     * 
     * @type {Array.<ElementInterface>}
     */
    interfaces: interfaces,
    /**
     * Determines whether the given object is the constructor function of a built-in HTML element type that is recognized by the current browser.
     * 
     * @param {function} constructor - The object to test.
     * 
     * @returns {boolean} - True if the given object is the constructor function of a built-in HTML element type that is recognized by the current browser; otherwise, false.
     */
    isElementInterface: function isElementInterface(constructor) {
        return priv.has(constructor);
    },
    /**
     * Determines whether the given object is the interface prototype object of a built-in HTML element type that is recognized by the current browser.
     * 
     * @param {object} prototype - The object to test.
     * 
     * @returns {boolean} - True if the given object is the interface prototype object of a built-in HTML element type that is recognized by the current browser; otherwise, false.
     */
    isElementPrototype: function isElementPrototype(prototype) {
        return priv.has(prototype);
    },
    /**
     * Determines whether the given tag name corresponds to a built-in HTML element that is recognized by the current browser.
     * 
     * @param {string} tagName - The tag name of the element to test.
     * 
     * @returns {boolean} - True if the tag name corresponds to a built-in HTML element that is recognized by the current browser; otherwise, false.
     */
    isKnownTagName: function isKnownTagName(tagName) {
        return !isValidCustomElementName(tagName) && !!getOrCreateInterfaceFromTagName(tagName);
    }
};
