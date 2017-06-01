/// <reference path="../src/custom-elements-polyfill.js" />
/// <reference path="https://cdn.rawgit.com/Automattic/expect.js/0.3.1/index.js" />
/// <reference path="https://cdnjs.cloudflare.com/ajax/libs/mocha/3.4.1/mocha.min.js" />

(function (global, undefined) {
    'use strict';

    /**
     * @typedef {object} TestDefinitionOptions
     * 
     * @property {boolean} defineEarly - True if the custom element definition should be registered
     *   before the document is interactive; otherwise, false.
     * @property {?string} localName - The local name. For customized built-in elements, this should
     *   be the local name of the extended element (i.e. 'div'). For autonomous custom elements, this
     *   should be undefined or null.
     */
    
    var api = {},
        builtInElements = {},
        comparisonInterface = (HTMLUnknownElement || HTMLElement).prototype,
        container = document.getElementById('test-container'),
        createElement = Document.prototype.createElement.bind(document),
        definitions = {},
        descriptors = {},
        emptyElements = 'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr'.split(','),
        expect = window.expect,
        interfacesByPrototype = new Map(),
        Mocha = global.Mocha,
        mocha = global.mocha,
        nameIncrement = 0,
        predefinedTagNames = {
            HTMLAnchorElement: 'a',
            HTMLDListElement: 'dl',
            HTMLDirectoryElement: 'dir',
            HTMLHeadingElement: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            HTMLKeygenElement: null,
            HTMLModElement: ['del', 'ins'],
            HTMLOListElement: 'ol',
            HTMLParagraphElement: 'p',
            HTMLQuoteElement: 'blockquote',
            HTMLTableCaptionElement: 'caption',
            HTMLTableCellElement: ['td', 'th'],
            HTMLTableColElement: 'col',
            HTMLTableRowElement: 'tr',
            HTMLTableSectionElement: ['tbody', 'tfoot', 'thead'],
            HTMLUListElement: 'ul',
            HTMLUnknownElement: null
        },
        reports = [],
        tagNamesByPrototype = new Map(),
        reg_htmlInterface = /^HTML(.+)Element$/,
        reg_n1 = /[^a-zA-Z]([a-z])/g,
        reg_n2 = /[^\w\$\-]/g,
        supportsClasses = (function () {
            try {
                eval('class A{}');
                return true;
            } catch (ex) {
                return false;
            }
        })(),
        runner;

    (function () {

        var p, s;

        if (!global.Promise) {
            s = document.head.getElementsByTagName('script')[0];
            p = document.createElement('script');
            p.src = '../lib/es6-promise.auto.min.js';
            document.head.insertBefore(p, s);
        }

    })();

    /**
     * @param {Mocha.Test} test
     * @returns {string}
     */
    function flattenTitles(test) {
        var titles = [test.title];
        while (test.parent && test.parent.title) {
            titles.push(test.parent.title);
            test = test.parent;
        }
        return titles.reverse().join(' ');
    };

    /**
     * @param {object} [options]
     * @returns {Array.<TestElementDefinition>}
     */
    function generateAllTests(options) {
        var tests, names, name, value, i, j, k, newOptions, permutation, t;
        if (options instanceof Object) {
            names = Object.getOwnPropertyNames(options);
            i = names.length;
            while (i--) {
                name = names[i];
                value = options[name];
                if (value instanceof Array) {
                    tests = [];
                    t = 0;
                    j = value.length;
                    while (j--) {
                        newOptions = {};
                        Object.getOwnPropertyNames(options).forEach(function (n) {
                            newOptions[n] = options[n];
                        });
                        newOptions[name] = value[j];
                        permutation = generateAllTests(newOptions);
                        k = permutation.length;
                        while (k--) {
                            tests[t++] = permutation[k];
                        }
                    }
                    return tests;
                }
            }
            return [new TestElementDefinition(options)];
        } else {
            return generateAllTests({
                defineEarly: [true, false],
                isClass: supportsClasses ? [true, false] : false,
                localName: Object.getOwnPropertyNames(builtInElements).concat(null)
            });
        }
    }

    /**
     * @param {Mocha.Test} test
     * @param {Error} [err]
     */
    function logResult(test, err) {
        var passed = !err,
            result = {
                name: flattenTitles(test),
                result: passed
            };
        if (!passed && err) {
            if (err.message) {
                result.message = err.message;
            } else {
                result.message = String(err);
            }
            if (result.stack) {
                result.stack = err.stack;
            }
        }
        reports.push(result);
    }

    /**
     * @param {function|object} interf
     * @returns {Array.<string>}
     */
    function tagNamesFromInterface(interf) {
        if (typeof interf === 'function') {
            interf = interf.prototype;
        }
        if (!(interf instanceof Object)) {
            return null;
        }
        return tagNamesByPrototype.get(interf) || [];
    }

    /**
     * @param {string} tagName
     * @returns {string}
     */
    function tagNameToClassName(tagName) {
        var name = tagName.toLowerCase()
            .replace(reg_n1, uc)
            .replace(reg_n2, '');
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    /**
     * Represents a single custom element definition against which a series of tests is
     *   performed.
     * @class
     * 
     * @param {TestDefinitionOptions} options
     * 
     * @property {object} basePrototype - The base prototype from which the custom element's
     *   prototype is derived.
     * @property {boolean} defineEarly - True if the custom element definition should be registered
     *   before the document is interactive; otherwise, false.
     * @property {boolean} isClass - True if the custom element should be defined as an ES6 class;
     *   otherwise, false.
     * @property {string} localName - The local name. For autonomous custom elements, this is equal
     *   to the 'name'; for customized built-in elements, it is not.
     * @property {string} name - The custom element name.
     */
    function TestElementDefinition(options) {
        var name = 'test-' + (++nameIncrement),
            localName = options.localName || name,
            empty = Boolean(options.localName && emptyElements.indexOf(localName) > -1);

        Object.defineProperties(this, {
            basePrototype: {
                enumerable: true,
                value: (builtInElements[localName] || HTMLElement).prototype
            },
            defineEarly: {
                enumerable: true,
                value: !!options.defineEarly
            },
            localName: {
                enumerable: true,
                value: localName
            },
            name: {
                enumerable: true,
                value: name
            }
        });

        definitions[name] = this;
        if (localName !== 'body' && localName !== 'head' && localName !== 'html') {
            document.body.appendChild(document.createElement(localName));
            //document.write('<' + localName + (localName === name ? '' : ' is="' + name + '"') + (empty ? ' />' : '></' + localName + '>'));
        }
    }

    Object.getOwnPropertyNames(global).forEach(function (prop) {
        var match = reg_htmlInterface.exec(prop),
            interf, proto, tags, isPredefined, element, i, l;
        if (!match) {
            return;
        }
        interf = global[prop];
        if (!interf.hasOwnProperty('prototype') || !(interf.prototype instanceof HTMLElement)) {
            return;
        }
        interfacesByPrototype.set(interf.prototype, interf);
        tags = predefinedTagNames[prop];
        isPredefined = predefinedTagNames.hasOwnProperty(prop);
        if (!isPredefined) {
            tags = match[1].toLowerCase();
        }
        if (tags instanceof Array) {
            tags = tags.map(function (t) { return String(t); });
        } else if (typeof tags === 'string') {
            tags = [tags];
        } else {
            tags = [];
        }
        if (tags.length === 0) {
            return;
        }
        if (!isPredefined) {
            i = tags.length;
            while (i--) {
                element = createElement(tags[i]);
                if (Object.getPrototypeOf(element) === comparisonInterface) {
                    tags.pop();
                }
            }
        }
        for (i = 0, l = tags.length; i < l; i++) {
            descriptors[tags[i]] = {
                enumerable: true,
                value: interf
            };
        }
        tagNamesByPrototype.set(interf.prototype, tags);
    });
    Object.defineProperties(builtInElements, descriptors);

    Object.defineProperties(api, {
        builtInElements: {
            enumerable: true,
            value: builtInElements
        }
    });
    global.test = api;

    mocha.setup('bdd');
    generateAllTests();
    
    describe('window.CustomElementRegistry', function () {
        it('should be a function', function () {
            expect(CustomElementRegistry).to.be.a('function');
        });
        context('should throw a TypeError when invoked', function () {
            specify('with the new keyword', function () {
                expect(function () {
                    return new CustomElementRegistry();
                }).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
            specify('without the new keyword', function () {
                expect(CustomElementRegistry).to.throwException(function (e) {
                    expect(e).to.be.a(TypeError);
                });
            });
        });
    });

    describe('window.CustomElementRegistry.prototype', function () {
        it('should be an object', function () {
            expect(CustomElementRegistry.prototype).to.be.a('object');
        });
        it('should have a \'define\' method', function () {
            expect(CustomElementRegistry.prototype.define).to.be.a('function');
        });
        it('should have a \'get\' method', function () {
            expect(CustomElementRegistry.prototype.get).to.be.a('function');
        });
        it('should have a \'whenDefined\' method', function () {
            expect(CustomElementRegistry.prototype.whenDefined).to.be.a('function');
        });
    });

    describe('window.customElements', function () {
        it('should be an instance of CustomElementRegistry', function () {
            expect(customElements).to.be.a(CustomElementRegistry);
        });
    });

    mocha.globals(['mochaResults', 'test']);

    runner = mocha.run();
    runner.on('end', function () {

        var results = runner.stats,
            resultContainer = document.createElement('pre');

        results.reports = reports;

        global.mochaResults = results;

        resultContainer.id = 'results';
        resultContainer.appendChild(document.createTextNode(JSON.stringify(results)));

        document.body.appendChild(resultContainer);

        console.log(global.mochaResults);
    });
    runner.on('fail', logResult);
    runner.on('pass', logResult);

})(window);