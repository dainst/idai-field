const Application = require('spectron').Application;
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');
const fs = require('fs');

const failFast = (process.argv.length > 2 && process.argv[2] == 'ff') ? 'ff' : 'noff';

console.log('Fail fast mode:', failFast);
console.log('\n');

fs.writeFileSync('test/config/config.test.json', JSON.stringify({ 'dbs': ['test'] }));

let app = new Application({
    path: require('electron'),
    args: ['.', 'test']
});
let appDataPath = undefined;

app.start()
    .then(() => app?.electron?.remote?.app?.getPath('appData'))
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

        const sessionId = sessions.value[0].id;
        console.log('electron webdriver session id:', sessionId);
        const args = [
            'test/protractor-spectron.conf.js', '--seleniumSessionId=' + sessionId, '--params=' + failFast
        ];

        const protractor = (/^win/.test(process.platform))
            // windows
            ? spawn('cmd', ['/s', '/c', 'protractor'].concat(args))
            : spawn('protractor', args);

        protractor.stdout.setEncoding('utf8');
        protractor.stdout.on('data', data => {

            if (data.indexOf('.') == 5) {
                process.stdout.write(data.substring(10))
            } else {
                if (data.indexOf('FAILED') != -1) {
                    // takeScreenshot('Failed in stdout');
                }
                process.stdout.write(data);
            }
        });
        protractor.stderr.setEncoding('utf8');
        protractor.stderr.on('data', data => {
            // takeScreenshot('stderr event');
            process.stderr.write(data);
        });
        return new Promise(resolve => protractor.on('close', code => resolve(code)));
    })
    .then(code => {
        return new Promise(resolve => {
                const deletionPath = appDataPath + '/idai-field-client/imagestore/test';
                console.log('removing appData at', deletionPath);
                rimraf(deletionPath, () => resolve(code))
            })
            .catch(err => console.log('error when removing app data', err))
            .then(() => Promise.resolve(code));
    })
    .then(code => app.stop().then(() => process.exit(code)))
    .catch(() => process.exit(1));
