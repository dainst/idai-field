import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createUnfulfilledConditionWarning } from './create-warnings';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/unfulfilled condition', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');

        await waitForNotExist(await NavbarPage.getWarnings());
        await createUnfulfilledConditionWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test.afterAll(async () => {

        await stop();
    });


    test('solve warnings for unfulfilled condition via resources view', async () => {

        await ResourcesPage.openEditByDoubleClickResource('1', 0);
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.clickSelectOption('findspotClassification', 'Einzelmauer');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for unfulfilled condition via warnings modal', async () => {

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Nicht erfüllte Anzeigebedingung des Feldes Moderne Eingriffe']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.clickSelectOption('findspotClassification', 'Einzelmauer');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
