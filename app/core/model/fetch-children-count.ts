import {Document, Query, FindResult} from 'idai-components-2';
import {Name} from '../constants';


// @author Daniel de Oliveira
// @author Thomas Kleinke

export async function fetchChildrenCount(document: Document,
                                         isSubtype: (type: Name, of: Name) => boolean,
                                         find: (q: Query) => Promise<FindResult>): Promise<number> {

    return !document.resource.id
        ? 0
        : isSubtype(document.resource.type, 'Operation')
            ? await findAllIsRecordedInDocs(document.resource.id, find)
            : await findAllLiesWithinDocs(document.resource.id, find);
}


async function findAllIsRecordedInDocs(resourceId: string, find: (q: Query) => Promise<FindResult>): Promise<number> {

    return (await find({
        constraints: {
            'isRecordedIn:contain': resourceId
        }
    })).totalCount;
}


async function findAllLiesWithinDocs(resourceId: string, find: (q: Query) => Promise<FindResult>): Promise<number> { // TODO remove duplication with persistence manager and possibly type-relation-picker-component

    return (await find({
        constraints: {
            'liesWithin:contain': {
                value: resourceId,
                type: 'add',
                searchRecursively: true
            }
        }
    })).totalCount;
}