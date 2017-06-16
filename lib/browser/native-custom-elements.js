'use strict';

var classes = require('./classes'),
    globalEval = window.eval,
    instance, prototype, define, get, whenDefined;

// If the browser doesn't support ES6 classes, then it's guaranteed that the browser
// also doesn't have a native custom elements implementation.
if (classes.supported && typeof window.CustomElementRegistry === 'function' && window.customElements instanceof window.CustomElementRegistry) {
    instance = window.customElements;
    prototype = window.CustomElementRegistry.prototype;
    define = prototype.define.bind(instance);
    get = prototype.get.bind(instance);
    whenDefined = prototype.whenDefined.bind(instance);

    module.exports = {
        canExtend: (function () {
            var name = 'custom-elements-polyfill-test',
                constructor, e;
            try {
                constructor = globalEval("(function(){return class extends HTMLDivElement{constructor(){super();}};})()");
                define(name, constructor, { 'extends': 'div' });
                e = new constructor();
                return (e && e instanceof HTMLDivElement && e.tagName === 'DIV' && e.getAttribute('is') === name);
            } catch (ex) {
                return false;
            }
        })(),
        define: define,
        'get': get,
        instance: instance,
        prototype: prototype,
        whenDefined: whenDefined
    };
} else {
    module.exports = false;
}
