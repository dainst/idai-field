import {dissocIndices} from '../../../../../app/core/datastore/helpers';


describe('helpers', () => {

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