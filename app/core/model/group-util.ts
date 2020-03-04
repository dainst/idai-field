import {FieldDefinition} from '../configuration/model/field-definition';
import {POSITION_RELATIONS, TIME_RELATIONS, TypeRelations} from './relation-constants';


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

        if (TIME_RELATIONS.ALL.includes(relationName)) {
            return 'time';
        } else if (POSITION_RELATIONS.ALL.includes(relationName)) {
            return 'position';
        } else if (relationName === TypeRelations.IS_INSTANCE_OF) {
            // we do not want to show it in any group,
            // since this is done via an input type,
            // unlike other relations; we use a custom widget instead
            return undefined;
        } else if (relationName === TypeRelations.HAS_INSTANCE) {
            return 'identification'
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