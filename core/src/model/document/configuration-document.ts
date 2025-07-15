import { isEmpty, on, to } from 'tsfun';
import { Document } from './document';
import { ConfigurationResource } from './configuration-resource';
import { CategoryForm } from '../configuration/category-form';
import { CustomFormDefinition } from '../../configuration/model/form/custom-form-definition';
import { CustomLanguageConfigurations } from '../configuration/custom-language-configurations';
import { Group, GroupDefinition, Groups } from '../configuration/group';
import { Field } from '../configuration/field';
import { Resource } from './resource';
import { FieldResource } from './field-resource';
import { Valuelist } from '../configuration/valuelist';
import { BaseGroupDefinition } from '../../configuration/model/form/base-form-definition';
import { ConfigReader } from '../../configuration/boot/config-reader';
import { getConfigurationName } from '../../configuration/project-configuration-names';
import { sampleDataLabels } from '../../datastore/sampledata/sample-data-labels';
import { ScanCodeConfiguration } from '../configuration/scan-code-configuration';
import { ConfigurationMigrator } from '../../configuration/configuration-migrator';
import { Relation } from '../configuration/relation';


export const OVERRIDE_VISIBLE_FIELDS = [Resource.IDENTIFIER, FieldResource.SHORTDESCRIPTION, FieldResource.GEOMETRY];


export interface ConfigurationDocument extends Document {

    resource: ConfigurationResource;
}


export namespace ConfigurationDocument {

    export async function getConfigurationDocument(getFunction: (id: string) => Promise<Document>,
                                                   configReader: ConfigReader, projectIdentifier: string,
                                                   username: string): Promise<ConfigurationDocument> {

        let configurationDocument: ConfigurationDocument;

        try {
            configurationDocument = await getFunction('configuration') as ConfigurationDocument;
        } catch (_) {
            configurationDocument = await createConfigurationDocumentFromFile(
                configReader, projectIdentifier, username
            );
        }

        if (configurationDocument) ConfigurationMigrator.migrate(configurationDocument.resource);

        return configurationDocument;
    }


    export const isHidden = (customFormDefinition?: CustomFormDefinition,
                             parentCustomFormDefinitiion?: CustomFormDefinition) =>
            (field: Field): boolean => {

        return (customFormDefinition?.hidden ?? []).includes(field.name) ||
            (parentCustomFormDefinitiion?.hidden ?? []).includes(field.name);
    }


    export function isCustomizedCategory(configurationDocument: ConfigurationDocument,
                                         category: CategoryForm, checkChildren: boolean = false): boolean {

        const customDefinition: CustomFormDefinition = configurationDocument.resource
            .forms[category.libraryId ?? category.name];

        const result: boolean = customDefinition.color !== undefined
            || customDefinition.groups !== undefined
            || (customDefinition.valuelists !== undefined && !isEmpty(customDefinition.valuelists))
            || (customDefinition.fields !== undefined && !isEmpty(customDefinition.fields))
            || (customDefinition.hidden !== undefined && !isEmpty(customDefinition.hidden))
            || CustomLanguageConfigurations.hasCustomTranslations(
                configurationDocument.resource.languages, category
            );

        if (checkChildren) {
            if (category.children.find(childCategory => isCustomizedCategory(configurationDocument, childCategory))) {
                return true;
            }
        }

        return result;
    }


    export function getCustomCategoryDefinition(configurationDocument: ConfigurationDocument,
                                                category: CategoryForm): CustomFormDefinition|undefined {

        return configurationDocument.resource.forms[category.libraryId ?? category.name];
    }


    export function getParentCustomCategoryDefinition(configurationDocument: ConfigurationDocument,
                                                      category: CategoryForm): CustomFormDefinition|undefined {

        return category.parentCategory
            ? configurationDocument.resource.forms[category.parentCategory.libraryId ?? category.parentCategory.name]
            : undefined;
    }


    export function deleteCategory(customConfigurationDocument: ConfigurationDocument, category: CategoryForm,
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


    export function deleteGroup(customConfigurationDocument: ConfigurationDocument, category: CategoryForm,
                                group: Group, otherCategories: Array<CategoryForm>): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .forms[category.libraryId ?? category.name];
        clonedCategoryConfiguration.groups = clonedCategoryConfiguration
            .groups.filter(g => g.name !== group.name);

        if (!otherCategories.find(category => category.groups.find(g => g.name === group.name))) {
            CustomLanguageConfigurations.update(
                clonedConfigurationDocument.resource.languages, {}, {}, category, undefined, undefined, group
            );
        }

        return clonedConfigurationDocument;
    }


