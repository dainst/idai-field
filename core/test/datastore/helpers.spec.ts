import { dissocIndices, isProjectDocument, sortRevisionsByLastModified } from '../../src/datastore/helpers';
import { Document } from '../../src/model/document';


describe('helpers', () => {
  
    it('isProjectDocument', () => {

        const result = isProjectDocument({ resource: { id: 'project' } } as any);
        expect(result).toBeTruthy();
    });


    it('sort revisions', () => {

        const one: Document = {
            _id: '1',
            created: { user: '', date: new Date('2018') },
            modified: [],
            resource: {
                id: '1',
                identifier: '',
                ind: 1,
                category: 'Object',
                relations: {}
            }
        };

        const two: Document = {
            _id: '1',
            created: { user: '', date: new Date('2019') },
            modified: [],
            resource: {
                id: '1',
                identifier: '',
                ind: 2,
                category: 'Object',
                relations: {}
            }
        };

        const three: Document = {
            _id: '1',
            created: { user: '', date: new Date('2020') },
            modified: [],
            resource: {
                id: '1',
                identifier: '',
                ind: 3,
                category: 'Object',
                relations: {}
            }
        };

        const result = sortRevisionsByLastModified([three, two, one]);
        expect(result[0].resource['ind']).toBe(1);
        expect(result[1].resource['ind']).toBe(2);
        expect(result[2].resource['ind']).toBe(3);
    });


    it('removeItemsAtIndices', () => {

        const result = dissocIndices([0, 2])(['a', 'b', 'c', 'd']);
        expect(result.length).toBe(2);
        expect(result[0]).toBe('b');
        expect(result[1]).toBe('d');
    });


    it('delete last', () => {

        const result = dissocIndices([0])(['a']);
        expect(result.length).toBe(0);
    });


    it('non existing index', () => {

        const result = dissocIndices([-1])(['a']);
        expect(result.length).toBe(1);
        expect(result[0]).toBe('a');
    });
});
