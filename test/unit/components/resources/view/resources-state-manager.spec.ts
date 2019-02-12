import {FieldDocument} from 'idai-components-2';
import {Static} from '../../../static';
import {ResourcesStateManager} from '../../../../../app/components/resources/view/resources-state-manager';
import {ResourcesState} from '../../../../../app/components/resources/view/state/resources-state';

/**
 * @author Daniel de Oliveira
 */
describe('ResourcesStateManager', () => {

    let mockDatastore: any;
    let mockIndexFacade: any;

    const getCount = (constraintIndexName: string, matchTerm: string) => {
        return documents.map(document => document.resource.id)
            .find(id => id === matchTerm) ? 1 : 0
    };

    let resourcesStateManager: ResourcesStateManager;

    let documents: Array<FieldDocument>;
    let trenchDocument1: FieldDocument;


    beforeEach(() => {

        mockDatastore = jasmine.createSpyObj('datastore', ['get']);

        mockIndexFacade = jasmine.createSpyObj('indexFacade', ['getCount']);
        mockIndexFacade.getCount.and.callFake(getCount);

        const mockSerializer = jasmine.createSpyObj('serializer', ['store']);
        resourcesStateManager = new ResourcesStateManager(
            mockDatastore,
            mockIndexFacade,
            mockSerializer,
            undefined
        );

        resourcesStateManager.loaded = true;

        trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
    });



    it('repair navigation path if a relation is changed', async done => {

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

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

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

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

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

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

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

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

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

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

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

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


    it('set type filters and q', async done => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        const featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

        resourcesStateManager.setTypeFilters(['Find']);
        resourcesStateManager.setQueryString('abc');

        await resourcesStateManager.initialize('anotherOperationId');
        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual([]);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('');
        await resourcesStateManager.initialize(trenchDocument1.resource.id);

        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual(['Find']);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('abc');

        done();
    });


    it('delete type filter and q of segment', async done => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

        resourcesStateManager.setTypeFilters(undefined);
        resourcesStateManager.setQueryString('');
        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual(undefined);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('');

        done();
    });


    it('delete type filter and q of non segment', async done => {

        const trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');

        await resourcesStateManager.initialize(trenchDocument1.resource.id);

        resourcesStateManager.setTypeFilters(undefined);
        resourcesStateManager.setQueryString('');
        expect(ResourcesState.getTypeFilters(resourcesStateManager.get())).toEqual(undefined);
        expect(ResourcesState.getQueryString(resourcesStateManager.get())).toEqual('');

        done();
    });
});
