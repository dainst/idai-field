import {FieldDefinition} from 'idai-components-2';


const STEM = 0;
const DIMENSIONS = 3;


/**
 * @author Thomas Kleinke
 */
export module GroupUtil {

    export function sortGroups(groups: Array<any>) {

        sortGroup(groups[STEM].fields, ['identifier', 'shortDescription',
            'processor', 'description', 'diary', 'date', 'beginningDate', 'endDate']);
        sortGroup(groups[DIMENSIONS].fields, ['dimensionHeight',
            'dimensionLength', 'dimensionWidth', 'dimensionPerimeter',
            'dimensionDiameter', 'dimensionThickness', 'dimensionVerticalExtent', 'dimensionOther']);
    }


    /**
     * Fields not defined via 'order' are not considered
     */
    function sortGroup(fds: Array<FieldDefinition>, order: string[]) {

        const temp = fds;
        const l = temp.length;
        for (let fieldName of order) {

            const got = temp.find((fd: FieldDefinition) => fd.name === fieldName);
            if (got) temp.push(got);

        }
        fds.splice(0, l);
    }
}