import { Document } from './document';
import { ConfigurationResource } from './configuration-resource';
import { CategoryForm } from './configuration/category-form';
import { CustomFormDefinition } from '../configuration/model/form/custom-form-definition';
import { flatten, isEmpty, on, to } from 'tsfun';
import { CustomLanguageConfigurations } from './custom-language-configurations';
import { Group, Groups } from './configuration/group';
import { Field } from './configuration/field';
import { Named } from '../tools/named';
import { Resource } from './resource';
import { FieldResource } from './field-resource';
import { Valuelist } from './configuration/valuelist';
import { BaseGroupDefinition } from '../configuration/model/form/base-form-definition';


export const OVERRIDE_VISIBLE_FIELDS = [Resource.IDENTIFIER, FieldResource.SHORTDESCRIPTION, FieldResource.GEOMETRY];


export interface ConfigurationDocument extends Document {

    resource: ConfigurationResource;
}


export namespace ConfigurationDocument {


    export const isHidden = (customFormDefinition?: CustomFormDefinition,
                             parentCustomFormDefinitiion?: CustomFormDefinition) =>
            (field: Field): boolean => {

        return (customFormDefinition?.hidden ?? []).includes(field.name) ||
            (parentCustomFormDefinitiion?.hidden ?? []).includes(field.name);
    }


    export function isCustomizedCategory(configurationDocument: ConfigurationDocument,
                                         category: CategoryForm): boolean {

        const customDefinition: CustomFormDefinition = configurationDocument.resource
        .forms[category.libraryId ?? category.name];

        return customDefinition.color !== undefined
            || customDefinition.groups !== undefined
            || (customDefinition.valuelists !== undefined && !isEmpty(customDefinition.valuelists))
            || (customDefinition.fields !== undefined && !isEmpty(customDefinition.fields))
            || (customDefinition.hidden !== undefined && !isEmpty(customDefinition.hidden))
            || CustomLanguageConfigurations.hasCustomTranslations(
                configurationDocument.resource.languages, category
            );
    }


    export function getCustomCategoryDefinition(configurationDocument: ConfigurationDocument,
                                                category: CategoryForm): CustomFormDefinition|undefined {

        return configurationDocument.resource.forms[category.libraryId ?? category.name];
    }


    export function getParentCustomCategoryDefinition(configurationDocument: ConfigurationDocument,
                                                      category: CategoryForm): CustomFormDefinition|undefined {

        return category.parentCategory
            ? configurationDocument.resource.forms[category.libraryId ?? category.parentCategory.name]
            : undefined;
    }


    export function deleteCategory(customConfigurationDocument: ConfigurationDocument,
                                   category: CategoryForm,
                                   removeFromCategoriesOrder: boolean = true): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        delete clonedConfigurationDocument.resource.forms[category.libraryId ?? category.name];

        CustomLanguageConfigurations.deleteCategory(
            clonedConfigurationDocument.resource.languages, category
        );

        if (removeFromCategoriesOrder) {
            clonedConfigurationDocument.resource.order
            = clonedConfigurationDocument.resource.order.filter(categoryName => categoryName !== category.name);
        }

        return clonedConfigurationDocument;
    }


    export function deleteGroup(customConfigurationDocument: ConfigurationDocument,
                                category: CategoryForm, 
                                group: Group,
                                otherCategories: Array<CategoryForm>): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .forms[category.libraryId ?? category.name];
        clonedCategoryConfiguration.groups = clonedCategoryConfiguration
            .groups.filter(g => g.name !== group.name);

        if (!otherCategories.find(category => category.groups.find(g => g.name === group.name))) {
            CustomLanguageConfigurations.update(
                clonedConfigurationDocument.resource.languages, {}, {}, category, undefined, group
            );
        }

        return clonedConfigurationDocument;
    }


    export function deleteField(customConfigurationDocument: ConfigurationDocument,
                                category: CategoryForm, 
                                field: Field): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .forms[category.libraryId ?? category.name];
        delete clonedCategoryConfiguration.fields[field.name];

        removeFieldFromForm(clonedConfigurationDocument, category, field.name);

        category.children.filter(childCategory => childCategory.customFields.includes(field.name))
            .forEach(childCategory => {
                removeFieldFromForm(clonedConfigurationDocument, childCategory, field.name);
            });

        CustomLanguageConfigurations.update(
            clonedConfigurationDocument.resource.languages, {}, {}, category, field
        );

        return clonedConfigurationDocument;
    }


    export function deleteValuelist(customConfigurationDocument: ConfigurationDocument,
                                    valuelist: Valuelist): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        delete clonedConfigurationDocument.resource.valuelists[valuelist.id];

        return clonedConfigurationDocument;
    }


    export function getPermanentlyHiddenFields(configurationDocument: ConfigurationDocument,
                                               category: CategoryForm): string[] {

        const groups: Array<Group> = category.groups.filter(group => group.name !== Groups.HIDDEN_CORE_FIELDS);

        const result: string[] = flatten(groups.map(to('fields')))
            .filter(field => !field.visible
                && !OVERRIDE_VISIBLE_FIELDS.includes(field.name)
                && (category.source === 'custom' || !ConfigurationDocument.isHidden(
                    getCustomCategoryDefinition(configurationDocument, category),
                    getParentCustomCategoryDefinition(configurationDocument, category)
                )(field))
            )
            .map(Named.toName);

        if (category.name === 'Project') result.push(Resource.IDENTIFIER);
        return result;
    }


    export function addField(configurationDocument: ConfigurationDocument, category: CategoryForm,
                             permanentlyHiddenFields: string[], groupName: string,
                             fieldName: string): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(configurationDocument);

        addFieldToGroup(clonedConfigurationDocument, category, permanentlyHiddenFields, groupName, fieldName);
        category.children.filter(childCategory => {
            return !CategoryForm.getFields(childCategory).map(to('name')).includes(fieldName);
        })
        .forEach(childCategory => {
            addFieldToGroup(clonedConfigurationDocument, childCategory, permanentlyHiddenFields, groupName, fieldName);
        });
        
        return clonedConfigurationDocument;
    }


    function addFieldToGroup(configurationDocument: ConfigurationDocument, category: CategoryForm,
                             permanentlyHiddenFields: string[], groupName: string, fieldName: string) {
        
        const form: CustomFormDefinition = configurationDocument.resource
            .forms[category.libraryId ?? category.name];

        form.groups = CategoryForm.getGroupsConfiguration(category, permanentlyHiddenFields);
        let group: BaseGroupDefinition = form.groups.find(on('name', groupName));
        if (!group) {
            group = { name: groupName, fields: [] };
            form.groups.push(group);
        }
        group.fields.push(fieldName);
    }


    function removeFieldFromForm(configurationDocument: ConfigurationDocument, category: CategoryForm,
                                 fieldName: string) {
        
        const groupDefinition = configurationDocument.resource
            .forms[category.libraryId ?? category.name].groups
            .find(group => group.fields.includes(fieldName));

        groupDefinition.fields = groupDefinition.fields.filter(f => f !== fieldName);
    }
}
