import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, pause, resetApp, start, stop, waitForNotExist } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { createWarningViaAppController, expectSectionTitles } from './helpers';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/non-unique identifier --', () => {

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


    test('solve warnings for non-unique identifiers via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createNonUniqueIdentifierWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await ResourcesPage.openEditByDoubleClickResource('1', 0);
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for non-unique identifiers via warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createWarningViaAppController('createNonUniqueIdentifierWarning');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await pause(500);
        expect(await (await WarningsModalPage.getResources()).count()).toBe(2);
        expect(await (await WarningsModalPage.getResource('1')).count()).toBe(2);
        await expectSectionTitles(['Uneindeutiger Bezeichner']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.typeInInputField('identifier', '2');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
