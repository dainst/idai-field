import { WarningsUpdater } from '../../src/warnings/warnings-updater';
import { Warnings } from '../../src/model/warnings';
import { Field } from '../../src/model/configuration/field';
import { doc } from '../test-helpers';
import { CategoryForm } from '../../src/model/configuration/category-form';
import { DateConfiguration } from '../../src/model/configuration/date-configuration';
import { Document } from '../../src/model/document/document';
import { WarningsManager } from '../../src/warnings/warnings-manager';
import { Datastore } from '../../src/datastore/datastore';


const createDocument = (id: string, category: string = 'Category') => doc('sd', 'identifier' + id, category, id);


function buildWarningsUpdater(warningsUpdater, mockIndexFacade, mockProjectConfiguration, documents) {

    return new WarningsUpdater(
        warningsUpdater,
        mockIndexFacade,
        getMockDocumentCache(documents),
        mockProjectConfiguration
    );
}


function getMockProjectConfiguration(categoryDefinition?, parentCategoryDefinition?) {

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
            ]
        }]);
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


function getMockDocumentCache(documents: Array<Document>) {

    const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
    mockDocumentCache.get.and.callFake(resourceId => {
        return documents.find(document => document.resource.id === resourceId);
    });

    return mockDocumentCache;
}


function getMockFindFunction(returnedDocuments: Array<Document>) {

    return () => Promise.resolve({ documents: returnedDocuments } as Datastore.FindResult);
}


/**
 * @author Thomas Kleinke
 */
