import { WarningsUpdater } from '../../src/datastore/warnings-updater';
import { Warnings } from '../../src/model/warnings';
import { Field } from '../../src/model/configuration/field';
import { doc } from '../test-helpers';


const createDocument = (id: string, category: string = 'category') =>
    doc('sd', 'identifier' + id, category, id);


/**
 * @author Thomas Kleinke
 */
describe('WarningsUpdater', () => {

    it('update index independent warnings', () => {

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
                                values: { 'valueDropdown': {} }
                            }
                        },
                        {
                            name: 'checkboxes',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelist: {
                                values: { 'valueCheckboxes': {} }
                            }
                        },
                        {
                            name: 'dimension',
                            inputType: Field.InputType.DIMENSION,
                            valuelist: {
                                values: { 'valueDimension': {} }
                            }
                        }
                    ]
                }
            ]
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2'),
            createDocument('3')
        ];
        documents[0]._conflicts = ['123'];
        documents[0].resource.identifier = '1';
        documents[0].resource.number = 'text';
        documents[0].resource.dropdown = 'outlierValue';
        documents[0].resource.checkboxes = ['outlierValue'];
        documents[0].resource.dimension = [{ measurementPosition: 'outlierValue', inputValue: 1, inputUnit: 'cm' }];
        documents[0].resource.unconfiguredField = 'text';

        documents[1].resource.identifier = 'C2';

        documents[2].resource.identifier = 'C3';
        documents[2].resource.number = 1;
        documents[2].resource.dropdown = 'valueDropdown';
        documents[2].resource.checkboxes = ['valueCheckboxes'];
        documents[2].resource.dimension = [{ measurementPosition: 'valueDimension', inputValue: 1, inputUnit: 'cm'}];

        const mockProjectConfiguration = jasmine.createSpyObj('mockProjectConfiguration', ['getCategory'])
        mockProjectConfiguration.getCategory.and.returnValues(categoryDefinition, undefined, categoryDefinition);

        WarningsUpdater.updateIndexIndependentWarnings(documents[0], mockProjectConfiguration);
        WarningsUpdater.updateIndexIndependentWarnings(documents[1], mockProjectConfiguration);
        WarningsUpdater.updateIndexIndependentWarnings(documents[2], mockProjectConfiguration);
        
        expect(documents[0].warnings).toEqual({
            unconfiguredFields: ['unconfiguredField'],
            invalidFields: ['number'],
            outlierValues: ['dropdown', 'checkboxes', 'dimension'],
            conflicts: true,
            missingIdentifierPrefix: true
        });
        expect(documents[1].warnings).toEqual({
            unconfiguredFields: [],
            invalidFields: [],
            outlierValues: [],
            unconfiguredCategory: true
        });
        expect(documents[2].warnings).toBeUndefined();
    });

    
    it('set non-unique identifier warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex', 'getCount']);
        mockIndexFacade.getCount.and.returnValue(2);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1]] }));

        await WarningsUpdater.updateNonUniqueIdentifierWarning(
            documents[0], mockIndexFacade, mockDatastore, undefined, true
        );

        expect(documents[0].warnings?.nonUniqueIdentifier).toBe(true);
        expect(documents[1].warnings?.nonUniqueIdentifier).toBe(true);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'nonUniqueIdentifier:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'nonUniqueIdentifier:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

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

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex', 'getCount']);
        mockIndexFacade.getCount.and.returnValue(1);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1]] }));

        await WarningsUpdater.updateNonUniqueIdentifierWarning(
            documents[0], mockIndexFacade, mockDatastore, 'previousIdentifier', true
        );

        expect(documents[0].warnings).toBeUndefined();
        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'nonUniqueIdentifier:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'nonUniqueIdentifier:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('set resource limit warnings', async done => {

        const categoryDefinition = {
            name: 'category',
            resourceLimit: 1
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex', 'find']);
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[0], documents[1]] }));

        await WarningsUpdater.updateResourceLimitWarning(
            documents[0], categoryDefinition, mockIndexFacade, mockDatastore, true
        );

        expect(documents[0].warnings?.resourceLimitExceeded).toBe(true);
        expect(documents[1].warnings?.resourceLimitExceeded).toBe(true);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('remove resource limit warnings', async done => {

        const categoryDefinition = {
            name: 'category',
            resourceLimit: 2
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].warnings = Warnings.createDefault();
        documents[0].warnings.resourceLimitExceeded = true;
        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.resourceLimitExceeded = true;

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex', 'find']);
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[0], documents[1]] }));

        await WarningsUpdater.updateResourceLimitWarnings(mockDatastore, mockIndexFacade, categoryDefinition);

        expect(documents[0].warnings).toBeUndefined();
        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('set relation target warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].resource.relations['relation1'] = ['2'];
        documents[0].resource.relations['relation2'] = ['missing1'];
        documents[0].resource.relations['relation3'] = ['missing2'];

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex']);

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        await WarningsUpdater.updateRelationTargetWarning(documents[0], mockIndexFacade, mockDocumentCache);

        expect(documents[0].warnings?.missingRelationTargets).toEqual({
            relationNames: ['relation2', 'relation3'],
            targetIds: ['missing1', 'missing2']
        });
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove relation target warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].warnings = Warnings.createDefault();
        documents[0].warnings.missingRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['missing']
        };

        documents[0].resource.relations['relation'] = ['2'];

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex']);

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        await WarningsUpdater.updateRelationTargetWarning(documents[0], mockIndexFacade, mockDocumentCache);

        expect(documents[0].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove relation target warnings in linking resources', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.missingRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['1']
        };

        documents[1].resource.relations['relation'] = ['1'];

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex']);
    
        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1]] }));

        await WarningsUpdater.updateRelationTargetWarning(
            documents[0], mockIndexFacade, mockDocumentCache, mockDatastore, true
        );

        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'missingRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('set outlier warnings for valuelists from project field', async done => {

        const categoryDefinition = {
            name: 'category',
            identifierPrefix: 'C',
            groups: [
                {
                    fields: [
                        {
                            name: 'editor',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelistFromProjectField: 'staff'
                        }
                    ]
                }
            ]
        } as any;

        const documents = [
            createDocument('project', 'Project'),
            createDocument('1')
        ];

        documents[0].resource.staff = ['Person'];

        documents[1].resource.editor = ['outlierValue'];

        const mockProjectConfiguration = jasmine.createSpyObj('projectConfiguration', ['getCategory', 'getCategories'])
        mockProjectConfiguration.getCategory.and.returnValue(categoryDefinition);
        mockProjectConfiguration.getCategories.and.returnValue([{ item: categoryDefinition, trees: [] }]);

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex']);

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        await WarningsUpdater.updateProjectFieldOutlierWarning(
            documents[1], mockProjectConfiguration, categoryDefinition, mockIndexFacade, mockDocumentCache
        );

        expect(documents[1].warnings?.outlierValues).toEqual(['editor']);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('remove outlier warnings for valuelists from project field', async done => {

        const categoryDefinition = {
            name: 'category',
            identifierPrefix: 'C',
            groups: [
                {
                    fields: [
                        {
                            name: 'editor',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelistFromProjectField: 'staff'
                        }
                    ]
                }
            ]
        } as any;

        const documents = [
            createDocument('project', 'Project'),
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].resource.staff = ['Person'];

        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.outlierValues = ['editor'];
        documents[1].resource.editor = ['Person'];

        documents[2].warnings = Warnings.createDefault();
        documents[2].warnings.outlierValues = ['editor', 'otherField'];
        documents[2].resource.editor = ['Person'];

        const mockProjectConfiguration = jasmine.createSpyObj('mockProjectConfiguration', ['getCategory', 'getCategories'])
        mockProjectConfiguration.getCategory.and.returnValue(categoryDefinition);
        mockProjectConfiguration.getCategories.and.returnValue([{ item: categoryDefinition, trees: [] }]);

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex']);

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        await WarningsUpdater.updateProjectFieldOutlierWarning(
            documents[1], mockProjectConfiguration, categoryDefinition, mockIndexFacade, mockDocumentCache
        );

        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        await WarningsUpdater.updateProjectFieldOutlierWarning(
            documents[2], mockProjectConfiguration, categoryDefinition, mockIndexFacade, mockDocumentCache
        );

        expect(documents[2].warnings?.outlierValues).toEqual(['otherField'])
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'outlierValues:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'warnings:exist');

        done();
    });


    it('remove outlier warnings for valuelists from project field after updating project document', async done => {

        const categoryDefinition = {
            name: 'category',
            identifierPrefix: 'C',
            groups: [
                {
                    fields: [
                        {
                            name: 'editor',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelistFromProjectField: 'staff'
                        }
                    ]
                }
            ]
        } as any;

        const documents = [
            createDocument('project', 'Project'),
            createDocument('1'),
            createDocument('2'),
            createDocument('3')
        ];

        documents[0].resource.staff = ['Person'];

        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.outlierValues = ['editor'];
        documents[1].resource.editor = ['Person'];

        documents[2].warnings = Warnings.createDefault();
        documents[2].warnings.outlierValues = ['editor', 'otherField'];
        documents[2].resource.editor = ['Person'];

        documents[3].warnings = Warnings.createDefault();
        documents[3].warnings.outlierValues = ['otherField'];

        const mockProjectConfiguration = jasmine.createSpyObj('mockProjectConfiguration',
            ['getCategory', 'getCategories']);
        mockProjectConfiguration.getCategory.and.returnValue(categoryDefinition);
        mockProjectConfiguration.getCategories.and.returnValue([{ item: categoryDefinition, trees: [] }]);

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex']);

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1], documents[2], documents[3]] }));

        await WarningsUpdater.updateProjectFieldOutlierWarning(
            documents[0], mockProjectConfiguration, categoryDefinition, mockIndexFacade, mockDocumentCache,
            mockDatastore, true
        );

        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        expect(documents[2].warnings?.outlierValues).toEqual(['otherField']);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'outlierValues:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'warnings:exist');

        expect(documents[3].warnings?.outlierValues).toEqual(['otherField']);
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'outlierValues:exist');
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'warnings:exist');

        done();
    });
});
