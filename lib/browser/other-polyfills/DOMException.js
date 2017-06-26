(function (window) {
    'use strict';

    var constructorError = "Failed to construct 'DOMException': Please use the 'new' operator, this DOM object constructor cannot be called as a function.",
        defineProperties = Object.defineProperties,
        defineProperty = Object.defineProperty,
        DOMException = window.DOMException,
        Error = window.Error,
        hasOwnProperty = (function () {
            var hOP = Object.prototype.hasOwnProperty;
            return function (O, p) {
                return hOP.call(O, p);
            };
        })(),
        nativePrototype = typeof DOMException === 'function' ? DOMException.prototype : null,
        nativeConstructor = nativePrototype ? (function () {
            try {
                new DOMException('', 'SyntaxError');
                return DOMException;
            } catch (e) {
                return null;
            }
        })() : null,
        getters = false,
        nativeGetters = false,
        ILLEGAL_INVOCATION = 'Illegal invocation',
        String = window.String,
        TypeError = window.TypeError,

        get_code, get_message, get_name,
        codes, props, names, i, l, constants, code;

    if (nativeConstructor && nativePrototype) {
        module.exports = DOMException;
        return;
    } else if (nativePrototype) {
        get_code = Object.getOwnPropertyDescriptor(nativePrototype, 'code');
        if (get_code && get_code.get) {
            getters = true;
            nativeGetters = true;
            get_code = get_code.get;
            get_message = Object.getOwnPropertyDescriptor(nativePrototype, 'message').get;
            get_name = Object.getOwnPropertyDescriptor(nativePrototype, 'name').get;
        }
    } else {
        getters = true;
    }

    props = getters ? new WeakMap() : null;

    codes = {
        IndexSizeError: { code: 1, constant: 'INDEX_SIZE_ERR' },
        HierarchyRequestError: { code: 3, constant: 'HIERARCHY_REQUEST_ERR' },
        WrongDocumentError: { code: 4, constant: 'WRONG_DOCUMENT_ERR' },
        InvalidCharacterError: { code: 5, constant: 'INVALID_CHARACTER_ERR' },
        NoModificationAllowedError: { code: 7, constant: 'NO_MODIFICATION_ALLOWED_ERR' },
        NotFoundError: { code: 8, constant: 'NOT_FOUND_ERR' },
        NotSupportedError: { code: 9, constant: 'NOT_SUPPORTED_ERR' },
        InvalidStateError: { code: 11, constant: 'INVALID_STATE_ERR' },
        SyntaxError: { code: 12, constant: 'SYNTAX_ERR' },
        InvalidModificationError: { code: 13, constant: 'INVALID_MODIFICATION_ERR' },
        NamespaceError: { code: 14, constant: 'NAMESPACE_ERR' },
        InvalidAccessError: { code: 15, constant: 'INVALID_ACCESS_ERR' },
        TypeMismatchError: { code: 17, constant: 'TYPE_MISMATCH_ERR' },
        SecurityError: { code: 18, constant: 'SECURITY_ERR' },
        NetworkError: { code: 19, constant: 'NETWORK_ERR' },
        AbortError: { code: 20, constant: 'ABORT_ERR' },
        URLMismatchError: { code: 21, constant: 'URL_MISMATCH_ERR' },
        QuotaExceededError: { code: 22, constant: 'QUOTA_EXCEEDED_ERR' },
        TimeoutError: { code: 23, constant: 'TIMEOUT_ERR' },
        InvalidNodeTypeError: { code: 24, constant: 'INVALID_NODE_TYPE_ERR' },
        DataCloneError: { code: 25, constant: 'DATA_CLONE_ERR' }
    };

    DOMException = function DOMException(message, name) {
        var code, err;
        if (!(this instanceof DOMException) || (props && props.has(this))) {
            throw new TypeError(constructorError);
        }
        if (nativePrototype && getters) {
            try {
                get_code.call(this);
            } catch (ex) {
                err = ex;
            }
            if (!err) {
                throw new TypeError(constructorError);
            }
        }
        Error.call(this);
        code = hasOwnProperty(codes, name) ? codes[name].code : 0;
        message = message === undefined ? '' : String(message);
        name = (name === undefined) ? 'Error' : String(name);
        if (getters) {
            props.set(this, {
                code: code,
                message: message,
                name: name
            });
            if (hasOwnProperty(this, 'message')) {
                delete this.message;
            }
            if (hasOwnProperty(this, 'name')) {
                delete this.name;
            }
        } else {
            defineProperties(this, {
                code: {
                    configurable: true,
                    enumerable: true,
                    value: code
                },
                message: {
                    configurable: true,
                    enumerable: true,
                    value: message
                },
                name: {
                    configurable: true,
                    enumerable: true,
                    value: name
                }
            });
        }
    };

    module.exports = DOMException;
    defineProperty(window, 'DOMException', {
        configurable: true,
        enumerable: false,
        value: DOMException,
        writable: true
    });

    if (nativeGetters) {
        DOMException.prototype = defineProperties(nativePrototype, {
            constructor: {
                configurable: true,
                enumerable: false,
                value: DOMException,
                writable: true
            },
            code: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = props.get(this);
                    return p ? p.code : get_code.call(this);
                }
            },
            message: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = props.get(this);
                    return p ? p.message : get_message.call(this);
                }
            },
            name: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = props.get(this);
                    return p ? p.name : get_name.call(this);
                }
            }
        });

        return;
    }

    names = Object.getOwnPropertyNames(codes);

    DOMException.prototype = Object.create(Error.prototype, {
        constructor: {
            configurable: true,
            enumerable: false,
            value: DOMException,
            writable: true
        }
    });

    if (getters) {
        defineProperties(DOMException.prototype, {
            code: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = this instanceof DOMException ? props.get(this) : null;
                    if (!p) {
                        throw new TypeError(ILLEGAL_INVOCATION);
                    }
                    return p.code;
                }
            },
            message: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = this instanceof DOMException ? props.get(this) : null;
                    if (!p) {
                        throw new TypeError(ILLEGAL_INVOCATION);
                    }
                    return p.message;
                }
            },
            name: {
                configurable: true,
                enumerable: true,
                get: function () {
                    var p = this instanceof DOMException ? props.get(this) : null;
                    if (!p) {
                        throw new TypeError(ILLEGAL_INVOCATION);
                    }
                    return p.name;
                }
            }
        });
    }

    constants = {};
    i = 0;
    l = names.length;
    while (i < l) {
        code = codes[names[i++]];
        constants[code.constant] = {
            configurable: false,
            enumerable: true,
            value: code.code,
            writable: false
        };
    }

    defineProperties(DOMException, constants);
    defineProperties(DOMException.prototype, constants);

})(typeof global !== 'undefined' ? global : (typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : {})));
