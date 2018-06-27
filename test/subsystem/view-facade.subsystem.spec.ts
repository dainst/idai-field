import {ProjectConfiguration, Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {ViewFacade} from '../../app/components/resources/state/view-facade';
import {ResourcesState} from '../../app/components/resources/state/core/resources-state';
import {IdaiFieldDocumentDatastore} from '../../app/core/datastore/field/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../app/core/datastore/field/idai-field-type-converter';
import {OperationViews} from '../../app/components/resources/state/core/operation-views';
import {Static} from '../unit/static';
import {DAOsSpecHelper} from './daos-spec-helper';
import {TypeUtility} from '../../app/core/model/type-utility';
import {ViewDefinition} from '../../app/components/resources/state/core/view-definition';
import {toResourceId} from '../../app/components/resources/state/navpath/navigation-path-segment';

/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 */
export function main() {


    describe('ViewFacade/Subsystem', () => {

        const viewsList: ViewDefinition[] = [
            {
                'label': 'Ausgrabung',
                'operationSubtype': 'Trench',
                'name': 'excavation'
            }
        ];

        const pc = {
            types: [
                { 'type': 'Place', 'fields': [] },
                { 'type': 'Survey', 'fields': [] },
                { 'type': 'Building', 'fields': [] },
                { 'type': 'Trench', 'fields': [] },
                { 'type': 'Image', 'fields': [] },
                { 'type': 'Find', 'fields': [] },
                { 'type': 'Feature', 'fields': [] },
                { 'type': 'Project', 'fields': [] }
            ]
        };

        let viewFacade: ViewFacade;
        let resourcesState: ResourcesState;
        let stateSerializer;
        let changesStream;
        let settingsService;
        let loading;

        let projectDocument: Document;
        let trenchDocument1: IdaiFieldDocument;
        let trenchDocument2: IdaiFieldDocument;
        let findDocument1: IdaiFieldDocument;
        let findDocument2: IdaiFieldDocument;
        let featureDocument1: IdaiFieldDocument;
        let featureDocument2: IdaiFieldDocument;
        let idaiFieldDocumentDatastore: CachedDatastore<IdaiFieldDocument>;


        beforeEach(async done => {

            spyOn(console, 'debug'); // suppress console.debug

            const {datastore, documentCache, indexFacade} = DAOsSpecHelper.createPouchdbDatastore('testdb');
            idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
                datastore, indexFacade, documentCache,
                new IdaiFieldTypeConverter(new TypeUtility(new ProjectConfiguration(pc))));

            projectDocument = Static.doc('testdb','testdb','Project','project');
            trenchDocument1 = Static.ifDoc('trench1','trench1','Trench','t1');
            trenchDocument1.resource.relations['isRecordedIn'] = ['testdb'];
            trenchDocument2 = Static.ifDoc('trench2','trench2','Trench','t2');
            trenchDocument2.resource.relations['isRecordedIn'] = ['testdb'];

            findDocument1 = Static.ifDoc('Find 1','find1','Find', 'find1');
            findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument2 = Static.ifDoc('Find 2','find2','Find', 'find2');
            findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument1 = Static.ifDoc('Feature 1','feature1','Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument1.resource.relations['includes'] = [findDocument1.resource.id, findDocument2.resource.id];
            findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
            findDocument2.resource.relations['liesWithin'] = [featureDocument1.resource.id];

            featureDocument2 = Static.ifDoc('Feature 2','feature2','Feature', 'feature2');
            featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            await idaiFieldDocumentDatastore.create(projectDocument, 'u');
            await idaiFieldDocumentDatastore.create(trenchDocument1, 'u');
            await idaiFieldDocumentDatastore.create(trenchDocument2, 'u');
            await idaiFieldDocumentDatastore.create(findDocument1, 'u');
            await idaiFieldDocumentDatastore.create(findDocument2, 'u');
            await idaiFieldDocumentDatastore.create(featureDocument1, 'u');
            await idaiFieldDocumentDatastore.create(featureDocument2, 'u');
            done();
        });


        beforeEach(() => {

            settingsService =
                jasmine.createSpyObj('settingsService', ['getUsername', 'getSelectedProject', 'getProjectDocument']);
            settingsService.getUsername.and.returnValue('user');
            settingsService.getSelectedProject.and.returnValue('testdb');
            settingsService.getProjectDocument.and.returnValue(projectDocument);

            stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
            stateSerializer.load.and.returnValue(Promise.resolve({}));
            stateSerializer.store.and.returnValue(Promise.resolve());

            changesStream = jasmine.createSpyObj('changesStream', ['notifications']);
            changesStream.notifications.and.returnValue({
                subscribe: () => {}
            });

            resourcesState = new ResourcesState(
                stateSerializer,
                new OperationViews(viewsList),
                [],
                undefined,
                undefined
            );
            resourcesState.loaded = true;

            loading = jasmine.createSpyObj('loading', ['start', 'stop']);

            viewFacade = new ViewFacade(
                idaiFieldDocumentDatastore,
                changesStream,
                resourcesState,
                loading
            );
        });


        afterEach((done) => new PouchDB('testdb').destroy().then(() => {done()}), 5000);


        it('reload layer ids on startup', async done => {

            resourcesState.loaded = false;
            stateSerializer.load.and.returnValue({ excavation: {
                navigationPaths: {'t1': {elements: []}},
                layerIds: {'t1': ['layerid1']}
            }});
            await viewFacade.selectView('excavation');
            await viewFacade.selectOperationTypeDocument(trenchDocument1);

            expect(viewFacade.getActiveLayersIds()).toEqual(['layerid1']);
            done();
        });


        it('reload predefined layer ids on startup in test/demo project', async done => {

            resourcesState = new ResourcesState(
                stateSerializer,
                new OperationViews(viewsList),
                [],
                'test',
                false
            );
            resourcesState.loaded = false;

            viewFacade = new ViewFacade(
                idaiFieldDocumentDatastore,
                changesStream,
                resourcesState,
                loading
            );

            await viewFacade.selectView('excavation');
            await viewFacade.selectOperationTypeDocument(trenchDocument1);

            expect(viewFacade.getActiveLayersIds()).toEqual(['o25']);
            done();
        });


        it('operations overview: populate document list', async done => {

            await viewFacade.selectView('project');
            expect(viewFacade.getDocuments().length).toBe(2);
            const identifiers = viewFacade.getDocuments().map(document => document.resource.identifier);
            expect(identifiers).toContain('trench1');
            expect(identifiers).toContain('trench2');
            done();
        });


        it('operations overview: search', async done => {

            await viewFacade.selectView('project');
            await viewFacade.setSearchString('trench2');
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('trench2');
            done();
        });


        it('operations view: populate document list', async done => {

            await viewFacade.selectView('excavation');
            const documents: Array<Document> = viewFacade.getDocuments();
            expect(documents.length).toBe(2);
            expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
            expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);
            done();
        });


        it('operations view: select operations type document', async done => {

            const findDocument3 = Static.ifDoc('Find 3','find3','Find', 'find3');
            findDocument3.resource.relations['isRecordedIn'] = [trenchDocument2.resource.id];
            await idaiFieldDocumentDatastore.create(findDocument3, 'u');

            await viewFacade.selectView('excavation');
            await viewFacade.selectOperationTypeDocument(trenchDocument2);
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find3');
            done();
        });


        it('operations view: search', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.setSearchString('feature2');
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('feature2');
            done();
        });


        it('operations view: set selected, query invalidated', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.setSearchString('feature1');
            await viewFacade.setSelectedDocument(featureDocument2);
            expect(viewFacade.getQueryString()).toEqual('');
            expect(viewFacade.getDocuments().length).toBe(2);
            done();
        });


        it('operations view: set selected in operations view, query not invalidated', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.setSearchString('feature1');
            await viewFacade.setSelectedDocument(featureDocument1);
            expect(viewFacade.getQueryString()).toEqual('feature1');
            expect(viewFacade.getDocuments().length).toBe(1);
            done();
        });


        it('operations view: query matches selection', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.moveInto(featureDocument1);
            await viewFacade.setSelectedDocument(findDocument1);
            await viewFacade.setSearchString('find1');
            expect(viewFacade.getSelectedDocument().resource.id).toBe(findDocument1.resource.id);
            done();
        });


        it('operations view: query does not match selection, deselect', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.setSelectedDocument(findDocument1);
            await viewFacade.setSearchString('find2');
            expect(viewFacade.getSelectedDocument()).toBe(undefined);
            done();
        });


        it('deselect on switching views', async done => {

            await viewFacade.selectView('project');
            await viewFacade.setSelectedDocument(trenchDocument1);
            expect(viewFacade.getSelectedDocument()).toEqual(trenchDocument1);

            await viewFacade.selectView('excavation');
            expect(viewFacade.getSelectedDocument()).toEqual(undefined);
            done();
        });


        it('operations view: previous selection gets restored', async () => {

            await viewFacade.selectView('excavation');
            await viewFacade.moveInto(featureDocument1);
            await viewFacade.setSelectedDocument(findDocument1);

            await viewFacade.moveInto(undefined);
            expect(viewFacade.getSelectedDocument()).toBeUndefined();

            await viewFacade.moveInto(featureDocument1);
            expect(viewFacade.getSelectedDocument().resource.id).toBe(findDocument1.resource.id);
        });


        it('operations view: previous selection gets restored on view change', async () => {

            await viewFacade.selectView('excavation');
            await viewFacade.setSelectedDocument(featureDocument2);

            await viewFacade.selectView('project');
            expect(viewFacade.getSelectedDocument()).toBeUndefined();
            await viewFacade.selectView('excavation');
            expect(viewFacade.getSelectedDocument()).toBe(featureDocument2);
        });


        // there was a problem ...
        it('operations view: previous selection gets restored when coming from overview', async () => {

            await viewFacade.selectView('excavation');
            await viewFacade.setSelectedDocument(featureDocument2);

            await viewFacade.selectView('project');
            await viewFacade.selectView('excavation');
            await viewFacade.selectOperationTypeDocument(trenchDocument1); // ... with this deleting the selection

            expect(viewFacade.getSelectedDocument()).toBe(featureDocument2);
        });


        it('operations view: show only documents with liesWithin relation to a specific resource', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.moveInto(featureDocument1);

            let documents = await viewFacade.getDocuments();
            expect(documents.length).toBe(2);
            expect(documents[0].resource.id).toEqual(findDocument1.resource.id);
            expect(documents[1].resource.id).toEqual(findDocument2.resource.id);

            await viewFacade.moveInto(undefined);
            documents = await viewFacade.getDocuments();
            expect(documents.length).toBe(2);
            expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
            expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);

            done();
        });


        it('operations view: get navigation path, switch between operation type docs', async done => {

            const featureDocument3 = Static.ifDoc('Feature 3','feature3','Feature', 'feature3');
            featureDocument3.resource.relations['isRecordedIn'] = [trenchDocument2.resource.id];
            await idaiFieldDocumentDatastore.create(featureDocument3, 'u');
            await viewFacade.selectView('excavation');

            await viewFacade.moveInto(featureDocument1);

            let navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.segments.length).toEqual(1);
            expect(toResourceId(navigationPath.segments[0])).toEqual(featureDocument1.resource.id);
            expect(navigationPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

            viewFacade.selectOperationTypeDocument(trenchDocument2);
            await viewFacade.moveInto(featureDocument3);

            navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.segments.length).toEqual(1);
            expect(toResourceId(navigationPath.segments[0])).toEqual(featureDocument3.resource.id);
            expect(navigationPath.selectedSegmentId).toEqual(featureDocument3.resource.id);

            viewFacade.selectOperationTypeDocument(trenchDocument1);
            navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

            done();
        });
    });
}
