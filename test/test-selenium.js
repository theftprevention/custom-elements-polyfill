const
    SauceLabs = require('saucelabs'),
    webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until;

const
    checkInterval = 5000,
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
            var jobs, job, i, j, k, l;
            if (err) {
                return reject(err);
            }
            if (typeof response === 'string') {
                response = JSON.parse(response);
            }

            console.log('POST ' + sauceApiUrl + ':username/js-tests/status');
            console.log('  => ' + JSON.stringify(response));

            if (response && typeof response.completed === 'boolean') {
                jobs = response['js tests'] instanceof Array ? response['js tests'] : [];
                for (i = 0, l = jobs.length, k = completedJobs.length; i < l; i++) {
                    job = jobs[i];
                    if (job instanceof Object && job.result && job.result.pending === 0) {
                        j = runningJobIds.length;
                        while (j--) {
                            if (runningJobIds[j] === job.id) {
                                runningJobIds.splice(j, 1);
                                completedJobs[k++] = job;
                                break;
                            }
                        }
                    }
                }
                l = completedJobs.length;
                if (l === 0) {
                    console.log('All jobs complete.');
                    resolve();
                } else {
                    k = checkInterval / 1000;
                    console.log(l + ' job' + (l === 1 ? '' : 's') + ' still in progress.');
                    if (checkCount < checkLimit) {
                        console.log('Launching status request ' + (checkCount + 1) + ' in ' + k + ' second' + (k === 1 ? '' : 's') + '.');
                        setTimeout(checkJobs, checkInterval);
                    } else {
                        console.log('Status request limit reached.');
                        reject(new Error('Status request limit reached.'));
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
            setTimeout(checkJobs, checkInterval);
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

    console.log('Starting manual browser tests');
    
    sauce.send({
        method: 'POST',
        path: ':username/js-tests',
        data: {
            url: 'http://localhost:8000/test/index.html',
            platforms: [
                ['Windows 7', 'internet explorer', '11'],
                ['Windows 10', 'chrome', '58'],
                ['Linux', 'opera', '12.15']
            ],
            framework: 'mocha',
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
            build: process.env.TRAVIS_BUILD_NUMBER,
            recordScreenshots: false,
            recordVideo: false
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
        });
    });

    console.log('End of script');

}