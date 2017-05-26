const
    SauceLabs = require('saucelabs'),
    webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until;

const
    checkInterval = 5000,
    checkIntervalSeconds = checkInterval / 1000,
    checkLimit = 12,
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
        console.log('Launching status request ' + (checkCount + 1) + ' of ' + checkLimit + ' in ' + checkIntervalSeconds + ' second' + (checkIntervalSeconds === 1 ? '' : 's') + '.');
        setTimeout(checkJobs, checkInterval);
    }

    function checkJobs() {

        checkCount++;
        console.log('Launching status request ' + checkCount + ' of ' + checkLimit + '.');

        sauce.send({
            method: 'POST',
            path: ':username/js-tests/status',
            data: {
                'js tests': runningJobIds
            }
        }, function (err, response) {
            if (err) {
                return reject(err);
            }
            if (typeof response === 'string') {
                response = JSON.parse(response);
            }

            console.log('POST ' + sauceApiUrl + ':username/js-tests/status');
            //console.log('  => ' + JSON.stringify(response));

            if (response && typeof response.completed === 'boolean') {
                if (response.completed) {
                    console.log('All jobs completed.');
                    resolve(response['js tests']);
                } else {
                    console.log('Some jobs are still in progress.');
                    if (checkCount < checkLimit) {
                        scheduleJobCheck();
                    } else {
                        reject(new Error('Status request timeout'));
                    }
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
                ['Linux', 'opera', 'latest']
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