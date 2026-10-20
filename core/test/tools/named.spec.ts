import { Named } from '../../src/tools/named';

/**
 * @author Daniel de Oliveira
 */
describe('named', () => {

    it('named array to named map', () => {

        const namedAs =  [{ name: '17', e: 3 }, { name: '19', e: 7 }];

        expect(
            Named.arrayToMap(namedAs)
        ).toEqual(
            {
                '17': { e: 3, name: '17' },
                '19': { e: 7, name: '19' }
            }
        );
    });


    it('named map to named array', () => {

        const namedMap =  { '17': { e: 3 }, '19': { e: 7 } };

        expect(
            Named.mapToNamedArray(namedMap)
        ).toEqual(
            [{ e: 3, name: '17' }, { e: 7, name: '19' }]
        );
    });


    it('sort by name', () => {

       const namedArray = [{ name: '18', e: 1 }, { name: '17' }, { name: '19' }];

        expect(
            Named.sortArray(['17', '19'])(namedArray)
        ).toEqual(
            [{ name: '17' }, { name: '19' }, { name: '18', e: 1 }]
        );
    });
});
