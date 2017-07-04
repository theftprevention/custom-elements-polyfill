const
    SauceLabs = require('saucelabs'),
    sauceApiUrl = 'https://saucelabs.com/rest/v1/';

/**
 * @typedef {Object} SauceTest
 * @property {number} checkCount
 * @property {number} checkInterval
 * @property {Array.<string>} completedJobs
 * @property {object} options
 * @property {Promise} promise
 * @property {function} reject
 * @property {function} resolve
 * @property {Array.<string>} runningJobs
 * @property {SauceLabs} sauce
 * @property {number} travisBuildNumber
 * @property {number} travisJobNumber
 */

/**
 * @param {SauceTest} test
 */
function scheduleJobCheck(test) {
    setTimeout(checkJobs, test.checkInterval, test);
}

/**
 * @param {SauceTest} test
 * @param {object} job
 */
function checkJob(test, job) {
    var i;
    if (job.result === null || (job.result && job.result.pending === 0) || (job.status && String(job.status).toLowerCase() === 'test error')) {
        i = test.runningJobs.length;
        while (i--) {
            if (test.runningJobs[i] === job.id) {
                test.runningJobs.splice(i, 1);
                break;
            }
        }
        test.completedJobs.push(job.id);
        if (job.status) {
            console.log('Job failed: ' + job.id);
            console.log(JSON.stringify(job));
        } else {
            console.log('Job complete: ' + job.id);
        }
    }
}

/**
 * @param {SauceTest} test 
 */
function checkJobs(test) {

    test.checkCount++;

    test.sauce.send({
        method: 'POST',
        path: ':username/js-tests/status',
        data: {
            'js tests': test.runningJobs
        }
    }, function (err, responseData) {
        var response, jobs, i;

        if (err) {
            return test.reject(err);
        }
        
        console.log('Status request #' + test.checkCount + ':');

        try {
            response = JSON.parse(responseData);
            jobs = response && response['js tests'];
            if (!Array.isArray(jobs)) {
                throw new Error('Could not parse API response.');
            }
        } catch (ex) {
            console.log();
            console.error(ex);
            console.log();
            console.log('POST ' + sauceApiUrl + ':username/js-tests/status');
            console.log('  => ' + responseData);
            return test.reject(ex);
        }

        jobs.forEach(checkJob.bind(null, test));

        i = test.runningJobs.length;
        if (i === 0) {
            console.log('All jobs completed.');
            console.log();
            resolve(jobs);
        } else {
            console.log(i + ' job' + (i === 1 ? ' is' : 's are') + ' still in progress.');
            console.log();
            scheduleJobCheck(test);
        }
    });
}

/**
 * @param {object} options
 * @returns {Promise}
 */
function runSauceTests(options) {
    var e = process.env,
        promise, resolve, reject, sauce, test;

    promise = new Promise(function (y, n) { resolve = y; reject = n; });

    if (!e.SAUCE_USERNAME || !e.SAUCE_ACCESS_KEY) {
        reject(new Error('SauceLabs credentials are missing.'));
        return promise;
    } else if (!e.TRAVIS_JOB_NUMBER || !e.TRAVIS_BUILD_NUMBER) {
        reject(new Error('Travis CI environment variables are missing.'));
        return promise;
    }

    console.log('Beginning Sauce API tests.');
    console.log(JSON.stringify(options || {}, null, 4));
    console.log();

    sauce = new SauceLabs({ username: e.SAUCE_USERNAME, password: e.SAUCE_ACCESS_KEY });

    test = {
        checkCount: 0,
        checkInterval: 10000,
        completedJobs: [],
        options: options,
        promise: promise,
        reject: reject,
        resolve: resolve,
        runningJobs: [],
        sauce: sauce,
        travisBuildNumber: e.TRAVIS_BUILD_NUMBER,
        travisJobNumber: e.TRAVIS_JOB_NUMBER
    };

    sauce.send({
        method: 'POST',
        path: ':username/js-tests',
        data: options
    }, function (err, responseData) {
        var response, jobs, i;
        if (err) {
            throw err;
        }

        try {
            response = JSON.parse(responseData);
            jobs = response && response['js tests'];
            if (!Array.isArray(jobs)) {
                throw new Error('Could not parse API response.');
            }
            if (jobs.length === 0) {
                throw new Error('The API response returned an empty job list.');
            }
        } catch (ex) {
            console.log();
            console.error(ex);
            console.log();
            console.log('POST ' + sauceApiUrl + ':username/js-tests');
            console.log('  => ' + responseData);
            return reject(ex);
        }

        test.runningJobs = jobs;
        i = jobs.length;

        console.log('Started ' + i + ' job' + (i === 1 ? '' : 's') + ':');
        console.log(JSON.stringify(jobs, null, 4));
        console.log();

        scheduleJobCheck(test);
    });

    return promise;
}

runSauceTests({
    url: 'http://localhost:8000/test/browser/index.html',
    platforms: [
        ['Windows 7', 'internet explorer', '11'],
        ['Windows 10', 'chrome', '58'],
        ['Windows 10', 'MicrosoftEdge', '14'],
        ['macOS 10.12', 'firefox', '53'],
        ['Mac 10.11', 'iphone', '10.2']
    ],
    framework: 'mocha',
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    build: process.env.TRAVIS_BUILD_NUMBER,
    recordScreenshots: true,
    recordVideo: true
}).then(function () {
    console.log('Sauce Labs tests complete.');
}, function (err) {
    console.log(err);
});
