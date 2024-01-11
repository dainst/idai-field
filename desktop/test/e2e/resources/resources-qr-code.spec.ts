import { start, stop, click } from '../app';
import { ResourcesPage } from './resources.page';
const { test, expect } = require('@playwright/test');


/**
 * @author Danilo Guzzo
 * 
 * Tests for QR Code related functionality.
 */
test.describe('resources/qr-code --', () => {

    test.beforeAll(async () => {

        // Start the application with a looping video as fake camera input.
        await start('test/test-data/bu1-qr-code.mjpeg');
    });


    test.afterAll(async () => {

        // Stop the application.
        await stop();
    });

    test('application navigates resource matching the scanned QR code', async () => {

        // Open QR Scanner modal by clicking the QR icon next to the search bar.
        await click('#qr-scanner')
        // Check that the resource 'bu1' (Building 1) has been selected.
        expect(await ResourcesPage.getSelectedListItemShortDescriptionText()).toEqual('Gebäude 1');
    });
});