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
let appDataPath = undefined;

app.start()
    .then(() => {
        if (app && app.electron && app.electron && app.electron.remote && app.electron.remote.app) {
            return app.electron.remote.app.getPath('appData');
        } else {
            return Promise.resolve(undefined);
        }
    })
    .then(appPath => {
        if (appPath !== undefined && appPath.length > 10) {
            appDataPath = appPath;
            console.log('appDataPath: ', appDataPath);
            return Promise.resolve(undefined);
        } else {
            return Promise.reject(undefined);
        }
    })
    .then(() => app.client.sessions())
    .then(sessions => {

        let i = 0;
        const sessionId = sessions.value[0].id;
        console.log('electron webdriver session id:', sessionId);

        function takeShot(mode) {}

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

                resolve(code);
            });
        });
    })
    .then(code => {
        return new Promise(resolve => {
                console.log('removing appData, path:', appDataPath + '/idai-field-client/imagestore/test');
                rimraf(appDataPath + '/idai-field-client/imagestore/test', () => resolve(code))
            })
            .catch(err => console.log('error when removing app data', err))
            .then(() => Promise.resolve(code));
    })
    .then(code => app.stop().then(() => process.exit(code)));
