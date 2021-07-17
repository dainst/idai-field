import { Relation } from '../../../src/model/configuration/relation';


describe('Relation', () => {

    it('make', () => {

        const inverseRelationsMap: Relation.InverseRelationsMap
            = Relation.makeInverseRelationsMap(
                [
                    { name: 'a', inverse: 'b', domain: [], range: [], editable: false, inputType: 'relation' },
                    { name: 'c', domain: [], range: [], editable: false, inputType: 'relation' }
                 ]
             );
 
        expect(inverseRelationsMap).toEqual({
            a: 'b',
            c: undefined
        });
 
        // let's make sure the keys are there, even if the values are undefined
        expect(Object.keys(inverseRelationsMap)).toEqual(['a', 'c']);
    })
});
