import { Field } from 'idai-field-core';
import { navigateTo, waitForNotExist } from '../app';
import { ConfigurationPage } from '../configuration/configuration.page';
import { EditConfigurationPage } from '../configuration/edit-configuration.page';
import { NavbarPage } from '../navbar.page';
import { ResourcesPage } from '../resources/resources.page';
import { CategoryPickerPage } from '../widgets/category-picker.page';
import { createCategory, createField } from './helpers';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';
import { DoceditPage } from '../docedit/docedit.page';
import { ManageValuelistsModalPage } from '../configuration/manage-valuelists-modal.page';
import { DoceditMeasurementEntryModalPage } from '../docedit/docedit-measurement-entry-modal.page';
import { AddFieldModalPage } from '../configuration/add-field-modal.page';
import { DoceditCompositeEntryModalPage } from '../docedit/docedit-composite-entry-modal.page';
import { WorkflowEditorModalPage } from '../widgets/workflow-editor-modal.page';
import { AddCategoryFormModalPage } from '../configuration/add-category-form-modal.page';


export async function createResourceLimitWarnings(resourceIdentifiers: string[]) {

    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'place');
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickOpenContextMenu('Place');
    await ConfigurationPage.clickContextMenuEditOption();
    const resourceLimit: string = (resourceIdentifiers.length - 1).toString();
    await EditConfigurationPage.typeInResourceLimit(resourceLimit);
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createInvalidFieldDataWarnings(resourceIdentifiers: string[], fieldName: string,
                                                     inputValue: string, inputType: Field.InputType) {

    await navigateTo('configuration');
    await createField(fieldName, Field.InputType.INPUT, undefined, true);

    const completeFieldName: string = 'test:' + fieldName;

    await NavbarPage.clickCloseNonResourcesTab();
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'place', completeFieldName, inputValue);
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.clickInputTypeSelectOption(inputType, 'field');
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createInvalidRelationTargetWarning(resourceIdentifier: string, targetIdentifier: string) {

    await navigateTo('configuration');
    await ConfigurationPage.createRelation(
        'Place', 'relation1', 'Relation 1', ['Trench', 'Building'], ['Operation', 'Operation']
    );
    await ConfigurationPage.createRelation(
        'Trench', 'relation2', 'Relation 2', ['Place'], [undefined], 'Operation'
    );

    await NavbarPage.clickCloseNonResourcesTab();
    await ResourcesPage.performCreateResource(resourceIdentifier, 'place');
    await ResourcesPage.performCreateResource(targetIdentifier, 'operation-trench');
    await ResourcesPage.openEditByDoubleClickResource(resourceIdentifier);
    await DoceditRelationsPage.clickAddRelationForGroupWithIndex('test:relation1');
    await DoceditRelationsPage.typeInRelation('test:relation1', targetIdentifier);
    await DoceditRelationsPage.clickChooseRelationSuggestion(0);
    await DoceditPage.clickSaveDocument();

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickOpenContextMenuForField('test:relation1');
    await ConfigurationPage.clickContextMenuEditOption();
    await CategoryPickerPage.clickSelectCategory('Trench', 'Operation', 'target-category-picker-container');
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createMissingIdentifierPrefixWarning(resourceIdentifier: string) {

    await ResourcesPage.performCreateResource(resourceIdentifier, 'place');

    await navigateTo('configuration');
    await CategoryPickerPage.clickOpenContextMenu('Place');
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.typeInIdentifierPrefix('P');
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createMissingMandatoryFieldWarning(resourceIdentifier: string) {

    await ResourcesPage.performCreateResource(resourceIdentifier, 'place');

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickSelectGroup('properties');
    await ConfigurationPage.clickOpenContextMenuForField('placeName');
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.clickToggleMandatorySlider();
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createUnfulfilledConditionWarning(resourceIdentifier: string) {

    await ResourcesPage.performCreateResource(resourceIdentifier, 'place');
    await ResourcesPage.openEditByDoubleClickResource(resourceIdentifier);
    await DoceditPage.clickSelectGroup('properties');
    await DoceditPage.typeInInputField('modernIntervention', 'Text');
    await DoceditPage.clickSaveDocument();

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickSelectGroup('properties');
    await ConfigurationPage.clickOpenContextMenuForField('modernIntervention');
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.clickSelectConditionField('findspotClassification', 'field');
    await EditConfigurationPage.clickSelectConditionValue('valuelist', 0, 'field');
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createInvalidProcessStateWarning(resourceIdentifier: string) {

    await navigateTo('configuration');
    await ConfigurationPage.clickSelectCategoriesFilter('all');
    await ConfigurationPage.clickCreateSubcategory('Process');
    await AddCategoryFormModalPage.typeInSearchFilterInput('NewProcess');
    await AddCategoryFormModalPage.clickCreateNewCategory();
    await CategoryPickerPage.clickSelectCategory('Trench', 'Operation', 'is-carried-out-on-target-container');
    await ConfigurationPage.clickNextInCreateProcessModal();
    await ConfigurationPage.clickNextInCreateProcessModal();
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();

    await ResourcesPage.clickOpenContextMenu('S1');
    await ResourcesPage.clickContextMenuEditWorkflowButton();
    await WorkflowEditorModalPage.clickPlusButton();

    await DoceditPage.typeInInputField('identifier', resourceIdentifier);
    await DoceditPage.clickSelectOption('state', 'Geplant');
    await DoceditPage.typeInDateInputField('date', '01.01.2000');
    await DoceditPage.clickSaveDocument();

    await WorkflowEditorModalPage.clickCancel();
}


export async function createOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string, 
                                                  inputType: Field.InputType = Field.InputType.CHECKBOXES,
                                                  categoryName: string = 'Place', supercategoryName?: string) {

    await navigateTo('configuration');
    await createField(fieldName, inputType, 'Wood-color-default', false, categoryName, supercategoryName);

    const completeFieldName: string = 'test:' + fieldName;

    await NavbarPage.clickCloseNonResourcesTab();
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 
            (supercategoryName ? supercategoryName.toLowerCase() + '-' : '') + categoryName.toLowerCase());
        await ResourcesPage.openEditByDoubleClickResource(identifier);
        if (inputType === Field.InputType.DROPDOWN) {
            await DoceditPage.clickSelectOption(completeFieldName, 'braun', 0);
        } else if (inputType === Field.InputType.CHECKBOXES) {
            await DoceditPage.clickCheckbox(completeFieldName, 0);
            await DoceditPage.clickCheckbox(completeFieldName, 1);
        }
        await DoceditPage.clickSaveDocument();
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory(categoryName, supercategoryName);
    await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.clickSwapValuelist();
    await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-objectType-default');
    await ManageValuelistsModalPage.clickSelectValuelist('Wood-objectType-default');
    await ManageValuelistsModalPage.clickConfirmSelection();
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createProjectOutlierValuesWarning(resourceIdentifier: string) {

    await navigateTo('editProject');
    await DoceditPage.clickSelectGroup('properties');
    await DoceditPage.typeInMultiInputField('staff', 'Test');
    await DoceditPage.clickAddMultiInputEntry('staff');
    await DoceditPage.clickSaveDocument();

    await ResourcesPage.performCreateResource(resourceIdentifier, 'operation-trench');
    await ResourcesPage.openEditByDoubleClickResource(resourceIdentifier);
    await DoceditPage.clickCheckbox('processor', 2);
    await DoceditPage.clickSaveDocument();

    await navigateTo('editProject');
    await DoceditPage.clickSelectGroup('properties');
    await DoceditPage.clickDeleteMultiInputEntry('staff', 2);
    await DoceditPage.clickSaveDocument();
}


export async function createParentOutlierValuesWarning(parentResourceIdentifier: string,
                                                       childResourceIdentifier: string) {

    await ResourcesPage.performCreateResource(parentResourceIdentifier, 'operation-trench');
    await ResourcesPage.openEditByDoubleClickResource(parentResourceIdentifier);
    await DoceditPage.clickCheckbox('campaign', 0);
    await DoceditPage.clickSaveDocument();

    await ResourcesPage.clickHierarchyButton(parentResourceIdentifier);
    await ResourcesPage.performCreateResource(childResourceIdentifier, 'feature');
    await ResourcesPage.openEditByDoubleClickResource(childResourceIdentifier);
    await DoceditPage.clickCheckbox('campaign', 0);
    await DoceditPage.clickSaveDocument();

    await NavbarPage.clickTab('project');
    await ResourcesPage.openEditByDoubleClickResource(parentResourceIdentifier);
    await DoceditPage.clickCheckbox('campaign', 0);
    await DoceditPage.clickSaveDocument();
}


export async function createDimensionOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string) {

    await navigateTo('configuration');
    await createField(fieldName, 'dimension', 'position-values-edge-default');

    const completeFieldName: string =  'test:' + fieldName;

    await NavbarPage.clickCloseNonResourcesTab();
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'place');
        await ResourcesPage.openEditByDoubleClickResource(identifier);
        await DoceditPage.clickCreateNewObjectArrayEntryButton(completeFieldName);
        await DoceditMeasurementEntryModalPage.typeInInputValue('1');
        await DoceditMeasurementEntryModalPage.clickMeasurementPositionOption('Oberkante');
        await DoceditMeasurementEntryModalPage.clickConfirm();
        await DoceditPage.clickSaveDocument();
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.clickSwapValuelist();
    await ManageValuelistsModalPage.typeInSearchFilterInput('position-values-expansion-default');
    await ManageValuelistsModalPage.clickSelectValuelist('position-values-expansion-default');
    await ManageValuelistsModalPage.clickConfirmSelection();
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createDropdownRangeOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string) {

    await navigateTo('configuration');
    await createField(fieldName, 'dropdownRange', 'periods-default-1');

    const completeFieldName: string =  'test:' + fieldName;

    await NavbarPage.clickCloseNonResourcesTab();
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'place');
        await ResourcesPage.openEditByDoubleClickResource(identifier);
        await DoceditPage.clickSelectOption(completeFieldName, 'Frühbronzezeitlich', 0);
        await DoceditPage.clickDropdownRangeActivateEndButton(completeFieldName);
        await DoceditPage.clickSelectOption(completeFieldName, 'Spätbronzezeitlich', 1);
        await DoceditPage.clickSaveDocument();
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.clickSwapValuelist();
    await ManageValuelistsModalPage.typeInSearchFilterInput('periods-meninx-1');
    await ManageValuelistsModalPage.clickSelectValuelist('periods-meninx-1');
    await ManageValuelistsModalPage.clickConfirmSelection();
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createCompositeOutlierValuesWarnings(resourceIdentifiers: string[], fieldName: string) {

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickAddFieldButton();
    await AddFieldModalPage.typeInSearchFilterInput(fieldName);
    await AddFieldModalPage.clickCreateNewField();

    await EditConfigurationPage.clickInputTypeSelectOption('composite', 'field');
    
    await EditConfigurationPage.typeInNewSubfield('subfield1');
    await EditConfigurationPage.clickCreateSubfield();
    await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'subfield');
    await EditConfigurationPage.clickAddValuelist();
    await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-color-default');
    await ManageValuelistsModalPage.clickSelectValuelist('Wood-color-default');
    await ManageValuelistsModalPage.clickConfirmSelection();
    await EditConfigurationPage.clickConfirmSubfield();

    await EditConfigurationPage.typeInNewSubfield('subfield2');
    await EditConfigurationPage.clickCreateSubfield();
    await EditConfigurationPage.clickInputTypeSelectOption('dropdown', 'subfield');
    await EditConfigurationPage.clickAddValuelist();
    await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-color-default');
    await ManageValuelistsModalPage.clickSelectValuelist('Wood-color-default');
    await ManageValuelistsModalPage.clickConfirmSelection();
    await EditConfigurationPage.clickConfirmSubfield();

    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    const completeFieldName: string =  'test:' + fieldName;

    await NavbarPage.clickCloseNonResourcesTab();
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'place');
        await ResourcesPage.openEditByDoubleClickResource(identifier);
        await DoceditPage.clickCreateCompositeEntry(completeFieldName);
        await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(0, 'braun');
        await DoceditCompositeEntryModalPage.clickSelectSubfieldSelectOption(1, 'braun');
        await DoceditCompositeEntryModalPage.clickConfirm();
        await DoceditPage.clickSaveDocument();
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
    await ConfigurationPage.clickContextMenuEditOption();
    await EditConfigurationPage.clickEditSubfield(0);
    await EditConfigurationPage.clickSwapValuelist();
    await ManageValuelistsModalPage.typeInSearchFilterInput('Wood-objectType-default');
    await ManageValuelistsModalPage.clickSelectValuelist('Wood-objectType-default');
    await ManageValuelistsModalPage.clickConfirmSelection();
    await EditConfigurationPage.clickConfirmSubfield();
    await EditConfigurationPage.clickConfirm();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createUnconfiguredCategoryWarnings(resourceIdentifiers: string[], categoryName: string) {

    await navigateTo('configuration');
    await ConfigurationPage.clickSelectCategoriesFilter('trench');
    await createCategory(categoryName);

    const completeCategoryName: string = 'Test:' + categoryName;

    await NavbarPage.clickCloseNonResourcesTab();
    await ResourcesPage.clickHierarchyButton('S1');
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'feature-' + completeCategoryName);
    }

    await navigateTo('configuration');
    await ConfigurationPage.deleteCategory(completeCategoryName, 'Feature', true);
    await waitForNotExist(await CategoryPickerPage.getCategory(completeCategoryName, 'Feature'));
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createUnconfiguredFieldWarnings(resourceIdentifiers: string[], fieldName: string) {

    await navigateTo('configuration');
    await createField(fieldName);

    const completeFieldName: string = 'test:' + fieldName;

    await NavbarPage.clickCloseNonResourcesTab();
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'place', completeFieldName, 'Text');
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Place');
    await ConfigurationPage.clickOpenContextMenuForField(completeFieldName);
    await ConfigurationPage.clickContextMenuDeleteOption();
    await ConfigurationPage.clickConfirmFieldDeletionButton();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}


export async function createUnconfiguredRelationFieldWarnings(resourceIdentifiers: string[], relationName: string) {

    await navigateTo('configuration');
    ConfigurationPage.clickSelectCategoriesFilter('trench');
    await ConfigurationPage.createRelation(
        'Feature', relationName, relationName, ['Feature'], [undefined]
    );

    const completeRelationName: string = 'test:' + relationName;

    await NavbarPage.clickCloseNonResourcesTab();
    await ResourcesPage.clickHierarchyButton('S1');
    for (let identifier of resourceIdentifiers) {
        await ResourcesPage.performCreateResource(identifier, 'feature');
        await ResourcesPage.performCreateRelation(identifier, 'SE0', completeRelationName);
    }

    await navigateTo('configuration');
    await CategoryPickerPage.clickSelectCategory('Feature');
    await ConfigurationPage.clickOpenContextMenuForField(completeRelationName);
    await ConfigurationPage.clickContextMenuDeleteOption();
    await ConfigurationPage.clickConfirmFieldDeletionButton();
    await ConfigurationPage.save();

    await NavbarPage.clickCloseNonResourcesTab();
}
