const Application = require('spectron').Application;
const electron = require('electron');

const app = new Application({
    path: electron,
    args: ['.', 'dev']
});

describe('test --', () => {

    it('test', async done => {

        try {
            await app.start();
            expect(await app.browserWindow.isVisible()).toBe(true);
            await (await app.client.$('#buttons-container')).waitForExist({ timeout: 60000 });
            await app.client.pause(2000);
            await (await app.client.$('#list-mode-button')).click();
            await (await app.client.$('#list-background')).waitForExist({ timeout: 60000 });
            await app.client.pause(10000);
            await app.stop();
        } catch (err) {
            fail(err);
        }

        done();
    }, 100000);
});
