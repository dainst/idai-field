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
    beginningDate: Groups.STEM,
    endDate: Groups.STEM,
    processor: Groups.STEM,
    campaign: Groups.STEM,
    description: 'default',
    date: Groups.STEM,
    spatialLocation: Groups.POSITION,
    provenance: 'default',
    orientation: Groups.POSITION,
    literature: 'default',
    geometry: Groups.POSITION
};


const projectPrefix: string = process.argv[2];

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

    if (!isCustomized(form) && (!customParentForm || !isCustomized(customParentForm))) return;

    if (parentFormId) {
        const parentForm = clone(getForm(parentFormId, builtInConfiguration, forms, categories));
        setGroups(parentForm, customParentForm, 'parent', false);
        form.groups = mergeGroupsConfigurations(parentForm.groups ?? {}, form.groups ?? {});
    }
    setGroups(form, customForm, parentFormId ? 'child' : 'parent', true);
    delete customForm.commons;
});


function getForm(formId, builtInConfiguration, forms, categories, customForm?) {

    if (forms[formId]) {
        return forms[formId];
    } else if (builtInConfiguration.builtInCategories[formId]) {
        return builtInConfiguration.builtInCategories[formId].minimalForm;
    } else if (categories[formId]) {
        const category = categories[formId];
        return builtInConfiguration.builtInCategories[category.parent].minimalForm;
    } else if (customForm?.parent) {
        return {
            parent: customForm.parent,
            groups: []
        };
    } else {
        console.warn('Form not found: ' + formId);
    }
}


function getParentFormId(form, builtInConfiguration, forms, categories, customForms) {

    const parent = categories[form.categoryName]?.parent
        ?? builtInConfiguration.builtInCategories?.[form.categoryName]?.parent
        ?? form.parent;
    if (!parent) return undefined;

    return Object.keys(customForms).find(customFormId => {
        return getForm(customFormId, builtInConfiguration, forms, categories)?.categoryName === parent;
    });

}


function setGroups(form, customForm, defaultGroupName: 'parent'|'child', setInCustomForm: boolean) {

    const groups = clone(form.groups);

    if (customForm.commons) {
        customForm.commons.forEach(commonFieldName => {
            let groupName = commonFieldGroups[commonFieldName];
            if (groupName === 'default') groupName = defaultGroupName;
            addToGroup(groups, groupName, commonFieldName);
        });
    }

    Object.keys(customForm.fields).forEach(fieldName => {
        addToGroup(groups, defaultGroupName, fieldName);
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

    return (!form.fields || Object.keys(form.fields).length === 0)
        && (!form.commons || form.commons.length === 0);
}


fs.writeFileSync('Config-' + projectPrefix + '.json', JSON.stringify(projectConfiguration, null, 2));
