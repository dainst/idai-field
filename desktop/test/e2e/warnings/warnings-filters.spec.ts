import { Field } from 'idai-field-core';
import { NavbarPage } from '../navbar.page';
import { navigateTo, resetApp, start, stop, waitForNotExist } from '../app';
import { DoceditPage } from '../docedit/docedit.page';
import { WarningsModalPage } from './warnings-modal.page';
import { createInvalidFieldDataWarnings, createMissingIdentifierPrefixWarning, createOutlierValuesWarnings,
    createUnconfiguredFieldWarnings } from './create-warnings';
import { expectResourcesInWarningsModal, expectSectionTitles } from './helpers';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('warnings/filters --', () => {

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


    async function expectWarningFilterOptions(optionLabels: string[]) {

        const filterOptions = await WarningsModalPage.getFilterOptions();
        expect(await filterOptions.count()).toBe(optionLabels.length);

        for (let i = 0; i < optionLabels.length; i++) {
            expect(await WarningsModalPage.getFilterOptionText(i)).toEqual(optionLabels[i]);
        }
    }


    test('filter resources in warnings modal', async () => {

        await waitForNotExist(await NavbarPage.getWarnings());
        await createInvalidFieldDataWarnings(['1'], 'invalidField', 'Text', Field.InputType.INT);
        await createUnconfiguredFieldWarnings(['2', '3'], 'unconfiguredField');
        await createOutlierValuesWarnings(['4', '5', '6'], 'outliersField');
        await createMissingIdentifierPrefixWarning('7');
        expect(await NavbarPage.getNumberOfWarnings()).toBe('7');

        await NavbarPage.clickWarningsButton();
        await expectWarningFilterOptions([
            'Alle (7)',
            'Unkonfigurierte Felder (2)',
            'Ungültige Felddaten (1)',
            'Nicht in Werteliste enthaltene Werte (3)',
            'Fehlende Bezeichner-Präfixe (7)'
        ]);
        
        await expectResourcesInWarningsModal(['1', '2', '3', '4', '5', '6', '7']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('1');
        await expectSectionTitles([
            'Ungültige Daten im Feld test:invalidField',
            'Fehlendes Präfix im Feld Bezeichner'
        ]);

        await WarningsModalPage.clickResource('2');
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('2');
        await expectSectionTitles([
            'Unkonfiguriertes Feld test:unconfiguredField',
            'Fehlendes Präfix im Feld Bezeichner'
        ]);

        await WarningsModalPage.clickFilterOption('unconfiguredFields:exist');
        await expectResourcesInWarningsModal(['2', '3']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('2');
        await expectSectionTitles(['Unkonfiguriertes Feld test:unconfiguredField']);

        await WarningsModalPage.clickFilterOption('outliers:exist');
        await expectResourcesInWarningsModal(['4', '5', '6']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('4');
        await expectSectionTitles(['Ungültige Werte im Feld test:outliersField']);

        await WarningsModalPage.clickFilterOption('invalidFields:exist');
        await expectResourcesInWarningsModal(['1']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('1');
        await expectSectionTitles(['Ungültige Daten im Feld test:invalidField']);
        
        await WarningsModalPage.clickEditButton(0);
        await DoceditPage.clickDeleteInvalidFieldDataButton('test:invalidField');
        await DoceditPage.clickSaveDocument();

        await expectWarningFilterOptions([
            'Alle (7)',
            'Unkonfigurierte Felder (2)',
            'Nicht in Werteliste enthaltene Werte (3)',
            'Fehlende Bezeichner-Präfixe (7)'
        ]);

        await expectResourcesInWarningsModal(['1', '2', '3', '4', '5', '6', '7']);
        expect(await WarningsModalPage.getSelectedResourceIdentifier()).toEqual('1');

        await expectSectionTitles([
            'Fehlendes Präfix im Feld Bezeichner'
        ]);

        await WarningsModalPage.clickCloseButton();
    });
});
