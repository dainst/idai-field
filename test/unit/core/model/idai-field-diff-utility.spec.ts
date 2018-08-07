/**
 *
 */
import {IdaiFieldDiffUtility} from '../../../../app/core/model/idai-field-diff-utility';


describe('IdaiFieldDiffUtility', () => {

    it('findDifferingRelations - different order in relation', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['7', '1', '3'] };

        const differingFields = IdaiFieldDiffUtility.findDifferingRelations(rels1, rels2);
        expect(differingFields).toEqual([]);
    });

    
    it('findDifferingRelations - one rel has less elements', () => {

        const rels1 = { a: ['1', '3', '7'] };
        const rels2 = { a: ['1', '3'] };

        const differingFields = IdaiFieldDiffUtility.findDifferingRelations(rels1, rels2);
        expect(differingFields).toEqual(['a']);
    });


    it('findDifferingRelations - keys in different order', () => {

        const rels1 = { a: ['1'], b: ['1'] };
        const rels2 = { b: ['1'], a: ['1'] };

        const differingFields = IdaiFieldDiffUtility.findDifferingRelations(rels1, rels2);
        expect(differingFields).toEqual([]);
    });
});
