import { equal, is, isArray, isObject, on, to, Map } from 'tsfun';
import { Document } from '../model/document/document';
import { Named } from '../tools/named';
import { CategoryForm } from '../model/configuration/category-form';
import { Field } from '../model/configuration/field';
import { Resource } from '../model/document/resource';
import { ImageResource } from '../model/document/image-resource';
import { RelationTargetWarnings, OutlierWarnings, Warnings } from '../model/warnings';
import { IndexFacade } from '../index/index-facade';
import { Constraints, Query, SortMode } from '../model/datastore/query';
import { DocumentCache } from '../datastore/document-cache';
import { Tree } from '../tools/forest';
import { FieldResource } from '../model/document/field-resource';
import { Relation } from '../model/configuration/relation';
import { ProcessResource } from '../model/document/process-resource';
import { ProjectConfiguration } from '../services/project-configuration';
import { Condition } from '../model/configuration/condition';
import { getOutlierValues } from './get-outlier-values';
import { Datastore } from '../datastore';
import { WarningsManager } from './warnings-manager';


const FIELDS_TO_SKIP = [
    Resource.ID, Resource.CATEGORY, Resource.RELATIONS, FieldResource.SCANCODE, ImageResource.GEOREFERENCE,
    ImageResource.ORIGINAL_FILENAME
].concat(Relation.Hierarchy.ALL)
.concat(Relation.Image.ALL);


/**
 * @author Thomas Kleinke
 */
export class WarningsUpdater {

    constructor(private warningsManager: WarningsManager,
                private indexFacade: IndexFacade,
                private documentCache: DocumentCache,
                private projectConfiguration: ProjectConfiguration) {}


    /**
     * Updates all warnings for whose determination the index is not required. These warnings do no rely on
     * analyzing the document in the context of other documents.
     */
    public updateIndexIndependentWarnings(document: Document) {

        if (document.resource.category === 'Configuration' || document.project) return;

        const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);

