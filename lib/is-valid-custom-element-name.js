'use strict';

var reg_reservedTagNames = /^(?:annotation-xml|color-profile|font-face(?:-(?:src|uri|format|name))?|missing-glyph)$/,
    reg_validCustomElementName = (function () {
        var supportsRegexUnicodeFlag = (function () {
            try {
                new RegExp('1', 'u');
                return true;
            } catch (ex) {
                return false;
            }
        })();

        // If the browser supports the 'u' flag, then the '\u{xxxxx}' token is used to
        // detect code points in the astral plane. The browser's implementation is likely
        // to be faster than the fallback regular expression in the 'else' block.
        if (supportsRegexUnicodeFlag) {
            return new RegExp('^[a-z][\\-\\.0-9_a-z\\xB7\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}]*-[\\-\\.0-9_a-z\\xB7\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u203F-\\u2040\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}]*$', 'u');
        } else {
            return /^[a-z](?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*\-(?:[\-\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
        }
    })();

/**
 * Determines whether the provided tag name is a valid custom element name.
 * @param {string} tagName - The tag name.
 * @returns {boolean}
 */
function isValidCustomElementName(tagName) {
    return (!reg_reservedTagNames.test(tagName) && reg_validCustomElementName.test(tagName));
}

module.exports = isValidCustomElementName;
