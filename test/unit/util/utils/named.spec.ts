import {namedArrayToNamedMap, namedMapToNamedArray} from '../../../../app/core/util/named';

/**
 * @author Daniel de Oliveira
 */
describe('named', () => {

    it('namedArrayToNamedMap', () => {

        const namedAs =  [{ name: '17', e: 3 }, { name: '19', e: 7 }];

        expect(
            namedArrayToNamedMap(namedAs)
        ).toEqual(
            {
                '17': {e: 3, name: '17'},
                '19': {e: 7, name: '19'}
            }
        );
    });


    it('namedArrayToNamedMap', () => {

        const namedMap =  {'17': { name: '17', e: 3 }, '19': { name: '19', e: 7 }};

        expect(
            namedMapToNamedArray(namedMap)
        ).toEqual(
            [{e: 3, name: '17'}, {e: 7, name: '19'}]
        );
    });
});