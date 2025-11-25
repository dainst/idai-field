import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createMissingMandatoryFieldWarning } from './create-warnings';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/missing mandatory fields', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await NavbarPage.clickCloseNonResourcesTab();
        await NavbarPage.clickTab('project');

        await waitForNotExist(await NavbarPage.getWarnings());
        await createMissingMandatoryFieldWarning('1');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('1');
    });


    test.afterAll(async () => {

        await stop();
    });


    test('solve warnings for missing mandatory fields via resources view', async () => {

        await ResourcesPage.openEditByDoubleClickResource('1', 0);
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.typeInInputField('placeName', 'Place');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('solve warnings for missing mandatory fields via warnings modal', async () => {

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1']);
        await expectSectionTitles(['Nicht ausgefülltes Pflichtfeld Ortsname']);

        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickSelectGroup('properties');
        await DoceditPage.typeInInputField('placeName', 'Place');
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await WarningsModalPage.getModalBody());
        await waitForNotExist(await NavbarPage.getWarnings());
    });
});