describe('WarningsUpdater', () => {

    it('update index independent warnings', () => {

        const parentCategoryDefinition = {
            name: 'Process',
            groups: []
        } as any;

        const categoryDefinition = {
            name: 'Category',
            identifierPrefix: 'C',
            parentCategory: parentCategoryDefinition,
            groups: [
                {
                    fields: [
                        {
                            name: 'identifier',
                            inputType: Field.InputType.IDENTIFIER
                        },
                        {
                            name: 'shortDescription',
                            inputType: Field.InputType.INPUT
                        },
                        {
                            name: 'geometry',
                            inputType: Field.InputType.GEOMETRY,
                            geometryTypes: ['Polygon']
                        },
                        {
                            name: 'number',
                            inputType: Field.InputType.FLOAT
                        },
                        {
                            name: 'mandatoryField',
                            inputType: Field.InputType.INPUT,
                            mandatory: true
                        },
                        {
                            name: 'mandatoryRelation',
                            inputType: Field.InputType.RELATION,
                            mandatory: true
                        },
                        {
                            name: 'state',
                            inputType: Field.InputType.DROPDOWN
                        },
                        {
                            name: 'date',
                            inputType: Field.InputType.DATE,
                            dateConfiguration: {
                                dataType: DateConfiguration.DataType.OPTIONAL,
                                inputMode: DateConfiguration.InputMode.OPTIONAL
                            }
                        },
                        {
                            name: 'conditionalField',
                            inputType: Field.InputType.INPUT,
                            condition: {
                                fieldName: 'state',
                                values: ['completed']
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
        documents[0].resource.identifier = '1;';
        documents[0].resource.number = 'text';
        documents[0].resource.unconfiguredField = 'text';
        documents[0].resource.state = 'planned';
        documents[0].resource.date = { value: '01.01.1990', isRange: false };
        documents[0].resource.conditionalField = 'text';
        documents[0].resource.relations.unconfiguredRelation = ['target'];
        documents[0].resource.geometry = { type: 'Point', coordinates: [1.0, 2.0] };

        documents[1].resource.identifier = 'C2';
        delete documents[1].resource.category;

        documents[2].resource.identifier = 'C3';
        documents[2].resource.number = 1;
        documents[2].resource.mandatoryField = 'text';
        documents[2].resource.relations.mandatoryRelation = ['C2'];
        documents[2].resource.state = 'completed';
        documents[2].resource.date = { value: '01.01.1990', isRange: false };
        documents[2].resource.geometry = {
            type: 'Polygon',
            coordinates: [[[10.5, 25.3], [10.7, 25.4], [11.5, 26.6], [10.5, 25.3]]]
        };

        const warningsManager = new WarningsManager();
        
        const warningsUpdater = buildWarningsUpdater(
            warningsManager, getMockIndexFacade(),
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );

        warningsUpdater.updateIndexIndependentWarnings(documents[0]);
        warningsUpdater.updateIndexIndependentWarnings(documents[1]);
        warningsUpdater.updateIndexIndependentWarnings(documents[2]);
        
        expect(warningsManager.get(documents[0])).toEqual({
            unconfiguredFields: ['unconfiguredField', 'unconfiguredRelation'],
            invalidFields: ['number'],
            missingMandatoryFields: ['mandatoryField', 'mandatoryRelation'],
            unfulfilledConditionFields: ['conditionalField'],
            unallowedCharacterFields: ['identifier'],
            conflicts: true,
            missingIdentifierPrefix: true,
            invalidProcessState: true,
            unallowedGeometryType: true
        });
        expect(warningsManager.get(documents[1])).toEqual({
            unconfiguredFields: [],
            invalidFields: [],
            missingMandatoryFields: [],
            unfulfilledConditionFields: [],
            unallowedCharacterFields: [],
            unconfiguredCategory: true
        });
        expect(warningsManager.get(documents[2])).toBeUndefined();
    });

    
    it('set non-unique field warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.getCount.and.returnValue(2);

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(), documents
        );

        await warningsUpdater.updateNonUniqueFieldWarning(
            documents[0], 'identifier', 'nonUniqueIdentifier', getMockFindFunction([documents[1]]), undefined, true
        );

        expect(warningsManager.get(documents[0])?.nonUniqueIdentifier).toBe(true);
        expect(warningsManager.get(documents[1])?.nonUniqueIdentifier).toBe(true);

        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'nonUniqueIdentifier:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'nonUniqueIdentifier:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[0], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('remove non-unique field warnings', async done => {

        const documents = [
            createDocument('1'),
            createDocument('2')
        ];

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.getCount.and.returnValue(1);

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(), documents
        );

        for (let document of documents) {
            const warnings = Warnings.createDefault();
            warnings.nonUniqueIdentifier = true;
            warningsManager.set(document, warnings);
        }

        await warningsUpdater.updateNonUniqueFieldWarning(
            documents[0], 'identifier', 'nonUniqueIdentifier', getMockFindFunction([documents[1]]),
            'previousIdentifier', true
        );

        expect(warningsManager.get(documents[0])).toBeUndefined();
        expect(warningsManager.get(documents[1])).toBeUndefined();

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

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(categoryDefinition, undefined), documents
        );

        await warningsUpdater.updateResourceLimitWarning(
            documents[0], categoryDefinition,
            getMockFindFunction(documents.slice()), true
        );

        expect(warningsManager.get(documents[0])?.resourceLimitExceeded).toBe(true);
        expect(warningsManager.get(documents[1])?.resourceLimitExceeded).toBe(true);

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

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(categoryDefinition, undefined), documents
        );

        for (let document of documents) {
            const warnings = Warnings.createDefault();
            warnings.resourceLimitExceeded = true;
            warningsManager.set(document, warnings);
        }

        await warningsUpdater.updateResourceLimitWarnings(categoryDefinition, getMockFindFunction(documents.slice()));

        expect(warningsManager.get(documents[0])).toBeUndefined();
        expect(warningsManager.get(documents[1])).toBeUndefined();

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

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade,
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );
        
        await warningsUpdater.updateResourceLimitWarning(
            documents[0], categoryDefinition,
            getMockFindFunction(documents.slice()), true
        );

        expect(warningsManager.get(documents[0])?.resourceLimitExceeded).toBe(true);
        expect(warningsManager.get(documents[1])?.resourceLimitExceeded).toBe(true);

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

        const mockIndexFacade = getMockIndexFacade();
        mockIndexFacade.find.and.returnValue(['1', '2']);

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade,
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );

        for (let document of documents) {
            const warnings = Warnings.createDefault();
            warnings.resourceLimitExceeded = true;
            warningsManager.set(document, warnings);
        }

        await warningsUpdater.updateResourceLimitWarnings(categoryDefinition, getMockFindFunction(documents.slice()));

        expect(warningsManager.get(documents[0])).toBeUndefined();
        expect(warningsManager.get(documents[1])).toBeUndefined();

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
        
        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(), documents
        );

        await warningsUpdater.updateMissingRelationTargetWarning(documents[0], getMockFindFunction(documents.slice()));

        expect(warningsManager.get(documents[0])?.missingRelationTargets).toEqual({
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

        documents[0].resource.relations['relation'] = ['2'];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(), documents
        );

        const warnings = Warnings.createDefault();
        warnings.missingRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['missing']
        };
        warningsManager.set(documents[0], warnings);

        await warningsUpdater.updateMissingRelationTargetWarning(documents[0], getMockFindFunction(documents.slice()));

        expect(warningsManager.get(documents[0])).toBeUndefined();

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

        documents[1].resource.relations['relation'] = ['1'];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(), documents
        );

        const warnings = Warnings.createDefault();
        warnings.missingRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['1']
        };
        warningsManager.set(documents[1], warnings);

        await warningsUpdater.updateMissingRelationTargetWarning(
            documents[0], getMockFindFunction([documents[1]]), true
        );

        expect(warningsManager.get(documents[1])).toBeUndefined();

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

        const warningsManager = new WarningsManager();

        const mockDocumentCache = jasmine.createSpyObj('mockDocumentCache', ['get']);
        mockDocumentCache.get.and.callFake(resourceId => {
            return documents.find(document => document.resource.id === resourceId);
        });

        const mockProjectConfiguration = getMockProjectConfiguration();
        mockProjectConfiguration.isAllowedRelationDomainCategory.and.returnValue(false);

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, mockProjectConfiguration, documents
        );

        await warningsUpdater.updateInvalidRelationTargetWarning(documents[0], getMockFindFunction(documents.slice()));

        expect(warningsManager.get(documents[0])?.invalidRelationTargets).toEqual({
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

        documents[0].resource.relations['relation'] = ['2'];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(), documents
        );

        const warnings = Warnings.createDefault();
        warnings.invalidRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['2']
        };
        warningsManager.set(documents[0], warnings);

        await warningsUpdater.updateInvalidRelationTargetWarning(documents[0], getMockFindFunction(documents.slice()));

        expect(warningsManager.get(documents[0])).toBeUndefined();
    
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

        documents[1].resource.relations['relation'] = ['1'];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(), documents
        );

        const warnings = Warnings.createDefault();
        warnings.invalidRelationTargets = {
            relationNames: ['relation'],
            targetIds: ['1']
        };
        warningsManager.set(documents[1], warnings);

        await warningsUpdater.updateInvalidRelationTargetWarning(
            documents[0], getMockFindFunction([documents[1]]), true
        );

        expect(warningsManager.get(documents[1])).toBeUndefined();

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

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade,
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );

        await warningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], getMockFindFunction(documents.slice())
        );

        expect(warningsManager.get(documents[0])?.missingOrInvalidParent).toBe(true);

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

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade,
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );

        await warningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], getMockFindFunction(documents.slice())
        );

        expect(warningsManager.get(documents[0])?.missingOrInvalidParent).toBe(true);

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

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade,
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );

        await warningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], getMockFindFunction(documents.slice())
        );

        expect(warningsManager.get(documents[0])?.missingOrInvalidParent).toBe(true);

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

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade,
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );

        const warnings = Warnings.createDefault();
        warnings.missingOrInvalidParent = true;
        warningsManager.set(documents[0], warnings);

        await warningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], getMockFindFunction(documents.slice())
        );

        expect(warningsManager.get(documents[0])).toBeUndefined();

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
        documents[2].resource.relations['liesWithin'] = ['2'];
        documents[2].resource.relations['isRecordedIn'] = ['1'];
        documents[3].resource.relations['liesWithin'] = ['2'];
        documents[3].resource.relations['isRecordedIn'] = ['1'];
        documents[4].resource.relations['liesWithin'] = ['3'];
        documents[4].resource.relations['isRecordedIn'] = ['1'];
        documents[5].resource.relations['liesWithin'] = ['4'];
        documents[5].resource.relations['isRecordedIn'] = ['1'];

        const parentCategoryDefinition: CategoryForm = {
            name: 'ParentCategory',
            groups: []
        } as CategoryForm;

        const categoryDefinition: CategoryForm = {
            name: 'Category',
            groups: []
        } as CategoryForm;

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade,
            getMockProjectConfiguration(categoryDefinition, parentCategoryDefinition),
            documents
        );

        for (let document of documents.slice(1)) {
            const warnings = Warnings.createDefault();
            warnings.missingOrInvalidParent = true;
            warningsManager.set(document, warnings);
        }

        await warningsUpdater.updateMissingOrInvalidParentWarning(
            documents[0], getMockFindFunction(documents.slice(1)), true
        );

        expect(warningsManager.get(documents[0])).toBeUndefined();
        expect(warningsManager.get(documents[1])).toBeUndefined();
        expect(warningsManager.get(documents[2])).toBeUndefined();
        expect(warningsManager.get(documents[3])).toBeUndefined();
        expect(warningsManager.get(documents[4])).toBeUndefined();
        expect(warningsManager.get(documents[5])).toBeUndefined();

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
                            name: 'weight',
                            inputType: Field.InputType.WEIGHT,
                            valuelist: {
                                values: { 'valueWeight': {} }
                            }
                        },
                        {
                            name: 'volume',
                            inputType: Field.InputType.VOLUME,
                            valuelist: {
                                values: { 'valueVolume': {} }
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

        documents[0].resource.staff = [{ value: 'Person', selectable: true }];

        documents[1].resource.editor = ['outlierValue1'];
        documents[1].resource.dropdown = 'outlierValue2';
        documents[1].resource.checkboxes = ['outlierValue3'];
        documents[1].resource.dimension = [{ measurementPosition: 'outlierValue4', inputValue: 1, inputUnit: 'cm' }];
        documents[1].resource.weight = [{ measurementDevice: 'outlierValue5', inputValue: 1, inputUnit: 'g' }];
        documents[1].resource.volume = [{ measurementTechnique: 'outlierValue6', inputValue: 1, inputUnit: 'l' }];
        documents[1].resource.composite = [
            { dropdown: 'outlierValue7', checkboxes: ['outlierValue8'], url: 'http://www.example.de' }
        ];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(categoryDefinition), documents
        );

        await warningsUpdater.updateOutlierWarning(
            documents[1], categoryDefinition, getMockFindFunction(documents.slice())
        );

        expect(warningsManager.get(documents[1])?.outliers?.fields)
            .toEqual({
                editor: ['outlierValue1'],
                dropdown: ['outlierValue2'],
                checkboxes: ['outlierValue3'],
                dimension: ['outlierValue4'],
                weight: ['outlierValue5'],
                volume: ['outlierValue6'],
                composite: { dropdown: ['outlierValue7'], checkboxes: ['outlierValue8'] }
            });
        expect(warningsManager.get(documents[1])?.outliers?.values)
            .toEqual(['outlierValue1', 'outlierValue2', 'outlierValue3', 'outlierValue4', 'outlierValue5',
                'outlierValue6', 'outlierValue7', 'outlierValue8']);

        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');

        done();
    });


    it('do not set outlier warnings for unselectable values from project field', async done => {

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
                        }
                    ]
                }
            ]
        } as any;

        const documents = [
            createDocument('project', 'Project'),
            createDocument('1')
        ];

        documents[0].resource.staff = [{ value: 'Person', selectable: false }];

        documents[1].resource.editor = ['Person'];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(categoryDefinition), documents
        );

        await warningsUpdater.updateOutlierWarning(
            documents[1], categoryDefinition, getMockFindFunction(documents.slice())
        );

        expect(warningsManager.get(documents[1])).toBeUndefined();

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
                            name: 'weight',
                            inputType: Field.InputType.WEIGHT,
                            valuelist: {
                                values: { 'valueWeight': {} }
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

        documents[0].resource.staff = [{ value: 'Person', selectable: true }];

        documents[1].resource.editor = ['Person'];
        documents[1].resource.dropdown = 'valueDropdown';
        documents[1].resource.checkboxes = ['valueCheckboxes'];
        documents[1].resource.dimension = [{ measurementPosition: 'valueDimension', inputValue: 1, inputUnit: 'cm'}];
        documents[1].resource.weight = [{ measurementPosition: 'valueWeight', inputValue: 1, inputUnit: 'g'}];
        documents[1].resource.composite = [
            { dropdown: 'valueSubfieldDropdown', checkboxes: ['valueSubfieldCheckboxes'] }
        ];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(categoryDefinition), documents
        );

        const warnings = Warnings.createDefault();
        warnings.outliers = {
            fields: {
                editor: ['outlierValue'],
                dropdown: ['outlierValue'],
                checkboxes: ['outlierValue'],
                dimension: ['outlierValue'],
                weight: ['outlierValue'],
                composite: { dropdown: ['outlierValue'], checkboxes: ['outlierValue'] }
            },
            values: ['outlierValue']
        };
        warningsManager.set(documents[1], warnings);

        await warningsUpdater.updateOutlierWarning(
            documents[1], categoryDefinition, getMockFindFunction(documents.slice())
        );

        expect(warningsManager.get(documents[1])).toBeUndefined();

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

        documents[0].resource.staff = [{ value: 'Person', selectable: true }];

        documents[1].resource.editor = ['Person'];

        documents[2].resource.editor = ['Person'];
        documents[2].resource.checkboxes = ['outlierValue'];

        documents[3].resource.checkboxes = ['outlierValue'];

        const mockIndexFacade = getMockIndexFacade();

        const warningsManager = new WarningsManager();

        const warningsUpdater = buildWarningsUpdater(
            warningsManager, mockIndexFacade, getMockProjectConfiguration(categoryDefinition), documents
        );

        let warnings = Warnings.createDefault();
        warnings.outliers = { fields: { editor: ['outlierValue'] }, values: ['outlierValue'] };
        warningsManager.set(documents[1], warnings);

        warnings = Warnings.createDefault();
        warnings.outliers = {
            fields: { editor: ['outlierValue'], checkboxes: ['outlierValue'] },
            values: ['outlierValue']
        };
        warningsManager.set(documents[2], warnings);

        warnings = Warnings.createDefault();
        warnings.outliers = { fields: { checkboxes: ['outlierValue'] }, values: ['outlierValue'] };
        warningsManager.set(documents[3], warnings);

        await warningsUpdater.updateOutlierWarning(
            documents[0], categoryDefinition, getMockFindFunction(documents.slice(1)), true
        );

        expect(warningsManager.get(documents[1])).toBeUndefined();
        expect(warningsManager.get(documents[2])?.outliers?.fields).toEqual({ checkboxes: ['outlierValue'] });
        expect(warningsManager.get(documents[2])?.outliers?.values).toEqual(['outlierValue']);
        expect(warningsManager.get(documents[3])?.outliers?.fields).toEqual({ checkboxes: ['outlierValue'] });
        expect(warningsManager.get(documents[3])?.outliers?.values).toEqual(['outlierValue']);

        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[1], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).toHaveBeenCalledWith(documents[2], 'warnings:exist');
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'outliers:exist');
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'outlierValues:contain');
        expect(mockIndexFacade.putToSingleIndex).not.toHaveBeenCalledWith(documents[3], 'warnings:exist');

        done();
    });
});
