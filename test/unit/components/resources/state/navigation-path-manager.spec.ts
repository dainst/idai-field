import {IdaiFieldDocument} from 'idai-components-2/field';
import {Query} from 'idai-components-2/core';
import {ResourcesState} from '../../../../../app/components/resources/state/resources-state';
import {OperationViews} from '../../../../../app/components/resources/state/operation-views';
import {NavigationPathManager} from '../../../../../app/components/resources/state/navigation-path-manager';
import {Static} from '../../../static';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('NavigationPathManager', () => {

    const viewsList = [
        {
            'mainTypeLabel': 'Schnitt',
            'label': 'Ausgrabung',
            'operationSubtype': 'Trench',
            'name': 'excavation'
        }
    ];


    let resourcesState: ResourcesState;
    let navigationPathManager: NavigationPathManager;
    let mockDatastore: any;

    let documents: Array<IdaiFieldDocument>;
    let trenchDocument1: IdaiFieldDocument;


    const find = (query: Query) => {
        return {
            totalCount: documents.map(document => document.resource.id)
                .find(id => id == query.constraints['id:match']) ? 1 : 0
        };
    };


    beforeEach(() => {

        const mockSerializer = jasmine.createSpyObj('serializer', ['store']);
        resourcesState = new ResourcesState(
            mockSerializer,
            new OperationViews(viewsList),
            undefined,
            undefined
        );

        mockDatastore = jasmine.createSpyObj('datastore', ['get', 'find']);
        mockDatastore.find.and.callFake(find);

        navigationPathManager = new NavigationPathManager(resourcesState, mockDatastore);

        resourcesState.loaded = true;

        documents = [];
    });


    beforeEach(async () => {

        trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
        await resourcesState.initialize('excavation');
        resourcesState.setMainTypeDocument(trenchDocument1);
    });


    it('step into', async done => {

        const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1];

        await navigationPathManager.moveInto(featureDocument1);

        expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument1);
        expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
        expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);

        done();
    });


    it('step out', async done => {

        const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1];

        await navigationPathManager.moveInto(featureDocument1);
        await navigationPathManager.moveInto(undefined);

        expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(undefined);
        expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
        expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);

        done();
    });


    it('repair navigation path if a document is deleted', async done => {

        const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const findDocument1 = Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1, findDocument1];

        await navigationPathManager.moveInto(featureDocument1);
        await navigationPathManager.moveInto(findDocument1);
        await navigationPathManager.moveInto(featureDocument1);

        documents.pop();

        await navigationPathManager.moveInto(undefined);

        expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(undefined);
        expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
        expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);

        done();
    });


    it('repair navigation path if a relation is changed', async done => {

        const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const featureDocument2 = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        const findDocument1 = Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1, featureDocument2, findDocument1];

        await navigationPathManager.moveInto(featureDocument1);
        await navigationPathManager.moveInto(findDocument1);

        findDocument1.resource.relations['liesWithin'] = [featureDocument2.resource.id];

        await navigationPathManager.moveInto(featureDocument1);

        expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument1);
        expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
        expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);

        done();
    });


    it('updateNavigationPathForDocument', async done => {

        const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const featureDocument2 = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        const findDocument1 = Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
        const findDocument2 = Static.idfDoc('Find 2', 'find2', 'Find', 'find2');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
        findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument2.resource.relations['liesWithin'] = [featureDocument2.resource.id];

        documents = [trenchDocument1, featureDocument1, findDocument1];

        await navigationPathManager.moveInto(featureDocument1);
        await navigationPathManager.moveInto(findDocument1);
        await navigationPathManager.moveInto(featureDocument1);

        mockDatastore.get.and.returnValue(Promise.resolve(featureDocument2));

        await navigationPathManager.updateNavigationPathForDocument(findDocument2);

        expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument2);
        expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
        expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument2);

        done();
    });


    it('updateNavigationPathForDocument - is correct navigation path', async done => {

        const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        const featureDocument2 = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        const findDocument1 = Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        documents = [trenchDocument1, featureDocument1, findDocument1];

        await navigationPathManager.moveInto(featureDocument1);
        await navigationPathManager.moveInto(findDocument1);

        await navigationPathManager.updateNavigationPathForDocument(featureDocument1);

        expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(undefined);
        expect(navigationPathManager.getNavigationPath().elements.length).toEqual(2);
        expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);
        expect(navigationPathManager.getNavigationPath().elements[1]).toEqual(findDocument1);

        done();
    });
});
