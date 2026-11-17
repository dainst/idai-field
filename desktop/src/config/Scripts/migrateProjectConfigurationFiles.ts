import { clone } from 'tsfun';
import { Groups, BuiltInConfiguration } from 'idai-field-core';
import { mergeGroupsConfigurations } from '../../../../core/src/configuration/boot/merge-groups-configurations';

const fs = require('fs');


const commonFieldGroups = {
    period: Groups.TIME,
    dating: Groups.TIME,
    diary: Groups.STEM,
    area: Groups.DIMENSION,
    dimensionLength: Groups.DIMENSION,
    dimensionWidth: Groups.DIMENSION, 
    dimensionHeight: Groups.DIMENSION,
    dimensionDepth: Groups.DIMENSION,
    dimensionDiameter: Groups.DIMENSION,
    dimensionPerimeter: Groups.DIMENSION,
    dimensionThickness: Groups.DIMENSION,
    dimensionVerticalExtent: Groups.POSITION,
    dimensionOther: Groups.DIMENSION,
    processor: Groups.STEM,
    campaign: Groups.STEM,
    description: Groups.PROPERTIES,
    date: Groups.STEM,
    spatialLocation: Groups.POSITION,
    provenance: Groups.PROPERTIES,
    orientation: Groups.POSITION,
    literature: Groups.PROPERTIES,
    geometry: Groups.POSITION
};


const defaultCategoriesOrder = [
    'Project', 'Operation', 'Trench', 'Building', 'Survey', 'Place', 'Feature', 'Layer', 'Grave', 'Burial',
    'Architecture', 'Floor', 'DrillCoreLayer', 'Wall_surface', 'Area', 'SurveyUnit', 'Sondage', 'Excavation',
    'Find', 'Pottery', 'Terracotta', 'Brick', 'Bone', 'Glass', 'Metal', 'Stone', 'Wood', 'Coin', 'PlasterFragment',
    'Mollusk', 'Inscription', 'Sample', 'Profile', 'Planum', 'BuildingPart', 'Room', 'RoomCeiling', 'RoomWall',
    'RoomFloor', 'ProcessUnit', 'Drilling', 'SurveyBurial', 'BuildingFloor', 'Quantification', 'Impression',
    'Image', 'Drawing', 'Photo', 'TypeCatalog', 'Type'
];


fs.readdirSync('.')
    .filter(fileName => fileName.startsWith('Config-'))
    .map(fileName => fileName.replace('Config-', '').replace('.json', ''))
    .forEach(migrate);
    

function migrate(projectPrefix) {

    const projectConfiguration = JSON.parse(fs.readFileSync('Config-' + projectPrefix + '.json'));
    const originalProjectConfiguration = clone(projectConfiguration);
    const categories = JSON.parse(fs.readFileSync('Library/Categories.json'));
    const forms = JSON.parse(fs.readFileSync('Library/Forms.json'));
    const builtInConfiguration = new BuiltInConfiguration(projectPrefix);

    Object.keys(projectConfiguration.forms).forEach(formId => {
        const customForm = projectConfiguration.forms[formId];
        const form = clone(getForm(formId, builtInConfiguration, forms, categories, customForm));
        const parentFormId = getParentFormId(form, builtInConfiguration, forms, categories, projectConfiguration.forms);
        const customParentForm = parentFormId ? originalProjectConfiguration.forms[parentFormId] : undefined;

        if (!isCustomized(customForm) && (!customParentForm || !isCustomized(customParentForm))) {
            delete customForm.commons;
            return;
        }

        if (parentFormId) {
            const parentForm = clone(getForm(parentFormId, builtInConfiguration, forms, categories));
            setGroups(parentForm, customParentForm, false);
            form.groups = mergeGroupsConfigurations(parentForm.groups ?? {}, form.groups ?? {});
        }
        setGroups(form, customForm, true);
        delete customForm.commons;
    });

    projectConfiguration.order = getCategoriesOrder(projectConfiguration.forms, forms, categories, builtInConfiguration);

    fs.writeFileSync('Config-' + projectPrefix + '.json', JSON.stringify(projectConfiguration, null, 2));
}


