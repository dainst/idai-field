import { is, on, to } from 'tsfun';
import { Document } from '../model/document';
import { Named } from '../tools/named';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model/configuration/field';
import { ValuelistUtil } from '../tools/valuelist-util';
import { Resource } from '../model/resource';
import { ImageResource } from '../model/image-resource';
import { MissingRelationTargetWarnings, Warnings } from '../model/warnings';
import { IndexFacade } from '../index/index-facade';
import { Datastore } from './datastore';
import { Query } from '../model/query';
import { DocumentCache } from './document-cache';
import { FieldResource, Valuelist } from '../model';
import { Hierarchy } from '../services/utilities/hierarchy';
import { ProjectConfiguration } from '../services';
import { Tree } from '../tools/forest';


/**
 * @author Thomas Kleinke
 */
export module WarningsUpdater {

    const FIELDS_TO_SKIP = [
        Resource.ID, Resource.IDENTIFIER, Resource.CATEGORY, Resource.RELATIONS, FieldResource.SCANCODE,
        ImageResource.GEOREFERENCE, ImageResource.ORIGINAL_FILENAME
    ];


    /**
     * Updates all warnings for whose determination the index is not required. These warnings do no rely on
     * analyzing the document in the context of other documents.
     */
    export function updateIndexIndependentWarnings(document: Document, projectConfiguration: ProjectConfiguration) {

        if (document.resource.category === 'Configuration') return;

        const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);

