import { flow } from 'tsfun';
import { Relation } from '../model/configuration/relation';
import { assocReduce, toPair } from '../tools';


/**
 * @author Daniel de Oliveira
 */
export type InverseRelationsMap = {

    [_: string]:    // relation name for every defined relation, independent if it has an inverse or not
        string      // inverse relation name, if existent
        | undefined // for relations without inverse
}
