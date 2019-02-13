import {Document, FieldDocument} from 'idai-components-2';
import * as PouchDB from 'pouchdb';
import {ViewFacade} from '../../app/components/resources/view/view-facade';
import {ResourcesStateManager} from '../../app/components/resources/view/resources-state-manager';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {createApp, setupSyncTestDb} from './subsystem-helper';
import {Static} from '../unit/static';


/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 */

describe('ViewFacade/Subsystem', () => {
    
    let viewFacade: ViewFacade;
    let resourcesState: ResourcesStateManager;
    let stateSerializer;
    let changesStream;
    let loading;

    let trenchDocument1: FieldDocument;
    let trenchDocument2: FieldDocument;
    let findDocument1: FieldDocument;
    let findDocument2: FieldDocument;
    let featureDocument1: FieldDocument;
    let featureDocument2: FieldDocument;
    let fieldDocumentDatastore: CachedDatastore<FieldDocument>;


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

        const result = await createApp();

        fieldDocumentDatastore = result.fieldDocumentDatastore;
        viewFacade = result.viewFacade;

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

        await fieldDocumentDatastore.create(trenchDocument1, 'u');
        await fieldDocumentDatastore.create(trenchDocument2, 'u');
        await fieldDocumentDatastore.create(findDocument1, 'u');
        await fieldDocumentDatastore.create(findDocument2, 'u');
        await fieldDocumentDatastore.create(featureDocument1, 'u');
        await fieldDocumentDatastore.create(featureDocument2, 'u');

        stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
        stateSerializer.load.and.returnValue(Promise.resolve({}));
        stateSerializer.store.and.returnValue(Promise.resolve());

        changesStream = jasmine.createSpyObj('changesStream', ['notifications']);
        changesStream.notifications.and.returnValue({
            subscribe: () => {}
        });

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
        await viewFacade.selectView('excavation');
        //await viewFacade.selectOperation(trenchDocument1.resource.id);
        expect(viewFacade.getActiveLayersIds()).toEqual(['layerid1']);
        done();
    });


    it('search -- show only resources of the selected type', async done => {

        const findDocument3 = Static.ifDoc('Find 3','find3','Find', 'find3');
        findDocument3.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        await fieldDocumentDatastore.create(findDocument3, 'u');

        await viewFacade.selectView('t1');
        expect(viewFacade.getDocuments().map(_ => _.resource.id)).toContain('feature1');
        expect(viewFacade.getDocuments().map(_ => _.resource.id)).toContain('feature2');
        expect(viewFacade.getDocuments().map(_ => _.resource.id)).toContain('find3');

        await viewFacade.setFilterTypes(['Find']);
        expect(viewFacade.getDocuments().length).toBe(1);
        expect(viewFacade.getDocuments()[0].resource.id).toEqual('find3');
        done();
    });


    it('ViewContext -- keep filter when switching views', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setFilterTypes(['Feature']);
        await viewFacade.selectView('project');
        expect(viewFacade.getFilterTypes()).toEqual([]);
        await viewFacade.selectView('t1');
        expect(viewFacade.getFilterTypes()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep filter when move into', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setFilterTypes(['Feature']);
        await viewFacade.moveInto(featureDocument1);
        expect(viewFacade.getFilterTypes()).toEqual([]);
        await viewFacade.moveInto(undefined);
        expect(viewFacade.getFilterTypes()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep filter on switching mode', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setFilterTypes(['Feature']);
        viewFacade.setMode('list');
        expect(viewFacade.getFilterTypes()).toEqual(['Feature']);
        viewFacade.setMode('map');
        expect(viewFacade.getFilterTypes()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep query string when switching views', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('abc');
        await viewFacade.selectView('project');
        expect(viewFacade.getSearchString()).toEqual('');
        await viewFacade.selectView('t1');
        expect(viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewContext -- keep query string when move into', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('abc');
        await viewFacade.moveInto(featureDocument1);
        expect(viewFacade.getSearchString()).toEqual('');
        await viewFacade.moveInto(undefined);
        expect(viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewContext -- keep query string on switching mode', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('abc');
        viewFacade.setMode('list');
        expect(viewFacade.getSearchString()).toEqual('abc');
        viewFacade.setMode('map');
        expect(viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewContext -- keep custom constraints when switching views', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setBypassHierarchy(true);
        await viewFacade.setFilterTypes(['Find']);
        await viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        await viewFacade.selectView('project');
        expect(viewFacade.getCustomConstraints()).toEqual({});
        await viewFacade.selectView('t1');
        expect(viewFacade.getCustomConstraints()).toEqual({ 'processor:match': 'person' });
        done();
    });


    it('ViewContext -- keep custom constraints on switching mode', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setBypassHierarchy(true);
        await viewFacade.setFilterTypes(['Find']);
        await viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        viewFacade.setMode('list');
        expect(viewFacade.getCustomConstraints()).toEqual({ 'processor:match': 'person' });
        viewFacade.setMode('map');
        expect(viewFacade.getCustomConstraints()).toEqual({ 'processor:match': 'person' });
        done();
    });


    it('ViewContext -- use different view context when bypassing hierarchy', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('abc');
        await viewFacade.setBypassHierarchy(true);
        expect(viewFacade.getSearchString()).toEqual('');
        await viewFacade.setBypassHierarchy(false);
        expect(viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewState -- restore mode when switching views', async done => {

        await viewFacade.selectView('t1');
        expect(viewFacade.getMode()).toEqual('map');
        viewFacade.setMode('list');
        await viewFacade.selectView('t2');
        expect(viewFacade.getMode()).toEqual('list');
        viewFacade.setMode('map');
        await viewFacade.selectView('t1');
        expect(viewFacade.getMode()).toEqual('list');
        await viewFacade.selectView('t2');
        expect(viewFacade.getMode()).toEqual('map');

        done();
    });

    /*
    it('reload predefined layer ids on startup in test/demo project', async done => {

        resourcesState = new ResourcesStateManager(
            fieldDocumentDatastore,
            stateSerializer,
            new OperationViews(viewsList),
            [],
            'test',
            false
        );
        resourcesState.loaded = false;

        viewFacade = new viewFacade(
            projectConfiguration,
            fieldDocumentDatastore,
            changesStream,
            resourcesState,
            loading
        );

        await viewFacade.selectView('excavation');
        await viewFacade.selectOperation(trenchDocument1.resource.id);
        expect(viewFacade.getActiveLayersIds()).toEqual(['o25']);
        done();
    });*/


    it('overview: populate document list', async done => {

        await viewFacade.selectView('project');
        expect(viewFacade.getDocuments().length).toBe(2);
        const identifiers = viewFacade.getDocuments().map(document => document.resource.identifier);
        expect(identifiers).toContain('trench1');
        expect(identifiers).toContain('trench2');
        done();
    });


    it('overview: search', async done => {

        await viewFacade.selectView('project');
        await viewFacade.setSearchString('trench2');
        expect(viewFacade.getDocuments().length).toBe(1);
        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('trench2');
        done();
    });


    it('overview: show all resources in extended search mode', async done => {

        await viewFacade.selectView('project');
        await viewFacade.setBypassHierarchy(true);
        expect(viewFacade.getDocuments().length).toBe(6);
        done();
    });


    it('operation view: populate document list', async done => {

        await viewFacade.selectView('t1');
        const documents: Array<Document> = viewFacade.getDocuments();
        expect(documents.length).toBe(2);
        expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
        expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);
        done();
    });


    it('operation view: update children count map when populating document list', async done => {

        await viewFacade.selectView('t1');
        expect(viewFacade.getChildrenCount(featureDocument1)).toBe(2);
        expect(viewFacade.getChildrenCount(featureDocument2)).toBe(0);
        done();
    });


    it('operation view: search', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('feature2');
        expect(viewFacade.getDocuments().length).toBe(1);
        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('feature2');
        done();
    });


    it('operation view: invalidate query after selecting document if necessary', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('feature1');
        await viewFacade.setSelectedDocument(featureDocument2.resource.id);
        expect(viewFacade.getSearchString()).toEqual('');
        expect(viewFacade.getDocuments().length).toBe(2);
        done();
    });


    it('operation view: do not invalidate query after selecting document if not necessary', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('feature1');
        await viewFacade.setSelectedDocument(featureDocument1.resource.id);
        expect(viewFacade.getSearchString()).toEqual('feature1');
        expect(viewFacade.getDocuments().length).toBe(1);
        done();
    });


    it('operation view: do not deselect if query matches selection', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.moveInto(featureDocument1);
        await viewFacade.setSelectedDocument(findDocument1.resource.id);
        await viewFacade.setSearchString('find1');
        expect(viewFacade.getSelectedDocument().resource.id).toBe(findDocument1.resource.id);
        done();
    });


    it('operation view: deselect if query does not match selection', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSelectedDocument(findDocument1.resource.id);
        await viewFacade.setSearchString('find2');
        expect(viewFacade.getSelectedDocument()).toBe(undefined);
        done();
    });


    it('deselect on switching views', async done => {

        await viewFacade.selectView('project');
        await viewFacade.setSelectedDocument(trenchDocument1.resource.id);
        expect(viewFacade.getSelectedDocument().resource.id).toEqual(trenchDocument1.resource.id);

        await viewFacade.selectView('t1');
        expect(viewFacade.getSelectedDocument()).toEqual(undefined);
        done();
    });


    it('operation view: restore previous selection while navigation through hierarchy', async () => {

        await viewFacade.selectView('t1');
        await viewFacade.moveInto(featureDocument1);
        await viewFacade.setSelectedDocument(findDocument1.resource.id);

        await viewFacade.moveInto(undefined);
        expect(viewFacade.getSelectedDocument()).toBeUndefined();

        await viewFacade.moveInto(featureDocument1);
        expect(viewFacade.getSelectedDocument().resource.id).toBe(findDocument1.resource.id);
    });


    it('operation view: restore previous selection on view change', async () => {

        await viewFacade.selectView('t1');
        await viewFacade.setSelectedDocument(featureDocument2.resource.id);

        await viewFacade.selectView('project');
        expect(viewFacade.getSelectedDocument()).toBeUndefined();
        await viewFacade.selectView('t1');
        expect(viewFacade.getSelectedDocument().resource.id).toBe(featureDocument2.resource.id);
    });


    it('operation view: show only documents with liesWithin relation to a specific resource', async done => {

        await viewFacade.selectView('t1');
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


    it('operation view: search with custom constraint filter', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setBypassHierarchy(true);

        await viewFacade.setFilterTypes(['Find']);
        expect(viewFacade.getDocuments().length).toBe(2);

        await viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        expect(viewFacade.getDocuments().length).toBe(1);
        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find1');

        await viewFacade.setCustomConstraints({ 'processor:match': 'wrongPerson' });
        expect(viewFacade.getDocuments().length).toBe(0);

        done();
    });


    it('operation view: remove custom constraint filters when type filter is changed', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setBypassHierarchy(true);

        await viewFacade.setFilterTypes(['Find']);
        await viewFacade.setCustomConstraints({ 'processor:match': 'person' });
        expect(viewFacade.getDocuments().length).toBe(1);

        await viewFacade.setFilterTypes(['Feature']);
        expect(viewFacade.getCustomConstraints()).toEqual({});

        await viewFacade.setFilterTypes(['Find']);
        expect(viewFacade.getDocuments().length).toBe(2);

        done();
    });
});

