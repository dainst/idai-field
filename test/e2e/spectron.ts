const Application = require('spectron').Application;
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');

let app = new Application({
    path: './node_modules/.bin/electron',
    args: ['.']
});

app.start().then(() => app.client.sessions()).then(sessions => {

    const sessionId = sessions.value[0].id;
    console.log("electron webdriver session id:", sessionId);

    return new Promise(resolve => {
        const protractor = spawn('protractor', [
            'test/e2e/config/protractor-spectron.conf.js',
            //'--params.skip_fail_fast=noff',
            '--seleniumSessionId=' + sessionId
        ]);
        protractor.stdout.setEncoding('utf8');
        protractor.stdout.on('data', data => process.stdout.write(data));
        protractor.stderr.setEncoding('utf8');
        protractor.stderr.on('data', data => process.stderr.write(data));
        protractor.on('close', code => resolve(code));
    });

}).then(code => {

    return app.electron.remote.app.getPath('appData').then(path => {
        console.log("appData", path);
        return new Promise(resolve => rimraf(path + "/idai-field-client", () => resolve(code)));
    });
}).then(code => app.stop().then(() => process.exit(code)))
.catch(err => console.log("error when removing app data", err));
