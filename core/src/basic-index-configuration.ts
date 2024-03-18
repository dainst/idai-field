import { Map } from 'tsfun';
import { IndexDefinition } from './index/constraint-index';
import { Query } from './model/query';
import { Resource } from './model/resource';


export const childrenOf = (id: Resource.Id): Query => ({
    constraints: {
        'isChildOf:contain': {
            value: id,
            searchRecursively: true
        }
    }
});


export const CHILDOF_CONTAIN = 'isChildOf:contain';
export const CHILDOF_EXIST = 'isChildOf:exist';
export const UNKNOWN = 'UNKNOWN';


export const basicIndexConfiguration: Map<IndexDefinition> = {
    'identifier:match': { path: 'resource.identifier', pathArray: ['resource', 'identifier'], type: 'match' },
    'id:match': { path: 'resource.id', pathArray: ['resource', 'id'], type: 'match' },
    'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', pathArray: ['resource', 'relations', 'isRecordedIn'], type: 'contain' },
    'isChildOf:contain': { path: 'resource.relations.isChildOf', pathArray: ['resource', 'relations', 'isChildOf'], type: 'contain', recursivelySearchable: true },
    'isChildOf:exist': { path: 'resource.relations.isChildOf', pathArray: ['resource', 'relations', 'isChildOf'], type: 'exist' },
    'isPresentIn:contain': { path: 'resource.relations.isPresentIn', pathArray: ['resource', 'relations', 'isPresentIn'], type: 'contain' },
    'missingRelationTargetIds:contain': { path: 'warnings.missingRelationTargets.targetIds', pathArray: ['warnings', 'missingRelationTargets', 'targetIds'], type: 'contain' }
};
