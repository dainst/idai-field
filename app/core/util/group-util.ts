import {FieldDefinition} from 'idai-components-2';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module GroupUtil {

    export function sortGroups(fields: Array<FieldDefinition>, groupName: string) {

        switch(groupName) {
            case 'stem':
                sortGroup(fields, ['identifier', 'shortDescription',
                    'processor', 'description', 'diary', 'date', 'beginningDate', 'endDate']);
                break;
            case 'dimension':
                sortGroup(fields, ['dimensionHeight',
                    'dimensionLength', 'dimensionWidth', 'dimensionPerimeter',
                    'dimensionDiameter', 'dimensionThickness', 'dimensionVerticalExtent', 'dimensionOther']);
                break;
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