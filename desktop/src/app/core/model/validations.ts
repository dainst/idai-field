import {is, isArray, on, Predicate, isString, isNot, and} from 'tsfun';
import {Dating, Dimension, Literature, Document, NewDocument, NewResource,
    Resource, OptionalRange} from 'idai-components-2';
import {FieldGeometry} from '@idai-field/core';
import {validateFloat, validateUnsignedFloat, validateUnsignedInt} from '../util/number-util';
import {ValidationErrors} from './validation-errors';
import {ProjectConfiguration} from '../configuration/project-configuration';
import {FieldDefinition} from '../configuration/model/field-definition';
import {RelationDefinition} from '../configuration/model/relation-definition';
import {Named} from '../util/named';


export module Validations {

    /**
     * @throws [INVALID_NUMERICAL_VALUES]
     */
    export function assertCorrectnessOfNumericalValues(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration,
                                                       allowStrings: boolean = true) {

        const invalidFields: string[] = Validations.validateNumericValues(
            document.resource,
            projectConfiguration,
            allowStrings ? validateNumberAsString : validateNumber,
            ['unsignedInt', 'float', 'unsignedFloat']
        );
        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_NUMERICAL_VALUES,
                document.resource.category,
                invalidFields.join(', ')
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
            ['float', 'unsignedFloat']
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
            document.resource, projectConfiguration);

