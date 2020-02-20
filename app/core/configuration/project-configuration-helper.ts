import {flow, map} from 'tsfun';
import {RelationDefinition} from './model/relation-definition';
import {replaceIn, toTuple} from '../util/utils';

// @author Daniel de Oliveira


export type InverseRelationsMap = {

    [_: string]:    // relation name for every defined relation, independent if it has an inverse or not
        string      // inverse relation name, if existent
        | undefined // for relations without inverse
}


export function makeInverseRelationsMap(relationDefinitions: Array<RelationDefinition>) {

    return flow(
        relationDefinitions,
        map(toTuple('name', 'inverse')),
        replaceIn({})) as InverseRelationsMap;
}