import {Document, IdaiFieldDocument, ProjectConfiguration} from 'idai-components-2';
import * as PouchDB from 'pouchdb';
import {ViewFacade} from '../../app/components/resources/view/view-facade';
import {ResourcesStateManager} from '../../app/components/resources/view/resources-state-manager';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {createApp, setupSyncTestDb} from './daos-helper';
import {Static} from '../unit/static';
import {toResourceId} from '../../app/components/resources/view/state/navigation-path-segment';

/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 */

describe('ViewFacade/Subsystem', () => {
    
    let _viewFacade: ViewFacade;
    let resourcesState: ResourcesStateManager;
    let projectConfiguration: ProjectConfiguration;
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
    let _idaiFieldDocumentDatastore: CachedDatastore<IdaiFieldDocument>;


    /*
     * project
     * - trench1
     *   + feature1
     *      # find1
     *      # find2
     *   + feature2
     * - trench2
     */


    beforeEach(async done => {

        await setupSyncTestDb();

        const {
            viewFacade,
            idaiFieldDocumentDatastore,
        } = await createApp();
        
        _idaiFieldDocumentDatastore = idaiFieldDocumentDatastore;
        _viewFacade = viewFacade;

        // await new PouchDB('testdb').destroy();

        spyOn(console, 'debug'); // suppress console.debug

        trenchDocument1 = Static.ifDoc('trench1', 'trench1', 'Trench', 't1');
        trenchDocument1.resource.relations['isRecordedIn'] = ['testdb'];
        trenchDocument2 = Static.ifDoc('trench2','trench2','Trench','t2');
        trenchDocument2.resource.relations['isRecordedIn'] = ['testdb'];

        findDocument1 = Static.ifDoc('Find 1', 'find1', 'Find', 'find1');
        findDocument1.resource.processor = 'person';
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument2 = Static.ifDoc('Find 2', 'find2', 'Find', 'find2');
        findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument1 = Static.ifDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        featureDocument1.resource.relations['includes'] = [findDocument1.resource.id,
            findDocument2.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
        findDocument2.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        featureDocument2 = Static.ifDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        // await idaiFieldDocumentDatastore.create(projectDocument, 'u');
        await idaiFieldDocumentDatastore.create(trenchDocument1, 'u');
        await idaiFieldDocumentDatastore.create(trenchDocument2, 'u');
        await idaiFieldDocumentDatastore.create(findDocument1, 'u');
        await idaiFieldDocumentDatastore.create(findDocument2, 'u');
        await idaiFieldDocumentDatastore.create(featureDocument1, 'u');
        await idaiFieldDocumentDatastore.create(featureDocument2, 'u');

        stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
        stateSerializer.load.and.returnValue(Promise.resolve({}));
        stateSerializer.store.and.returnValue(Promise.resolve());

        changesStream = jasmine.createSpyObj('changesStream', ['notifications']);
        changesStream.notifications.and.returnValue({
            subscribe: () => {}
        });

        // resourcesState.loaded = true;
        loading = jasmine.createSpyObj('loading', ['start', 'stop']);
        done();
    });


    afterEach((done) => new PouchDB('testdb').destroy().then(() => {done()}), 5000);


    xit('reload layer ids on startup', async done => {

        resourcesState.loaded = false;
        stateSerializer.load.and.returnValue({ excavation: {
            navigationPaths: { 't1': { elements: [] } },
            layerIds: { 't1': ['layerid1'] }
        }});
        await _viewFacade.selectView('excavation');
        await _viewFacade.selectOperation(trenchDocument1.resource.id);
        expect(_viewFacade.getActiveLayersIds()).toEqual(['layerid1']);
        done();
    });


    it('search -- show only resources of the selected type', async done => {

        const findDocument3 = Static.ifDoc('Find 3','find3','Find', 'find3');
        findDocument3.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        await _idaiFieldDocumentDatastore.create(findDocument3, 'u');

        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getDocuments().map(_ => _.resource.id)).toContain('feature1');
        expect(_viewFacade.getDocuments().map(_ => _.resource.id)).toContain('feature2');
        expect(_viewFacade.getDocuments().map(_ => _.resource.id)).toContain('find3');

        await _viewFacade.setFilterTypes(['Find']);
        expect(_viewFacade.getDocuments().length).toBe(1);
        expect(_viewFacade.getDocuments()[0].resource.id).toEqual('find3');
        done();
    });


    it('ViewContext -- keep filter when switching views', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setFilterTypes(['Feature']);
        await _viewFacade.selectView('project');
        expect(_viewFacade.getFilterTypes()).toEqual([]);
        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getFilterTypes()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep filter when move into', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setFilterTypes(['Feature']);
        await _viewFacade.moveInto(featureDocument1);
        expect(_viewFacade.getFilterTypes()).toEqual([]);
        await _viewFacade.moveInto(undefined);
        expect(_viewFacade.getFilterTypes()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep filter on switching mode', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setFilterTypes(['Feature']);
        _viewFacade.setMode('list');
        expect(_viewFacade.getFilterTypes()).toEqual(['Feature']);
        _viewFacade.setMode('map');
        expect(_viewFacade.getFilterTypes()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep query string when switching views', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSearchString('abc');
        await _viewFacade.selectView('project');
        expect(_viewFacade.getSearchString()).toEqual('');
        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewContext -- keep query string when move into', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSearchString('abc');
        await _viewFacade.moveInto(featureDocument1);
        expect(_viewFacade.getSearchString()).toEqual('');
        await _viewFacade.moveInto(undefined);
        expect(_viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewContext -- keep query string on switching mode', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSearchString('abc');
        _viewFacade.setMode('list');
        expect(_viewFacade.getSearchString()).toEqual('abc');
        _viewFacade.setMode('map');
        expect(_viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewContext -- keep custom constraints when switching views', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setBypassHierarchy(true);
        await _viewFacade.setFilterTypes(['Find']);
        await _viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        await _viewFacade.selectView('project');
        expect(_viewFacade.getCustomConstraints()).toEqual({});
        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getCustomConstraints()).toEqual({ 'processor:match': 'person' });
        done();
    });


    it('ViewContext -- keep custom constraints on switching mode', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setBypassHierarchy(true);
        await _viewFacade.setFilterTypes(['Find']);
        await _viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        _viewFacade.setMode('list');
        expect(_viewFacade.getCustomConstraints()).toEqual({ 'processor:match': 'person' });
        _viewFacade.setMode('map');
        expect(_viewFacade.getCustomConstraints()).toEqual({ 'processor:match': 'person' });
        done();
    });


    it('ViewContext -- optypedoc has different context in different hierarchy mode', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSearchString('abc');
        await _viewFacade.setBypassHierarchy(true);
        expect(_viewFacade.getSearchString()).toEqual('');
        await _viewFacade.setBypassHierarchy(false);
        expect(_viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewContext -- all optypedocs selection does not have its own context', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setBypassHierarchy(true);
        await _viewFacade.setSelectAllOperationsOnBypassHierarchy(true);
        await _viewFacade.setSearchString('abc');
        await _viewFacade.setSelectAllOperationsOnBypassHierarchy(false);
        expect(_viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewState -- restore operation type selection after switching views', async done => {

        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getSelectedOperations()[0].resource.id).toEqual(trenchDocument1.resource.id);
        await _viewFacade.selectOperation(trenchDocument2.resource.id);
        await _viewFacade.selectView('project');
        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getSelectedOperations()[0].resource.id).toEqual(trenchDocument2.resource.id);
        done();
    });


    it('ViewState -- keep mode when switching views', async done => {

        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getMode()).toEqual('map');
        _viewFacade.setMode('list');
        await _viewFacade.selectView('project');
        expect(_viewFacade.getMode()).toEqual('list');
        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getMode()).toEqual('list');

        done();
    });

    /*
    it('reload predefined layer ids on startup in test/demo project', async done => {

        resourcesState = new ResourcesStateManager(
            _idaiFieldDocumentDatastore,
            stateSerializer,
            new OperationViews(viewsList),
            [],
            'test',
            false
        );
        resourcesState.loaded = false;

        _viewFacade = new _viewFacade(
            projectConfiguration,
            idaiFieldDocumentDatastore,
            changesStream,
            resourcesState,
            loading
        );

        await _viewFacade.selectView('excavation');
        await _viewFacade.selectOperation(trenchDocument1.resource.id);
        expect(_viewFacade.getActiveLayersIds()).toEqual(['o25']);
        done();
    });*/


    it('operations overview: populate document list', async done => {

        await _viewFacade.selectView('project');
        expect(_viewFacade.getDocuments().length).toBe(2);
        const identifiers = _viewFacade.getDocuments().map(document => document.resource.identifier);
        expect(identifiers).toContain('trench1');
        expect(identifiers).toContain('trench2');
        done();
    });


    it('operations overview: search', async done => {

        await _viewFacade.selectView('project');
        await _viewFacade.setSearchString('trench2');
        expect(_viewFacade.getDocuments().length).toBe(1);
        expect(_viewFacade.getDocuments()[0].resource.identifier).toEqual('trench2');
        done();
    });


    it('operations overview: show all resources in extended search mode', async done => {

        await _viewFacade.selectView('project');
        await _viewFacade.setBypassHierarchy(true);
        expect(_viewFacade.getDocuments().length).toBe(6);
        done();
    });


    it('operations view: populate document list', async done => {

        await _viewFacade.selectView('excavation');
        const documents: Array<Document> = _viewFacade.getDocuments();
        expect(documents.length).toBe(2);
        expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
        expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);
        done();
    });


    it('operations view: select operations type document', async done => {

        const findDocument3 = Static.ifDoc('Find 3','find3','Find', 'find3');
        findDocument3.resource.relations['isRecordedIn'] = [trenchDocument2.resource.id];
        await _idaiFieldDocumentDatastore.create(findDocument3, 'u');

        await _viewFacade.selectView('excavation');
        await _viewFacade.selectOperation(trenchDocument2.resource.id);
        expect(_viewFacade.getDocuments().length).toBe(1);
        expect(_viewFacade.getDocuments()[0].resource.identifier).toEqual('find3');
        done();
    });


    it('operations view: search', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSearchString('feature2');
        expect(_viewFacade.getDocuments().length).toBe(1);
        expect(_viewFacade.getDocuments()[0].resource.identifier).toEqual('feature2');
        done();
    });


    it('operations view: set selected, query invalidated', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSearchString('feature1');
        await _viewFacade.setSelectedDocument(featureDocument2.resource.id);
        expect(_viewFacade.getSearchString()).toEqual('');
        expect(_viewFacade.getDocuments().length).toBe(2);
        done();
    });


    it('operations view: set selected in operations view, query not invalidated', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSearchString('feature1');
        await _viewFacade.setSelectedDocument(featureDocument1.resource.id);
        expect(_viewFacade.getSearchString()).toEqual('feature1');
        expect(_viewFacade.getDocuments().length).toBe(1);
        done();
    });


    it('operations view: query matches selection', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.moveInto(featureDocument1);
        await _viewFacade.setSelectedDocument(findDocument1.resource.id);
        await _viewFacade.setSearchString('find1');
        expect(_viewFacade.getSelectedDocument().resource.id).toBe(findDocument1.resource.id);
        done();
    });


    it('operations view: query does not match selection, deselect', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSelectedDocument(findDocument1.resource.id);
        await _viewFacade.setSearchString('find2');
        expect(_viewFacade.getSelectedDocument()).toBe(undefined);
        done();
    });


    it('deselect on switching views', async done => {

        await _viewFacade.selectView('project');
        await _viewFacade.setSelectedDocument(trenchDocument1.resource.id);
        expect(_viewFacade.getSelectedDocument().resource.id).toEqual(trenchDocument1.resource.id);

        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getSelectedDocument()).toEqual(undefined);
        done();
    });


    it('operations view: previous selection gets restored', async () => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.moveInto(featureDocument1);
        await _viewFacade.setSelectedDocument(findDocument1.resource.id);

        await _viewFacade.moveInto(undefined);
        expect(_viewFacade.getSelectedDocument()).toBeUndefined();

        await _viewFacade.moveInto(featureDocument1);
        expect(_viewFacade.getSelectedDocument().resource.id).toBe(findDocument1.resource.id);
    });


    it('operations view: previous selection gets restored on view change', async () => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSelectedDocument(featureDocument2.resource.id);

        await _viewFacade.selectView('project');
        expect(_viewFacade.getSelectedDocument()).toBeUndefined();
        await _viewFacade.selectView('excavation');
        expect(_viewFacade.getSelectedDocument().resource.id).toBe(featureDocument2.resource.id);
    });


    // there was a problem ...
    it('operations view: previous selection gets restored when coming from overview', async () => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setSelectedDocument(featureDocument2.resource.id);

        await _viewFacade.selectView('project');
        await _viewFacade.selectView('excavation');
        await _viewFacade.selectOperation(trenchDocument1.resource.id); // ... with this deleting the selection

        expect(_viewFacade.getSelectedDocument().resource.id).toBe(featureDocument2.resource.id);
    });


    it('operations view: show only documents with liesWithin relation to a specific resource', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.moveInto(featureDocument1);

        let documents = await _viewFacade.getDocuments();
        expect(documents.length).toBe(2);
        expect(documents[0].resource.id).toEqual(findDocument1.resource.id);
        expect(documents[1].resource.id).toEqual(findDocument2.resource.id);

        await _viewFacade.moveInto(undefined);
        documents = await _viewFacade.getDocuments();
        expect(documents.length).toBe(2);
        expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
        expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);

        done();
    });


    it('operations view: get navigation path, switch between operation type docs', async done => {

        const featureDocument3 = Static.ifDoc('Feature 3','feature3','Feature', 'feature3');
        featureDocument3.resource.relations['isRecordedIn'] = [trenchDocument2.resource.id];
        await _idaiFieldDocumentDatastore.create(featureDocument3, 'u');
        await _viewFacade.selectView('excavation');

        await _viewFacade.moveInto(featureDocument1);

        let navigationPath = await _viewFacade.getNavigationPath();
        expect(navigationPath.segments.length).toEqual(1);
        expect(toResourceId(navigationPath.segments[0])).toEqual(featureDocument1.resource.id);
        expect(navigationPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

        await _viewFacade.selectOperation(trenchDocument2.resource.id);
        navigationPath = await _viewFacade.getNavigationPath();
        expect(navigationPath.segments.length).toEqual(0);

        await _viewFacade.moveInto(featureDocument3);

        navigationPath = await _viewFacade.getNavigationPath();
        expect(navigationPath.segments.length).toEqual(1);
        expect(toResourceId(navigationPath.segments[0])).toEqual(featureDocument3.resource.id);
        expect(navigationPath.selectedSegmentId).toEqual(featureDocument3.resource.id);

        await _viewFacade.selectOperation(trenchDocument1.resource.id);
        navigationPath = await _viewFacade.getNavigationPath();
        expect(navigationPath.selectedSegmentId).toEqual(featureDocument1.resource.id);

        done();
    });


    it('operations view: search with custom constraint filter', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setBypassHierarchy(true);

        await _viewFacade.setFilterTypes(['Find']);
        expect(_viewFacade.getDocuments().length).toBe(2);

        await _viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        expect(_viewFacade.getDocuments().length).toBe(1);
        expect(_viewFacade.getDocuments()[0].resource.identifier).toEqual('find1');

        await _viewFacade.setCustomConstraints({ 'processor:match': 'wrongPerson' });
        expect(_viewFacade.getDocuments().length).toBe(0);

        done();
    });


    it('operations view: remove custom constraint filters when type filter is changed', async done => {

        await _viewFacade.selectView('excavation');
        await _viewFacade.setBypassHierarchy(true);

        await _viewFacade.setFilterTypes(['Find']);
        await _viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        expect(_viewFacade.getDocuments().length).toBe(1);

        await _viewFacade.setFilterTypes(['Feature']);
        expect(_viewFacade.getCustomConstraints()).toEqual({});

        await _viewFacade.setFilterTypes(['Find']);
        expect(_viewFacade.getDocuments().length).toBe(2);

        done();
    });
});