        if (invalidFields.length > 0) {
            throw [
                ValidationErrors.INVALID_OPTIONALRANGE_VALUES,
                document.resource.category,
                invalidFields.join(', ')
            ];
        }
    }


    // This is to replicate behaviour of Dating.isValid before the change
    // regarding typeguards and valiation
    function isValidDating(dating: any) {

        const TYPE = 'type';
        const BEGIN = 'begin';
        const END = 'end';
        const MARGIN = 'margin';
        const SOURCE = 'source';
        const IS_IMPRECISE = 'isImprecise';
        const IS_UNCERTAIN = 'isUncertain';
        const LABEL = 'label';

        const YEAR = 'year';
        const INPUT_YEAR = 'inputYear';
        const INPUT_TYPE = 'inputType';

        const VALID_FIELDS = [TYPE, BEGIN, END, MARGIN, SOURCE, IS_IMPRECISE, IS_UNCERTAIN, LABEL];
        const VALID_ELEMENT_FIELDS = [YEAR, INPUT_YEAR, INPUT_TYPE];

        for (const fieldName in dating) {
            if (!VALID_FIELDS.includes(fieldName)) return false;
        }

        if (dating.begin) for (const fieldName in dating.begin) {
            if (!VALID_ELEMENT_FIELDS.includes(fieldName)) return false;
        }

        if (dating.end) for (const fieldName in dating.end) {
            if (!VALID_ELEMENT_FIELDS.includes(fieldName)) return false;
        }
        if (dating.label) return true;
        return false;
    }


    export function assertCorrectnessOfDatingValues(document: Document|NewDocument,
                                                    projectConfiguration: ProjectConfiguration) {

        assertValidityOfObjectArrays(
            document,
            projectConfiguration,
            FieldDefinition.InputType.DATING,
            ValidationErrors.INVALID_DATING_VALUES,
            (dating: any) => {

                if (isValidDating(dating)) return false; // TODO migrate old datings and get rid of this
                return !(Dating.isDating(dating) && Dating.isValid(dating))
            });
    }


    // This is to replicate behaviour of Dimension.isValid before the change
    // regarding typeguards and valiation
    function isValidDimension(dimension: any) {
        const VALUE = 'value';
        const LABEL = 'label';
        const ISRANGE = 'isRange';
        const RANGEMIN = 'rangeMin';
        const RANGEMAX = 'rangeMax';
        const INPUTVALUE = 'inputValue';
        const INPUTRANGEENDVALUE = 'inputRangeEndValue';
        const INPUTUNIT = 'inputUnit';
        const MEASUREMENTPOSITION = 'measurementPosition';
        const MEASUREMENTCOMMENT = 'measurementComment';
        const ISIMPRECISE = 'isImprecise';

        const VALID_FIELDS = [VALUE, LABEL, ISRANGE, RANGEMIN, RANGEMAX,
            INPUTVALUE, INPUTRANGEENDVALUE, INPUTUNIT, MEASUREMENTPOSITION, MEASUREMENTCOMMENT, ISIMPRECISE];

        for (const fieldName in dimension) {
            if (!VALID_FIELDS.includes(fieldName)) return false;
        }
        if (dimension.label) return true;
        return false;
    }


    export function assertCorrectnessOfDimensionValues(document: Document|NewDocument,
                                                       projectConfiguration: ProjectConfiguration) {

        assertValidityOfObjectArrays(
            document,
            projectConfiguration,
            FieldDefinition.InputType.DIMENSION,
            ValidationErrors.INVALID_DIMENSION_VALUES,
            (dimension: any, options?: any) => {
                if (isValidDimension(dimension)) return false; // TODO migrate old dimension and get rid of this
                return !(Dimension.isDimension(dimension) && Dimension.isValid(dimension, options)); // TODO review; remove options
            });
    }


    export function assertCorrectnessOfLiteratureValues(document: Document|NewDocument,
                                                        projectConfiguration: ProjectConfiguration) {

        assertValidityOfObjectArrays(
            document,
            projectConfiguration,
            FieldDefinition.InputType.LITERATURE,
            ValidationErrors.INVALID_LITERATURE_VALUES,
            isNot(and(Literature.isLiterature, Literature.isValid)));
    }


    function assertValidityOfObjectArrays(document: Document|NewDocument,
                                          projectConfiguration: ProjectConfiguration,
                                          inputType: 'dating'|'dimension'|'literature',
                                          error: string,
                                          isInvalid: Predicate) {

        const invalidFields: string[] = Validations.validateObjectArrayFields(
            document.resource, projectConfiguration, inputType, isInvalid
        );

        if (invalidFields.length > 0) {
            throw [
                error,
                document.resource.category,
                invalidFields.join(', ')
            ];
        }
    }


    export function assertCorrectnessOfBeginningAndEndDates(document: Document|NewDocument) {

        if (!document.resource.beginningDate || !document.resource.endDate) return;

        const beginningDate: Date = parseDate(document.resource.beginningDate);
        const endDate: Date = parseDate(document.resource.endDate);

        if (beginningDate > endDate) {
            throw [
                ValidationErrors.END_DATE_BEFORE_BEGINNING_DATE,
                document.resource.category
            ];
        }
    }


    function parseDate(dateString: string): Date {

        const dateComponents: string[] = dateString.split('.');

        return new Date(
            parseInt(dateComponents[2]),
            parseInt(dateComponents[1]) - 1,
            parseInt(dateComponents[0])
        );
    }


    /**
     * @throws [MISSING_PROPERTY]
     */
    export function assertNoFieldsMissing(document: Document|NewDocument,
                                          projectConfiguration: ProjectConfiguration): void {

        const missingProperties = Validations.getMissingProperties(document.resource, projectConfiguration);

        if (missingProperties.length > 0) {
            throw [
                ValidationErrors.MISSING_PROPERTY,
                document.resource.category,
                missingProperties.join(', ')
            ];
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
                if (!Validations.validatePolylineOrMultiPointCoordinates(geometry.coordinates)) {
                    return [ValidationErrors.INVALID_COORDINATES, 'MultiPoint'];
                }
                break;
            case 'LineString':
                if (!Validations.validatePolylineOrMultiPointCoordinates(geometry.coordinates)) {
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


    export function getMissingProperties(resource: Resource|NewResource,
                                         projectConfiguration: ProjectConfiguration) {

        const missingFields: string[] = [];
        const fieldDefinitions: Array<FieldDefinition>
            = projectConfiguration.getFieldDefinitions(resource.category);

        for (let fieldDefinition of fieldDefinitions) {
            if (projectConfiguration.isMandatory(resource.category, fieldDefinition.name)) {
                if (resource[fieldDefinition.name] === undefined || resource[fieldDefinition.name] === '') {
                    missingFields.push(fieldDefinition.name);
                }
            }
        }

        return missingFields;
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
        return projectConfiguration
            .getCategoriesArray()
            .some(on(Named.NAME, is(resource.category)));
    }


    /**
     * @returns the names of invalid fields if one or more of the fields are not defined in projectConfiguration
     */
    export function validateDefinedFields(resource: Resource|NewResource,
                                          projectConfiguration: ProjectConfiguration): string[] {

        const projectFields: Array<FieldDefinition> = projectConfiguration
            .getFieldDefinitions(resource.category);
        const defaultFields: Array<FieldDefinition> = [{ name: 'relations' } as FieldDefinition];

        const definedFields: Array<any> = projectFields.concat(defaultFields);

        const invalidFields: Array<any> = [];

        for (let resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                let fieldFound: boolean = false;
                for (let definedField of definedFields) {
                    if (definedField.name === resourceField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) invalidFields.push(resourceField);
            }
        }

        return invalidFields;
    }


    /**
     * @returns the names of invalid relation fields if one or more of the fields are invalid
     */
    export function validateDefinedRelations(resource: Resource|NewResource,
                                             projectConfiguration: ProjectConfiguration): string[] {

        const fields: Array<RelationDefinition> = projectConfiguration
            .getRelationDefinitionsForDomainCategory(resource.category);
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

        const projectFields: Array<FieldDefinition> = projectConfiguration
            .getFieldDefinitions(resource.category);
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


    function validateNumberAsString(value: string|number, inputType: string): boolean {

        if (typeof value === 'number') value = value.toString();

        switch(inputType) {
            case 'unsignedInt':
                return validateUnsignedInt(value);
            case 'float':
                return validateFloat(value);
            case 'unsignedFloat':
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


    export function validatePolylineOrMultiPointCoordinates(coordinates: number[][]): boolean {

        return coordinates.length >= 2
            && coordinates.every(validatePointCoordinates);
    }


    export function validateMultiPolylineCoordinates(coordinates: number[][][]): boolean {

        return coordinates.length !== 0
            && coordinates.every(validatePolylineOrMultiPointCoordinates);
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
            isNot(and(isOptionalRange, OptionalRange.isValid)));
    }


    export function validateObjectArrayFields(resource: Resource|NewResource,
                                              projectConfiguration: ProjectConfiguration,
                                              inputType: 'dating'|'dimension'|'literature',
                                              isInvalid: (object: any, option?: any) => boolean): string[] {

        return validateFields(resource, projectConfiguration, inputType, (fieldContent: any, options) => {
            if (!isArray(fieldContent)) return true;
            return fieldContent.filter(object => isInvalid(object, options)).length > 0;
        });
    }


    export function validateFields(resource: Resource|NewResource,
                                   projectConfiguration: ProjectConfiguration,
                                   inputType: string,
                                   isInvalid: (object: any, options?: any) => boolean): string[] {

        return projectConfiguration.getFieldDefinitions(resource.category)
            .filter(field => field.inputType === inputType)
            .filter(field => resource[field.name] !== undefined)
            .filter(field => isInvalid(resource[field.name], field.inputTypeOptions?.validation))
            .map(field => field.name);
    }
}
