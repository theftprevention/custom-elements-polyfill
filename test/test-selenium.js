const
    SauceLabs = require('saucelabs'),
    webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until;

const
    checkInterval = 5000,
    checkIntervalSeconds = checkInterval / 1000,
    sauceApiUrl = 'https://saucelabs.com/rest/v1/',
    completedJobs = [],
    runningJobIds = [],
    username = process.env.SAUCE_USERNAME,
    accessKey = process.env.SAUCE_ACCESS_KEY,
    sauce = (username && accessKey) ? new SauceLabs({ username: username, password: accessKey }) : null;

var checkCount = 0,
    browser;

const whenJobsCompleted = (function () {

    var resolve, reject, promise;

    function scheduleJobCheck() {
        console.log('Launching status request ' + (checkCount + 1) + ' in ' + checkIntervalSeconds + ' second' + (checkIntervalSeconds === 1 ? '' : 's') + '.');
        setTimeout(checkJobs, checkInterval);
    }

    function checkJobs() {

        checkCount++;
        console.log('Launching status request ' + checkCount + '.');

        sauce.send({
            method: 'POST',
            path: ':username/js-tests/status',
            data: {
                'js tests': runningJobIds
            }
        }, function (err, response) {
            var tests, test, remaining, i, l, j;
            if (err) {
                return reject(err);
            }
            if (typeof response === 'string') {
                response = JSON.parse(response);
            }

            console.log('POST ' + sauceApiUrl + ':username/js-tests/status');
            console.log('  => ' + JSON.stringify(response));

            if (response && typeof response.completed === 'boolean') {
                tests = response['js tests'];
                if (tests instanceof Array) {
                    remaining = 0;
                    for (i = 0, l = tests.length; i < l; i++) {
                        test = tests[i];
                        if ((test.result && test.result.pending === 0) || (test.status && String(test.status).toLowerCase() === 'test error')) {
                            j = runningJobIds.length;
                            while (j--) {
                                if (runningJobIds[j] === test.id) {
                                    runningJobIds.splice(j, 1);
                                    break;
                                }
                            }
                            if (test.status) {
                                console.log('Job failed: ' + test.id);
                                console.log(JSON.stringify(test));
                            } else {
                                console.log('Job complete: ' + test.id);
                            }
                        }
                        if (!test.result) {
                            remaining++;
                        }
                    }
                }
                if (response.completed) {
                    console.log('All jobs completed.');
                    resolve(tests);
                } else {
                    if (typeof remaining === 'number') {
                        console.log(remaining + ' job' + (remaining === 1 ? ' is' : 's are') + ' still in progress.');
                    } else {
                        console.log('Some jobs are still in progress.');
                    }
                    scheduleJobCheck();
                }
            } else {
                reject(new Error('Could not parse API response.'));
            }
        });
    }

    /**
     * @returns {Promise}
     */
    return function whenJobsCompleted() {
        if (!promise) {
            promise = new Promise(function (res, rej) {
                resolve = res;
                reject = rej;
            });
            scheduleJobCheck();
        }
        return promise;
    };

})();

if (sauce) {

    console.log('Using Sauce Connect.');
    console.log('Travis Job Number:   ' + process.env.TRAVIS_JOB_NUMBER);
    console.log('Travis Build Number: ' + process.env.TRAVIS_BUILD_NUMBER);

    //browser = new webdriver.Builder()
    //    .usingServer('http://' + username + ':' + accessKey + '@ondemand.saucelabs.com:80/wd/hub')
    //    .withCapabilities(webdriver.Capabilities.chrome().merge({
    //        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    //        build: process.env.TRAVIS_BUILD_NUMBER,
    //        username: username,
    //        accessKey: accessKey
    //    }))
    //    .build();
    //
    //browser.getSession().then(function (session) {
    //    console.log('Session ID is ' + (session && typeof session.getId === 'function' ? '"' + session.getId() + '"' : 'unavailable') + '.');
    //    return browser.get('http://localhost:8000/test/index.html');
    //}).then(function () {
    //    return browser.wait(until.elementLocated(by.id('results')), 80000);
    //}).then(function (resultContainer) {
    //    return resultContainer.getText();
    //}).then(function (resultText) {
    //    console.log('Results:')
    //    console.log(resultText);
    //
    //    browser.quit();
    //});
    
    sauce.send({
        method: 'POST',
        path: ':username/js-tests',
        data: {
            url: 'http://localhost:8000/test/index.html',
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
        }
    }, function (err, response) {
        var newJobIds, i, j, l;
        if (err) {
            throw err;
        }
        if (typeof response === 'string') {
            response = JSON.parse(response);
        }

        console.log('POST ' + sauceApiUrl + ':username/js-tests');
        console.log('  => ' + JSON.stringify(response));

        if (response && response['js tests'] instanceof Array) {
            newJobIds = response['js tests'];
        } else {
            newJobIds = [];
        }
        for (i = 0, j = runningJobIds.length, l = newJobIds.length; i < l; i++) {
            runningJobIds[j++] = newJobIds[i];
        }

        console.log('All running jobs: ' + JSON.stringify(runningJobIds));

        whenJobsCompleted().then(function () {
            console.log('Done! Terminating script.');
        }).catch(function (error) {
            throw error;
        });
    });

}