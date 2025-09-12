import { isArray, isObject, isString } from 'tsfun';
import { I18N } from '../../tools/i18n';
import { validateFloat, validateInt, validateUnsignedFloat, validateUnsignedInt,
    validateUrl } from '../../tools/validation-util';
import { Dating } from '../input-types/dating';
import { Measurement } from '../input-types/measurement';
import { Literature } from '../input-types/literature';
import { OptionalRange } from '../input-types/optional-range';
import { Valuelist } from './valuelist';
import { Composite } from '../input-types/composite';
import { DateConfiguration } from './date-configuration';
import { DateSpecification, DateValidationResult } from '../input-types/date-specification';
import { Condition } from './condition';
import { Resource } from '../document/resource';
import { Reference } from './reference';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface Field extends BaseField {

    inputTypeOptions?: { validation?: { permissive?: true } };
    valuelistFromProjectField?: string;
    editable?: boolean;                 // defaults to true
    visible?: boolean;                  // defaults to true
    selectable?: boolean;               // defaults to true
    fulltextIndexed?: boolean;
    constraintIndexed?: boolean;
    defaultConstraintIndexed?: boolean;
    mandatory?: boolean;
    required?: boolean;
    onlySubcategory?: boolean;
    fixedInputType?: true;
    maxCharacters?: number;
    source?: Field.SourceType;
    references?: Array<Reference>;
    dateConfiguration?: DateConfiguration;  // For input type "date"
    subfields?: Array<Subfield>;            // For input type "composite"
    constraintName?: string;                // For input type "derivedRelation"
}


export interface Subfield extends BaseField {}


export interface BaseField extends I18N.LabeledValue, I18N.Described {

    inputType: Field.InputType;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
    valuelist?: Valuelist;
    condition?: Condition;
}


export module Field {

    export type SourceType = 'builtIn'|'library'|'custom'|'common';

    export const INPUTTYPE = 'inputType';
    export const SOURCE = 'source';
    export const VISIBLE = 'visible';
    export const MANDATORY = 'mandatory';
    export const EDITABLE = 'editable';
    export const NAME = 'name';
    export const LABEL = 'label';
    export const DESCRIPTION = 'description';
    export const FULLTEXTINDEXED = 'fulltextIndexed';
    export const CONSTRAINTINDEXED = 'constraintIndexed';
    export const GROUP = 'group';


    export module Source {

        export const BUILTIN = 'builtIn';
        export const LIBRARY = 'library';
        export const CUSTOM = 'custom';
        export const COMMON = 'common';
    }

    export function isValidFieldData(fieldData: any, field: BaseField, permissive: boolean = false): boolean {

        if (fieldData === null || fieldData === undefined) return false;

        switch (field.inputType) {
            case InputType.SIMPLE_INPUT:
            case InputType.DROPDOWN:
            case InputType.RADIO:
            case InputType.CATEGORY:
            case InputType.IDENTIFIER:
                return isString(fieldData);
            case InputType.INPUT:
            case InputType.TEXT:
                // TODO Improve validation for i18n strings
                return isString(fieldData) || isObject(fieldData);
            case InputType.SIMPLE_MULTIINPUT:
            case InputType.CHECKBOXES:
            case InputType.RELATION:
            case InputType.INSTANCE_OF:
                return isArray(fieldData) && fieldData.every(element => isString(element));
            case InputType.MULTIINPUT:
                return isArray(fieldData) && fieldData.every(element => isString(element) || isObject(element));
            case InputType.VALUELIST_MULTIINPUT:
                return isArray(fieldData) && fieldData.every(element => isObject(element) && element.value);            
            case InputType.UNSIGNEDINT:
                return validateUnsignedInt(fieldData);
            case InputType.UNSIGNEDFLOAT:
                return validateUnsignedFloat(fieldData);
            case InputType.INT:
                return validateInt(fieldData);
            case InputType.FLOAT:
                return validateFloat(fieldData);
            case InputType.URL:
                return validateUrl(fieldData);
            case InputType.BOOLEAN:
                return fieldData === true || fieldData === false;
            case InputType.DATE:
                return DateSpecification.validate(fieldData, field, permissive) === DateValidationResult.VALID;
            case InputType.DROPDOWNRANGE:
                return OptionalRange.buildIsOptionalRange(isString)(fieldData);
            case InputType.DATING:
                return isArray(fieldData) && fieldData.every(element => {
                    return Dating.isDating(element) && Dating.isValid(element);
                });
            case InputType.DIMENSION:
            case InputType.WEIGHT:
            case InputType.VOLUME:
                return isArray(fieldData) && fieldData.every(element => {
                    return Measurement.isMeasurement(element) && Measurement.isValid(element, field.inputType);
                });
            case InputType.LITERATURE:
                return isArray(fieldData) && fieldData.every(element => {
                    return Literature.isLiterature(element) && Literature.isValid(element);
                });
            case InputType.COMPOSITE:
                return isArray(fieldData) && fieldData.every(element => {
                    return Composite.isValid(element, (field as Field).subfields);
                });
            case InputType.GEOMETRY:
                return fieldData.type !== undefined && fieldData.coordinates !== undefined;
            default:
                return true;
        }
    }


