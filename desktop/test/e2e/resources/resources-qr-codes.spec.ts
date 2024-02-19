import { navigateTo, resetApp, start, stop, waitForExist, waitForNotExist } from '../app';
import { ConfigurationPage } from '../configuration/configuration.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { DoceditPage } from '../docedit/docedit.page';
import { NavbarPage } from '../navbar.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { FieldsViewPage } from '../widgets/fields-view.page';
import { QrCodeEditorModalPage } from '../widgets/qr-code-editor-modal.page';
import { ResourcesGridListPage } from './resources-grid-list.page';
import { ResourcesSearchBarPage } from './resources-search-bar.page';
import { ResourcesPage } from './resources.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Danilo Guzzo
 * @author Thomas Kleinke
 */
test.describe('resources/qr-codes --', () => {

    test.beforeAll(async () => {

        await start({ fakeVideoPath: 'test/test-data/qrCode.mjpeg' });
    });


    test.beforeEach(async () => {
        
        await navigateTo('settings');
        await resetApp();
        await enableQrCodes();
        await ResourcesPage.clickHierarchyButton('S1');
    });


    test.afterAll(async () => {

        await stop();
    });


    async function enableQrCodes() {

        await navigateTo('configuration');
        await ConfigurationPage.enableQRCodes('trench', 'pottery', 'find');
        await ConfigurationPage.enableQRCodes('inventory', 'storageplace');
        await NavbarPage.clickCloseNonResourcesTab();
    }


    test('generate new QR code for resource', async () => {
        
        await ResourcesPage.performCreateResource('P1', 'find-pottery');
        await ResourcesPage.clickOpenContextMenu('P1');
        await ResourcesPage.clickContextMenuAddQrCodeButton();

        await waitForExist(await QrCodeEditorModalPage.getPlaceholder());
        await waitForNotExist(await QrCodeEditorModalPage.getCanvas());

        await QrCodeEditorModalPage.clickAddQrCode();
        await QrCodeEditorModalPage.clickGenerateQrCode();

        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());
        await waitForNotExist(await QrCodeEditorModalPage.getPlaceholder());
        await waitForExist(await QrCodeEditorModalPage.getCanvas());

        await QrCodeEditorModalPage.clickCancel();
    });


    test('assign existing QR code to resource and reselect it via QR code scanner', async () => {
        
        await ResourcesPage.performCreateResource('P1', 'find-pottery');
        await ResourcesPage.performCreateResource('P2', 'find-pottery');
        await ResourcesPage.clickOpenContextMenu('P1');
        await ResourcesPage.clickContextMenuAddQrCodeButton();

        await waitForExist(await QrCodeEditorModalPage.getPlaceholder());
        await waitForNotExist(await QrCodeEditorModalPage.getCanvas());

        await QrCodeEditorModalPage.clickAddQrCode();
        await QrCodeEditorModalPage.clickSetExistingQrCode();

        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());
        await waitForNotExist(await QrCodeEditorModalPage.getPlaceholder());
        await waitForExist(await QrCodeEditorModalPage.getCanvas());

        await QrCodeEditorModalPage.clickCancel();
        await ResourcesPage.clickSelectResource('P2');
        await ResourcesSearchBarPage.clickOpenQrScanner();

        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());
        expect(await ResourcesPage.getSelectedListItemIdentifierText()).toEqual('P1');
    });


    test('prevent assigning the same QR code to multiple resources', async () => {
        
        await ResourcesPage.performCreateResource('P1', 'find-pottery');
        await ResourcesPage.performCreateResource('P2', 'find-pottery');

        await ResourcesPage.clickOpenContextMenu('P1');
        await ResourcesPage.clickContextMenuAddQrCodeButton();
        await QrCodeEditorModalPage.clickAddQrCode();
        await QrCodeEditorModalPage.clickSetExistingQrCode();
        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());
        await QrCodeEditorModalPage.clickCancel();

        await ResourcesPage.clickOpenContextMenu('P2');
        await ResourcesPage.clickContextMenuAddQrCodeButton();
        await QrCodeEditorModalPage.clickAddQrCode();
        await QrCodeEditorModalPage.clickSetExistingQrCode();
        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());
        await QrCodeEditorModalPage.clickCancel();

        expect(await NavbarPage.getMessageText())
            .toContain('Der gescannte QR-Code ist bereits einer anderen Ressource zugeordnet.');
    });


    test('remove QR code from resource', async () => {
        
        await ResourcesPage.performCreateResource('P1', 'find-pottery');
        await ResourcesPage.performCreateResource('P2', 'find-pottery');
        await ResourcesPage.clickOpenContextMenu('P1');
        await ResourcesPage.clickContextMenuAddQrCodeButton();
        await QrCodeEditorModalPage.clickAddQrCode();
        await QrCodeEditorModalPage.clickSetExistingQrCode();
        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());

        await QrCodeEditorModalPage.clickDeleteQrCode();
        await QrCodeEditorModalPage.clickConfirmDeletionInModal();
        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());
        await waitForExist(await QrCodeEditorModalPage.getPlaceholder());
        await waitForNotExist(await QrCodeEditorModalPage.getCanvas());
        
        await QrCodeEditorModalPage.clickCancel();
        await ResourcesPage.clickSelectResource('P2');
        await ResourcesSearchBarPage.clickOpenQrScanner();

        await waitForNotExist(await ResourcesPage.getQrCodeScannerModalBody());
        expect(await NavbarPage.getMessageText())
            .toContain('Für diesen QR-Code konnte keine Ressource gefunden werden.');
    });


    test('automatically create QR code for new resource', async () => {
        
        await navigateTo('configuration');
        await ConfigurationPage.clickSelectCategoriesFilter('trench');
        await CategoryPickerPage.clickOpenContextMenu('Pottery', 'Find');
        await ConfigurationPage.clickContextMenuEditOption();
        await EditConfigurationPage.clickToggleAutoCreateScanCodesSlider();
        await EditConfigurationPage.clickConfirm();
        await ConfigurationPage.save()
        await NavbarPage.clickCloseNonResourcesTab();

        await ResourcesPage.performCreateResource('P1', 'find-pottery');
        await ResourcesPage.clickOpenContextMenu('P1');
        await ResourcesPage.clickContextMenuEditQrCodeButton();
        await waitForExist(await QrCodeEditorModalPage.getCanvas());
        await waitForNotExist(await QrCodeEditorModalPage.getPlaceholder());

        await QrCodeEditorModalPage.clickCancel();
    });


    test('link storage place via QR code', async () => {
        
        await navigateTo('resources/inventory');
        await ResourcesPage.performCreateResource('SP1', 'storageplace', undefined, undefined, false, true);
        await ResourcesGridListPage.clickOpenContextMenu('SP1');
        await ResourcesPage.clickContextMenuAddQrCodeButton();
        await QrCodeEditorModalPage.clickAddQrCode();
        await QrCodeEditorModalPage.clickSetExistingQrCode();

        await waitForExist(await QrCodeEditorModalPage.getCanvas());
        await QrCodeEditorModalPage.clickCancel();
        await NavbarPage.clickCloseNonResourcesTab();

        await ResourcesPage.performCreateResource('P1', 'find-pottery');
        await ResourcesPage.clickOpenContextMenu('P1');
        await ResourcesPage.clickContextMenuScanStoragePlaceButton();

        await NavbarPage.awaitAlert('Für die Ressource P1 wurde erfolgreich der Aufbewahrungsort SP1 gespeichert.');
        
        await ResourcesPage.clickSelectResource('P1', 'info');
        await FieldsViewPage.clickAccordionTab(1);

        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Wird aufbewahrt in')
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SP1');
    });


    test('replace previously linked storage place for find when linking storage place via QR code', async () => {
        
        await navigateTo('resources/inventory');
        await ResourcesPage.performCreateResource('SP1', 'storageplace', undefined, undefined, false, true);
        await ResourcesPage.performCreateResource('SP2', 'storageplace', undefined, undefined, false, true);
        await ResourcesGridListPage.clickOpenContextMenu('SP2');
        await ResourcesPage.clickContextMenuAddQrCodeButton();
        await QrCodeEditorModalPage.clickAddQrCode();
        await QrCodeEditorModalPage.clickSetExistingQrCode();

        await waitForExist(await QrCodeEditorModalPage.getCanvas());
        await QrCodeEditorModalPage.clickCancel();
        await NavbarPage.clickCloseNonResourcesTab();

        await ResourcesPage.performCreateResource('P1', 'find-pottery');
        await ResourcesPage.openEditByDoubleClickResource('P1');
        await DoceditPage.clickGotoInventoryTab();
        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('isStoredIn');
        await DoceditRelationsPage.typeInRelation('isStoredIn', 'SP1');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickSaveDocument();

        await ResourcesPage.clickSelectResource('P1', 'info');
        await FieldsViewPage.clickAccordionTab(1);

        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Wird aufbewahrt in')
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SP1');

        await ResourcesPage.clickOpenContextMenu('P1');
        await ResourcesPage.clickContextMenuScanStoragePlaceButton();

        await NavbarPage.awaitAlert('Für die Ressource P1 wurde erfolgreich der Aufbewahrungsort SP2 gespeichert.');
        
        expect(await FieldsViewPage.getRelationName(1, 0)).toBe('Wird aufbewahrt in')
        expect(await FieldsViewPage.getRelationValue(1, 0)).toBe('SP2');
    });
});
