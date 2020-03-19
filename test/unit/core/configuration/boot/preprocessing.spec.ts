import {Map} from 'tsfun';
import {LibraryTypeDefinition} from '../../../../../app/core/configuration/model/library-type-definition';
import {Preprocessing} from '../../../../../app/core/configuration/boot/preprocessing';
import {TypeDefinition} from '../../../../../app/core/configuration/model/type-definition';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Preprocessing', () => {

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


    it('apply search configuration', () => {

        configuration = {
            identifier: 'test',
            types: {
                A: { fields: { a1: {}, a2: {}, a3: {} } } as TypeDefinition
            },
            relations: []
        };

        const searchConfiguration = {
            'A': {
                'fulltext': ['a1', 'a3'],
                'constraint': ['a2', 'a3']
            }
        };

        Preprocessing.applySearchConfiguration(configuration, searchConfiguration);

        expect(configuration.types['A'].fields['a1'].fulltextIndexed).toBeTruthy();
        expect(configuration.types['A'].fields['a2'].fulltextIndexed).toBeFalsy();
        expect(configuration.types['A'].fields['a3'].fulltextIndexed).toBeTruthy();
        expect(configuration.types['A'].fields['a1'].constraintIndexed).toBeFalsy();
        expect(configuration.types['A'].fields['a2'].constraintIndexed).toBeTruthy();
        expect(configuration.types['A'].fields['a3'].constraintIndexed).toBeTruthy();
    });
});

























