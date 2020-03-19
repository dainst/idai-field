import {Map} from 'tsfun';
import {LibraryTypeDefinition} from '../../../../../app/core/configuration/model/library-type-definition';
import {TypeDefinition} from '../../../../../app/core/configuration/model/type-definition';
import {applyLanguage} from '../../../../../app/core/configuration/boot/apply-language';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applyLanguage', () => {

    let configuration;
    let t1: LibraryTypeDefinition;

    beforeEach(() => {

        t1 = {
            typeFamily: 'x1',
            commons: [],
            parent: 'x',
            description: { 'de': '' },
            createdBy: '',
            creationDate: '',
            color: 'white',
            valuelists: {},
            fields: {
                'aField': {}
            }
        } as LibraryTypeDefinition;

        configuration = {
            identifier: 'test',
            types: {
                'T1': t1
            } as Map<LibraryTypeDefinition>
        } as any;
    });


    it('apply language', () => {

        configuration = {
            identifier: 'test',
            types: {
                A: { fields: { a: {}, a1: {} } } as TypeDefinition,
                B: { fields: { b: {} } } as TypeDefinition
            },
            relations: [{ name: 'isRecordedIn' }, { name: 'isContemporaryWith' }]
        };

        const languageConfiguration = {
            types: {
                A: {
                    label: 'A_',
                    fields: {
                        a: {
                            label: 'a_'
                        },
                        a1: {
                            description: 'a1_desc'
                        }
                    }
                }
            },
            relations: {
                isRecordedIn: {
                    label: 'isRecordedIn_'
                }
            }
        };

        configuration = applyLanguage(languageConfiguration)(configuration);

        expect(configuration.types['A'].label).toEqual('A_');
        expect(configuration.types['B'].label).toBeUndefined();
        expect(configuration.types['A'].fields['a'].label).toEqual('a_');
        expect(configuration.types['A'].fields['a1'].label).toBeUndefined();
        expect(configuration.types['A'].fields['a'].description).toBeUndefined();
        expect(configuration.types['A'].fields['a1'].description).toEqual('a1_desc');
        expect(configuration.relations[0].label).toEqual('isRecordedIn_');
        expect(configuration.relations[1].label).toBeUndefined();
    });
});

