function getForm(formId, builtInConfiguration, forms, categories, customForm?) {

    if (forms[formId]) {
        return forms[formId];
    } else if (builtInConfiguration.builtInCategories[formId]) {
        return getMinimalForm(formId, builtInConfiguration.builtInCategories[formId]);
    } else if (categories[formId]) {
        const category = categories[formId];
        return getMinimalForm(formId, builtInConfiguration.builtInCategories[category.parent]);
    } else if (customForm?.parent) {
        return {
            categoryName: formId,
            parent: customForm.parent,
            groups: []
        };
    } else {
        console.warn('Form not found: ' + formId);
    }
}


function getMinimalForm(formId, category) {

    const minimalForm = clone(category.minimalForm);
    minimalForm.categoryName = formId;
    return minimalForm;
}


function getParentFormId(form, builtInConfiguration, forms, categories, customForms) {

    const parent = getParentCategoryName(form, categories, builtInConfiguration);
    if (!parent) return undefined;

    return Object.keys(customForms).find(customFormId => {
        return getForm(customFormId, builtInConfiguration, forms, categories, customForms[customFormId])
            ?.categoryName === parent;
    });
}


function getParentCategoryName(form, categories, builtInConfiguration) {

    return categories[form.categoryName]?.parent
        ?? builtInConfiguration.builtInCategories?.[form.categoryName]?.parent
        ?? form.parent;
}


function setGroups(form, customForm, setInCustomForm: boolean) {

    const groups = clone(form.groups);

    if (customForm.commons) {
        customForm.commons.forEach(commonFieldName => {
            let groupName = commonFieldGroups[commonFieldName];
            addToGroup(groups, groupName, commonFieldName);
        });
    }

    Object.keys(customForm.fields).forEach(fieldName => {
        addToGroup(groups, Groups.PROPERTIES, fieldName);
    });

    if (setInCustomForm) {
        customForm.groups = groups;
    } else {
        form.groups = groups;
    }
}


function addToGroup(groups, groupName, fieldName) {

    let group = groups.find(group => group.name === groupName);

    if (!group) {
        group = { name: groupName, fields: [] };
        groups.push(group);
    }

    if (!group.fields.includes(fieldName)) group.fields.push(fieldName);
}


function isCustomized(form) {

    return (form.fields !== undefined && Object.keys(form.fields).length > 0)
        || (form.commons !== undefined && form.commons.length > 0)
        || form.parent !== undefined;
}


function getCategoriesOrder(customForms, forms, categories, builtInConfiguration): string[] {

    const usedForms = Object.keys(customForms)
        .map(formId => getForm(formId, builtInConfiguration, forms, categories, customForms[formId]));

    const order = defaultCategoriesOrder.filter(categoryName => {
        return usedForms.map(form => form.categoryName).includes(categoryName);
    });
    const newlyCreatedCustomForms = usedForms.filter(form => !order.includes(form.categoryName));

    newlyCreatedCustomForms.forEach(customForm => {
        const parent = getParentCategoryName(customForm, categories, builtInConfiguration);
        const orderParents = order.map(categoryName => {
            return getParentCategoryNameForCategoryName(categoryName, customForms, categories, builtInConfiguration);
        });
        let index = orderParents.lastIndexOf(parent);
        if (index === -1) index = order.indexOf(parent);
        if (index === -1) {
            order.push(customForm.categoryName);
        } else {
            order.splice(index + 1, 0, customForm.categoryName);
        }
    });

    return order;
}


function getParentCategoryNameForCategoryName(categoryName, customForms, categories, builtInConfiguration) {

    return categories[categoryName]?.parent
        ?? builtInConfiguration.builtInCategories?.[categoryName]?.parent
        ?? customForms[categoryName]?.parent
        ?? 'NONE';
}
