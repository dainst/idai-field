import { isArray, isObject, isString } from 'tsfun';
import { I18N } from '../../tools/i18n';
import { validateFloat, validateInt, validateUnsignedFloat, validateUnsignedInt, validateUrl } from '../../tools/validation-util';
import { parseDate } from '../../tools/parse-date';
import { Dating } from '../dating';
import { Dimension } from '../dimension';
import { Literature } from '../literature';
import { OptionalRange } from '../optional-range';
import { Valuelist } from './valuelist';
import { Composite } from '../composite';


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
    mandatory?: true;
    fixedInputType?: true;
    allowOnlyValuesOfParent?: true;
    maxCharacters?: number;
    source?: Field.SourceType;
    subfields?: Array<Subfield>;
    constraintName?: string;            // For input type derivedRelation
}


export interface Subfield extends BaseField {

    condition?: SubfieldCondition;
}


export interface BaseField extends I18N.LabeledValue, I18N.Described {

    inputType: Field.InputType;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
    valuelist?: Valuelist;
}


export interface SubfieldCondition {

    subfieldName: string;
    values: string[]|boolean;
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

    export function isValidFieldData(fieldData: any, field: BaseField): boolean {

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
                return isArray(fieldData) && fieldData.every(element => isString(element));
            case InputType.MULTIINPUT:
                return isArray(fieldData) && fieldData.every(element => isString(element) || isObject(element));
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
                return !isNaN(parseDate(fieldData)?.getTime());
            case InputType.DROPDOWNRANGE:
                return OptionalRange.buildIsOptionalRange(isString)(fieldData);
            case InputType.DATING:
                return isArray(fieldData) && fieldData.every(element => {
                    return Dating.isDating(element) && Dating.isValid(element);
                });
            case InputType.DIMENSION:
                return isArray(fieldData) && fieldData.every(element => {
                    return Dimension.isDimension(element) && Dimension.isValid(element);
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
            case InputType.RELATION:
            case InputType.INSTANCE_OF:
                return isObject(fieldData) && Object.values(fieldData).every(relationTargets => {
                    return isArray(relationTargets) && relationTargets.every(element => isString(element));
                });
            default:
                return true;
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
        |'dropdown'
        |'dropdownRange'
        |'radio'
        |'boolean'
        |'checkboxes'
        |'dating'
        |'date'
        |'dimension'
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
        export const URL = 'url';
        export const DROPDOWN = 'dropdown';
        export const DROPDOWNRANGE = 'dropdownRange';
        export const RADIO = 'radio';
        export const BOOLEAN = 'boolean';
        export const CHECKBOXES = 'checkboxes';
        export const DATING = 'dating';
        export const DATE = 'date';
        export const DIMENSION = 'dimension';
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

        export const VALUELIST_INPUT_TYPES: Array<InputType> = [DROPDOWN, DROPDOWNRANGE, CHECKBOXES, RADIO, DIMENSION];
        export const NUMBER_INPUT_TYPES: Array<InputType> = [UNSIGNEDINT, UNSIGNEDFLOAT, INT, FLOAT];
        export const I18N_COMPATIBLE_INPUT_TYPES: Array<InputType> = [INPUT, SIMPLE_INPUT, TEXT, MULTIINPUT,
            SIMPLE_MULTIINPUT];
        export const I18N_INPUT_TYPES: Array<InputType> = [INPUT, TEXT, MULTIINPUT];
        export const SIMPLE_INPUT_TYPES: Array<InputType> = [SIMPLE_INPUT, SIMPLE_MULTIINPUT];
        export const SUBFIELD_INPUT_TYPES: Array<InputType> = [INPUT, SIMPLE_INPUT, TEXT, BOOLEAN, DROPDOWN, RADIO,
            CHECKBOXES, FLOAT, UNSIGNEDFLOAT, INT, UNSIGNEDINT, DATE, URL];
        export const RELATION_INPUT_TYPES: Array<InputType> = [RELATION, INSTANCE_OF, DERIVED_RELATION];

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
