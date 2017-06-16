module.exports = (function () {
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor,
        getOwnPropertyNames = Object.getOwnPropertyNames,
        getOwnPropertySymbols = Object.getOwnPropertySymbols;

    if (typeof Object.getOwnPropertyDescriptors !== 'function') {
        Object.defineProperty(Object, 'getOwnPropertyDescriptors', {
            configurable: true,
            /**
             * @param {object} O
             * @returns {object}
             */
            value: function getOwnPropertyDescriptors(O) {
                var names = getOwnPropertyNames(O),
                    i = 0,
                    l = names.length,
                    result = {},
                    name;
                while (i < l) {
                    name = names[i++];
                    result[name] = getOwnPropertyDescriptor(O, name);
                }
                if (getOwnPropertySymbols) {
                    names = getOwnPropertySymbols;
                    i = 0;
                    l = names.length;
                    while (i < l) {
                        name = names[i++];
                        result[name] = getOwnPropertyDescriptor(O, name);
                    }
                }
                return result;
            },
            writable: true
        });
    }

    return Object.getOwnPropertyDescriptors;
    
})();
