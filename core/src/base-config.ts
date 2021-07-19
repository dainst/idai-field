export const basicIndexConfiguration = {
    'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' },
    'id:match': { path: 'resource.id', pathArray: ['resource', 'id'], type: 'match' },
    // TODO remove and just use isChildOf
    'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', pathArray: ['resource', 'relations', 'isRecordedIn'], type: 'contain' },
    'liesWithin:contain': { path: 'resource.relations.liesWithin', pathArray: ['resource', 'relations', 'liesWithin'], type: 'contain', recursivelySearchable: true },
    'liesWithin:exist': { path: 'resource.relations.liesWithin', pathArray: ['resource', 'relations', 'liesWithin'], type: 'exist' },
    // -
    'isChildOf:contain': { path: 'resource.relations.isChildOf', pathArray: ['resource', 'relations', 'isChildOf'], type: 'contain', recursivelySearchable: true }
};