import { equal, is, isArray, isObject, on, set, to, Map } from 'tsfun';
import { Document } from '../model/document';
import { Named } from '../tools/named';
import { CategoryForm } from '../model/configuration/category-form';
import { BaseField, Field } from '../model/configuration/field';
import { ValuelistUtil } from '../tools/valuelist-util';
import { Resource } from '../model/resource';
import { ImageResource } from '../model/image-resource';
import { MissingRelationTargetWarnings, OutlierWarnings, Warnings } from '../model/warnings';
import { IndexFacade } from '../index/index-facade';
import { Datastore } from './datastore';
import { Query } from '../model/query';
import { DocumentCache } from './document-cache';
import { ProjectConfiguration } from '../services';
import { Tree } from '../tools/forest';
import { FieldResource } from '../model/field-resource';
import { Valuelist } from '../model/configuration/valuelist';
import { Relation } from '../model';


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
                                                       previousWarnings?: Warnings, updateAll: boolean = false) {
        
        const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
        if (!category) return;

        if (previousWarnings?.unconfiguredCategory && updateAll) {
            await updateMissingOrInvalidParentWarningsForDescendants(
                document, datastore, documentCache, indexFacade, projectConfiguration
            );
        }

        await updateNonUniqueIdentifierWarning(document, indexFacade, datastore, previousIdentifier, updateAll);
        await updateResourceLimitWarning(document, category, indexFacade, projectConfiguration, datastore, updateAll);
        await updateRelationTargetWarning(document, indexFacade, documentCache, datastore, updateAll);
        await updateMissingOrInvalidParentWarning(document, projectConfiguration, indexFacade, documentCache,
            datastore, updateAll);
        await updateOutlierWarning(document, projectConfiguration, category, indexFacade, documentCache,
            datastore, updateAll);
    }


    export async function updateNonUniqueIdentifierWarning(document: Document, indexFacade: IndexFacade,
                                                           datastore?: Datastore, previousIdentifier?: string,
                                                           updateAll: boolean = false) {

        if (indexFacade.getCount('identifier:match', document.resource.identifier) > 1) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            if (!document.warnings.nonUniqueIdentifier) {
                document.warnings.nonUniqueIdentifier = true;
                updateIndex(indexFacade, document, ['nonUniqueIdentifier:exist']);
                if (updateAll) {
                    await updateNonUniqueIdentifierWarnings(
                        datastore, indexFacade, document.resource.identifier
                    );
                }
            }
        } else if (document.warnings?.nonUniqueIdentifier) {
            delete document.warnings.nonUniqueIdentifier;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, ['nonUniqueIdentifier:exist']);
        }
        
        if (updateAll && previousIdentifier && previousIdentifier !== document.resource.identifier
                && indexFacade.getCount('identifier:match', previousIdentifier) > 0) {
            await updateNonUniqueIdentifierWarnings(datastore, indexFacade, previousIdentifier);
        }
    }


    export async function updateResourceLimitWarning(document: Document, category: CategoryForm,
                                                     indexFacade: IndexFacade,
                                                     projectConfiguration: ProjectConfiguration,
                                                     datastore?: Datastore, updateAll: boolean = false) {
    
        if (!category) return;

        const resourceLimit: number = category.parentCategory?.resourceLimit ?? category.resourceLimit;
        const parentCategoryName: string = category.parentCategory?.name ?? category.name;

        const query: Query = {
            categories: projectConfiguration.getCategoryWithSubcategories(parentCategoryName).map(to(Named.NAME)),
            sort: { mode: 'none' }
        };

        if (resourceLimit !== undefined && indexFacade.find(query).length  > resourceLimit) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            document.warnings.resourceLimitExceeded = true;
            updateIndex(indexFacade, document, ['resourceLimitExceeded:exist']);
            if (updateAll) await updateResourceLimitWarnings(datastore, indexFacade, projectConfiguration, category);
        } else if (document.warnings?.resourceLimitExceeded) {
            delete document.warnings.resourceLimitExceeded;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, ['resourceLimitExceeded:exist']);
        }
    }


    export async function updateResourceLimitWarnings(datastore: Datastore, indexFacade: IndexFacade,
                                                      projectConfiguration: ProjectConfiguration,
                                                      category: CategoryForm) {

        if (!category) return;

        const parentCategoryName: string = category.parentCategory?.name ?? category.name;

        const documents: Array<Document> = (await datastore.find({
            categories: projectConfiguration.getCategoryWithSubcategories(parentCategoryName).map(to(Named.NAME)),
            sort: { mode: 'none' }
        })).documents;

        for (let document of documents) {
            await updateResourceLimitWarning(
                document,
                projectConfiguration.getCategory(document.resource.category),
                indexFacade,
                projectConfiguration
            );
        }
    }


    export async function updateRelationTargetWarning(document: Document, indexFacade: IndexFacade,
                                                      documentCache: DocumentCache, datastore?: Datastore,
                                                      updateRelationTargets: boolean = false) {
    
        const warnings: MissingRelationTargetWarnings = { relationNames: [], targetIds: [] };

        const relationNames: string[] = Object.keys(document.resource.relations).filter(relationName => {
            return !Relation.Hierarchy.ALL.includes(relationName);
        });

        for (let relationName of relationNames) {
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
            updateIndex(indexFacade, document, ['missingRelationTargets:exist']);
        } else if (document.warnings?.missingRelationTargets) {
            delete document.warnings.missingRelationTargets;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, ['missingRelationTargets:exist']);
        }

        if (updateRelationTargets) {
            await updateRelationTargetWarnings(datastore, documentCache, indexFacade, document.resource.id);
        }
    }


    export async function updateMissingOrInvalidParentWarning(document: Document,
                                                              projectConfiguration: ProjectConfiguration,
                                                              indexFacade: IndexFacade, documentCache: DocumentCache,
                                                              datastore?: Datastore, updateAll: boolean = false) {

        let hasValidParent: boolean = true;
        
        const ancestors: Array<Document> = getAncestorDocuments(document, documentCache);

        for (let i = 0; i <= ancestors.length; i++) {
            const baseDocument: Document = i ? ancestors[i - 1] : document;
            const parentDocument: Document = i < ancestors.length ? ancestors[i] : undefined;
            const recordedInTargetIds: string[] = baseDocument.resource.relations[Relation.Hierarchy.RECORDEDIN];
            const recordedInTargetId: string = recordedInTargetIds?.length ? recordedInTargetIds[0] : undefined;
            const recordedInTarget: Document = recordedInTargetId ? documentCache.get(recordedInTargetId) : undefined;
            if (!Document.isValidParent(baseDocument, parentDocument, recordedInTarget, projectConfiguration)) {
                hasValidParent = false;
                break;
            }
        }

        if (!hasValidParent) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            document.warnings.missingOrInvalidParent = true;
            updateIndex(indexFacade, document, ['missingOrInvalidParent:exist']);
        } else if (document.warnings?.missingOrInvalidParent) {
            delete document.warnings.missingOrInvalidParent;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            updateIndex(indexFacade, document, ['missingOrInvalidParent:exist']);
            if (updateAll) {
                await updateMissingOrInvalidParentWarningsForDescendants(
                    document, datastore, documentCache, indexFacade, projectConfiguration
                );
            }
        }
    }


    export async function updateOutlierWarning(document: Document,
                                               projectConfiguration: ProjectConfiguration,
                                               category: CategoryForm, indexFacade: IndexFacade,
                                               documentCache: DocumentCache, datastore?: Datastore,
                                               updateAll: boolean = false) {

        const fields: Array<Field> = CategoryForm.getFields(category).filter(field => {
            return Field.InputType.VALUELIST_INPUT_TYPES.concat([Field.InputType.COMPOSITE])
                .includes(field.inputType);
        });
        const parent: Document = getParentDocument(document, documentCache);
        const outlierWarnings: OutlierWarnings = { fields: {}, values: [] };

        for (let field of fields) {
            const outlierValues: Map<string[]>|string[] = getOutlierValues(
                document.resource, field, documentCache.get('project'), parent?.resource, projectConfiguration
            );
            if (isArray(outlierValues) && !outlierValues.length) continue;
            if (isObject(outlierValues) && !Object.keys(outlierValues).length) continue;
            
            outlierWarnings.fields[field.name] = outlierValues;
            if (isArray(outlierValues)) {
                outlierWarnings.values = outlierWarnings.values.concat(outlierValues);
            } else {
                outlierWarnings.values = Object.values(outlierValues).reduce((result, values) => {
                    return result.concat(values);
                }, outlierWarnings.values);
            }
        }

        if (!equal(outlierWarnings as any, document.warnings?.outliers ?? { fieldNames: [], values: [] } as any)) {
            if (outlierWarnings.values.length) {
                if (!document.warnings) document.warnings = Warnings.createDefault();
                document.warnings.outliers = outlierWarnings;
                updateIndex(indexFacade, document, ['outliers:exist', 'outlierValues:contain']);
            } else if (document.warnings?.outliers) {
                delete document.warnings.outliers;
                if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
                updateIndex(indexFacade, document, ['outliers:exist', 'outlierValues:contain']);
            }
        }

        if (updateAll) {
            if (document.resource.category === 'Project') {
                await updateProjectFieldOutlierWarnings(datastore, documentCache, indexFacade, projectConfiguration);
            }
            await updateOutlierWarningsForChildren(
                document, datastore, documentCache, indexFacade, projectConfiguration
            );
        }
    }


    function getOutlierValues(fieldContainer: any, field: BaseField, projectDocument: Document,
                              parentResource: Resource,
                              projectConfiguration: ProjectConfiguration): Map<string[]>|string[] {

        const fieldContent: any = fieldContainer[field.name];
        if (!fieldContent) return [];

        if (field.inputType === Field.InputType.COMPOSITE) {
            return getOutlierValuesForCompositeField(
                field, fieldContent, projectDocument, parentResource, projectConfiguration
            );
        }

        const valuelist: Valuelist = ValuelistUtil.getValuelist(
            field, projectDocument, projectConfiguration, parentResource
        );
        return valuelist
            ? set(ValuelistUtil.getValuesNotIncludedInValuelist(fieldContent, valuelist) ?? [])
            : [];
    }


    function getOutlierValuesForCompositeField(field: Field, fieldContent: any, projectDocument: Document,
                                               parentResource: Resource,
                                               projectConfiguration: ProjectConfiguration): Map<string[]> {

        if (!isArray(fieldContent)) return {};

        let outliers: Map<string[]> = {};

        for (let entry of fieldContent) {
            if (!isObject(entry)) continue;

            for (let subfield of field.subfields) {
                if (!Field.InputType.VALUELIST_INPUT_TYPES.includes(subfield.inputType)) continue;

                const subfieldOutliers: string[] = getOutlierValues(
                    entry, subfield, projectDocument, parentResource, projectConfiguration
                ) as string[];
                if (!subfieldOutliers.length) continue;

                if (outliers[subfield.name]) {
                    outliers[subfield.name] = set(outliers[subfield.name].concat(subfieldOutliers));
                } else {
                    outliers[subfield.name] = subfieldOutliers;
                }
            }
        }

        return outliers;
    }


    async function updateNonUniqueIdentifierWarnings(datastore: Datastore, indexFacade: IndexFacade,
                                                     identifier: string) {

        const documents: Array<Document> = (await datastore.find({
            constraints: { 'identifier:match': identifier },
            sort: { mode: 'none' }
        })).documents;

        for (let document of documents) {
            await updateNonUniqueIdentifierWarning(document, indexFacade);
        }
    }


    async function updateRelationTargetWarnings(datastore: Datastore, documentCache: DocumentCache,
                                                indexFacade: IndexFacade, id: string) {

        const documents: Array<Document> = (await datastore.find({
            constraints: { 'missingRelationTargetIds:contain': id },
            sort: { mode: 'none' }
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

        const documents: Array<Document> = (await datastore.find(
            { categories: categoryNames, sort: { mode: 'none' } }
        )).documents;

        for (let document of documents) {
            const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
            if (!category) continue;

            await updateOutlierWarning(document, projectConfiguration, category, indexFacade, documentCache, datastore);
        }
    }


    async function updateOutlierWarningsForChildren(document: Document, datastore: Datastore,
                                                    documentCache: DocumentCache, indexFacade: IndexFacade,
                                                    projectConfiguration: ProjectConfiguration) {

        const documents: Array<Document> = (await datastore.find({
            constraints: { 'isChildOf:contain': document.resource.id },
            sort: { mode: 'none' }
        })).documents;

        for (let document of documents) {
            const category: CategoryForm = projectConfiguration.getCategory(document.resource.category);
            if (!category) continue;

            await updateOutlierWarning(document, projectConfiguration, category, indexFacade, documentCache, datastore);
        }
    }


    async function updateMissingOrInvalidParentWarningsForDescendants(document: Document, datastore: Datastore,
                                                                      documentCache: DocumentCache,
                                                                      indexFacade: IndexFacade,
                                                                      projectConfiguration: ProjectConfiguration) {

        const documents: Array<Document> = (await datastore.find({
            constraints: { 'isChildOf:contain': { value: document.resource.id, searchRecursively: true } },
            sort: { mode: 'none' }
        }, { includeResourcesWithoutValidParent: true })).documents;

        for (let document of documents) {
            await updateMissingOrInvalidParentWarning(
                document, projectConfiguration, indexFacade, documentCache, datastore
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
        }
    }


    function updateIndex(indexFacade: IndexFacade, document: Document, indexNames: string[]) {

        indexNames.forEach(indexName => indexFacade.putToSingleIndex(document, indexName));
        indexFacade.putToSingleIndex(document, 'warnings:exist');
    }


    function getAncestorDocuments(document: Document, documentCache): Array<Document> {

        const result: Array<Document> = [];
        let parent: Document;

        do {
            parent = getParentDocument(parent ?? document, documentCache);
            if (parent) {
                if (result.includes(parent)) return [];
                result.push(parent);
            }
        } while (parent);

        return result;
    }


    function getParentDocument(document: Document, documentCache: DocumentCache): Document {

        return Resource.hasRelations(document.resource, Relation.Hierarchy.LIESWITHIN)
            ? documentCache.get(document.resource.relations.liesWithin[0])
            : Resource.hasRelations(document.resource, Relation.Hierarchy.RECORDEDIN)
                ? documentCache.get(document.resource.relations.isRecordedIn[0])
                : undefined;
    }
}
