import {expand, makeEmptyDenseArray} from '../../../../app/core/export/export-helper';


/**
 * @author Daniel de Oliveira
 */
describe('ExportHelper', () => {


   it('expand', () => {

       const originalItems = ['a', 'b', 'c', 'd'];

       const resultingItems = expand(1, 2, (item: string) => {
           return [item + '1', item + '2']
       })(originalItems);

       expect(resultingItems).toEqual(['a', 'b1', 'b2', 'c1', 'c2', 'd']);
   });


   it('expand empty elements in arrays', () => {

       const originalItems = ['a', 'b', 'c', 'd'];

       const resultingItems = expand(1, 2, (item: string) => {
           return makeEmptyDenseArray(2);
       })(originalItems);

       expect(resultingItems).toEqual(['a', undefined, undefined, undefined, undefined, 'd']);
   });
});