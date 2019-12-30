import {RelationDefinition} from './model/relation-definition';


export function makeInverseRelationsMap(relationDefinitions: Array<RelationDefinition>) {

    return relationDefinitions.reduce((acc, relationDefinition) => {

        acc[relationDefinition.name] = relationDefinition.inverse;
        return acc;

    }, {} as {[_: string /* relation name */ ]: string /* relation inverse name */})
}