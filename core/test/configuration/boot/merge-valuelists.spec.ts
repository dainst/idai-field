import { Map } from 'tsfun';
import { mergeValuelists } from '../../../src/configuration/boot/merge-valuelists';
import { Valuelist } from '../../../src/model/configuration/valuelist';


/**
 * @author Thomas Kleinke
 */
describe('mergeValuelists', () => {

    it('merge library with custom valuelists', () => {

        const libraryValuelists: Map<Valuelist> = {
            'library-list': {
                values: {
                    a: {}
                }
            }
        }

        const customValuelists: Map<Valuelist> = {
            'custom-list': {
                values: {
                    b: {}
                }
            },
            'library-list': {   // Ignore this (overwriting library valuelists is not allowed)
                values: {
                    c: {}
                }
            }
        }

        const result: Map<Valuelist> = mergeValuelists(libraryValuelists, customValuelists);
        
        expect(Object.keys(result).length).toBe(2);
        expect(result['library-list']).toEqual({
            id: 'library-list',
            source: 'library',
            values: {
                a: {}
            },
        });
        expect(result['custom-list']).toEqual({
            id: 'custom-list',
            source: 'custom',
            values: {
                b: {}
            },
        });
    });
});
