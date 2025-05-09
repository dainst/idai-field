import { NavbarPage } from '../navbar.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { WarningsModalPage } from './warnings-modal.page';
import { createWarningViaAppController, expectResourcesInWarningsModal, expectSectionTitles } from './helpers';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/missing relation target', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');
    });


    test.afterAll(async () => {

        await stop();
    });


    test('solve warning for missing relation target via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createMissingRelationTargetWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Fehlende Zielressource der Relation Wird gezeigt in']);

        await WarningsModalPage.clickCleanUpRelationButton(0);
        await WarningsModalPage.clickConfirmCleanUpInModalButton();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
