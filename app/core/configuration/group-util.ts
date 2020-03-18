import {FieldDefinition} from './model/field-definition';
import {PositionRelations, TimeRelations, TypeRelations} from '../model/relation-constants';


export module Group {

    export const STEM = 'stem';
    export const DIMENSION = 'dimension';
    export const TIME = 'time';
    export const POSITION = 'position';
    export const IDENTIFICATION = 'identification';
    export const PROPERTIES = 'properties';
    export const PARENT = 'parent';
    export const CHILD = 'child';
}


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module GroupUtil {

    export function sortGroups(fields: Array<FieldDefinition>, groupName: string) {

        switch(groupName) {
            case 'stem':
                sortGroup(fields, [
                    'identifier', 'shortDescription', 'supervisor', 'draughtsmen', 'processor', 'campaign',
                    'diary', 'date', 'beginningDate', 'endDate'
                ]);
                break;
            case 'dimension':
                sortGroup(fields, [
                    'dimensionHeight', 'dimensionLength', 'dimensionWidth', 'dimensionPerimeter',
                    'dimensionDiameter', 'dimensionThickness', 'dimensionVerticalExtent', 'dimensionOther'
                ]);
                break;
        }
    }


    export function getGroupName(relationName: string): string|undefined {

        if (TimeRelations.ALL.includes(relationName)) {
            return 'time';
        } else if (PositionRelations.ALL.includes(relationName)) {
            return 'position';
        } else if (TypeRelations.ALL.includes(relationName)) {
            return 'identification';
        } else {
            return undefined;
        }
    }


    /**
     * Fields not defined via 'order' are not considered
     */
    function sortGroup(fields: Array<FieldDefinition>, order: string[]) {

        fields.sort((field1: FieldDefinition, field2: FieldDefinition) => {
           return order.indexOf(field1.name) > order.indexOf(field2.name) ? 1 : -1;
        });
    }
}