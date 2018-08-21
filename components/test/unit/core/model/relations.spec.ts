import {Relations} from '../../../../src/core/model/relations';

/**
 * @author Daniel de Oliveira
 */
describe('Relations', () => {

    it('getDifferent - different order in relation', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['7', '1', '3'] };

        const differingFields = Relations.getDifferent(rels1, rels2);
        expect(differingFields).toEqual([]);
    });


    it('getDifferent - one rel has less elements', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['1', '3'] };

        const differingFields = Relations.getDifferent(rels1, rels2);
        expect(differingFields).toEqual(['a']);
    });


    it('getDifferent - keys in different order', () => {

        const rels1 = { a: ['1'], b: ['1'] };
        const rels2 = { b: ['1'], a: ['1'] };

        const differingFields = Relations.getDifferent(rels1, rels2);
        expect(differingFields).toEqual([]);
    });
});