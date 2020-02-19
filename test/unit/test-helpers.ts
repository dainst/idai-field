import {Document} from 'idai-components-2';


export function doc(id: string, type: string = 'type'): Document {

    return {
        _id: id,
        resource: {
            id: id,
            identifier: 'identifier' + id,
            type: type,
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