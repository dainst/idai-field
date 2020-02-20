import {RelationDefinition} from './model/relation-definition';

// @author Daniel de Oliveira


export type InverseRelationsMap = {

    [_: string]:    // relation name for every defined relation, independent if it has an inverse or not
        string      // inverse relation name, if existent
        | undefined // for relations without inverse
}


export function makeInverseRelationsMap(relationDefinitions: Array<RelationDefinition>) {

    return relationDefinitions
        .reduce((acc, relationDefinition) => {

        acc[relationDefinition.name] = relationDefinition.inverse;
        return acc;

    }, {} as InverseRelationsMap)
}