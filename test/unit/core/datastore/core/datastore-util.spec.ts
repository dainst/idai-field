import {Document} from 'idai-components-2';
import {DatastoreUtil} from '../../../../../app/core/datastore/core/datastore-util';


describe('DatastoreUtil', () => {

    it('sort revisions', () => {

        const one: Document = {
            _id: '1',
            created: { user: '', date: new Date('2018') },
            modified: [],
            resource: {
                id: '1',
                ind: 1,
                type: 'Object',
                relations: {}
            }
        };

        const two: Document = {
            _id: '1',
            created: { user: '', date: new Date('2019') },
            modified: [],
            resource: {
                id: '1',
                ind: 2,
                type: 'Object',
                relations: {}
            }
        };

        const three: Document = {
            _id: '1',
            created: { user: '', date: new Date('2020') },
            modified: [],
            resource: {
                id: '1',
                ind: 3,
                type: 'Object',
                relations: {}
            }
        };

        const result = DatastoreUtil.sortRevisionsByLastModified([three, two, one]);
        expect(result[0].resource['ind']).toBe(1);
        expect(result[1].resource['ind']).toBe(2);
        expect(result[2].resource['ind']).toBe(3);
    });
});