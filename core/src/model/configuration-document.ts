import { Document } from './document';
import { ConfigurationResource } from './configuration-resource';
import { CategoryForm } from './configuration/category-form';
import { CustomFormDefinition } from '../configuration/model/form/custom-form-definition';
import { flatten, isEmpty, to } from 'tsfun';
import { CustomLanguageConfigurations } from './custom-language-configurations';
import { Group, Groups } from './configuration/group';
import { Field } from './configuration/field';
import { Named } from '../tools/named';
import { Resource } from './resource';
import { FieldResource } from './field-resource';


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

        const groupDefinition = clonedCategoryConfiguration.groups.find(
            group => group.fields.includes(field.name)
        );
        groupDefinition.fields = groupDefinition.fields.filter(f => f !== field.name);

        CustomLanguageConfigurations.update(
            clonedConfigurationDocument.resource.languages, {}, {}, category, field
        );

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
}
