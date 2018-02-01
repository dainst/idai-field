import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Query} from 'idai-components-2/datastore';
import {ResourcesState} from '../../../../../app/components/resources/state/resources-state';
import {OperationViews} from '../../../../../app/components/resources/state/operation-views';
import {Static} from '../../../helper/static';
import {NavigationPathManager} from '../../../../../app/components/resources/state/navigation-path-manager';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export function main() {

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

        let documents: Array<IdaiFieldDocument>;


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

            const mockDatastore = jasmine.createSpyObj('datastore', ['get', 'find']);
            mockDatastore.find.and.callFake(find);

            navigationPathManager = new NavigationPathManager(resourcesState, mockDatastore);

            resourcesState.loaded = true;

            documents = [];
        });


        it('step into', async done => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            documents = [trenchDocument1, featureDocument1];

            await resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            await navigationPathManager.moveInto(featureDocument1);

            expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument1);
            expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
            expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);

            done();
        });


        it('step out', async done => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            documents = [trenchDocument1, featureDocument1];

            await resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            await navigationPathManager.moveInto(featureDocument1);
            await navigationPathManager.moveInto(undefined);

            expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(undefined);
            expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
            expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);

            done();
        });


        it('repair navigation path if a document is deleted', async done => {

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
            const findDocument1 = Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

            documents = [trenchDocument1, featureDocument1, findDocument1];

            await resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

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

            const trenchDocument1 = Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
            const featureDocument1 = Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
            const featureDocument2 = Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
            const findDocument1 = Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];

            documents = [trenchDocument1, featureDocument1, featureDocument2, findDocument1];

            await resourcesState.initialize('excavation');
            resourcesState.setMainTypeDocument(trenchDocument1);

            await navigationPathManager.moveInto(featureDocument1);
            await navigationPathManager.moveInto(findDocument1);

            findDocument1.resource.relations['liesWithin'] = [featureDocument2.resource.id];

            await navigationPathManager.moveInto(featureDocument1);

            expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument1);
            expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
            expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);

            done();
        });
    });
}