module.exports = (function () {
    var toStr, isCallable, toInteger, maxSafeInteger, toLength, from;
    if (typeof Array.from === 'function') {
        return Array.from;
    }

    toStr = Object.prototype.toString,
    isCallable = function (fn) {
        return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
    };
    toInteger = function (value) {
        var number = Number(value);
        if (isNaN(number)) { return 0; }
        if (number === 0 || !isFinite(number)) { return number; }
        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    maxSafeInteger = Math.pow(2, 53) - 1;
    toLength = function (value) {
        var len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
    };
    from = function from(arrayLike) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Browser_compatibility
        // Production steps of ECMA-262, Edition 6, 22.1.2.1
        // Reference: https://people.mozilla.org/~jorendorff/es6-draft.html#sec-array.from

        var C, items, mapFn, T, len, A, k, kValue;

        // 1. Let C be the this value.
        C = this;

        // 2. Let items be ToObject(arrayLike).
        items = Object(arrayLike);

        // 3. ReturnIfAbrupt(items).
        if (arrayLike == null) {
            throw new TypeError("Array.from requires an array-like object - not null or undefined");
        }

        // 4. If mapfn is undefined, then let mapping be false.
        mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        if (typeof mapFn !== 'undefined') {
            // 5. else
            // 5. a. If IsCallable(mapfn) is false, throw a TypeError exception.
            if (!isCallable(mapFn)) {
                throw new TypeError('Array.from: when provided, the second argument must be a function');
            }

            // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
            if (arguments.length > 2) {
                T = arguments[2];
            }
        }

        // 10. Let lenValue be Get(items, "length").
        // 11. Let len be ToLength(lenValue).
        len = toLength(items.length);

        // 13. If IsConstructor(C) is true, then
        // 13. a. Let A be the result of calling the [[Construct]] internal method of C with an argument list containing the single item len.
        // 14. b. Else, Let A be ArrayCreate(len).
        A = isCallable(C) ? Object(new C(len)) : new Array(len);

        // 16. Let k be 0.
        k = 0;
        // 17. Repeat, while k < len (also steps a - h)
        while (k < len) {
            kValue = items[k];
            if (mapFn) {
                A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
            } else {
                A[k] = kValue;
            }
            k += 1;
        }
        // 18. Let putStatus be Put(A, "length", len, true).
        A.length = len;
        // 20. Return A.
        return A;
    };
    Object.defineProperty(Array, 'from', {
        configurable: true,
        enumerable: false,
        value: from,
        writable: true
    });
    return from;
}());
