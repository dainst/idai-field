import { WarningsUpdater } from '../../src/datastore/warnings-updater';
import { Warnings } from '../../src/model';
import { Field } from '../../src/model/configuration/field';
import { doc } from '../test-helpers';


const createDocument = (id: string, category: string = 'category') =>
    doc('sd', 'identifier' + id, category, id);


/**
 * @author Thomas Kleinke
 */
describe('WarningsUpdater', () => {

    it('update warnings', () => {

        const categoryDefinition = {
            name: 'category',
            identifierPrefix: 'C',
            groups: [
                {
                    fields: [
                        {
                            name: 'shortDescription',
                            inputType: Field.InputType.INPUT
                        },
                        {
                            name: 'number',
                            inputType: Field.InputType.FLOAT
                        },
                        {
                            name: 'dropdown',
                            inputType: Field.InputType.DROPDOWN,
                            valuelist: {
                                values: { 'value': {} }
                            }
                        }
                    ]
                }
            ]
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];
        documents[0]._conflicts = ['123'];
        documents[0].resource.identifier = '1';
        documents[0].resource.number = 'text';
        documents[0].resource.dropdown = 'invalidValue';
        documents[0].resource.unconfiguredField = 'text';

        documents[1].resource.identifier = 'C2';
        documents[1].resource.number = 1;
        documents[1].resource.dropdown = 'value';
        
        WarningsUpdater.updateWarnings(documents[0], categoryDefinition);
        WarningsUpdater.updateWarnings(documents[1], categoryDefinition);
        
        expect(documents[0].warnings).toEqual({
            unconfigured: ['unconfiguredField'],
            invalid: ['number'],
            outlierValues: ['dropdown'],
            conflicts: true,
            missingIdentifierPrefix: true
        });
        expect(documents[1].warnings).toBeUndefined();
    });

    
    it('set non-unique identifier warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['put', 'getCount']);
        mockIndexFacade.getCount.and.returnValue(2);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1]] }));

        await WarningsUpdater.updateNonUniqueIdentifierWarning(
            documents[0], mockIndexFacade, mockDatastore, undefined, true
        );

        expect(documents[0].warnings?.nonUniqueIdentifier).toBe(true);
        expect(documents[1].warnings?.nonUniqueIdentifier).toBe(true);
        expect(mockIndexFacade.put).toHaveBeenCalledWith(documents[0]);
        expect(mockIndexFacade.put).toHaveBeenCalledWith(documents[1]);

        done();
    });


    it('remove non-unique identifier warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].warnings = Warnings.createDefault();
        documents[0].warnings.nonUniqueIdentifier = true;
        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.nonUniqueIdentifier = true;

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['put', 'getCount']);
        mockIndexFacade.getCount.and.returnValue(1);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1]] }));

        await WarningsUpdater.updateNonUniqueIdentifierWarning(
            documents[0], mockIndexFacade, mockDatastore, 'previousIdentifier', true
        );

        expect(documents[0].warnings).toBeUndefined();
        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.put).toHaveBeenCalledWith(documents[0]);
        expect(mockIndexFacade.put).toHaveBeenCalledWith(documents[1]);

        done();
    });
});
