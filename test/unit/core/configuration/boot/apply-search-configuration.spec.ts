import {Map} from 'tsfun';
import {LibraryCategoryDefinition} from '../../../../../app/core/configuration/model/library-category-definition';
import {Preprocessing} from '../../../../../app/core/configuration/boot/preprocessing';
import {CategoryDefinition} from '../../../../../app/core/configuration/model/category-definition';
import {applySearchConfiguration} from '../../../../../app/core/configuration/boot/apply-search-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applySearchConfiguration', () => {

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


    it('apply search configuration', () => {

        configuration = {
            identifier: 'test',
            categories: {
                A: { fields: { a1: {}, a2: {}, a3: {} } } as CategoryDefinition
            },
            relations: []
        };

        const searchConfiguration = {
            'A': {
                'fulltext': ['a1', 'a3'],
                'constraint': ['a2', 'a3']
            }
        };

        applySearchConfiguration(searchConfiguration)(configuration);

        expect(configuration.categories['A'].fields['a1'].fulltextIndexed).toBeTruthy();
        expect(configuration.categories['A'].fields['a2'].fulltextIndexed).toBeFalsy();
        expect(configuration.categories['A'].fields['a3'].fulltextIndexed).toBeTruthy();
        expect(configuration.categories['A'].fields['a1'].constraintIndexed).toBeFalsy();
        expect(configuration.categories['A'].fields['a2'].constraintIndexed).toBeTruthy();
        expect(configuration.categories['A'].fields['a3'].constraintIndexed).toBeTruthy();
    });
});