        const warnings: Warnings = createWarnings(document, category);
        if (Warnings.hasWarnings(warnings)) {
            document.warnings = warnings;
        } else {
            delete document.warnings;
        }
    }


    /**
     * Updates all warnings for whose determination the documents must have been previously indexed.
     */
    export async function updateIndexDependentWarnings(document: Document, indexFacade: IndexFacade,
                                                       documentCache: DocumentCache,
                                                       projectConfiguration: ProjectConfiguration,
                                                       datastore?: Datastore, previousIdentifier?: string,
                                                       updateAll: boolean = false) {

        const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
        if (!category) return;

        await updateNonUniqueIdentifierWarning(document, indexFacade, datastore, previousIdentifier, updateAll);
        await updateResourceLimitWarning(document, category, indexFacade, datastore, updateAll);
        await updateRelationTargetWarning(document, indexFacade, documentCache, datastore, updateAll);
        await updateProjectFieldOutlierWarning(document, projectConfiguration, category, indexFacade, documentCache,
            datastore, updateAll);
    }


    export async function updateNonUniqueIdentifierWarning(document: Document, indexFacade: IndexFacade,
                                                           datastore?: Datastore, previousIdentifier?: string,
                                                           updateAll: boolean = false) {

        if (indexFacade.getCount('identifier:match', document.resource.identifier) > 1) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            if (!document.warnings.nonUniqueIdentifier) {
                document.warnings.nonUniqueIdentifier = true;
                updateIndex(indexFacade, document, 'nonUniqueIdentifier:exist');
                if (updateAll) {
                    await updateNonUniqueIdentifierWarnings(
                        datastore, indexFacade, document.resource.identifier
                    );
                }
            }
        } else if (document.warnings?.nonUniqueIdentifier) {
            delete document.warnings.nonUniqueIdentifier;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, 'nonUniqueIdentifier:exist');
        }
        
        if (updateAll && previousIdentifier && previousIdentifier !== document.resource.identifier
                && indexFacade.getCount('identifier:match', previousIdentifier) > 0) {
            await updateNonUniqueIdentifierWarnings(datastore, indexFacade, previousIdentifier);
        }
    }


    export async function updateResourceLimitWarning(document: Document, category: CategoryForm,
                                                     indexFacade: IndexFacade, datastore?: Datastore,
                                                     updateAll: boolean = false) {
    
        if (!category) return;

        const query: Query = { categories: [category.name] };

        if (category.resourceLimit && indexFacade.find(query).length  > category.resourceLimit) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            document.warnings.resourceLimitExceeded = true;
            updateIndex(indexFacade, document, 'resourceLimitExceeded:exist');
            if (updateAll) await updateResourceLimitWarnings(datastore, indexFacade, category);
        } else if (document.warnings?.resourceLimitExceeded) {
            delete document.warnings.resourceLimitExceeded;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, 'resourceLimitExceeded:exist');
        }
    }


    export async function updateResourceLimitWarnings(datastore: Datastore, indexFacade: IndexFacade,
                                                      category: CategoryForm) {

        if (!category) return;
        const documents: Array<Document> = (await datastore.find({ categories: [category.name] })).documents;

        for (let document of documents) {
            await updateResourceLimitWarning(document, category, indexFacade);
        }
    }


    export async function updateRelationTargetWarning(document: Document, indexFacade: IndexFacade,
                                                      documentCache: DocumentCache, datastore?: Datastore,
                                                      updateRelationTargets: boolean = false) {
    
        const warnings: MissingRelationTargetWarnings = { relationNames: [], targetIds: [] };

        for (let relationName of Object.keys(document.resource.relations)) {
            for (let targetId of document.resource.relations[relationName]) {
                if (!documentCache.get(targetId)) {
                    if (!warnings.relationNames.includes(relationName)) warnings.relationNames.push(relationName);
                    if (!warnings.targetIds.includes(targetId)) warnings.targetIds.push(targetId);
                }
            }
        }

        if (warnings.relationNames.length > 0) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            document.warnings.missingRelationTargets = warnings;
            updateIndex(indexFacade, document, 'missingRelationTargets:exist');
        } else if (document.warnings?.missingRelationTargets) {
            delete document.warnings.missingRelationTargets;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, 'missingRelationTargets:exist');
        }

        if (updateRelationTargets) {
            await updateRelationTargetWarnings(datastore, documentCache, indexFacade, document.resource.id);
        }
    }


    export async function updateProjectFieldOutlierWarning(document: Document,
                                                           projectConfiguration: ProjectConfiguration,
                                                           category: CategoryForm, indexFacade: IndexFacade,
                                                           documentCache: DocumentCache, datastore?: Datastore,
                                                           updateAll: boolean = false) {

        const fields: Array<Field> = CategoryForm.getFields(category).filter(field => {
            return field.valuelistFromProjectField && Field.InputType.VALUELIST_INPUT_TYPES.includes(field.inputType);
        });
        const fieldNames: string[] = fields.map(to(Named.NAME));
        const outlierValues: string[] = [];

        for (let field of fields) {
            const fieldContent: any = document.resource[field.name];
            if (!fieldContent) continue;

            const valuelist: Valuelist = ValuelistUtil.getValuelist(
                field,
                documentCache.get('project'),
                await Hierarchy.getParentResource(id => Promise.resolve(documentCache.get(id)), document.resource)
            );

            if (valuelist && ValuelistUtil.getValuesNotIncludedInValuelist(fieldContent, valuelist)) {
                outlierValues.push(field.name);
            }
        }

        if (outlierValues.length) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            document.warnings.outlierValues = outlierValues;
            updateIndex(indexFacade, document, 'outlierValues:exist');
        } else if (document.warnings?.outlierValues.find(fieldName => fieldNames.includes(fieldName))) {
            document.warnings.outlierValues = document.warnings.outlierValues.filter(fieldName => {
                return !fieldNames.includes(fieldName);
            });
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, 'outlierValues:exist');
        }

        if (document.resource.category === 'Project' && updateAll) {
            await updateProjectFieldOutlierWarnings(datastore, documentCache, indexFacade, projectConfiguration);
        }
    }


    async function updateNonUniqueIdentifierWarnings(datastore: Datastore, indexFacade: IndexFacade,
                                                     identifier: string) {

        const documents: Array<Document> = (await datastore.find({
            constraints: { 'identifier:match': identifier }
        })).documents;

        for (let document of documents) {
            await updateNonUniqueIdentifierWarning(document, indexFacade);
        }
    }


    async function updateRelationTargetWarnings(datastore: Datastore, documentCache: DocumentCache,
                                                indexFacade: IndexFacade, id: string) {

        const documents: Array<Document> = (await datastore.find({
            constraints: { 'missingRelationTargetIds:contain': id }
        })).documents;

        for (let document of documents) {
            await updateRelationTargetWarning(document, indexFacade, documentCache, datastore);
        }
    }


    async function updateProjectFieldOutlierWarnings(datastore: Datastore, documentCache: DocumentCache,
                                                     indexFacade: IndexFacade,
                                                     projectConfiguration: ProjectConfiguration) {

        const categoryNames: string[] = Tree.flatten(projectConfiguration.getCategories()).filter(category => {
            return CategoryForm.getFields(category).find(field => field.valuelistFromProjectField);
        }).map(to(Named.NAME));

        const documents: Array<Document> = (await datastore.find({ categories: categoryNames })).documents;

        for (let document of documents) {
            const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
            if (!category) continue;

            await updateProjectFieldOutlierWarning(
                document, projectConfiguration, category, indexFacade, documentCache, datastore
            );
        }
    }


    function createWarnings(document: Document, category?: CategoryForm): Warnings {

        const warnings: Warnings = Warnings.createDefault();

        if (!category) {
            warnings.unconfiguredCategory = true;
            return warnings;
        }

        const fieldDefinitions: Array<Field> = CategoryForm.getFields(category);

        if (document._conflicts) warnings.conflicts = true;
        if (isIdentifierPrefixMissing(document, category)) warnings.missingIdentifierPrefix = true;

        return Object.keys(document.resource)
            .filter(fieldName => !FIELDS_TO_SKIP.includes(fieldName))
            .reduce((result, fieldName) => {
                const fieldContent: any = document.resource[fieldName];
                const field: Field = fieldDefinitions.find(on(Named.NAME, is(fieldName)));
                updateWarningsForField(warnings, fieldName, field, fieldContent);
                return result;
            }, warnings);
    }


    function isIdentifierPrefixMissing(document: Document, category: CategoryForm): boolean {

        if (!document.resource.identifier) return false;

        return category.identifierPrefix && !document.resource.identifier.startsWith(category.identifierPrefix);
    }


    function updateWarningsForField(warnings: Warnings, fieldName: string, field: Field, fieldContent: any) {

        if (!field) {
            warnings.unconfiguredFields.push(fieldName);
        } else if (!Field.isValidFieldData(fieldContent, field)) {
            warnings.invalidFields.push(fieldName);
        }  else if (Field.InputType.VALUELIST_INPUT_TYPES.includes(field.inputType)
                && !field.valuelistFromProjectField
                && ValuelistUtil.getValuesNotIncludedInValuelist(fieldContent, field.valuelist)) {
            warnings.outlierValues.push(fieldName);
        }
    }


    function updateIndex(indexFacade: IndexFacade, document: Document, indexName: string) {

        indexFacade.putToSingleIndex(document, indexName);
        indexFacade.putToSingleIndex(document, 'warnings:exist');
    }
}
