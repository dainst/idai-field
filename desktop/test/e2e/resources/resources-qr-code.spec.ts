import { start, stop } from '../app';
import { ResourcesSearchBarPage } from './resources-search-bar.page';
import { ResourcesPage } from './resources.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Danilo Guzzo
 */
test.describe('resources/qr-code --', () => {

    test.beforeAll(async () => {

        // Start the application with a looping video as fake camera input.
        await start('test/test-data/bu1-qr-code.mjpeg');
    });


    test.afterAll(async () => {

        await stop();
    });


    test('select resource matching the scanned QR code', async () => {

        await ResourcesSearchBarPage.clickOpenQrScanner();
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Gebäude 1');
    });
});
