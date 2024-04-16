import { click, getLocator, getText, selectOption, selectSearchableSelectOption } from '../app';


/**
 * @author Thomas Kleinke
 */
export class WarningsModalPage {

    // click

    public static async clickResource(identifier: string) {

        return click(await this.getResource(identifier));
    }


    public static async clickEditButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.edit-button'));
    }


    public static async clickSolveConflictButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.solve-conflict-button'));
    }


    public static async clickDeleteResourceButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.delete-resource-button'));
    }


    public static async clickConvertFieldDataButton(sectionIndex: number) {

        return click(await this.getConvertFieldDataButton(sectionIndex));
    }


    public static async clickSelectNewCategoryButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.select-new-category-button'));
    }


    public static async clickSelectNewFieldButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.select-new-field-button'));
    }


    public static async clickSelectNewParentButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.select-new-parent-button'));
    }


    public static async clickDeleteFieldDataButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.delete-field-data-button'));
    }


    public static async clickCleanUpRelationButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.clean-up-relation-button'));
    }


    public static async clickFixOutliersButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.fix-outliers-button'));
    }


    public static async clickDeleteOutliersButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return click(section.locator('.delete-outliers-button'));
    }


    public static clickConfirmCleanUpInModalButton() {

        return click('#confirm-clean-up-button');
    }


    public static async clickCloseButton() {

        return click('#close-warnings-modal-button');
    }


    public static async clickFilterOption(optionValue: string) {

        return selectOption('#warning-filter-select', optionValue);
    }
    

    // get

    public static getModalBody() {

        return getLocator('.warnings-modal-body');
    }


    public static getResource(identifier: string) {

        return getLocator('#document-picker-resource-' + identifier);
    }


    public static getResources() {

        return getLocator('#document-picker .list-group-item');
    }


    public static async getSection(index: number) {

        return (await this.getSections()).nth(index);
    }


    public static getSections() {

        return getLocator('.warnings-section');
    }


    public static async getFilterOption(index: number) {

        const options = await this.getFilterOptions();
        return options.nth(index);
    }


    public static getFilterOptions() {

        return getLocator('#warning-filter-select option');
    }


    public static async getConvertFieldDataButton(sectionIndex: number) {

        const section = await this.getSection(sectionIndex);
        return section.locator('.convert-field-data-button');
    }


    public static getFixingDataInProgressModal() {

        return getLocator('#fixing-data-in-progress-modal');
    }


    public static getDeletionInProgressModal() {

        return getLocator('#deletion-in-progress-modal');
    }


    // get text

    public static async getSectionTitle(index: number) {

        const section = await this.getSection(index);
        return getText(await section.locator('.card-title'));
    }


    public static async getFilterOptionText(index: number) {

        return getText(await this.getFilterOption(index));
    }


    public static async getSelectedResourceIdentifier() {

        return getText(await getLocator('#document-warnings-header .document-teaser .title'));
    }
}
