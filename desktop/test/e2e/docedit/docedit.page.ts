import { waitForNotExist, click, waitForExist, getLocator, typeIn, getValue, getText, clearText,
    selectSearchableSelectOption, selectOption } from '../app';
import { NavbarPage } from '../navbar.page';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditPage {

    private static async clickSaveInModal() {

        await click('#overview-save-confirmation-modal-save-button');
        return waitForNotExist('#document-edit-wrapper');
    }


    private static clickCancelInModal() {

        return click('#overview-save-confirmation-modal-cancel-button');
    }


    private static async clickDiscardInModal() {

        await click('#overview-save-confirmation-modal-discard-button');
        return waitForNotExist('#document-edit-wrapper');
    }


     public static async clickCloseEdit(action?: 'discard'|'cancel'|'save') {

        await waitForExist('#document-edit-button-goto-view');
        await click('#document-edit-button-goto-view');

        if (action === 'discard') return this.clickDiscardInModal();
        if (action === 'cancel') return this.clickCancelInModal();
        if (action === 'save') return this.clickSaveInModal();
    };


    public static clickGotoTimeTab() {

        return click('#edit-form-goto-time');
    };


    public static clickGotoPropertiesTab() {

        return click('#edit-form-goto-properties');
    }


    public static clickGotoImagesTab() {

        return click('#edit-form-goto-images');
    }


    public static clickGotoIdentificationTab() {

        return click('#edit-form-goto-identification');
    }


    public static clickGotoInventoryTab() {

        return click('#edit-form-goto-inventory');
    }


    public static clickGotoPositionTab() {

        return click('#edit-form-goto-position');
    }


    public static clickGotoDimensionTab() {

        return click('#edit-form-goto-dimension');
    }


    public static clickGotoHierarchyTab() {

        return click('#edit-form-goto-hierarchy');
    }


    public static async clickSelectGroup(groupName: string) {

        return click(await this.getGroup(groupName));
    }


    public static async clickSaveDocument(clickMsgAway: boolean = false, waitForModalToClose: boolean = true) {

        await waitForExist('#document-edit-button-save-document');
        await click('#document-edit-button-save-document');
                    
        if (clickMsgAway) await NavbarPage.clickCloseAllMessages();
        if (waitForModalToClose) await waitForNotExist('#document-edit-wrapper');
    }


    public static async clickDuplicateDocument() {

        await click('#document-edit-button-dropdown');
        return click('#document-edit-button-duplicate-document');
    }


    public static async clickConfirmDuplicateInModal() {

        await click(await this.getConfirmDuplicateButton());
        return waitForNotExist('#document-edit-wrapper');
    }


    public static async clickChooseRightRevision() {

        const radioButton = (await getLocator('input[type=radio]')).nth(1);
        return click(radioButton);
    }


    public static clickSolveConflictButton() {

        return click('#solve-conflict-button');
    }


    public static clickCategorySwitcherButton() {

        return click('#category-switcher-button');
    }


    public static clickCategorySwitcherOption(categoryName: string) {
    
        return click('#choose-category-option-' + categoryName);
    }


    public static async clickSelectOption(fieldName: string, optionValueLabel: string,
                                          selectElementIndex: number = 0) {

        const field = await this.getField(fieldName);
        const element = await (await field.locator('searchable-select')).nth(selectElementIndex);

        return selectSearchableSelectOption(element, optionValueLabel);
    }


    public static async clickCheckbox(fieldName: string, checkboxIndex: number) {

        const field = await this.getField(fieldName);
        await waitForExist(field);

        const element = await (await field.locator('.checkbox')).nth(checkboxIndex);
        return click(element);
    }


    public static async clickBooleanRadioButton(fieldName: string, radioButtonIndex: number) {

        const field = await this.getField(fieldName);
        await waitForExist(field);

        const element = await (await field.locator('input')).nth(radioButtonIndex);
        return click(element);
    }


    public static async clickAddMultiInputEntry(fieldName: string) {

        const field = await this.getField(fieldName);
        await waitForExist(field);

        const element = await field.locator('.add-multi-input-entry');
        return click(element);
    }


    public static async clickDeleteMultiInputEntry(fieldName: string, entryIndex: number) {

        const field = await this.getField(fieldName);
        await waitForExist(field);

        const element = await (await field.locator('.delete-multi-input-entry').nth(entryIndex));
        return click(element);
    }


    public static async clickCreateNewDimensionButton(fieldName: string) {

        const field = await this.getField(fieldName);
        await waitForExist(field);

        const element = await field.locator('.create-new-dimension-button');
        return click(element);
    }


    public static async clickSaveDimensionButton(fieldName: string) {

        const field = await this.getField(fieldName);
        await waitForExist(field);

        const element = await field.locator('.save-dimension-button');
        return click(element);
    }


    public static async clickDimensionMeasurementPositionOption(fieldName: string, optionValue: string) {

        return selectOption(
            (await this.getField(fieldName)).locator('.measurement-position-select'),
            optionValue
        );
    }


    public static async clickDropdownRangeActivateEndButton(fieldName: string) {

        const field = await this.getField(fieldName);
        await waitForExist(field);

        return click(await field.locator('.dropdown-range-activate-end-button'));
    }


    public static async clickDeleteInvalidFieldDataButton(fieldName: string) {

        return click((await this.getField(fieldName).locator('.delete-invalid-field-data-button')));
    }


    public static async clickLanguageTab(fieldName: string, language: string) {

        return click((await this.getField(fieldName)).locator('.language-tab-' + language));
    }


    public static async clickCreateCompositeEntry(fieldName: string) {

        return click((await this.getField(fieldName)).locator('.create-composite-entry-button'));
    }


    public static async clickEditCompositeEntryButton(fieldName: string, entryIndex: 0) {
        
        return click((await this.getField(fieldName)).locator('.composite-entry:nth-child(' + (entryIndex + 1) + ') '
            + '.edit-composite-entry'));
    }


    public static async clickRemoveOutlierValue(fieldName: string, outlierValueIndex: number) {

        const outlierValues = await this.getOutlierValues(fieldName);
        const valueToRemove = await outlierValues.nth(outlierValueIndex);
        return click(valueToRemove.locator('.remove-outlier-button'));
    }


    // get text

    public static async getSimpleInputFieldValue(index) {

        const element = (await getLocator('form-field-simple-input input')).nth(index);
        return getValue(element);
    }


    public static async getIdentifierInputFieldValue() {

        const element = (await getLocator('form-field-identifier input')).nth(0);
        return getValue(element);
    }


    public static async getFieldLabel(fieldName: string) {

        const fieldElement = await this.getField(fieldName);
        return getText(await fieldElement.locator('.card-title'));
    }


    public static async getGroupLabel(groupName: string) {

        return getText(await this.getGroup(groupName));
    }


    public static async getIdentifierPrefix() {

        const element = (await getLocator('.identifier-prefix-label')).nth(0);
        return getText(element);
    }


    // elements

    public static getNumberOfDuplicatesInputField() {

        return getLocator('#duplicate-input');
    }


    public static async getCheckboxes(fieldName: string) {

        return (await this.getField(fieldName)).locator('.checkbox');
    }


    public static getGeometryEditWidget() {

        return getLocator('form-field-geometry');
    }


    public static getField(fieldName: string) {

        return getLocator('#edit-form-element-' + fieldName.replace(':', '-'));
    }


    public static async getFieldFormGroup(fieldName: string) {

        return (await this.getField(fieldName)).locator('.form-group');
    }


    public static getGroup(groupName: string) {

        return getLocator('#edit-form-goto-' + groupName.replace(':', '-'));
    }


    public static async getLanguageTabs(fieldName: string) {

        return (await this.getField(fieldName)).locator('.language-tab');
    }


    public static async getInvalidIdentifierInfo() {

        return (await getLocator('.invalid-identifier-info')).nth(0);
    }


    public static getConfirmDuplicateButton(disabled: boolean = false) {

        let locatorString: string = '#duplicate-confirm';
        if (disabled) locatorString += '.disabled';

        return getLocator(locatorString);
    }


    public static async getCompositeEntryWarningIcon(fieldName: string, entryIndex: 0) {
        
        return (await this.getField(fieldName)).locator('.composite-entry:nth-child(' + (entryIndex + 1) + ') '
            + '.composite-entry-warning');
    }


    public static async getOutlierValues(fieldName: string) {

        return (await this.getField(fieldName)).locator('.outlier');
    }


    // type in

    public static async typeInInputField(fieldName: string, text: string) {

        return typeIn((await this.getField(fieldName)).locator('input'), text);
    }


    public static async typeInMultiInputField(fieldName: string, text: string) {

        const elements = await (await this.getField(fieldName)).locator('input');
        const element = await elements.nth(await elements.count() - 1);

        return typeIn(element, text);
    }


    public static async typeInDimensionInputValue(fieldName: string, text: string) {

        return typeIn((await this.getField(fieldName)).locator('.value-input'), text);
    }


    public static async removeTextFromInputField(fieldName: string) {

        return clearText((await this.getField(fieldName)).locator('input'));
    }


    public static async typeInNumberOfDuplicates(numberOfDuplicates: string) {

        return typeIn(await this.getNumberOfDuplicatesInputField(), numberOfDuplicates);
    }
}
