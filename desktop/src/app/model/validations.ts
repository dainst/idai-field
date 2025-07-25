import { is, isArray, isString, and, isObject, to, equal, intersect } from 'tsfun';
import { Dating, Dimension, Literature, Document, NewDocument, NewResource, Resource, OptionalRange,
    CategoryForm, Tree, FieldGeometry, ProjectConfiguration, Named, Field, Relation, validateFloat,
    validateUnsignedFloat, validateUnsignedInt, validateUrl, validateInt, Composite,  DateSpecification,
    DateValidationResult, Condition } from 'idai-field-core';
import { ValidationErrors } from './validation-errors';


type InvalidDateInfo = {
    fieldName: string;
    dateValidationResult: DateValidationResult;
}


export module Validations {

    /**
     * @throws [INVALID_NUMERICAL_VALUES]
     */
    export function assertCorrectnessOfNumericalValues(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration,
                                                       allowStrings: boolean = true,
                                                       previousDocumentVersion?: Document) {

         const previousInvalidFields: string[] = previousDocumentVersion
            ?  Validations.validateNumericValues(
                previousDocumentVersion.resource,
                projectConfiguration,
                allowStrings ? validateNumberAsString : validateNumber,
                Field.InputType.NUMBER_INPUT_TYPES
            ) : [];

        const invalidFields: string[] = Validations.validateNumericValues(
            document.resource,
            projectConfiguration,
            allowStrings ? validateNumberAsString : validateNumber,
            Field.InputType.NUMBER_INPUT_TYPES
        );
        
        const newInvalidFields: string[] = getNewInvalidFields(
            invalidFields, previousInvalidFields, document, previousDocumentVersion
        );

        if (newInvalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_NUMERICAL_VALUES,
                document.resource.category,
                newInvalidFields.join(', ')
            ];
        }
    }


    export function assertCorrectnessOfUrls(document: Document|NewDocument, projectConfiguration: ProjectConfiguration,
                                            previousDocumentVersion?: Document) {

        const previousInvalidFields: string[] = previousDocumentVersion
            ?  Validations.validateUrls(
                previousDocumentVersion.resource,
                projectConfiguration,
                validateUrl
            ) : [];

        const invalidFields: string[] = Validations.validateUrls(
            document.resource,
            projectConfiguration,
            validateUrl
        );

        const newInvalidFields: string[] = getNewInvalidFields(
            invalidFields, previousInvalidFields, document, previousDocumentVersion
        );

        if (newInvalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_URLS,
                document.resource.category,
                newInvalidFields.join(', ')
            ];
        }
    }


    export function assertCorrectnessOfDates(document: Document|NewDocument,
                                             projectConfiguration: ProjectConfiguration,
                                             previousDocumentVersion?: Document) {

        const previousInvalidFields: Array<InvalidDateInfo> = previousDocumentVersion
            ?  Validations.validateDates(
                previousDocumentVersion.resource,
                projectConfiguration
            )
            : [];

        const invalidFields: Array<InvalidDateInfo> = Validations.validateDates(
            document.resource,
            projectConfiguration
        );

        const newInvalidFields: Array<InvalidDateInfo> = getNewInvalidDateFields(
            invalidFields, previousInvalidFields, document, previousDocumentVersion
        );

        if (!newInvalidFields.length) return;

        const genericInvalidFields: Array<InvalidDateInfo> = newInvalidFields
            .filter(field => field.dateValidationResult === DateValidationResult.INVALID);

        if (genericInvalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_DATES,
                document.resource.category,
                genericInvalidFields.map(info => info.fieldName).join(', ')
            ];
        } else {
            throw [
                getDateError(newInvalidFields[0].dateValidationResult),
                document.resource.category,
                newInvalidFields[0].fieldName
            ];
        }
    }


    /**
     * @throws [INVALID_DECIMAL_SEPARATORS]
     */
    export function assertUsageOfDotAsDecimalSeparator(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration) {

        const invalidFields: string[] = Validations.validateNumericValues(
            document.resource,
            projectConfiguration,
            validateDecimalSeparator,
            [Field.InputType.FLOAT, Field.InputType.UNSIGNEDFLOAT]
        );

        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_DECIMAL_SEPARATORS,
                document.resource.category,
                invalidFields.join(', ')
            ];
        }
    }


    export function assertCorrectnessOfOptionalRangeValues(document: Document|NewDocument,
                                                           projectConfiguration: ProjectConfiguration) {

        const invalidFields: string[] = Validations.validateDropdownRangeFields(
            document.resource, projectConfiguration
        );

        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_OPTIONALRANGE_VALUES,
                document.resource.category,
                invalidFields.join(', ')
            ];
        }
    }


    export function assertCorrectnessOfDatingValues(document: Document|NewDocument,
                                                    projectConfiguration: ProjectConfiguration,
                                                    previousDocumentVersion?: Document) {

        assertValidityOfObjectArrays(
            document,
            projectConfiguration,
            Field.InputType.DATING,
            ValidationErrors.INVALID_DATING_VALUES,
            (dating: any) => Dating.isDating(dating) && Dating.isValid(dating),
            previousDocumentVersion
        );
    }


    export function assertCorrectnessOfDimensionValues(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration,
                                                       previousDocumentVersion?: Document) {

        assertValidityOfObjectArrays(
            document,
            projectConfiguration,
            Field.InputType.DIMENSION,
            ValidationErrors.INVALID_DIMENSION_VALUES,
            (dimension: any, _: Field, options?: any) =>
                Dimension.isDimension(dimension) && Dimension.isValid(dimension, options),
            previousDocumentVersion
        );
    }


    export function assertCorrectnessOfLiteratureValues(document: Document|NewDocument,
                                                        projectConfiguration: ProjectConfiguration,
                                                        previousDocumentVersion?: Document) {

        assertValidityOfObjectArrays(
            document,
            projectConfiguration,
            Field.InputType.LITERATURE,
            ValidationErrors.INVALID_LITERATURE_VALUES,
            (entry: any) => Literature.isLiterature(entry) && Literature.isValid(entry),
            previousDocumentVersion
        );
    }


    export function assertCorrectnessOfCompositeValues(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration,
                                                       previousDocumentVersion?: Document) {

        assertValidityOfObjectArrays(
            document,
            projectConfiguration,
            Field.InputType.COMPOSITE,
            ValidationErrors.INVALID_COMPOSITE_VALUES,
            (entry: any, field: Field) => Composite.isValid(entry, field.subfields),
            previousDocumentVersion
        );
    }


    function assertValidityOfObjectArrays(document: Document|NewDocument, projectConfiguration: ProjectConfiguration,
                                          inputType: 'dating'|'dimension'|'literature'|'composite', error: string,
                                          isValid: (object: any, field: Field, option?: any) => boolean,
                                          previousDocumentVersion?: Document) {

        const previousInvalidFields: string[] = previousDocumentVersion
            ?  Validations.validateObjectArrayFields(
                previousDocumentVersion.resource, projectConfiguration, inputType, isValid
            )
            : [];


        const invalidFields: string[] = Validations.validateObjectArrayFields(
            document.resource, projectConfiguration, inputType, isValid
        );

        const newInvalidFields: string[] = getNewInvalidFields(
            invalidFields, previousInvalidFields, document, previousDocumentVersion
        );

        if (newInvalidFields.length > 0) {
            throw [
                error,
                document.resource.category,
                newInvalidFields.join(', ')
            ];
        }
    }


    /**
     * @throws [MISSING_PROPERTY]
     */
    export function assertNoFieldsMissing(document: Document|NewDocument, projectConfiguration: ProjectConfiguration,
                                          allowEmptyFields: string[] = []): void {

        const missingProperties = Validations.getMissingProperties(document.resource, projectConfiguration, allowEmptyFields);

        if (missingProperties.length > 0) {
            throw [
                ValidationErrors.MISSING_PROPERTY,
                document.resource.category,
                missingProperties.join(', ')
            ];
        }
    }


    export function assertMaxCharactersRespected(document: Document|NewDocument,
                                                 projectConfiguration: ProjectConfiguration): void {

        const result = Validations.validateMaxCharacters(document.resource, projectConfiguration);

        if (result) {
            throw [
                ValidationErrors.MAX_CHARACTERS_EXCEEDED,
                document.resource.category,
                result.fieldName,
                result.maxCharacters
            ];
        }
    }


    export function assertMapLayerRelations(document: Document|NewDocument) {

        const invalidRelationTargets: string[] = Validations.validateMapLayerRelations(document.resource);

        if (invalidRelationTargets.length > 0) {
            throw [
                ValidationErrors.INVALID_MAP_LAYER_RELATION_VALUES,
                document.resource.category
            ];
        }
    }


    export function assertWorkflowRelations(document: Document|NewDocument) {

        const carriedOutOnTargetIds: string[] = document.resource.relations[Relation.Workflow.IS_CARRIED_OUT_ON] ?? [];
        const resultsInTargetIds: string[] = document.resource.relations[Relation.Workflow.RESULTS_IN] ?? [];

        if (intersect(carriedOutOnTargetIds)(resultsInTargetIds).length) {
            throw [ValidationErrors.INVALID_WORKFLOW_RELATION_TARGETS];
        }
    }


    export function validateStructureOfGeometries(geometry: FieldGeometry): Array<string>|null {

        if (!geometry) return null;

        if (!geometry.type) return [ValidationErrors.MISSING_GEOMETRY_TYPE];
        if (!geometry.coordinates) return [ValidationErrors.MISSING_COORDINATES];

        switch(geometry.type) {
            case 'Point':
                if (!Validations.validatePointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'Point'];
                }
                break;
            case 'MultiPoint':
                if (!Validations.validateMultiPointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiPoint'];
                }
                break;
            case 'LineString':
                if (!Validations.validatePolylineCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'LineString'];
                }
                break;
            case 'MultiLineString':
                if (!Validations.validateMultiPolylineCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiLineString'];
                }
                break;
            case 'Polygon':
                if (!Validations.validatePolygonCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'Polygon'];
                }
                break;
            case 'MultiPolygon':
                if (!Validations.validateMultiPolygonCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiPolygon'];
                }
                break;
            default:
                return [ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE, geometry.type];
        }

        return null;
    }


    export function getMissingProperties(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration,
                                         allowEmptyFields: string[]) {

        const missingFields: string[] = [];
        const fieldDefinitions: Array<Field>
            = CategoryForm.getFields(projectConfiguration.getCategory(resource.category));

        for (let fieldDefinition of fieldDefinitions) {
            if (allowEmptyFields.includes(fieldDefinition.name)) continue;
            if (CategoryForm.isMandatoryField(projectConfiguration.getCategory(resource.category), fieldDefinition.name)
                    && !Field.isFilled(fieldDefinition, resource as Resource)) {
                missingFields.push(fieldDefinition.name);
            }
        }

        return missingFields;
    }


    export function validateMaxCharacters(resource: Resource|NewResource,
                                          projectConfiguration: ProjectConfiguration)
                                          : { fieldName: string, maxCharacters: number }|undefined {

        const fieldDefinitions: Array<Field>
            = CategoryForm.getFields(projectConfiguration.getCategory(resource.category));

        for (let fieldDefinition of fieldDefinitions) {
            const fieldValue = resource[fieldDefinition.name];
            if (fieldValue && fieldDefinition.maxCharacters) {
                if ((isString(fieldValue) && fieldValue.length > fieldDefinition.maxCharacters)
                    || (isObject(fieldValue) && Object.values(fieldValue).find(value => {
                        return !isString(value) || value.length > fieldDefinition.maxCharacters;
                    }))) {
                    return { fieldName: fieldDefinition.name, maxCharacters: fieldDefinition.maxCharacters };
                }
            }
        }

        return undefined;
    }


    /**
     *
     * @param resource
     * @param projectConfiguration
     * @returns {boolean} true if the category of the resource is valid, otherwise false
     */
    export function validateCategory(resource: Resource|NewResource,
                                     projectConfiguration: ProjectConfiguration): boolean {

        if (!resource.category) return false;
        return Tree.flatten(projectConfiguration
            .getCategories())
            .some(Named.onName(is(resource.category)));
    }


    /**
     * @returns the names of invalid fields if one or more of the fields are not defined in projectConfiguration
     */
    export function validateDefinedFields(resource: Resource|NewResource,
                                          projectConfiguration: ProjectConfiguration): string[] {

        const projectFields: Array<Field> =
            CategoryForm.getFields(projectConfiguration.getCategory(resource.category));
        const defaultFields: Array<Field> = [
            { name: 'identifier' } as Field,
            { name: 'relations' } as Field,
            { name: 'id' } as Field,
            { name: 'scanCode' } as Field
        ];
        if (projectConfiguration.getImageCategories().map(to(Named.NAME)).includes(resource.category)) {
            defaultFields.push({ name: 'originalFilename' } as Field);
            defaultFields.push({ name: 'georeference' } as Field);
            defaultFields.push({ name: 'featureVectors' } as Field);
        }

        const definedFields: Array<Field> = projectFields.concat(defaultFields);
        const invalidFields: string[] = [];

        for (let resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                let fieldFound: boolean = false;
                for (let definedField of definedFields) {
                    if (definedField.name === resourceField
                            && !Field.InputType.EDITABLE_RELATION_INPUT_TYPES.includes(definedField.inputType)) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) invalidFields.push(resourceField);
            }
        }

        return invalidFields;
    }


    export function validateConditionalFields(resource: Resource|NewResource,
                                              projectConfiguration: ProjectConfiguration): string[] {

        const invalidFields: string[] = [];
        const category: CategoryForm = projectConfiguration.getCategory(resource.category);
        if (!category) return [];
        
        for (let fieldName in resource) {
            if (resource.hasOwnProperty(fieldName)) {
                const field: Field = CategoryForm.getField(category, fieldName);
                if (!field?.condition) continue;
                if (!Condition.isFulfilled(field.condition, resource, CategoryForm.getFields(category), 'field')) {
                    invalidFields.push(fieldName);
                }
            }
        }

        return invalidFields;
    }


    /**
     * @returns the names of invalid relation fields if one or more of the fields are invalid
     */
    export function validateDefinedRelations(resource: Resource|NewResource,
                                             projectConfiguration: ProjectConfiguration): string[] {

        const fields: Array<Relation> = projectConfiguration.getRelationsForDomainCategory(resource.category);
        const invalidFields: Array<any> = [];

        for (let relationField in resource.relations) {
            if (resource.relations.hasOwnProperty(relationField)) {
                let fieldFound: boolean = false;
                for (let i in fields) {
                    if (fields[i].name === relationField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) {
                    invalidFields.push(relationField);
                }
            }
        }

        return (invalidFields.length > 0) ? invalidFields : [];
    }


    export function validateNumericValues(resource: Resource|NewResource,
                                          projectConfiguration: ProjectConfiguration,
                                          validationFunction: (value: string, inputType: string) => boolean,
                                          numericInputTypes: string[]): string[] {

        const projectFields: Array<Field> =
            CategoryForm.getFields(projectConfiguration.getCategory(resource.category));
        const invalidFields: string[] = [];

        projectFields.filter(fieldDefinition => {
            return fieldDefinition.inputType && numericInputTypes.includes(fieldDefinition.inputType)
        }).forEach(fieldDefinition => {
            let value = resource[fieldDefinition.name];

            if (value && numericInputTypes.includes(fieldDefinition.inputType as string)
                    && !validationFunction(value, fieldDefinition.inputType as string)) {
                invalidFields.push(fieldDefinition.name);
            }
        });

        return invalidFields;
    }


    export function validateUrls(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration,
                                 validationFunction: (value: string) => boolean): string[] {

        const projectFields: Array<Field> =
            CategoryForm.getFields(projectConfiguration.getCategory(resource.category));
        const invalidFields: string[] = [];

        projectFields.filter(fieldDefinition => {
            return fieldDefinition.inputType === Field.InputType.URL;
        }).forEach(fieldDefinition => {
            const value = resource[fieldDefinition.name];
            if (value && !validationFunction(value)) invalidFields.push(fieldDefinition.name);
        });

        return invalidFields;
    }


    export function validateDates(resource: Resource|NewResource,
                                  projectConfiguration: ProjectConfiguration): Array<InvalidDateInfo> {

        const category: CategoryForm = projectConfiguration.getCategory(resource.category);
        const projectFields: Array<Field> = CategoryForm.getFields(category);
        const invalidFields: Array<InvalidDateInfo> = [];

        projectFields.filter(fieldDefinition => {
            return fieldDefinition.inputType === Field.InputType.DATE;
        }).forEach(fieldDefinition => {
            const value = resource[fieldDefinition.name];
            if (!value) return;

            const dateValidationResult: DateValidationResult = DateSpecification.validate(value, fieldDefinition);
            if (dateValidationResult !== DateValidationResult.VALID) {
                invalidFields.push({
                    fieldName: fieldDefinition.name,
                    dateValidationResult
                });
            }
        });

        return invalidFields;
    }


    export function validateMapLayerRelations(resource: Resource|NewResource): string[] {

        const hasMapLayerTargets: string[] = resource.relations[Relation.Image.HASMAPLAYER] ?? [];
        const hasDefaultMapLayerTargets: string[] = resource.relations[Relation.Image.HASDEFAULTMAPLAYER] ?? [];

        return hasDefaultMapLayerTargets.filter(resourceId => !hasMapLayerTargets.includes(resourceId));
    }


    export function validateNumberAsString(value: string|number, inputType: string): boolean {

        if (typeof value === 'number') value = value.toString();

        switch(inputType) {
            case Field.InputType.INT:
                return validateInt(value);
            case Field.InputType.UNSIGNEDINT:
                return validateUnsignedInt(value);
            case Field.InputType.FLOAT:
                return validateFloat(value);
            case Field.InputType.UNSIGNEDFLOAT:
                return validateUnsignedFloat(value);
            default:
                return false;
        }
    }


    function validateNumber(value: string|number, inputType: string): boolean {

        if (typeof value !== 'number') return false;

        return validateNumberAsString(value, inputType);
    }


    function validateDecimalSeparator(value: string|number): boolean {

        return typeof value === 'number' || !value.includes(',');
    }


    export function validatePointCoordinates(coordinates: number[]): boolean {

        if (coordinates.length < 2 || coordinates.length > 3) return false;
        if (isNaN(coordinates[0])) return false;
        if (isNaN(coordinates[1])) return false;
        if (coordinates.length === 3 && isNaN(coordinates[2])) return false;

        return true;
    }


    export function validateMultiPointCoordinates(coordinates: number[][]): boolean {

        return coordinates.length !== 0
            && coordinates.every(validatePointCoordinates);
    }


    export function validatePolylineCoordinates(coordinates: number[][]): boolean {

        return coordinates.length >= 2
            && coordinates.every(validatePointCoordinates);
    }


    export function validateMultiPolylineCoordinates(coordinates: number[][][]): boolean {

        return coordinates.length !== 0
            && coordinates.every(validatePolylineCoordinates);
    }


    export function validatePolygonCoordinates(coordinates: number[][][]): boolean {

        if (coordinates.length === 0) return false;

        for (let i in coordinates) {
            if (coordinates[i].length < 3) return false;

            for (let j in coordinates[i]) {
                if (!validatePointCoordinates(coordinates[i][j])) return false;
            }
        }

        return true;
    }


    export function validateMultiPolygonCoordinates(coordinates: number[][][][]): boolean {

        return coordinates.length !== 0
            && coordinates.every(validatePolygonCoordinates);
    }


    export function validateDropdownRangeFields(resource: Resource|NewResource,
                                                projectConfiguration: ProjectConfiguration): string[] {

        const isOptionalRange = OptionalRange.buildIsOptionalRange(isString);

        return validateFields(resource, projectConfiguration, 'dropdownRange',
            and(isOptionalRange, OptionalRange.isValid));
    }


    export function validateObjectArrayFields(resource: Resource|NewResource,
                                              projectConfiguration: ProjectConfiguration,
                                              inputType: 'dating'|'dimension'|'literature'|'composite',
                                              isValid: (object: any, field: Field, option?: any) => boolean): string[] {

        return validateFields(resource, projectConfiguration, inputType, (fieldContent: any, field: Field, options) =>
            isArray(fieldContent)
            && fieldContent.filter(item => !isValid(item, field, options)).length === 0
        );
    }


    export function validateFields(resource: Resource|NewResource, projectConfiguration: ProjectConfiguration,
                                   inputType: string,
                                   isValid: (object: any, field: Field, options?: any) => boolean): string[] {

        return CategoryForm.getFields(projectConfiguration.getCategory(resource.category))
            .filter(field => field.inputType === inputType)
            .filter(field => resource[field.name] !== undefined)
            .filter(field => !isValid(resource[field.name], field, field.inputTypeOptions?.validation))
            .map(field => field.name);
    }


    function getNewInvalidFields(invalidFields: string[], previousInvalidFields: string[],
                                 document: Document|NewDocument, previousDocumentVersion?: Document): string[] {

        return invalidFields.filter(field => {
            return !previousInvalidFields.includes(field)
                || document.resource[field] !== previousDocumentVersion?.resource[field];
        });
    }


    function getNewInvalidDateFields(invalidFields: Array<InvalidDateInfo>,
                                     previousInvalidFields: Array<InvalidDateInfo>, document: Document|NewDocument,
                                     previousDocumentVersion?: Document): Array<InvalidDateInfo> {

        return invalidFields.filter(info => {
            return !previousInvalidFields.find(previousInfo => info.fieldName === previousInfo.fieldName)
                || !equal(document.resource[info.fieldName])(previousDocumentVersion?.resource[info.fieldName]);
        });
    }


    function getDateError(dateValidationResult: DateValidationResult): string {

        switch (dateValidationResult) {
            case DateValidationResult.RANGE_NOT_ALLOWED:
                return ValidationErrors.INVALID_DATE_RANGE_NOT_ALLOWED;
            case DateValidationResult.SINGLE_NOT_ALLOWED:
                return ValidationErrors.INVALID_DATE_SINGLE_NOT_ALLOWED;
            case DateValidationResult.TIME_NOT_ALLOWED:
                return ValidationErrors.INVALID_DATE_TIME_NOT_ALLOWED;
            case DateValidationResult.TIME_NOT_SET:
                return ValidationErrors.INVALID_DATE_TIME_NOT_SET;
            case DateValidationResult.END_DATE_BEFORE_BEGINNING_DATE:
                return ValidationErrors.INVALID_DATE_END_DATE_BEFORE_BEGINNING_DATE
        }
    }
}
