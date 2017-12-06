const Application = require('spectron').Application;
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');
const fs = require('fs');

const failFast = (process.argv.length > 2 && process.argv[2] == 'ff') ? 'ff' : 'noff';

console.log('Fail fast mode:', failFast);
console.log('\n');

fs.writeFileSync('config/config.test.json', JSON.stringify({ 'dbs': ['test'] }));

let app = new Application({
    path: require('electron'),
    args: ['.', 'test']
});

app.start().then(() => app.client.sessions()).then(sessions => {

    let i = 0;
    const sessionId = sessions.value[0].id;
    console.log('electron webdriver session id:', sessionId);

    function takeShot(mode) {
        console.log('taking screenshot ' + i + ' on ' + mode);
        app.browserWindow.capturePage().then(function(imageBuffer) {
            fs.writeFileSync('test/e2e-screenshots/' + i + '.png', imageBuffer);
            i++;
        });
    }

    return new Promise(resolve => {
        let protractor;
        if (/^win/.test(process.platform)) { // windows
            protractor = spawn('cmd', ['/s', '/c', 'protractor',
                'test/e2e/config/protractor-spectron.conf.js',
                '--seleniumSessionId=' + sessionId,
                '--params=' + failFast
            ]);
        } else {
            protractor = spawn('protractor', [
                'test/e2e/config/protractor-spectron.conf.js',
                '--seleniumSessionId=' + sessionId,
                '--params=' + failFast
            ]);
        }
        protractor.stdout.setEncoding('utf8');
        protractor.stdout.on('data', data => {

            if (data.indexOf('.') == 5) {
                process.stdout.write(data.substring(10))
            } else {
                if (data.indexOf('FAILED') != -1) {
                    takeShot('Failed in stdout');
                }
                process.stdout.write(data);
            }
        });
        protractor.stderr.setEncoding('utf8');
        protractor.stderr.on('data', data => {
            takeShot('stderr event');
            process.stderr.write(data);
        });
        protractor.on('close', code => {

            app.browserWindow.capturePage().then(function(imageBuffer) {
                fs.writeFileSync('test/e2e-screenshots/close.png', imageBuffer);
            });
            resolve(code);
        });
    });

}).then(code => {
    return app.electron.remote.app.getPath('appData').then(path => {
        console.log('appData', path);
        return new Promise(resolve => rimraf(path + '/idai-field-client/imagestore/test', () => resolve(code)));
    });
}).then(code => app.stop().then(() => process.exit(code)))
.catch(err => console.log('error when removing app data', err));