    export function isFilled(field: Field, resource: Resource): boolean {

        if (Field.InputType.EDITABLE_RELATION_INPUT_TYPES.includes(field.inputType)) {
            return resource.relations[field.name]?.length > 0;
        } else {
            return resource[field.name] !== undefined && resource[field.name] !== '';
        }
    }


    export type InputType = 'input'
        |'simpleInput'
        |'unsignedInt'
        |'unsignedFloat'
        |'int'
        |'float'
        |'text'
        |'url'
        |'multiInput'
        |'simpleMultiInput'
        |'valuelistMultiInput'
        |'dropdown'
        |'dropdownRange'
        |'radio'
        |'boolean'
        |'checkboxes'
        |'dating'
        |'date'
        |'dimension'
        |'weight'
        |'volume'
        |'literature'
        |'geometry'
        |'relation'
        |'derivedRelation'
        |'instanceOf'
        |'default'
        |'category'
        |'identifier'
        |'composite'
        |'none';


    export module InputType {

        export const INPUT = 'input';
        export const SIMPLE_INPUT = 'simpleInput';
        export const UNSIGNEDINT = 'unsignedInt';
        export const UNSIGNEDFLOAT = 'unsignedFloat';
        export const INT = 'int';
        export const FLOAT = 'float';
        export const TEXT = 'text';
        export const MULTIINPUT = 'multiInput';
        export const SIMPLE_MULTIINPUT = 'simpleMultiInput';
        export const VALUELIST_MULTIINPUT = 'valuelistMultiInput';
        export const URL = 'url';
        export const DROPDOWN = 'dropdown';
        export const DROPDOWNRANGE = 'dropdownRange';
        export const RADIO = 'radio';
        export const BOOLEAN = 'boolean';
        export const CHECKBOXES = 'checkboxes';
        export const DATING = 'dating';
        export const DATE = 'date';
        export const DIMENSION = 'dimension';
        export const WEIGHT = 'weight';
        export const VOLUME = 'volume';
        export const LITERATURE = 'literature';
        export const GEOMETRY = 'geometry';
        export const INSTANCE_OF = 'instanceOf';
        export const RELATION = 'relation';
        export const DERIVED_RELATION = 'derivedRelation';
        export const CATEGORY = 'category';
        export const IDENTIFIER = 'identifier';
        export const COMPOSITE = 'composite';
        export const NONE = 'none';
        export const DEFAULT = 'default';

        export const VALUELIST_INPUT_TYPES: Array<InputType> = [DROPDOWN, DROPDOWNRANGE, CHECKBOXES, RADIO, DIMENSION,
            WEIGHT];
        export const NUMBER_INPUT_TYPES: Array<InputType> = [UNSIGNEDINT, UNSIGNEDFLOAT, INT, FLOAT];
        export const I18N_COMPATIBLE_INPUT_TYPES: Array<InputType> = [INPUT, SIMPLE_INPUT, TEXT, MULTIINPUT,
            SIMPLE_MULTIINPUT];
        export const I18N_INPUT_TYPES: Array<InputType> = [INPUT, TEXT, MULTIINPUT];
        export const SIMPLE_INPUT_TYPES: Array<InputType> = [SIMPLE_INPUT, SIMPLE_MULTIINPUT];
        export const MEASUREMENT_INPUT_TYPES: Array<InputType> = [DIMENSION, WEIGHT, VOLUME];
        export const SUBFIELD_INPUT_TYPES: Array<InputType> = [INPUT, SIMPLE_INPUT, TEXT, BOOLEAN, DROPDOWN, RADIO,
            CHECKBOXES, FLOAT, UNSIGNEDFLOAT, INT, UNSIGNEDINT, DATE, URL];
        export const RELATION_INPUT_TYPES: Array<InputType> = [RELATION, INSTANCE_OF, DERIVED_RELATION];
        export const EDITABLE_RELATION_INPUT_TYPES: Array<InputType> = [RELATION, INSTANCE_OF];

        const INTERCHANGEABLE_INPUT_TYPES: Array<Array<InputType>> = [
            [INPUT, SIMPLE_INPUT, TEXT, DROPDOWN, RADIO],
            [MULTIINPUT, SIMPLE_MULTIINPUT, CHECKBOXES]
        ];

        
        export function getInterchangeableInputTypes(inputType: InputType): Array<InputType> {

            const alternativeTypes: Array<InputType>|undefined = INTERCHANGEABLE_INPUT_TYPES.find(types => {
                return types.includes(inputType);
            });

            return alternativeTypes ?? [];
        }
    }
}
