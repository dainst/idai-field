const Application = require('spectron').Application;
const spawn = require('child_process').spawn;
const rimraf = require('rimraf');
const fs = require('fs');

const configPath = 'config/config.test.json';
const failFast = (process.argv.length > 2 && process.argv[2] == 'ff') ? 'ff' : 'noff';

fs.writeFileSync(configPath, JSON.stringify({ 'environment': 'test' }));

let app = new Application({
    path: require('electron'),
    args: ['.', configPath]
});

app.start().then(() => app.client.sessions()).then(sessions => {

    let i = 0;
    const sessionId = sessions.value[0].id;
    console.log("electron webdriver session id:", sessionId);

    function takeShot(mode) {
        console.log("taking screenshot "+i+" on "+mode);
        app.browserWindow.capturePage().then(function (png) {
            let stream = fs.createWriteStream('test/e2e-screenshots/'+i+'.png');
            stream.write(new Buffer(png, 'base64'));
            stream.end();
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

            if (data.indexOf('.')==5) {
                process.stdout.write(data.substring(10))
            } else {
                if(data.indexOf("Failed")!=-1) {
                    takeShot('Failed in stdout');
                }
                process.stdout.write(data)
            }
        });
        protractor.stderr.setEncoding('utf8');
        protractor.stderr.on('data', data => {
            takeShot("stderr event");
            process.stderr.write(data)
        });
        protractor.on('close', code => {

            app.browserWindow.capturePage().then(function (png) {
                let stream = fs.createWriteStream('test/e2e-screenshots/close.png');
                stream.write(new Buffer(png, 'base64'));
                stream.end();
                i++;
            });
            resolve(code)
        });
    });

}).then(code => {

    return app.electron.remote.app.getPath('appData').then(path => {
        console.log("appData", path);
        return new Promise(resolve => rimraf(path + "/idai-field-client", () => resolve(code)));
    });
}).then(code => app.stop().then(() => process.exit(code)))
.catch(err => console.log("error when removing app data", err));