    export function deleteField(customConfigurationDocument: ConfigurationDocument,
                                category: CategoryForm, field: Field): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        const clonedCategoryConfiguration = clonedConfigurationDocument.resource
            .forms[category.libraryId ?? category.name];

        const scanCodeConfiguration: ScanCodeConfiguration = clonedCategoryConfiguration.scanCodes;
        if (scanCodeConfiguration?.printedFields) {
            scanCodeConfiguration.printedFields = scanCodeConfiguration.printedFields.filter(printedField => {
                return printedField.name !== field.name;
            });
        }

        removeFieldFromForm(clonedConfigurationDocument, category, field);

        category.children.filter(childCategory => childCategory.customFields.includes(field.name))
            .forEach(childCategory => {
                removeFieldFromForm(clonedConfigurationDocument, childCategory, field);
            });

        return clonedConfigurationDocument;
    }


    export function deleteValuelist(customConfigurationDocument: ConfigurationDocument,
                                    valuelist: Valuelist): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(customConfigurationDocument);
        delete clonedConfigurationDocument.resource.valuelists[valuelist.id];

        return clonedConfigurationDocument;
    }


    export function getPermanentlyHiddenFields(category: CategoryForm): string[] {

        return category.name === 'Project'
            ? [Resource.IDENTIFIER]
            : [];
    }


    export function swapCategoryForm(configurationDocument: ConfigurationDocument, currentForm: CategoryForm,
                                     newForm: CategoryForm, parentForm?: CategoryForm): ConfigurationDocument {

        const clonedConfigurationDocument = ConfigurationDocument.deleteCategory(
            configurationDocument, currentForm, false
        );

        [newForm].concat(currentForm.children).forEach(form => {
            const formDefinition: CustomFormDefinition = {
                fields: {},
                hidden: []
            };

            if (form.parentCategory) {
                if (form.source === 'custom') formDefinition.parent = form.parentCategory.name;
                if (form.source === 'custom' || form.parentCategory.name === 'Process') {
                    formDefinition.groups = CategoryForm.getGroupsConfiguration(
                        newForm, getPermanentlyHiddenFields(newForm)
                    );
                }
                if (form.parentCategory.name === 'Process') {
                    addWorkflowRelations(
                        configurationDocument,
                        form.name === currentForm.name ? currentForm : form,
                        formDefinition
                    );
                }
            }

            clonedConfigurationDocument.resource.forms[form.libraryId] = formDefinition;
        });

        if (parentForm) addCustomParentFields(newForm, parentForm, clonedConfigurationDocument);
        
        return clonedConfigurationDocument;
    }


    export function addCategoryForm(configurationDocument: ConfigurationDocument, categoryForm: CategoryForm,
                                    parentForm?: CategoryForm): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(configurationDocument);

        clonedConfigurationDocument.resource.forms[categoryForm.libraryId] = {
            fields: {},
            hidden: []
        };
        
        if (parentForm) addCustomParentFields(categoryForm, parentForm, clonedConfigurationDocument);

        if (categoryForm.parentCategory?.name === 'Process') {
            for (let relationName of Relation.Workflow.ALL) {
                const relation: Relation = CategoryForm.getField(categoryForm, relationName) as Relation;
                if (!relation) continue;
                clonedConfigurationDocument.resource.forms[categoryForm.libraryId].fields[relationName] = {
                    inputType: Field.InputType.RELATION,
                    range: relation.range
                };
                addFieldToGroup(
                    clonedConfigurationDocument,
                    categoryForm,
                    getPermanentlyHiddenFields(categoryForm),
                    Groups.WORKFLOW,
                    relationName
                );
            }
        }

        return addToCategoriesOrder(
            clonedConfigurationDocument, categoryForm.name, categoryForm.parentCategory?.name
        );
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


    export function addToCategoriesOrder(configurationDocument: ConfigurationDocument, newCategoryName: string,
                                         parentCategoryName?: string): ConfigurationDocument {

        const clonedConfigurationDocument = Document.clone(configurationDocument);
        const order: string[] = clonedConfigurationDocument.resource.order;

        if (parentCategoryName) {
            order.splice(order.indexOf(parentCategoryName) + 1, 0, newCategoryName);
        } else {
            order.push(newCategoryName);
        }

        return clonedConfigurationDocument;
    }


    async function createConfigurationDocumentFromFile(configReader: ConfigReader, projectIdentifier: string,
                                                       username: string): Promise<ConfigurationDocument> {

        const customConfigurationName: string = getConfigurationName(projectIdentifier);
        const customConfiguration = await configReader.read('/Config-' + customConfigurationName + '.json');
        const languageConfigurations = configReader.getCustomLanguageConfigurations(customConfigurationName);

        const configurationDocument = {
            _id: 'configuration',
            created: {
                user: username,
                date: new Date()
            },
            modified: [],
            resource: {
                id: 'configuration',
                identifier: 'Configuration',
                category: 'Configuration',
                relations: {},
                forms: customConfiguration.forms,
                order: customConfiguration.order,
                languages: languageConfigurations,
                valuelists: {},
                projectLanguages: projectIdentifier === 'test' ? Object.keys(sampleDataLabels) : []
            }
        };

        return configurationDocument;
    }


    function addCustomParentFields(categoryForm: CategoryForm, parentForm: CategoryForm,
                                   clonedConfigurationDocument: ConfigurationDocument) {

        parentForm.groups.forEach(group => {
            group.fields.filter(field => parentForm.customFields?.includes(field.name))
                .forEach(field => addFieldToGroup(clonedConfigurationDocument, categoryForm,
                    getPermanentlyHiddenFields(categoryForm), group.name, field.name));
        });
    }


    function addFieldToGroup(configurationDocument: ConfigurationDocument, category: CategoryForm,
                             permanentlyHiddenFields: string[], groupName: string, fieldName: string) {
        
        const form: CustomFormDefinition = configurationDocument.resource
            .forms[category.libraryId ?? category.name];

        if (!form.groups || form.groups.length === 0) {
            form.groups = CategoryForm.getGroupsConfiguration(category, permanentlyHiddenFields);
        }
        let group: BaseGroupDefinition = form.groups.find(on('name', groupName));
        if (!group) {
            group = { name: groupName, fields: [] };
            form.groups.push(group);
        }
        group.fields.push(fieldName);
    }


    function removeFieldFromForm(configurationDocument: ConfigurationDocument, category: CategoryForm,
                                 field: Field) {

        const formDefinition = configurationDocument.resource
            .forms[category.libraryId ?? category.name];

        const groupDefinition = formDefinition.groups
            .find(group => group.fields.includes(field.name));

        delete formDefinition.fields[field.name];
        groupDefinition.fields = groupDefinition.fields.filter(f => f !== field.name);

        if (groupDefinition.fields.length === 0) {
            formDefinition.groups.splice(formDefinition.groups.indexOf(groupDefinition), 1);
        }

        if (formDefinition.valuelists?.[field.name]) {
            delete formDefinition.valuelists[field.name];
            if (isEmpty(formDefinition.valuelists)) delete formDefinition.valuelists;
        }

        CustomLanguageConfigurations.update(
            configurationDocument.resource.languages, {}, {}, category, field
        );

        if (field.subfields) {
            field.subfields.forEach(subfield => {
                CustomLanguageConfigurations.update(
                    configurationDocument.resource.languages, {}, {}, category, field, subfield
                );
            });
        }
    }


    function addWorkflowRelations(configurationDocument: ConfigurationDocument, form: CategoryForm,
                                  formDefinition: CustomFormDefinition) {

        const currentCategoryDefinition: CustomFormDefinition = getCustomCategoryDefinition(
            configurationDocument, form
        );

        for (let relationName of Relation.Workflow.ALL) {
            if (currentCategoryDefinition.fields[relationName]) {
                formDefinition.fields[relationName] = currentCategoryDefinition.fields[relationName];
                const workflowGroup: GroupDefinition = formDefinition.groups.find(group => {
                    return group.name === Groups.WORKFLOW;
                });
                if (!workflowGroup) {
                    formDefinition.groups.splice(1, 0, { name: Groups.WORKFLOW, fields: [relationName] });
                } else {
                    workflowGroup.fields.push(relationName);
                }
            }
        }
    }
}