        const warnings: Warnings = WarningsUpdater.createWarnings(document, category);
        this.warningsManager.set(document, warnings);
    }


    /**
     * Updates all warnings for whose determination the documents must have been previously indexed.
     */
    public async updateIndexDependentWarnings(document: Document, find?: Datastore.Find, previousIdentifier?: string,
                                              previousScanCode?: string, updateAll: boolean = false) {

        const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);
        if (!category || document.project) return;

        await this.updateNonUniqueFieldWarning(document, 'identifier', 'nonUniqueIdentifier', find, previousIdentifier,
            updateAll);
        await this.updateNonUniqueFieldWarning(document, 'scanCode', 'nonUniqueQrCode', find, previousScanCode,
            updateAll);
        await this.updateResourceLimitWarning(document, category, find, updateAll);
        await this.updateMissingRelationTargetWarning(document, find, updateAll);
        await this.updateInvalidRelationTargetWarning(document, find, updateAll);
        await this.updateMissingOrInvalidParentWarning(document, find, updateAll);
        await this.updateOutlierWarning(document, category, find, updateAll);
    }


    public async updateNonUniqueFieldWarning(document: Document, fieldName: string, warningName: string, 
                                             find?: Datastore.Find, previousFieldValue?: string,
                                             updateAll: boolean = false) {

        const fieldValue: string = document.resource[fieldName];
        const warnings: Warnings = this.warningsManager.get(document) ?? Warnings.createDefault();

        if (fieldValue && this.indexFacade.getCount(fieldName + ':match', fieldValue) > 1) {
            if (!warnings[warningName]) {
                warnings[warningName] = true;
                this.setWarnings(document, warnings, [warningName + ':exist']);
                if (updateAll) await this.updateNonUniqueFieldWarnings(fieldName, warningName, fieldValue, find);
            }
        } else {
            if (warnings[warningName]) {
                delete warnings[warningName];
                this.setWarnings(document, warnings, [warningName + ':exist']);
            }
        }

        if (updateAll && previousFieldValue && previousFieldValue !== fieldValue
                && this.indexFacade.getCount(fieldName + ':match', previousFieldValue) > 0) {
            await this.updateNonUniqueFieldWarnings(fieldName, warningName, previousFieldValue, find);
        }
    }


    public async updateResourceLimitWarning(document: Document, category: CategoryForm, find?: Datastore.Find,
                                            updateAll: boolean = false) {
    
        if (!category) return;

        const resourceLimit: number = category.parentCategory?.resourceLimit ?? category.resourceLimit;
        const parentCategoryName: string = category.parentCategory?.name ?? category.name;

        const query: Query = {
            categories: this.projectConfiguration.getCategoryWithSubcategories(parentCategoryName).map(to(Named.NAME)),
            sort: { mode: SortMode.None }
        };

        const warnings: Warnings = this.warningsManager.get(document) ?? Warnings.createDefault();

        if (resourceLimit !== undefined && this.indexFacade.find(query).length  > resourceLimit) {
            warnings.resourceLimitExceeded = true;
            this.setWarnings(document, warnings, ['resourceLimitExceeded:exist']);
            if (updateAll) await this.updateResourceLimitWarnings(category, find);
        } else {
            if (warnings?.resourceLimitExceeded) {
                delete warnings.resourceLimitExceeded;
                this.setWarnings(document, warnings, ['resourceLimitExceeded:exist']);
            }
        }
    }


    public async updateMissingRelationTargetWarning(document: Document, find?: Datastore.Find,
                                                    updateRelationTargets: boolean = false) {
    
        const relationTargetWarnings: RelationTargetWarnings = { relationNames: [], targetIds: [] };

        for (let relationName of Resource.getRelationNames(document.resource)) {
            for (let targetId of document.resource.relations[relationName]) {
                if (!this.documentCache.get(targetId)) {
                    if (!relationTargetWarnings.relationNames.includes(relationName)) {
                        relationTargetWarnings.relationNames.push(relationName);
                    }
                    if (!relationTargetWarnings.targetIds.includes(targetId)) {
                        relationTargetWarnings.targetIds.push(targetId);
                    }
                }
            }
        }

        const warnings: Warnings = this.warningsManager.get(document) ?? Warnings.createDefault();

        if (relationTargetWarnings.relationNames.length > 0) {
            warnings.missingRelationTargets = relationTargetWarnings;
            this.setWarnings(
                    document, warnings, ['missingRelationTargetIds:contain', 'missingRelationTargets:exist']
                );
        } else {
            if (warnings.missingRelationTargets) {
                delete warnings.missingRelationTargets;
                this.setWarnings(
                    document, warnings, ['missingRelationTargetIds:contain', 'missingRelationTargets:exist']
                );
            }
        }

        if (updateRelationTargets) await this.updateMissingRelationTargetWarnings(document.resource.id, find);
    }


    public async updateInvalidRelationTargetWarning(document: Document, find?: Datastore.Find,
                                                    updateRelationTargets: boolean = false) {
    
        const relationTargetWarnings: RelationTargetWarnings = { relationNames: [], targetIds: [] };

        for (let relationName of Resource.getRelationNames(document.resource)) {
            if (this.warningsManager.get(document)?.unconfiguredFields.includes(relationName)) continue;

            for (let targetId of document.resource.relations[relationName]) {
                const targetDocument: Document = this.documentCache.get(targetId);
                if (!targetDocument) continue;
                if (!this.projectConfiguration.isAllowedRelationDomainCategory(
                    document.resource.category, targetDocument.resource.category, relationName
                )) {
                    if (!relationTargetWarnings.relationNames.includes(relationName)) {
                        relationTargetWarnings.relationNames.push(relationName);
                    }
                    if (!relationTargetWarnings.targetIds.includes(targetId)) {
                        relationTargetWarnings.targetIds.push(targetId);
                    }
                }

            }
        }

        const warnings: Warnings = this.warningsManager.get(document) ?? Warnings.createDefault();

        if (relationTargetWarnings.relationNames.length > 0) {
            warnings.invalidRelationTargets = relationTargetWarnings;
            this.setWarnings(
                document, warnings, ['invalidRelationTargets:exist', 'invalidRelationTargetIds:contain']
            );
        } else {
            if (warnings.invalidRelationTargets) {
                delete warnings.invalidRelationTargets;
                this.setWarnings(
                    document, warnings, ['invalidRelationTargets:exist', 'invalidRelationTargetIds:contain']
                );
            }
        }

        if (updateRelationTargets) await this.updateInvalidRelationTargetWarnings(document.resource.id, find);
    }


    public async updateMissingOrInvalidParentWarning(document: Document, find?: Datastore.Find,
                                                     updateAll: boolean = false) {

        let hasValidParent: boolean = true;
        
        const ancestors: Array<Document> = this.getAncestorDocuments(document);

        for (let i = 0; i <= ancestors.length; i++) {
            const baseDocument: Document = i ? ancestors[i - 1] : document;
            const parentDocument: Document = i < ancestors.length ? ancestors[i] : undefined;
            const recordedInTargetIds: string[] = baseDocument.resource.relations[Relation.Hierarchy.RECORDEDIN];
            const recordedInTargetId: string = recordedInTargetIds?.length ? recordedInTargetIds[0] : undefined;
            const recordedInTarget: Document = recordedInTargetId
                ? this.documentCache.get(recordedInTargetId)
                : undefined;
            if (!Document.isValidParent(baseDocument, parentDocument, recordedInTarget, this.projectConfiguration)) {
                hasValidParent = false;
                break;
            }
        }

        const warnings: Warnings = this.warningsManager.get(document) ?? Warnings.createDefault();

        if (!hasValidParent) {
            warnings.missingOrInvalidParent = true;
            this.setWarnings(document, warnings, ['missingOrInvalidParent:exist']);
        } else {
            if (warnings.missingOrInvalidParent) {
                delete warnings.missingOrInvalidParent;
                this.setWarnings(document, warnings, ['missingOrInvalidParent:exist']);
            }
        }

        if (updateAll) await this.updateMissingOrInvalidParentWarningsForDescendants(document, find);
    }


    public async updateOutlierWarning(document: Document, category: CategoryForm, find?: Datastore.Find,
                                      updateAll: boolean = false) {

        const fields: Array<Field> = CategoryForm.getFields(category).filter(field => {
            return Field.InputType.VALUELIST_INPUT_TYPES.concat([Field.InputType.COMPOSITE])
                .includes(field.inputType);
        });
        const outlierWarnings: OutlierWarnings = { fields: {}, values: [] };

        for (let field of fields) {
            const outlierValues: Map<string[]>|string[] = getOutlierValues(
                document.resource, field, this.documentCache.get('project')
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

        const warnings: Warnings = this.warningsManager.get(document) ?? Warnings.createDefault();

        if (!equal(outlierWarnings as any, warnings.outliers ?? { fieldNames: [], values: [] } as any)) {
            if (outlierWarnings.values.length) {
                warnings.outliers = outlierWarnings;
                this.setWarnings(document, warnings, ['outliers:exist', 'outlierValues:contain']);
            } else if (warnings.outliers) {
                delete warnings.outliers;
                this.setWarnings(document, warnings, ['outliers:exist', 'outlierValues:contain']);
            }
        }

        if (updateAll && document.resource.category === 'Project') {
            await this.updateProjectFieldOutlierWarnings(find);
        }
    }


    public async updateNonUniqueFieldWarnings(fieldName: string, warningName: string, fieldValue: string,
                                               find: Datastore.Find) {

        const constraints: Constraints = {};
        constraints[fieldName + ':match'] = fieldValue;

        const documents: Array<Document> = (await find({
            constraints,
            sort: { mode: SortMode.None }
        }, { includeResourcesWithoutValidParent: true })).documents;

        for (let document of documents) {
            await this.updateNonUniqueFieldWarning(document, fieldName, warningName, find);
        }
    }


    public async updateResourceLimitWarnings(category: CategoryForm, find: Datastore.Find) {

        if (!category) return;

        const parentCategoryName: string = category.parentCategory?.name ?? category.name;

        const documents: Array<Document> = (await find({
            categories: this.projectConfiguration.getCategoryWithSubcategories(parentCategoryName).map(to(Named.NAME)),
            sort: { mode: SortMode.None }
        })).documents;

        for (let document of documents) {
            await this.updateResourceLimitWarning(
                document,
                this.projectConfiguration.getCategory(document.resource.category),
                find
            );
        }
    }


    public async updateMissingRelationTargetWarnings(id: string, find: Datastore.Find) {

        const documents: Array<Document> = (await find({
            constraints: { 'missingRelationTargetIds:contain': id },
            sort: { mode: SortMode.None }
        }, { includeResourcesWithoutValidParent: true })).documents;

        for (let document of documents) {
            await this.updateMissingRelationTargetWarning(document, find);
        }
    }


    public async updateInvalidRelationTargetWarnings(id: string, find: Datastore.Find) {

        const documents: Array<Document> = (await find({
            constraints: { 'invalidRelationTargetIds:contain': id },
            sort: { mode: SortMode.None }
        }, { includeResourcesWithoutValidParent: true })).documents;

        for (let document of documents) {
            await this.updateInvalidRelationTargetWarning(document, find);
        }
    }


    public async updateProjectFieldOutlierWarnings(find: Datastore.Find) {

        const categoryNames: string[] = Tree.flatten(this.projectConfiguration.getCategories()).filter(category => {
            return CategoryForm.getFields(category).find(field => field.valuelistFromProjectField);
        }).map(to(Named.NAME));

        const documents: Array<Document> = (await find(
            { categories: categoryNames, sort: { mode: SortMode.None } },
            { includeResourcesWithoutValidParent: true }
        )).documents;

        for (let document of documents) {
            const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);
            if (!category) continue;

            await this.updateOutlierWarning(document, category, find);
        }
    }


    public async updateMissingOrInvalidParentWarningsForDescendants(document: Document, find: Datastore.Find) {

        const documents: Array<Document> = (await find({
            constraints: {
                'isChildOf:contain': { value: document.resource.id, searchRecursively: true },
                'missingOrInvalidParent:exist': 'KNOWN'
            },
            sort: { mode: SortMode.None }
        }, { includeResourcesWithoutValidParent: true })).documents;

        for (let document of documents) {
            await this.updateMissingOrInvalidParentWarning(document, find);
        }
    }


    private updateIndex(document: Document, indexNames: string[]) {

        indexNames.forEach(indexName => this.indexFacade.putToSingleIndex(document, indexName));
        this.indexFacade.putToSingleIndex(document, 'warnings:exist');
    }


    private getAncestorDocuments(document: Document): Array<Document> {

        const result: Array<Document> = [];
        let parent: Document;

        do {
            parent = this.getParentDocument(parent ?? document);
            if (parent) {
                if (result.includes(parent)) return [];
                result.push(parent);
            }
        } while (parent);

        return result;
    }


    private getParentDocument(document: Document): Document {

        return Resource.hasRelations(document.resource, Relation.Hierarchy.LIESWITHIN)
            ? this.documentCache.get(document.resource.relations.liesWithin[0])
            : Resource.hasRelations(document.resource, Relation.Hierarchy.RECORDEDIN)
                ? this.documentCache.get(document.resource.relations.isRecordedIn[0])
                : undefined;
    }


    private static createWarnings(document: Document, category?: CategoryForm): Warnings {

        const warnings: Warnings = Warnings.createDefault();

        if (!category) {
            warnings.unconfiguredCategory = true;
            return warnings;
        }

        const fieldDefinitions: Array<Field> = CategoryForm.getFields(category);
        this.updateMandatoryFieldWarnings(warnings, document, fieldDefinitions);

        if (document._conflicts) warnings.conflicts = true;
        if (this.isIdentifierPrefixMissing(document, category)) warnings.missingIdentifierPrefix = true;
        if (category.parentCategory?.name === 'Process'
                && !ProcessResource.validateState(document.resource as ProcessResource)) {
            warnings.invalidProcessState = true;
        }

        return Object.keys(document.resource)
            .concat(Object.keys(document.resource.relations))
            .filter(fieldName => !FIELDS_TO_SKIP.includes(fieldName))
            .reduce((result, fieldName) => {
                const field: Field = fieldDefinitions.find(on(Named.NAME, is(fieldName)));
                const fieldContent: any = field && Field.InputType.EDITABLE_RELATION_INPUT_TYPES.includes(field?.inputType)
                    ? document.resource.relations[fieldName]
                    : document.resource[fieldName];
                this.updateWarningsForField(warnings, fieldName, field, fieldContent, document.resource, category);
                return result;
            }, warnings);
    }


    private setWarnings(document: Document, warnings: Warnings, affectedIndexNames: string[]) {

        this.warningsManager.set(document, warnings);
        this.updateIndex(document, affectedIndexNames);
    }


    private static isIdentifierPrefixMissing(document: Document, category: CategoryForm): boolean {

        if (!document.resource.identifier) return false;

        return category.identifierPrefix && !document.resource.identifier.startsWith(category.identifierPrefix);
    }


    private static updateMandatoryFieldWarnings(warnings: Warnings, document: Document,
                                                fieldDefinitions: Array<Field>) {

        fieldDefinitions.filter(field => field.mandatory).forEach(field => {
            if (!Field.isFilled(field, document.resource)) {
                warnings.missingMandatoryFields.push(field.name);
            }
        });
    }


    private static updateWarningsForField(warnings: Warnings, fieldName: string, field: Field, fieldContent: any,
                                          resource: Resource, category: CategoryForm) {

        if (fieldName === Resource.IDENTIFIER && category.name === 'Project') return;

        if (!field) {
            warnings.unconfiguredFields.push(fieldName);
        } else if (!Field.isValidFieldData(fieldContent, field)) {
            warnings.invalidFields.push(fieldName);
        } else {
            if (!Condition.isFulfilled(field.condition, resource, CategoryForm.getFields(category), 'field')) {
                warnings.unfulfilledConditionFields.push(fieldName);
            }
            if (Field.hasUnallowedCharacters(fieldContent, field)) {
                warnings.unallowedCharacterFields.push(fieldName);
            }

            if (field.inputType === Field.InputType.GEOMETRY && field.geometryTypes
                    && !field.geometryTypes.includes(fieldContent.type)) {
                warnings.unallowedGeometryType = true;
            }
        }
    }
}
