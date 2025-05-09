import { Field } from 'idai-field-core';
import { navigateTo, pause, sendMessageToAppController, waitForExist } from '../app';
import { AddCategoryFormModalPage } from '../configuration/add-category-form-modal.page';
import { ConfigurationPage } from '../configuration/configuration.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { NavbarPage } from '../navbar.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { WarningsModalPage } from './warnings-modal.page';
import { AddFieldModalPage } from '../configuration/add-field-modal.page';
import { ManageValuelistsModalPage } from '../configuration/manage-valuelists-modal.page';

const { expect } = require('@playwright/test');


export async function createWarningViaAppController(message: string) {

    await navigateTo('settings');
    await sendMessageToAppController(message);
    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createCategory(categoryName: string) {
        
    await ConfigurationPage.clickCreateSubcategory('Feature');
    await AddCategoryFormModalPage.typeInSearchFilterInput(categoryName);
    await AddCategoryFormModalPage.clickCreateNewCategory();
    await EditConfigurationPage.clickConfirm();

    await waitForExist(await CategoryPickerPage.getCategory('Test:' + categoryName, 'Feature'));
    await ConfigurationPage.save();
}


export async function createField(fieldName: string, inputType?: Field.InputType, valuelistName?: string,
                                  disableMultiLanguageSupport: boolean = false) {
        
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickAddFieldButton();
    await AddFieldModalPage.typeInSearchFilterInput(fieldName);
    await AddFieldModalPage.clickCreateNewField();

    if (inputType) await EditConfigurationPage.clickInputTypeSelectOption(inputType, 'field');
    if (disableMultiLanguageSupport) await EditConfigurationPage.clickToggleMultiLanguageSlider();
    if (valuelistName) {
        await EditConfigurationPage.clickAddValuelist();
        await ManageValuelistsModalPage.typeInSearchFilterInput(valuelistName);
        await ManageValuelistsModalPage.clickSelectValuelist(valuelistName);
        await ManageValuelistsModalPage.clickConfirmSelection();
    }

    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();
}


export async function expectResourcesInWarningsModal(identifiers: string[]) {

    await pause(500);
    
    const resources = await WarningsModalPage.getResources();
    expect(await resources.count()).toBe(identifiers.length);

    for (let identifier of identifiers) {
        await waitForExist(await WarningsModalPage.getResource(identifier));
    }
}


export async function expectSectionTitles(sectionTitles: string[]) {

    const sections = await WarningsModalPage.getSections();
    expect(await sections.count()).toBe(sectionTitles.length);

    for (let i = 0; i < sectionTitles.length; i++) {
        expect(await WarningsModalPage.getSectionTitle(i)).toEqual(sectionTitles[i]);
    }
}
