const
    SauceLabs = require('saucelabs'),
    webdriver = require('selenium-webdriver'),
    by = webdriver.By,
    until = webdriver.until;

const
    username = process.env.SAUCE_USERNAME,
    accessKey = process.env.SAUCE_ACCESS_KEY,
    sauce = (username && accessKey) ? new SauceLabs({ username: username, password: accessKey }) : null;

var browser;

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
                ['Windows 7', 'chrome', '58']
            ],
            framework: 'mocha',
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
            build: process.env.TRAVIS_BUILD_NUMBER
        }
    }, function (err, response) {
        if (err) {
            throw err;
        }
        console.log('API response:');
        console.log(response);
    });

    console.log('End of script');

}