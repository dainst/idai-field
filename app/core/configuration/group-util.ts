import {PositionRelations, TimeRelations, TypeRelations} from '../model/relation-constants';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export module GroupUtil {

    export function getGroupName(relationName: string): string|undefined { // TODO make private, after putting to buildRawProjectConfiguration

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
}