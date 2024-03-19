import { is, on } from 'tsfun';
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
import { FieldResource } from '../model';


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
    export function updateIndexIndependentWarnings(document: Document, category?: CategoryForm) {

        if (document.resource.category === 'Configuration') return;

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
                                                       documentCache: DocumentCache, category?: CategoryForm,
                                                       datastore?: Datastore, previousIdentifier?: string,
                                                       updateAll: boolean = false) {

        if (!category) return;

        await updateNonUniqueIdentifierWarning(document, indexFacade, datastore, previousIdentifier, updateAll);
        await updateResourceLimitWarning(document, category, indexFacade, datastore, updateAll);
        await updateRelationTargetWarning(document, indexFacade, documentCache, datastore, updateAll);
    }


    export async function updateNonUniqueIdentifierWarning(document: Document, indexFacade: IndexFacade,
                                                           datastore?: Datastore, previousIdentifier?: string,
                                                           updateAll: boolean = false) {

        if (indexFacade.getCount('identifier:match', document.resource.identifier) > 1) {
            if (!document.warnings) document.warnings = Warnings.createDefault();
            if (!document.warnings.nonUniqueIdentifier) {
                document.warnings.nonUniqueIdentifier = true;
                indexFacade.put(document);
                if (updateAll) {
                    await updateNonUniqueIdentifierWarnings(
                        datastore, indexFacade, document.resource.identifier
                    );
                }
            }
        } else if (document.warnings?.nonUniqueIdentifier) {
            delete document.warnings.nonUniqueIdentifier;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            indexFacade.put(document);   
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
            indexFacade.put(document);
            if (updateAll) await updateResourceLimitWarnings(datastore, indexFacade, category);
        } else if (document.warnings?.resourceLimitExceeded) {
            delete document.warnings.resourceLimitExceeded;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            indexFacade.put(document);
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
            indexFacade.put(document);
        } else if (document.warnings?.missingRelationTargets) {
            delete document.warnings.missingRelationTargets;
            if (!Warnings.hasWarnings(document.warnings)) delete document.warnings;
            indexFacade.put(document);
        }

        if (updateRelationTargets) {
            await updateRelationTargetWarnings(datastore, documentCache, indexFacade, document.resource.id);
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
        } else if (!Field.InputType.isValidFieldData(fieldContent, field.inputType)) {
            warnings.invalidFields.push(fieldName);
        } else if ([Field.InputType.DROPDOWN, Field.InputType.DROPDOWNRANGE, Field.InputType.CHECKBOXES]
                .includes(field.inputType)
                && ValuelistUtil.getValuesNotIncludedInValuelist(fieldContent, field.valuelist)) {
            warnings.outlierValues.push(fieldName);
        }
    }
}
