'use strict';

require('./build-polyfill').then(function () {
    require('./build-tests');
}, function (err) {
    console.error(err);
});
