import { I18N } from '../../tools/i18n';
import { Valuelist } from './valuelist';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface Field extends I18N.LabeledValue {

    name: string;
    inputType: Field.InputType;
    inputTypeOptions?: { validation?: { permissive?: true } };
    label?: I18N.String;
    description?: I18N.String;
    defaultLabel?: I18N.String;
    defaultDescription?: I18N.String;
    valuelist?: Valuelist;
    valuelistFromProjectField?: string;
    editable?: boolean;                 // defaults to true
    visible?: boolean;                  // defaults to true
    fulltextIndexed?: boolean;
    constraintIndexed?: boolean;
    defaultConstraintIndexed?: boolean;
    mandatory?: true;
    fixedInputType?: true;
    allowOnlyValuesOfParent?: true;
    source?: Field.SourceType;
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

    export type InputType = 'input'
        |'unsignedInt'
        |'unsignedFloat'
        |'float'
        |'text'
        |'multiInput'
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
        |'instanceOf'
        |'default'
        |'category';

    export module InputType {

        export const INPUT = 'input';
        export const UNSIGNEDINT = 'unsignedInt';
        export const UNSIGNEDFLOAT = 'unsignedFloat';
        export const FLOAT = 'float';
        export const TEXT = 'text';
        export const MULTIINPUT = 'multiInput';
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
        export const CATEGORY = 'category';
        export const NONE = 'none';
        export const DEFAULT = 'default';

        export const VALUELIST_INPUT_TYPES = [DROPDOWN, DROPDOWNRANGE, CHECKBOXES, RADIO, DIMENSION];

        const INTERCHANGEABLE_INPUT_TYPES: Array<Array<InputType>> = [
            [INPUT, TEXT, DROPDOWN, RADIO],
            [MULTIINPUT, CHECKBOXES]
        ];

        
        export function getInterchangeableInputTypes(inputType: InputType): Array<InputType> {

            const alternativeTypes: Array<InputType>|undefined = INTERCHANGEABLE_INPUT_TYPES.find(types => {
                return types.includes(inputType);
            });

            return alternativeTypes ?? [];
        }
    }
}
