import { Named } from '../../src/tools/named';

/**
 * @author Daniel de Oliveira
 */
describe('named', () => {

    it('namedArrayToNamedMap', () => {

        const namedAs =  [{ name: '17', e: 3 }, { name: '19', e: 7 }];

        expect(
            Named.arrayToMap(namedAs)
        ).toEqual(
            {
                '17': {e: 3, name: '17'},
                '19': {e: 7, name: '19'}
            }
        );
    });


    it('namedArrayToNamedMap', () => {

        const namedMap =  {'17': { e: 3 }, '19': { e: 7 }};

        expect(
            Named.mapToNamedArray(namedMap)
        ).toEqual(
            [{e: 3, name: '17'}, {e: 7, name: '19'}]
        );
    });


    it('sortByName', () => {

       const namedArray = [{ name: '18', e: 1}, { name: '17'}, { name: '19'}];

        expect(
            Named.sortArray(['17', '19'])(namedArray)
        ).toEqual(
            [{name: '17'}, {name: '19'}, {name: '18', e: 1}]
        );
    });
});
