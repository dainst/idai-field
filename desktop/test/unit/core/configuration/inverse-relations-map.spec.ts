import {InverseRelationsMap,
    makeInverseRelationsMap} from '../../../../src/app/core/configuration/inverse-relations-map';


describe('InverseRelationsMap', () => {

   it('make', () => {

       const inverseRelationsMap: InverseRelationsMap
           = makeInverseRelationsMap(
               [
                   { name: 'a', label: '', inverse: 'b', domain: [], range: [] },
                   { name: 'c', label: '', domain: [], range: [] }
                   ]);

       expect(inverseRelationsMap).toEqual({
           a: 'b',
           c: undefined
       });

       // let's make sure the keys are there, even if the values are undefined
       expect(Object.keys(inverseRelationsMap)).toEqual(['a', 'c']);
   })
});
