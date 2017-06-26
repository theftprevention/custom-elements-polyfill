'use strict';

var common = require('./common'),

    allTagNames,
    constructorsByInterfaceName = {},
    constructorsByTagName = {},
    document = window.document,
    Document_createElement = Document.prototype.createElement,
    getOwnPropertyNames = Object.getOwnPropertyNames,
    hasOwnProperty = common.hasOwnProperty,
    HTMLElement = window.HTMLElement,
    HTMLElementProto = HTMLElement.prototype,
    interfaceNames,
    interfaces = [],
    isPrototypeOf = common.isPrototypeOf,
    // 'predefinedTagNames' is an object where each key is the name of a native HTML element
    // interface and each value is a string or an array of strings, each of which is the
    // localName of an element that is known to implement that interface.
    // 
    // An empty array signifies that there are no tag names associated with the interface,
    // meaning it will not be included in the mapping. This is generally done for interfaces
    // that are deprecated, obsolete, or abstract.
    predefinedTagNames = {
        HTMLAnchorElement: ['a'],
        HTMLDListElement: ['dl'],
        HTMLDirectoryElement: ['dir'],
        HTMLHeadingElement: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        HTMLKeygenElement: [], // deprecated
        HTMLModElement: ['del', 'ins'],
        HTMLOListElement: ['ol'],
        HTMLParagraphElement: ['p'],
        HTMLQuoteElement: ['blockquote'],
        HTMLTableCaptionElement: ['caption'],
        HTMLTableCellElement: ['td', 'th'],
        HTMLTableColElement: ['col'],
        HTMLTableRowElement: ['tr'],
        HTMLTableSectionElement: ['tbody', 'tfoot', 'thead'],
        HTMLUListElement: ['ul'],
        HTMLUnknownElement: [] // abstract
    },
    props = getOwnPropertyNames(window),
    prototypes = [],
    reg_htmlInterface = /^HTML(.+)Element$/,
    toLower = (function () {
        var S = String,
            t = S.prototype.toLowerCase;
        return function toLower(string) {
            return t.call(S(string));
        };
    })(),

    i = 0,
    l = props.length,
    n = 1,
    name, match, interf, tagNames, isPredefined, element, t, tagName;

/**
 * @param {string} interfaceName
 * @returns {?function}
 */
function constructorFromInterfaceName(interfaceName) {
    return constructorsByInterfaceName[interfaceName] || null;
}

/**
 * @param {object} prototype
 * @returns {?function}
 */
function constructorFromPrototype(prototype) {
    var i = prototypes.length;
    while (i--) {
        if (prototype === prototypes[i]) {
            return interfaces[i];
        }
    }
    return null;
}

/**
 * @param {string} tagName
 * @returns {?function}
 */
function constructorFromTagName(tagName) {
    return constructorsByTagName[tagName] || null;
}

/**
 * @param {function} constructor
 * @returns {boolean}
 */
function isElementInterface(constructor) {
    var i = interfaces.length;
    while (i--) {
        if (constructor === interfaces[i]) {
            return true;
        }
    }
    return false;
}

/**
 * @param {object} proto
 * @returns {boolean}
 */
function isElementPrototype(proto) {
    var i = prototypes.length;
    while (i--) {
        if (proto === prototypes[i]) {
            return true;
        }
    }
    return false;
}

/**
 * @param {string} tagName
 * @returns {boolean}
 */
function isKnownTagName(tagName) {
    return hasOwnProperty(constructorsByTagName, tagName);
}

interfaces[0] = HTMLElement;
prototypes[0] = HTMLElementProto;

while (i < l) {
    name = props[i++];
    match = reg_htmlInterface.exec(name);
    interf = match == null ? null : window[name];
    if (interf && interf.prototype && isPrototypeOf(HTMLElementProto, interf.prototype)) {
        constructorsByInterfaceName[name] = interf;
        interfaces[n++] = interf;
        prototypes[n] = interf.prototype;
        isPredefined = hasOwnProperty(predefinedTagNames, name);
        if (isPredefined) {
            tagNames = predefinedTagNames[name];
        } else {
            tagNames = [toLower(match[1])];
        }
        t = tagNames.length;
        if (isPredefined) {
            while (t--) {
                constructorsByTagName[tagNames[t]] = interf;
            }
        } else {
            while (t--) {
                tagName = tagNames[t];
                element = Document_createElement.call(document, tagName);
                if (element instanceof interf) {
                    constructorsByTagName[tagName] = interf;
                }
            }
        }
    }
}

allTagNames = getOwnPropertyNames(constructorsByTagName);
interfaceNames = getOwnPropertyNames(constructorsByInterfaceName);

module.exports = {
    constructorFromInterfaceName: constructorFromInterfaceName,
    constructorFromPrototype: constructorFromPrototype,
    constructorFromTagName: constructorFromTagName,
    interfaceNames: interfaceNames,
    isElementInterface: isElementInterface,
    isElementPrototype: isElementPrototype,
    isKnownTagName: isKnownTagName,
    tagNames: allTagNames
};
