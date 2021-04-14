import { click, pause, start, stop, waitForExist } from './app';

describe('test --', () => {

    it('test', async done => {

        try {
            await start();
            await waitForExist('#buttons-container');
            await pause(2000);
            await click('#list-mode-button');
            await waitForExist('#list-background');
            await pause(10000);
            await stop();
        } catch (err) {
            fail(err);
        }

        done();
    }, 100000);
});
