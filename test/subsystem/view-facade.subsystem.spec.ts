import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {ViewFacade} from '../../app/components/resources/state/view-facade';
import {ResourcesState} from '../../app/components/resources/state/resources-state';
import {IdaiFieldDocumentDatastore} from '../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../app/core/datastore/idai-field-type-converter';
import {ImageTypeUtility} from '../../app/common/image-type-utility';
import {OperationViews} from '../../app/components/resources/state/operation-views';
import {Static} from '../unit/static';
import {DAOsSpecHelper} from './daos-spec-helper';

/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 */
export function main() {


    describe('ViewFacade/Subsystem', () => {

        const viewsList = [
            {
                'mainTypeLabel': 'Schnitt',
                'label': 'Ausgrabung',
                'operationSubtype': 'Trench',
                'name': 'excavation'
            }
        ];

        const pc = {
            types: [
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
                new IdaiFieldTypeConverter(new ImageTypeUtility(new ProjectConfiguration(pc))));

            const projectDocument = Static.doc('testdb','testdb','Project','testdb');
            trenchDocument1 = Static.idfDoc('trench1','trench1','Trench','t1');
            trenchDocument1.resource.relations['isRecordedIn'] = ['testdb'];
            trenchDocument2 = Static.idfDoc('trench2','trench2','Trench','t2');
            trenchDocument2.resource.relations['isRecordedIn'] = ['testdb'];

            findDocument1 = Static.idfDoc('Find 1','find1','Find', 'find1');
            findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument2 = Static.idfDoc('Find 2','find2','Find', 'find2');
            findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument1 = Static.idfDoc('Feature 1','feature1','Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument1.resource.relations['includes'] = [findDocument1.resource.id, findDocument2.resource.id];

            featureDocument1.resource.relations['includes'] = [findDocument2.resource.id];
            findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
            findDocument2.resource.relations['liesWithin'] = [featureDocument1.resource.id];

            featureDocument2 = Static.idfDoc('Feature 2','feature2','Feature', 'feature2');
            featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            await idaiFieldDocumentDatastore.create(projectDocument);
            await idaiFieldDocumentDatastore.create(trenchDocument1);
            await idaiFieldDocumentDatastore.create(trenchDocument2);
            await idaiFieldDocumentDatastore.create(findDocument1);
            await idaiFieldDocumentDatastore.create(findDocument2);
            await idaiFieldDocumentDatastore.create(featureDocument1);
            await idaiFieldDocumentDatastore.create(featureDocument2);
            done();
        });


        beforeEach(() => {

            settingsService =
                jasmine.createSpyObj('settingsService', ['getUsername', 'getSelectedProject']);
            settingsService.getUsername.and.returnValue('user');
            settingsService.getSelectedProject.and.returnValue('testdb');

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
                undefined,
                undefined
            );
            resourcesState.loaded = true;

            viewFacade = new ViewFacade(
                idaiFieldDocumentDatastore,
                changesStream,
                settingsService,
                resourcesState
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
            await viewFacade.selectMainTypeDocument(trenchDocument1);

            expect(viewFacade.getActiveLayersIds()).toEqual(['layerid1']);
            done();
        });


        it('reload predefined layer ids on startup in test/demo project', async done => {

            resourcesState = new ResourcesState(
                stateSerializer,
                new OperationViews(viewsList),
                'test',
                false
            );
            resourcesState.loaded = false;

            viewFacade = new ViewFacade(
                idaiFieldDocumentDatastore,
                changesStream,
                settingsService,
                resourcesState
            );

            await viewFacade.selectView('excavation');
            await viewFacade.selectMainTypeDocument(trenchDocument1);

            expect(viewFacade.getActiveLayersIds()).toEqual(['o25']);
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

            const findDocument3 = Static.idfDoc('Find 3','find3','Find', 'find3');
            findDocument3.resource.relations['isRecordedIn'] = [trenchDocument2.resource.id];
            await idaiFieldDocumentDatastore.create(findDocument3);

            await viewFacade.selectView('excavation');
            await viewFacade.selectMainTypeDocument(trenchDocument2);
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
            await viewFacade.setSelectedDocument(findDocument1);
            await viewFacade.setSearchString('find1');
            expect(viewFacade.getSelectedDocument()).toBe(findDocument1);
            done();
        });


        it('operations view: query does not match selection, deselect', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.setSelectedDocument(findDocument1);
            await viewFacade.setSearchString('find2');
            expect(viewFacade.getSelectedDocument()).toBe(undefined);
            done();
        });


        it('operations view: show only documents with liesWithin relation to a specific resource', async done => {

            await viewFacade.selectView('excavation');
            await viewFacade.moveInto(featureDocument1 as any);

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


        it('build path while navigating, first element, then second', async done => {

            const featureDocument1a = Static.idfDoc('Feature 1a','feature1a','Feature', 'feature1a');
            featureDocument1a.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument1a.resource.relations['liesWithin'] = [featureDocument1.resource.id];
            await idaiFieldDocumentDatastore.create(featureDocument1a);

            const featureDocument1b = Static.idfDoc('Feature 1b','feature1b','Feature', 'feature1b');
            featureDocument1a.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument1a.resource.relations['liesWithin'] = [featureDocument1.resource.id];
            await idaiFieldDocumentDatastore.create(featureDocument1b);

            await viewFacade.selectView('excavation');

            // --

            await viewFacade.moveInto(featureDocument1 as any);

            let navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.elements.length).toEqual(1);
            expect(navigationPath.elements[0]).toEqual(featureDocument1);
            expect(navigationPath.rootDocument).toEqual(featureDocument1);

            await viewFacade.moveInto(featureDocument1a as any);

            navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.elements.length).toEqual(2);
            expect(navigationPath.elements[0]).toEqual(featureDocument1);
            expect(navigationPath.elements[1]).toEqual(featureDocument1a);
            expect(navigationPath.rootDocument).toEqual(featureDocument1a);

            await viewFacade.moveInto(featureDocument1 as any);

            navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.elements.length).toEqual(2);
            expect(navigationPath.elements[0]).toEqual(featureDocument1);
            expect(navigationPath.elements[1]).toEqual(featureDocument1a);
            expect(navigationPath.rootDocument).toEqual(featureDocument1);

            await viewFacade.moveInto(featureDocument1a as any);

            navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.elements.length).toEqual(2);
            expect(navigationPath.elements[0]).toEqual(featureDocument1);
            expect(navigationPath.elements[1]).toEqual(featureDocument1a);
            expect(navigationPath.rootDocument).toEqual(featureDocument1a);

            await viewFacade.moveInto(featureDocument1 as any);
            await viewFacade.moveInto(featureDocument1b as any);

            navigationPath = await viewFacade.getNavigationPath();
            expect(navigationPath.elements.length).toEqual(2);
            expect(navigationPath.elements[0]).toEqual(featureDocument1);
            expect(navigationPath.elements[1]).toEqual(featureDocument1b);
            expect(navigationPath.rootDocument).toEqual(featureDocument1b);

            done();
        });


        // TODO build up whole path automatically (in navigationpathmanager) when using selectDocument
    });
}
