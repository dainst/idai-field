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


    it('allow overwriting parent values when extending valuelist', () => {

        const extendedValuelist: Valuelist = {
            id: 'list',
            source: 'library',
            values: {
                a: {
                    label: { en: 'Library label A' },
                    description: { en: 'Library description A' }
                },
                b: {
                    label: { en: 'Library label B' },
                    description: { en: 'Library description B' }
                }
            }
        };

        const extendingValuelist: Valuelist = {
            id: 'extending-list',
            source: 'custom',
            extendedValuelist: 'list',
            values: {
                a: {
                    label: { en: 'Custom label A' },
                    description: { en: 'Custom description A' }
                },
                c: {
                    label: { en: 'Custom label C' },
                    description: { en: 'Custom description C' }
                }
            }
        };

        const result: Valuelist = Valuelist.applyExtension(extendingValuelist, extendedValuelist);

        expect(result).toEqual({
            id: 'extending-list',
            source: 'custom',
            extendedValuelist: 'list',
            values: {
                a: {
                    label: { en: 'Custom label A' },
                    description: { en: 'Custom description A' }
                },
                b: {
                    label: { en: 'Library label B' },
                    description: { en: 'Library description B' }
                },
                c: {
                    label: { en: 'Custom label C' },
                    description: { en: 'Custom description C' }
                }
            }
        })
    });
});
