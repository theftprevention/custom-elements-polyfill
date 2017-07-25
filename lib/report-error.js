'use strict';

var consoleError = window.console && typeof window.console.error === 'function' ? window.console.error.bind(window.console) : function () {},
    createEvent,
    dispatch = window.dispatchEvent.bind(window),
    ErrorEvent_get_colno,
    ErrorEvent_get_error,
    errorEventProps,
    errorTest = (function () {
        try {
            throw new TypeError('test');
        } catch (ex) {
            return ex;
        }
    })(),
    eventConstructors = (function () {
        try {
            new ErrorEvent('error');
            return true;
        } catch (e) {
            return false;
        }
    })(),
    Event_preventDefault,
    Event_get_defaultPrevented = Object.getOwnPropertyDescriptor(Event.prototype, 'defaultPrevented').get,
    Event_get_defaultPrevented_old,
    hasStack = typeof errorTest.stack === 'string',
    initErrorEvent,
    int = parseInt,
    reg_newline = /\r\n|\r|\n/,
    reg_stack = /([^@\(\s]+):(\d+):(\d+)/,
    stackIncludesDescription = hasStack ? /TypeError/.test(errorTest.stack) : false,
    String_slice = String.prototype.slice;

/**
 * @param {Error} error
 * @returns {ErrorEvent}
 */
function createErrorEvent(error) {
    return new ErrorEvent('error', getErrorInfo(error));
}

/**
 * @param {Error} error
 * @returns {ErrorEventInit}
 */
function getErrorInfo(error) {
    var stack = error.stack,
        result = {
            bubbles: false,
            cancelable: true,
            colno: 0,
            error: error,
            filename: '',
            lineno: 0,
            message: error.message
        },
        match;
    if (!stack || typeof stack !== 'string') {
        return result;
    }
    if (stackIncludesDescription) {
        match = reg_newline.exec(stack);
        if (match) {
            stack = String_slice.call(error.stack, match.index + match[0].length);
        }
    }
    match = reg_stack.exec(stack);
    if (match) {
        result.filename = match[1];
        result.lineno = int(match[2], 10);
        result.colno = int(match[3], 10);
    }
    return result;
}

if (!eventConstructors) {

    createEvent = Document.prototype.createEvent.bind(document);
    ErrorEvent_get_colno = Object.getOwnPropertyDescriptor(ErrorEvent.prototype, 'colno').get;
    ErrorEvent_get_error = Object.getOwnPropertyDescriptor(ErrorEvent.prototype, 'error').get;
    errorEventProps = require('./private-property-store')('error');
    Event_get_defaultPrevented_old = Event_get_defaultPrevented;
    Event_preventDefault = Event.prototype.preventDefault;
    initErrorEvent = ErrorEvent.prototype.initErrorEvent;

    Event_get_defaultPrevented = function () {
        var props = errorEventProps.get(this);
        return props ? props.defaultPrevented : Event_get_defaultPrevented_old.call(this);
    };

    Object.defineProperties(ErrorEvent.prototype, {
        colno: {
            configurable: true,
            enumerable: true,
            get: function () {
                var props = errorEventProps.get(this);
                return props ? props.colno : ErrorEvent_get_colno.call(this);
            }
        },
        defaultPrevented: {
            configurable: true,
            enumerable: true,
            get: Event_get_defaultPrevented
        },
        error: {
            configurable: true,
            enumerable: true,
            get: function () {
                var props = errorEventProps.get(this);
                return props ? props.error : ErrorEvent_get_error.call(this);
            }
        },
        preventDefault: {
            configurable: true,
            enumerable: true,
            value: function preventDefault() {
                var props = errorEventProps.get(this);
                if (props) {
                    props.defaultPrevented = true;
                }
                Event_preventDefault.call(this);
            },
            writable: true
        }
    });

    /**
     * @param {Error} error
     * @returns {ErrorEvent}
     */
    createErrorEvent = function createErrorEvent(error) {
        var event = createEvent('ErrorEvent'),
            props = getErrorInfo(error);
        props.defaultPrevented = false;
        props.error = error;
        initErrorEvent.call(event, 'error', props.bubbles, props.cancelable, props.message, props.filename, props.lineno);
        errorEventProps.set(event, props);
        return event;
    };

}

/**
 * Reports the provided error without throwing it.
 * 
 * @param {Error} error - The error being reported.
 */
module.exports = function reportError(error) {
    var event = createErrorEvent(error);
    dispatchEvent(event);
    if (!Event_get_defaultPrevented.call(event)) {
        consoleError('Uncaught ' + (!error.stack || !stackIncludesDescription ? error.name + ': ' : '') + (error.stack || error.message));
    }
};
