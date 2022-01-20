import { Map } from 'tsfun';
import { Valuelist } from '../../../../src/model/configuration/valuelist';


/**
 * @author Thomas Kleinke
 */
describe('Valuelist', () => {

    it('apply valuelist extension', () => {

        const extendedValuelist: Valuelist = {
            id: 'list',
            source: 'library',
            values: {
                a: {},
                b: {}
            }
        };

        const extendingValuelist: Valuelist = {
            id: 'extending-list',
            source: 'custom',
            extendedValuelist: 'list',
            values: {
                c: {}
            },
            hidden: ['b']
        };

        const result: Valuelist = Valuelist.applyExtension(extendingValuelist, extendedValuelist);

        expect(result).toEqual({
            id: 'extending-list',
            source: 'custom',
            extendedValuelist: 'list',
            values: {
                a: {},
                c: {}
            },
            hidden: ['b']
        })
    });
});
