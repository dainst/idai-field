import {Query} from './model/query';
import {Resource} from './model/resource';

// TODO allow to also pass Document
export const childrenOf = (id: Resource.Id): Query => ({
    constraints: {
        'isChildOf:contain': {
            value: id,
            searchRecursively: true
        }
    }
});
