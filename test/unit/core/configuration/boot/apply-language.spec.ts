import {Map} from 'tsfun';
import {LibraryCategoryDefinition} from '../../../../../app/core/configuration/model/library-category-definition';
import {CategoryDefinition} from '../../../../../app/core/configuration/model/category-definition';
import {applyLanguage} from '../../../../../app/core/configuration/boot/apply-language';
import {Groups} from '../../../../../app/core/configuration/model/group';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applyLanguage', () => {

    let configuration;
    let t1: LibraryCategoryDefinition;

    beforeEach(() => {

        t1 = {
            categoryName: 'x1',
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
        } as LibraryCategoryDefinition;

        configuration = {
            identifier: 'test',
            categories: {
                'T1': t1
            } as Map<LibraryCategoryDefinition>
        } as any;
    });


    it('apply language', () => {

        configuration = {
            identifier: 'test',
            categories: {
                A: { fields: { a: {}, a1: {} } } as CategoryDefinition,
                B: { fields: { b: {} } } as CategoryDefinition
            },
            relations: [{ name: 'isRecordedIn' }, { name: 'isContemporaryWith' }]
        };

        const languageConfiguration = {
            categories: {
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

        expect(configuration.categories['A'].label).toEqual('A_');
        expect(configuration.categories['B'].label).toBeUndefined();
        expect(configuration.categories['A'].fields['a'].label).toEqual('a_');
        expect(configuration.categories['A'].fields['a1'].label).toBeUndefined();
        expect(configuration.categories['A'].fields['a'].description).toBeUndefined();
        expect(configuration.categories['A'].fields['a1'].description).toEqual('a1_desc');
        expect(configuration.relations[0].label).toEqual('isRecordedIn_');
        expect(configuration.relations[1].label).toBeUndefined();
    });
});

























