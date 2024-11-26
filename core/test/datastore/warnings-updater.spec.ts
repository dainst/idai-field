import { WarningsUpdater } from '../../src/datastore/warnings-updater';
import { Warnings } from '../../src/model/warnings';
import { Field } from '../../src/model/configuration/field';
import { doc } from '../test-helpers';
import { CategoryForm } from '../../src/model/configuration/category-form';


const createDocument = (id: string, category: string = 'Category') => doc('sd', 'identifier' + id, category, id);


function getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition?) {

    const mockProjectConfiguration = jasmine.createSpyObj(
        'projectConfiguration',
        ['getCategory', 'getCategories', 'getCategoryWithSubcategories', 'isAllowedRelationDomainCategory',
        'getRegularCategories']
    );

    mockProjectConfiguration.getCategory.and.callFake(categoryName => {
        if (categoryName === 'Category') return categoryDefinition;
        if (categoryName === 'ParentCategory') return parentCategoryDefinition;
    });

    if (parentCategoryDefinition) {
        mockProjectConfiguration.getCategories.and.returnValue([{
            item: parentCategoryDefinition, trees: [
                { item: categoryDefinition, trees: [] }
            ] }
        ]);
    } else {
        mockProjectConfiguration.getCategories.and.returnValue([{ item: categoryDefinition, trees: [] }]);
    }

    mockProjectConfiguration.getCategoryWithSubcategories.and.callFake(categoryName => {
        if (categoryName === 'Category') return [categoryDefinition];
        if (categoryName === 'ParentCategory' && parentCategoryDefinition) {
            return [parentCategoryDefinition, categoryDefinition];
        }
        return [];
    });

    mockProjectConfiguration.isAllowedRelationDomainCategory.and.returnValue(true);
    mockProjectConfiguration.getRegularCategories.and.returnValue([categoryDefinition]);

    return mockProjectConfiguration;
}


function getMockIndexFacade() {

    return jasmine.createSpyObj(
        'mockIndexFacade',
        ['putToSingleIndex', 'getCount', 'notifyObservers', 'find']
    );
}


/**
 * @author Thomas Kleinke
 */
