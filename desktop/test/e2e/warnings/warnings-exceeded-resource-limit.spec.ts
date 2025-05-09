import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { WarningsModalPage } from './warnings-modal.page';
import { expectResourcesInWarningsModal, expectSectionTitles } from './helpers';
import { createResourceLimitWarnings } from './create-warnings';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/exceeded resource limit', () => {

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


    test('solve warnings for exceeded resource limit via resources view', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createResourceLimitWarnings(['1', '2']);
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await ResourcesPage.clickOpenContextMenu('1');
        await ResourcesPage.clickContextMenuDeleteButton();
        await ResourcesPage.typeInIdentifierInConfirmDeletionInputField('1');
        await ResourcesPage.clickConfirmDeleteInModal();

        await waitForNotExist(await NavbarPage.getWarnings());
    });


    test('show warnings for exceeded resource limit in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createResourceLimitWarnings(['1', '2']);
        expect(await NavbarPage.getNumberOfWarnings()).toBe('2');

        await NavbarPage.clickWarningsButton();
        await expectResourcesInWarningsModal(['1', '2']);
        await expectSectionTitles(['Ressourcenlimit für Kategorie Ort überschritten']);

        await WarningsModalPage.clickCloseButton();
    });
});
