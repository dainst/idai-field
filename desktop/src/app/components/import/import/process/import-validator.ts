import { Injectable } from '@angular/core';
import { isnt } from 'tsfun';
import { Document, Datastore, Relation, NewDocument, Query, Resource, Named, ProjectConfiguration,
     CategoryForm } from 'idai-field-core';
import { Validations } from '../../../../model/validations';
import { Validator } from '../../../../model/validator';
import { ImportErrors as E } from '../import-errors';
import RECORDED_IN = Relation.Hierarchy.RECORDEDIN;
import LIES_WITHIN = Relation.Hierarchy.LIESWITHIN;


@Injectable()
/**
 * Validates against data model of ProjectConfiguration and projectCategories and contents of Database
 *
 * Errors thrown are of type
 *   ImportError.* if specified in ImportValidator itself and of type
 *   ValidationError.* if coming from the Validator
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ImportValidator extends Validator {

    constructor(projectConfiguration: ProjectConfiguration,
                private datastore: Datastore) {

        super(projectConfiguration, (q: Query) => datastore.find(q));
    }


    public assertIsAllowedRelationDomainCategory(domainCategoryName: string, rangeCategoryName: string,
                                                 relationName: string, identifier: string) {

        if (!this.projectConfiguration.isAllowedRelationDomainCategory(
                domainCategoryName, rangeCategoryName,relationName)) {

            throw [
                E.TARGET_CATEGORY_RANGE_MISMATCH,
                identifier,
                relationName,
                rangeCategoryName
            ];
        }
    }


    public assertLiesWithinCorrectness(resources: Array<Resource>) {

        for (const resource of resources) {

            const category = this.projectConfiguration.getCategory(resource.category);
            if (!category) {
                console.error('Category not found', resource.category);
                continue;
            }
            if (!category.mustLieWithin) continue;

            const recordedIn = resource.relations[RECORDED_IN];
            const liesWithin = resource.relations[LIES_WITHIN];

            if (recordedIn && recordedIn.length > 0 && (!liesWithin || liesWithin.length === 0)) {

                throw [E.MUST_LIE_WITHIN_OTHER_NON_OPERATON_RESOURCE, resource.category, resource.identifier];
            }
        }
    }


    /**
     * @throws [INVALID_CATEGORY]
     */
    public assertIsKnownCategory(document: Document|NewDocument) {

        if (!Validations.validateCategory(document.resource, this.projectConfiguration)) {
            throw [E.INVALID_CATEGORY, document.resource.category];
        }
    }


    public assertIsAllowedCategory(document: Document|NewDocument) {

        if (document.resource.category === 'Operation'
            || document.resource.category === 'Project') {

            throw [E.CATEGORY_NOT_ALLOWED, document.resource.category];
        }

        if (document.resource.category === 'Image' || this.projectConfiguration.isSubcategory(
                document.resource.category, 'Image')) {

            throw [E.CATEGORY_ONLY_ALLOWED_ON_UPDATE, document.resource.category];
        }
    }


    public async assertIsNotOverviewCategory(document: Document|NewDocument) {

        if (this.projectConfiguration.getOverviewCategories().map(Named.toName)
                .includes(document.resource.category)) {

            throw [E.OPERATIONS_NOT_ALLOWED];
        }
    }


    public assertRelationsWellformedness(documents: Array<Document|NewDocument>) {

        for (const document of documents) {

            const invalidRelationFields = Validations
                .validateDefinedRelations(document.resource, this.projectConfiguration)
                // operations have empty RECORDED_IN which however is not defined
                // image categories must not be imported. regular categories all have RECORDED_IN
                .filter(isnt(RECORDED_IN));

            if (invalidRelationFields.length > 0) {
                throw [
                    E.INVALID_RELATIONS,
                    document.resource.category,
                    invalidRelationFields.join(', ')
                ];
            }
        }
    }


    /**
     * @throws [E.INVALID_FIELDS]
     */
    public assertFieldsDefined(document: Document|NewDocument): void {

        const undefinedFields = Validations.validateDefinedFields(document.resource, this.projectConfiguration);
        if (undefinedFields.length > 0) {
            throw [
                E.INVALID_FIELDS,
                document.resource.category,
                undefinedFields.join(', ')
            ];
        }
    }


    /**
     * Wellformedness test specifically written for use in import package.
     *
     * Assumes
     *   * that the category of the document is a valid category from the active ProjectConfiguration
     *
     * Asserts
     *   * the fields and relations defined in a given document are actually configured
     *     fields and relations for the category of resource defined.
     *   * that the geometries are structurally valid
     *   * there are no mandatory fields missing
     *   * the numerical values are correct
     *
     * Does not do anything database consistency related,
     *   e.g. checking identifier uniqueness or relation target existence.
     *
     * @throws [E.INVALID_RELATIONS]
     * @throws [ValidationErrors.MISSING_PROPERTY]
     * @throws [ValidationErrors.MISSING_GEOMETRYTYPE]
     * @throws [ValidationErrors.MISSING_COORDINATES]
     * @throws [ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE]
     * @throws [ValidationErrors.INVALID_COORDINATES]
     * @throws [ValidationErrors.INVALID_NUMERICAL_VALUE]
     * @throws [ValidationErrors.INVALID_DATING_VALUES]
     * @throws [ValidationErrors.INVALID_DIMENSION_VALUES]
     * @throws [ValidationErrors.INVALID_LITERATURE_VALUES]
     * @throws [ValidationErrors.INVALID_OPTIONALRANGE_VALUES]
     * @throws [ValidationErrors.INVALID_MAP_LAYER_RELATION_VALUES]
     */
    public assertIsWellformed(document: Document|NewDocument): void {

        Validations.assertNoFieldsMissing(document, this.projectConfiguration);
        Validations.assertCorrectnessOfNumericalValues(document, this.projectConfiguration, false);
        Validations.assertCorrectnessOfUrls(document, this.projectConfiguration);
        Validations.assertCorrectnessOfDatingValues(document, this.projectConfiguration);
        Validations.assertCorrectnessOfDimensionValues(document, this.projectConfiguration);
        Validations.assertCorrectnessOfLiteratureValues(document, this.projectConfiguration);
        Validations.assertCorrectnessOfOptionalRangeValues(document, this.projectConfiguration);
        Validations.assertCorrectnessOfDates(document, this.projectConfiguration);
        Validations.assertCorrectnessOfBeginningAndEndDates(document);
        Validations.assertMapLayerRelations(document);

        const errWithParams = Validations.validateStructureOfGeometries(document.resource.geometry as any);
        if (errWithParams) throw errWithParams;
    }


    public assertHasLiesWithin(document: Document|NewDocument) {

        if (this.isExpectedToHaveIsRecordedInRelation(document)
            && !Document.hasRelations(document as Document, LIES_WITHIN)) { // isRecordedIn gets constructed from liesWithin

            throw [E.NO_PARENT_ASSIGNED];
        }
    }


     /**
     * @throws [INVALID_IDENTIFIER_PREFIX]
     */
       public assertIdentifierPrefixIsValid(document: Document|NewDocument): void {

        if (!document.resource.identifier) return;

        const category: CategoryForm = this.projectConfiguration.getCategory(document.resource.category);

        if (category.identifierPrefix && !document.resource.identifier.startsWith(category.identifierPrefix)) {
            throw [
                E.INVALID_IDENTIFIER_PREFIX,
                document.resource.identifier,
                document.resource.category,
                category.identifierPrefix
            ];
        }
    }


    public async isRecordedInTargetAllowedRelationDomainCategory(document: NewDocument,
                                                                 operationId: Resource.Id) {

        const operation = await this.datastore.get(operationId);
        if (!this.projectConfiguration.isAllowedRelationDomainCategory(document.resource.category,
            operation.resource.category, RECORDED_IN)) {

            throw [E.INVALID_OPERATION, document.resource.category, operation.resource.category];
        }
    }
}
