import { RelationDefinition, toPair } from 'idai-field-core';
import { flow } from 'tsfun';
import { assocReduce } from '../../../../../core/src/tools/assoc-reduce';


/**
 * @author Daniel de Oliveira
 */
export type InverseRelationsMap = {

    [_: string]:    // relation name for every defined relation, independent if it has an inverse or not
        string      // inverse relation name, if existent
        | undefined // for relations without inverse
}


export function makeInverseRelationsMap(relationDefinitions: Array<RelationDefinition>) {

    return flow(
        relationDefinitions,
        assocReduce(
            toPair<string>('name', 'inverse'),
            {}) as any) as InverseRelationsMap;
}
