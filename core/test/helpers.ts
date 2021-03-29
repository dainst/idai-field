import {Document} from 'idai-components-2';

// TODO get rid of code duplicated with test-helpers.ts
export function doc(id: string, category: string = 'category'): Document {

    return {
        _id: id,
        resource: {
            id: id,
            identifier: 'identifier' + id,
            category: category,
            relations: {}
        },
        created:
            {
                date: new Date('2017-12-31'),
                user: 'testuser'
            },
        modified: [
            {
                date: new Date('2018-01-01'),
                user: 'testuser'
            }
        ]
    };
}