describe('WarningsUpdater', () => {

    it('update index independent warnings', () => {

        const categoryDefinition = {
            name: 'Category',
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
        documents[0].resource.unconfiguredField = 'text';

        documents[1].resource.identifier = 'C2';
        delete documents[1].resource.category;

        documents[2].resource.identifier = 'C3';
        documents[2].resource.number = 1;

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition);

        WarningsUpdater.updateIndexIndependentWarnings(documents[0], mockProjectConfiguration);
        WarningsUpdater.updateIndexIndependentWarnings(documents[1], mockProjectConfiguration);
        WarningsUpdater.updateIndexIndependentWarnings(documents[2], mockProjectConfiguration);
        
        expect(documents[0].warnings).toEqual({
            unconfiguredFields: ['unconfiguredField'],
            invalidFields: ['number'],
            conflicts: true,
            missingIdentifierPrefix: true
        });
        expect(documents[1].warnings).toEqual({
            unconfiguredFields: [],
            invalidFields: [],
            unconfiguredCategory: true
        });
        expect(documents[2].warnings).toBeUndefined();
    });

    
    it('set non-unique identifier warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = getMockIndexFacade();
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

        const mockIndexFacade = getMockIndexFacade();
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
            name: 'Category',
            resourceLimit: 1
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[0], documents[1]] }));

        await WarningsUpdater.updateResourceLimitWarning(
            documents[0], categoryDefinition, mockIndexFacade, mockProjectConfiguration, mockDatastore, true
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
            name: 'Category',
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

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[0], documents[1]] }));

        await WarningsUpdater.updateResourceLimitWarnings(
            mockDatastore, mockIndexFacade, mockProjectConfiguration, categoryDefinition
        );

        expect(documents[0].warnings).toBeUndefined();
        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('set resource limit warnings for limit in parent category', async done => {

        const parentCategoryDefinition = {
            name: 'ParentCategory',
            resourceLimit: 1
        } as any;

        const categoryDefinition = {
            name: 'Category',
            parentCategory: parentCategoryDefinition
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[0], documents[1]] }));

        await WarningsUpdater.updateResourceLimitWarning(
            documents[0], categoryDefinition, mockIndexFacade, mockProjectConfiguration, mockDatastore, true
        );

        expect(documents[0].warnings?.resourceLimitExceeded).toBe(true);
        expect(documents[1].warnings?.resourceLimitExceeded).toBe(true);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('remove resource limit warnings for limit in parent category', async done => {

        const parentCategoryDefinition = {
            name: 'ParentCategory',
            resourceLimit: 2
        } as any;

        const categoryDefinition = {
            name: 'Category',
            parentCategory: parentCategoryDefinition
        } as any;

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].warnings = Warnings.createDefault();
        documents[0].warnings.resourceLimitExceeded = true;
        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.resourceLimitExceeded = true;

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[0], documents[1]] }));

        await WarningsUpdater.updateResourceLimitWarnings(
            mockDatastore, mockIndexFacade, mockProjectConfiguration, categoryDefinition
        );

        expect(documents[0].warnings).toBeUndefined();
        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'resourceLimitExceeded:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('set missing relation target warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].resource.relations['relation1'] = ['2'];
        documents[0].resource.relations['relation2'] = ['missing1'];
        documents[0].resource.relations['relation3'] = ['missing2'];

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        await WarningsUpdater.updateMissingRelationTargetWarning(documents[0], mockIndexFacade, mockDocumentCache);

        expect(documents[0].warnings?.missingRelationTargets).toEqual({
            relationNames: ['relation2', 'relation3'],
            targetIds: ['missing1', 'missing2']
        });
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingRelationTargetIds:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove missing relation target warnings', async done => {

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

        await WarningsUpdater.updateMissingRelationTargetWarning(documents[0], mockIndexFacade, mockDocumentCache);

        expect(documents[0].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingRelationTargetIds:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove missing relation target warnings in linking resources', async done => {

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

        const mockIndexFacade = getMockIndexFacade();
    
        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1]] }));

        await WarningsUpdater.updateMissingRelationTargetWarning(
            documents[0], mockIndexFacade, mockDocumentCache, mockDatastore, true
        );

        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'missingRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'missingRelationTargetIds:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('set invalid relation target warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].resource.relations['relation'] = ['2'];

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(undefined, undefined);
        mockProjectConfiguration.isAllowedRelationDomainCategory.and.returnValue(false);

        await WarningsUpdater.updateInvalidRelationTargetWarning(
            documents[0], mockIndexFacade, mockProjectConfiguration, mockDocumentCache
        );

        expect(documents[0].warnings?.invalidRelationTargets).toEqual({
            relationNames: ['relation'],
            targetIds: ['2']
        });
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'invalidRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'invalidRelationTargetIds:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove invalid relation target warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].warnings = Warnings.createDefault();
        documents[0].warnings.invalidRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['2']
        };

        documents[0].resource.relations['relation'] = ['2'];

        const mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['putToSingleIndex']);

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(undefined, undefined);

        await WarningsUpdater.updateInvalidRelationTargetWarning(
            documents[0], mockIndexFacade, mockProjectConfiguration, mockDocumentCache
        );

        expect(documents[0].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'invalidRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'invalidRelationTargetIds:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove invalid relation target warnings in linking resources', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.invalidRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['1']
        };

        documents[1].resource.relations['relation'] = ['1'];

        const mockIndexFacade = getMockIndexFacade();
    
        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(undefined, undefined);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1]] }));

        await WarningsUpdater.updateInvalidRelationTargetWarning(
            documents[0], mockIndexFacade, mockProjectConfiguration, mockDocumentCache, mockDatastore, true
        );

        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'invalidRelationTargets:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'invalidRelationTargetIds:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('set invalid parent warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].resource.relations['isRecordedIn'] = ['2'];
        documents[1].resource.category = 'ParentCategory';

        const parentCategoryDefinition: CategoryForm = {
            name: 'ParentCategory',
            groups: []
        } as CategoryForm;

        const categoryDefinition: CategoryForm = {
            name: 'Category',
            mustLieWithin: true,
            groups: []
        } as CategoryForm;

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition);

        await WarningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], mockProjectConfiguration, mockIndexFacade, mockDocumentCache
        );

        expect(documents[0].warnings?.missingOrInvalidParent).toBe(true);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('set invalid parent warnings for invalid ancestors', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2'),
            createDocument('3'),
            createDocument('4'),
            createDocument('5')
        ];

        documents[0].resource.relations['liesWithin'] = ['2'];
        documents[0].resource.relations['isRecordedIn'] = ['5'];
        documents[1].resource.relations['liesWithin'] = ['3'];
        documents[1].resource.relations['isRecordedIn'] = ['5'];
        documents[2].resource.relations['liesWithin'] = ['4'];
        documents[2].resource.relations['isRecordedIn'] = ['5'];
        documents[3].resource.relations['isRecordedIn'] = ['5'];
        documents[3].resource.category = 'UnconfiguredCategory';
        documents[4].resource.category = 'ParentCategory';

        const parentCategoryDefinition: CategoryForm = {
            name: 'ParentCategory',
            groups: []
        } as CategoryForm;

        const categoryDefinition: CategoryForm = {
            name: 'Category',
            groups: []
        } as CategoryForm;

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition);

        await WarningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], mockProjectConfiguration, mockIndexFacade, mockDocumentCache
        );

        expect(documents[0].warnings?.missingOrInvalidParent).toBe(true);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('set invalid parent warnings for circular relations', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2'),
            createDocument('3'),
            createDocument('4')
        ];

        documents[0].resource.relations['liesWithin'] = ['2'];
        documents[0].resource.relations['isRecordedIn'] = ['4'];
        documents[1].resource.relations['liesWithin'] = ['3'];
        documents[1].resource.relations['isRecordedIn'] = ['4'];
        documents[2].resource.relations['liesWithin'] = ['1'];
        documents[2].resource.relations['isRecordedIn'] = ['4'];
        documents[3].resource.category = 'ParentCategory';

        const parentCategoryDefinition: CategoryForm = {
            name: 'ParentCategory',
            groups: []
        } as CategoryForm;

        const categoryDefinition: CategoryForm = {
            name: 'Category',
            groups: []
        } as CategoryForm;

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition);

        await WarningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], mockProjectConfiguration, mockIndexFacade, mockDocumentCache
        );

        expect(documents[0].warnings?.missingOrInvalidParent).toBe(true);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove invalid parent warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        documents[0].resource.relations['isRecordedIn'] = ['2'];
        documents[0].warnings = Warnings.createDefault();
        documents[0].warnings.missingOrInvalidParent = true;
        documents[1].resource.category = 'ParentCategory';

        const parentCategoryDefinition: CategoryForm = {
            name: 'ParentCategory',
            groups: []
        } as CategoryForm;

        const categoryDefinition: CategoryForm = {
            name: 'Category',
            groups: []
        } as CategoryForm;

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition);

        await WarningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], mockProjectConfiguration, mockIndexFacade, mockDocumentCache
        );

        expect(documents[0].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');

        done();
    });


    it('remove invalid parent warnings for descendants', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2'),
            createDocument('3'),
            createDocument('4'),
            createDocument('5'),
            createDocument('6')
        ];

        documents[0].resource.category = 'ParentCategory';
        documents[1].resource.relations['isRecordedIn'] = ['1'];
        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.missingOrInvalidParent = true;
        documents[2].resource.relations['liesWithin'] = ['2'];
        documents[2].resource.relations['isRecordedIn'] = ['1'];
        documents[2].warnings = Warnings.createDefault();
        documents[2].warnings.missingOrInvalidParent = true;
        documents[3].resource.relations['liesWithin'] = ['2'];
        documents[3].resource.relations['isRecordedIn'] = ['1'];
        documents[3].warnings = Warnings.createDefault();
        documents[3].warnings.missingOrInvalidParent = true;
        documents[4].resource.relations['liesWithin'] = ['3'];
        documents[4].resource.relations['isRecordedIn'] = ['1'];
        documents[4].warnings = Warnings.createDefault();
        documents[4].warnings.missingOrInvalidParent = true;
        documents[5].resource.relations['liesWithin'] = ['4'];
        documents[5].resource.relations['isRecordedIn'] = ['1'];
        documents[5].warnings = Warnings.createDefault();
        documents[5].warnings.missingOrInvalidParent = true;

        const parentCategoryDefinition: CategoryForm = {
            name: 'ParentCategory',
            groups: []
        } as CategoryForm;

        const categoryDefinition: CategoryForm = {
            name: 'Category',
            groups: []
        } as CategoryForm;

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition);

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({
            documents: [documents[1], documents[2], documents[3], documents[4], documents[5]]
        }));

        await WarningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], mockProjectConfiguration, mockIndexFacade, mockDocumentCache, mockDatastore, true
        );

        expect(documents[0].warnings).toBeUndefined();
        expect(documents[1].warnings).toBeUndefined();
        expect(documents[2].warnings).toBeUndefined();
        expect(documents[3].warnings).toBeUndefined();
        expect(documents[4].warnings).toBeUndefined();
        expect(documents[5].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[3], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[3], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[4], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[4], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[5], 'missingOrInvalidParent:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[5], 'warnings:exist');

        done();
    });


    it('set outlier warnings', async done => {

        const categoryDefinition = {
            name: 'Category',
            identifierPrefix: 'C',
            groups: [
                {
                    fields: [
                        {
                            name: 'editor',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelistFromProjectField: 'staff'
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
                        },
                        {
                            name: 'composite',
                            inputType: Field.InputType.COMPOSITE,
                            subfields: [
                                {
                                    name: 'dropdown',
                                    inputType: Field.InputType.DROPDOWN,
                                    valuelist: {
                                        values: { 'valueSubfieldDropdown': {} }
                                    }
                                },
                                {
                                    name: 'checkboxes',
                                    inputType: Field.InputType.CHECKBOXES,
                                    valuelist: {
                                        values: { 'valueSubfieldCheckboxes': {} }
                                    }
                                },
                                {
                                    name: 'url',
                                    inputType: Field.InputType.URL
                                }
                            ]
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

        documents[1].resource.editor = ['outlierValue1'];
        documents[1].resource.dropdown = 'outlierValue2';
        documents[1].resource.checkboxes = ['outlierValue3'];
        documents[1].resource.dimension = [{ measurementPosition: 'outlierValue4', inputValue: 1, inputUnit: 'cm' }];
        documents[1].resource.composite = [
            { dropdown: 'outlierValue5', checkboxes: ['outlierValue6'], url: 'http://www.example.de' }
        ];

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition);
        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        await WarningsUpdater.updateOutlierWarning(
            documents[1], mockProjectConfiguration, categoryDefinition, mockIndexFacade, mockDocumentCache
        );

        expect(documents[1].warnings?.outliers?.fields)
            .toEqual({
                editor: ['outlierValue1'],
                dropdown: ['outlierValue2'],
                checkboxes: ['outlierValue3'],
                dimension: ['outlierValue4'],
                composite: { dropdown: ['outlierValue5'], checkboxes: ['outlierValue6'] }
            });
        expect(documents[1].warnings?.outliers?.values)
            .toEqual(['outlierValue1', 'outlierValue2', 'outlierValue3', 'outlierValue4', 'outlierValue5',
                'outlierValue6']);
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('remove outlier warnings', async done => {

        const categoryDefinition = {
            name: 'Category',
            identifierPrefix: 'C',
            groups: [
                {
                    fields: [
                        {
                            name: 'editor',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelistFromProjectField: 'staff'
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
                        },
                        {
                            name: 'composite',
                            inputType: Field.InputType.COMPOSITE,
                            subfields: [
                                {
                                    name: 'dropdown',
                                    inputType: Field.InputType.DROPDOWN,
                                    valuelist: {
                                        values: { 'valueSubfieldDropdown': {} }
                                    }
                                },
                                {
                                    name: 'checkboxes',
                                    inputType: Field.InputType.CHECKBOXES,
                                    valuelist: {
                                        values: { 'valueSubfieldCheckboxes': {} }
                                    }
                                }
                            ]
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

        documents[1].warnings = Warnings.createDefault();
        documents[1].warnings.outliers = {
            fields: {
                editor: ['outlierValue'],
                dropdown: ['outlierValue'],
                checkboxes: ['outlierValue'],
                dimension: ['outlierValue'],
                composite: { dropdown: ['outlierValue'], checkboxes: ['outlierValue'] }
            },
            values: ['outlierValue']
        };
        documents[1].resource.editor = ['Person'];
        documents[1].resource.dropdown = 'valueDropdown';
        documents[1].resource.checkboxes = ['valueCheckboxes'];
        documents[1].resource.dimension = [{ measurementPosition: 'valueDimension', inputValue: 1, inputUnit: 'cm'}];
        documents[1].resource.composite = [
            { dropdown: 'valueSubfieldDropdown', checkboxes: ['valueSubfieldCheckboxes'] }
        ];

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition);
        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        await WarningsUpdater.updateOutlierWarning(
            documents[1], mockProjectConfiguration, categoryDefinition, mockIndexFacade, mockDocumentCache
        );

        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('remove outlier warnings for valuelists from project field after updating project document', async done => {

        const categoryDefinition = {
            name: 'Category',
            identifierPrefix: 'C',
            groups: [
                {
                    fields: [
                        {
                            name: 'editor',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelistFromProjectField: 'staff'
                        },
                        {
                            name: 'checkboxes',
                            inputType: Field.InputType.CHECKBOXES,
                            valuelist: {
                                values: { 'valueCheckboxes': {} }
                            }
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
        documents[1].warnings.outliers = { fields: { editor: ['outlierValue'] }, values: ['outlierValue'] };
        documents[1].resource.editor = ['Person'];

        documents[2].warnings = Warnings.createDefault();
        documents[2].warnings.outliers = {
            fields: { editor: ['outlierValue'], checkboxes: ['outlierValue'] },
            values: ['outlierValue']
        };
        documents[2].resource.editor = ['Person'];
        documents[2].resource.checkboxes = ['outlierValue'];

        documents[3].warnings = Warnings.createDefault();
        documents[3].warnings.outliers = { fields: { checkboxes: ['outlierValue'] }, values: ['outlierValue'] };
        documents[3].resource.checkboxes = ['outlierValue'];

        const mockProjectConfiguration = getMockProjectConfiguration(categoryDefinition);

        const mockIndexFacade = getMockIndexFacade();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockDatastore = jasmine.createSpyObj('mockDatastore', ['find']);
        mockDatastore.find.and.returnValue(Promise.resolve({ documents: [documents[1], documents[2], documents[3]] }));

        await WarningsUpdater.updateOutlierWarning(
            documents[0], mockProjectConfiguration, categoryDefinition, mockIndexFacade, mockDocumentCache,
            mockDatastore, true
        );

        expect(documents[1].warnings).toBeUndefined();
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        expect(documents[2].warnings?.outliers?.fields).toEqual({ checkboxes: ['outlierValue'] });
        expect(documents[2].warnings?.outliers?.values).toEqual(['outlierValue']);

        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'warnings:exist');

        expect(documents[3].warnings?.outliers?.fields).toEqual({ checkboxes: ['outlierValue'] });
        expect(documents[3].warnings?.outliers?.values).toEqual(['outlierValue']);
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'warnings:exist');

        done();
    });
});
