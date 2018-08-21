import {OperationViews} from '../../../../../app/components/resources/view/state/operation-views';
import {Static} from '../../../static';
import {ResourcesStateManager} from '../../../../../app/components/resources/view/resources-state-manager';
import {IdaiFieldDocument} from 'idai-components-2';
import {Query} from 'idai-components-2';
import {ResourcesState} from '../../../../../app/components/resources/view/state/resources-state';

/**
 * @author Daniel de Oliveira
 */
describe('ResourcesStateManager', () => {

    const viewsList = [
        {
            'mainTypeLabel': 'Schnitt',
            'label': 'Ausgrabung',
            'operationSubtype': 'Trench',
            'name': 'excavation'
        }
    ];

    let mockDatastore: any;


    const find = (query: Query) => {
        return {
            totalCount: documents.map(document => document.resource.id)
                .find(id => id == query.constraints['id:match']) ? 1 : 0
        };
    };

    let resourcesStateManager: ResourcesStateManager;

    let documents: Array<IdaiFieldDocument>;
    let trenchDocument1: IdaiFieldDocument;


    beforeEach(() => {

        mockDatastore = jasmine.createSpyObj('datastore', ['get', 'find']);
        mockDatastore.find.and.callFake(find);

        const mockSerializer = jasmine.createSpyObj('serializer', ['store']);
        resourcesStateManager = new ResourcesStateManager(
            mockDatastore,
            mockSerializer,
            new OperationViews(viewsList),
            undefined,
            undefined
        );

        resourcesStateManager.loaded = true;

        trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
    });



    it('repair navigation path if a relation is changed', async done => {

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const featureDocument2 = Static.ifDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        const findDocument1 = Static.ifDoc('Find 1', 'find1', 'Find', 'find1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1, featureDocument2, findDocument1];

        await resourcesStateManager.moveInto(featureDocument1);
        await resourcesStateManager.moveInto(findDocument1);

        findDocument1.resource.relations['liesWithin'] = [featureDocument2.resource.id];

        await resourcesStateManager.moveInto(featureDocument1);

        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).selectedSegmentId).toEqual(featureDocument1.resource.id);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments.length).toEqual(1);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments[0].document.resource.id).toEqual(featureDocument1.resource.id);

        done();
    });


    it('updateNavigationPathForDocument', async done => {

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const featureDocument2 = Static.ifDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        const findDocument1 = Static.ifDoc('Find 1', 'find1', 'Find', 'find1');
        const findDocument2 = Static.ifDoc('Find 2', 'find2', 'Find', 'find2');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
        findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument2.resource.relations['liesWithin'] = [featureDocument2.resource.id];

        documents = [trenchDocument1, featureDocument1, findDocument1];

        await resourcesStateManager.moveInto(featureDocument1);
        await resourcesStateManager.moveInto(findDocument1);
        await resourcesStateManager.moveInto(featureDocument1);

        mockDatastore.get.and.returnValue(Promise.resolve(featureDocument2));

        await resourcesStateManager.updateNavigationPathForDocument(findDocument2);

        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).selectedSegmentId).toEqual(featureDocument2.resource.id);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments.length).toEqual(1);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments[0].document.resource.id).toEqual(featureDocument2.resource.id);

        done();
    });


    it('updateNavigationPathForDocument - is correct navigation path', async done => {

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const featureDocument2 = Static.ifDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        const findDocument1 = Static.ifDoc('Find 1', 'find1', 'Find', 'find1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1, findDocument1];

        await resourcesStateManager.moveInto(featureDocument1);
        await resourcesStateManager.moveInto(findDocument1);

        await resourcesStateManager.updateNavigationPathForDocument(featureDocument1);

        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).selectedSegmentId).toEqual(undefined);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments.length).toEqual(2);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments[0].document.resource.id).toEqual(featureDocument1.resource.id);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments[1].document.resource.id).toEqual(findDocument1.resource.id);

        done();
    });


    it('step into', async done => {

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1];

        await resourcesStateManager.moveInto(featureDocument1);

        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).selectedSegmentId).toEqual(featureDocument1.resource.id);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments.length).toEqual(1);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments[0].document.resource.id).toEqual(featureDocument1.resource.id);

        done();
    });


    it('step out', async done => {

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1];

        await resourcesStateManager.moveInto(featureDocument1);
        await resourcesStateManager.moveInto(undefined);

        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).selectedSegmentId).toEqual(undefined);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments.length).toEqual(1);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments[0].document.resource.id).toEqual(featureDocument1.resource.id);

        done();
    });


    it('repair navigation path if a document is deleted', async done => {

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const findDocument1 = Static.ifDoc('Find 1', 'find1', 'Find', 'find1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1, findDocument1];

        await resourcesStateManager.moveInto(featureDocument1);
        await resourcesStateManager.moveInto(findDocument1);
        await resourcesStateManager.moveInto(featureDocument1);

        documents.pop();

        await resourcesStateManager.moveInto(undefined);

        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).selectedSegmentId).toEqual(undefined);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments.length).toEqual(1);
        expect(ResourcesState.getNavigationPath(resourcesStateManager.get()).segments[0].document.resource.id).toEqual(featureDocument1.resource.id);

        done();
    });


    it('set type filters and q', () => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        resourcesStateManager.setTypeFilters(['Find']);
        resourcesStateManager.setQueryString('abc');

        resourcesStateManager.initialize('survey');
        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual([]);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('');
        resourcesStateManager.initialize('excavation');

        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual(['Find']);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('abc');
    });


    it('delete type filter and q of segment', () => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        resourcesStateManager.setTypeFilters(undefined);
        resourcesStateManager.setQueryString('');
        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual(undefined);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('');
    });


    it('delete type filter and q of non segment', () => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');

        resourcesStateManager.initialize('excavation');
        resourcesStateManager.setMainTypeDocument(trenchDocument1.resource.id);

        resourcesStateManager.setTypeFilters(undefined);
        resourcesStateManager.setQueryString('');
        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual(undefined);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('');
    });
});
