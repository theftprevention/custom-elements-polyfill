const
    webdriver = require('selenium-webdriver');

const
    username = process.env.SAUCE_USERNAME,
    accessKey = process.env.SAUCE_ACCESS_KEY,
    useSauceConnect = Boolean(username && accessKey);

var browser;

if (useSauceConnect) {

    console.log('Using Sauce Connect.');
    console.log('Travis Job Number:   ' + process.env.TRAVIS_JOB_NUMBER);
    console.log('Travis Build Number: ' + process.env.TRAVIS_BUILD_NUMBER);

    browser = new webdriver.Builder()
        .usingServer('http://' + username + ':' + accessKey + '@ondemand.saucelabs.com:80/wd/hub')
        .withCapabilities(webdriver.Capabilities.chrome().merge({
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
            build: process.env.TRAVIS_BUILD_NUMBER,
            username: username,
            accessKey: accessKey
        }))
        .build();

    browser.get('http://localhost:8000/test/index.html').then(function () {
        browser.getTitle().then(function (title) {
            console.log('Page title: "' + title + '"');
        });
    });

}