import {Map} from 'tsfun';
import {LibraryCategoryDefinition} from '../../../../../src/app/core/configuration/model/library-category-definition';
import {CategoryDefinition} from '../../../../../src/app/core/configuration/model/category-definition';
import {applyLanguageConfigurations} from '../../../../../src/app/core/configuration/boot/apply-language-configurations';



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

        configuration = [
            {
                A: { fields: { a: {}, a1: {} } } as CategoryDefinition,
                B: { fields: { b: {} } } as CategoryDefinition
            },
            [{ name: 'isRecordedIn' }, { name: 'isContemporaryWith' }]
        ];

        const languageConfigurations = [{
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
        }];

        const [categories,relations] = applyLanguageConfigurations(languageConfigurations)(configuration);

        expect(categories['A'].label).toEqual('A_');
        expect(categories['B'].label).toBeUndefined();
        expect(categories['A'].fields['a'].label).toEqual('a_');
        expect(categories['A'].fields['a1'].label).toBeUndefined();
        expect(categories['A'].fields['a'].description).toBeUndefined();
        expect(categories['A'].fields['a1'].description).toEqual('a1_desc');
        expect(relations[0].label).toEqual('isRecordedIn_');
        expect(relations[1].label).toBeUndefined();
    });
});

























