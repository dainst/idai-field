import {Map} from 'tsfun';
import {LibraryCategoryDefinition} from '../../../../../src/app/core/configuration/model/library-category-definition';
import {CategoryDefinition} from 'idai-field-core';
import {applySearchConfiguration} from '../../../../../src/app/core/configuration/boot/apply-search-configuration';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('applySearchConfiguration', () => {

    let categories;
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

        categories = {
            'T1': t1
        } as Map<LibraryCategoryDefinition>
    });


    it('apply search configuration', () => {

        categories = {
                A: { fields: { a1: {}, a2: {}, a3: {} } } as CategoryDefinition
        } ;

        const searchConfiguration = {
            'A': {
                'fulltext': ['a1', 'a3'],
                'constraint': ['a2', 'a3']
            }
        };

        applySearchConfiguration(searchConfiguration)(categories);

        expect(categories['A'].fields['a1'].fulltextIndexed).toBeTruthy();
        expect(categories['A'].fields['a2'].fulltextIndexed).toBeFalsy();
        expect(categories['A'].fields['a3'].fulltextIndexed).toBeTruthy();
        expect(categories['A'].fields['a1'].constraintIndexed).toBeFalsy();
        expect(categories['A'].fields['a2'].constraintIndexed).toBeTruthy();
        expect(categories['A'].fields['a3'].constraintIndexed).toBeTruthy();
    });
});
