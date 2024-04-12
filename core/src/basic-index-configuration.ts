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
    'isChildOf:contained': { path: 'resource.relations.isChildOf', pathArray: ['resource', 'relations', 'isChildOf'], type: 'contained' },
    'isChildOf:exist': { path: 'resource.relations.isChildOf', pathArray: ['resource', 'relations', 'isChildOf'], type: 'exist' },
    'isPresentIn:contain': { path: 'resource.relations.isPresentIn', pathArray: ['resource', 'relations', 'isPresentIn'], type: 'contain' },
    'missingRelationTargetIds:contain': { path: 'warnings.missingRelationTargets.targetIds', pathArray: ['warnings', 'missingRelationTargets', 'targetIds'], type: 'contain' },
    'warnings:exist': { path: 'warnings', pathArray: ['warnings'], type: 'exist' },
    'invalidFields:exist': { path: 'warnings.invalidFields', pathArray: ['warnings', 'invalidFields'], type: 'exist' },
    'invalidFields:contain': { path: 'warnings.invalidFields', pathArray: ['warnings', 'invalidFields'], type: 'contain' },
    'unconfiguredCategory:exist': { path: 'warnings.unconfiguredCategory', pathArray: ['warnings', 'unconfiguredCategory'], type: 'exist' },
    'unconfiguredFields:exist': { path: 'warnings.unconfiguredFields', pathArray: ['warnings', 'unconfiguredFields'], type: 'exist' },
    'unconfiguredFields:contain': { path: 'warnings.unconfiguredFields', pathArray: ['warnings', 'unconfiguredFields'], type: 'contain' },
    'outliers:exist': { path: 'warnings.outliers', pathArray: ['warnings', 'outliers'], type: 'exist' },
    'outlierValues:contain': { path: 'warnings.outliers.values', pathArray: ['warnings', 'outliers', 'values'], type: 'contain' },
    'missingRelationTargets:exist': { path: 'warnings.missingRelationTargets', pathArray: ['warnings', 'missingRelationTargets'], type: 'exist' },
    'missingIdentifierPrefix:exist': { path: 'warnings.missingIdentifierPrefix', pathArray: ['warnings', 'missingIdentifierPrefix'], type: 'exist' },
    'nonUniqueIdentifier:exist': { path: 'warnings.nonUniqueIdentifier', pathArray: ['warnings', 'nonUniqueIdentifier'], type: 'exist' },
    'resourceLimitExceeded:exist': { path: 'warnings.resourceLimitExceeded', pathArray: ['warnings', 'resourceLimitExceeded'], type: 'exist' },
    'invalidParent:exist': { path: 'warnings.invalidParent', pathArray: ['warnings', 'invalidParent'], type: 'exist' }
};
