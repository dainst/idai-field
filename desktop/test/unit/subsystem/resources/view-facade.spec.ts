import { Datastore, Document, fieldDoc } from 'idai-field-core';
import { FieldDocument } from '../../../../../core/index';
import { ResourcesStateManager } from '../../../../src/app/components/resources/view/resources-state-manager';
import { ViewFacade } from '../../../../src/app/components/resources/view/view-facade';
import { TabManager } from '../../../../src/app/services/tabs/tab-manager';
import { createApp } from '../subsystem-helper';
import PouchDB =  require('pouchdb-node');


/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('ViewFacade/Subsystem', () => {

    let viewFacade: ViewFacade;
    let changesStream;
    let loading;
    let resourcesStateManager: ResourcesStateManager;
    let stateSerializer;
    let tabManager: TabManager;

    let trenchDocument1: FieldDocument;
    let trenchDocument2: FieldDocument;
    let findDocument1: FieldDocument;
    let findDocument2: FieldDocument;
    let featureDocument1: FieldDocument;
    let featureDocument2: FieldDocument;
    let datastore: Datastore;


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

        const result = await createApp();

        datastore = result.datastore;
        viewFacade = result.viewFacade;
        resourcesStateManager = result.resourcesStateManager;
        stateSerializer = result.stateSerializer;
        tabManager = result.tabManager;

        spyOn(console, 'debug'); // suppress console.debug

        trenchDocument1 = fieldDoc('trench1', 'trench1', 'Trench', 't1');
        trenchDocument2 = fieldDoc('trench2','trench2','Trench','t2');

        featureDocument1 = fieldDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        findDocument1 = fieldDoc('Find 1', 'find1', 'Find', 'find1');
        findDocument1.resource.processor = 'person';
        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument2 = fieldDoc('Find 2', 'find2', 'Find', 'find2');
        findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
        findDocument2.resource.relations['liesWithin'] = [featureDocument1.resource.id];

        featureDocument2 = fieldDoc('Feature 2', 'feature2', 'Feature', 'feature2');
        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

        await datastore.create(trenchDocument1);
        await datastore.create(trenchDocument2);
        await datastore.create(featureDocument1);
        await datastore.create(featureDocument2);
        await datastore.create(findDocument1);
        await datastore.create(findDocument2);

        changesStream = jasmine.createSpyObj('changesStream', ['notifications']);
        changesStream.notifications.and.returnValue({
            subscribe: () => {}
        });

        loading = jasmine.createSpyObj('loading', ['start', 'stop']);
        done();
    });


    afterEach(done => new PouchDB('test').destroy().then(() => { done(); }), 5000);


    it('reload view states on startup', async done => {

        resourcesStateManager.loaded = false;
        stateSerializer.load.and.returnValue(
            Promise.resolve({
                overviewState: {
                    mode: 'list',
                    layerIds: ['layerId1']
                },
                operationViewStates: {
                    t1: {
                        layerIds: ['layerId2']
                    },
                    t2: {
                        mode: 'map'
                    }
                }
            })
        );

        await tabManager.openTab('resources', 't2', 'trench2',
            'Trench');

        await viewFacade.selectView('project');
        expect(viewFacade.getActiveLayersIds()).toEqual(['layerId1']);
        expect(viewFacade.getMode()).toEqual('list');

        await viewFacade.selectView('t1');
        expect(viewFacade.getActiveLayersIds()).toEqual(['layerId2']);
        expect(viewFacade.getMode()).toEqual('list');

        await viewFacade.selectView('t2');
        expect(viewFacade.getMode()).toEqual('map');

        done();
    });


    it('keep only map layer ids when deactivating view', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('test');
        await viewFacade.setFilterCategories(['Find']);
        await viewFacade.setSelectedDocument('feature1');
        viewFacade.setMode('list');
        viewFacade.setActiveLayersIds(['layer1']);

        await viewFacade.deactivateView('t1');
        await viewFacade.selectView('t1');

        expect(viewFacade.getSearchString()).toEqual('');
        expect(viewFacade.getFilterCategories()).toEqual([]);
        expect(viewFacade.getSelectedDocument()).toBeUndefined();
        expect(viewFacade.getMode()).toEqual('map');
        expect(viewFacade.getActiveLayersIds()).toEqual(['layer1']);

        done();
    });


    it('search -- show only resources of the selected category', async done => {

        const findDocument3 = fieldDoc('Find 3','find3','Find', 'find3');
        findDocument3.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        await datastore.create(findDocument3);

        await viewFacade.selectView('t1');
        expect(viewFacade.getDocuments().map(_ => _.resource.id)).toContain('feature1');
        expect(viewFacade.getDocuments().map(_ => _.resource.id)).toContain('feature2');
        expect(viewFacade.getDocuments().map(_ => _.resource.id)).toContain('find3');

        await viewFacade.setFilterCategories(['Find']);
        expect(viewFacade.getDocuments().length).toBe(1);
        expect(viewFacade.getDocuments()[0].resource.id).toEqual('find3');
        done();
    });


    it('ViewContext -- keep filter when switching views', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setFilterCategories(['Feature']);
        await viewFacade.selectView('project');
        expect(viewFacade.getFilterCategories()).toEqual([]);
        await viewFacade.selectView('t1');
        expect(viewFacade.getFilterCategories()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep filter when move into', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setFilterCategories(['Feature']);
        await viewFacade.moveInto(featureDocument1);
        expect(viewFacade.getFilterCategories()).toEqual([]);
        await viewFacade.moveInto(undefined);
        expect(viewFacade.getFilterCategories()).toEqual(['Feature']);
        done();
    });


    it('ViewContext -- keep filter on switching mode', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setFilterCategories(['Feature']);
        viewFacade.setMode('list');
        expect(viewFacade.getFilterCategories()).toEqual(['Feature']);
        viewFacade.setMode('map');
        expect(viewFacade.getFilterCategories()).toEqual(['Feature']);
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
        await viewFacade.setExtendedSearchMode(true);
        await viewFacade.setFilterCategories(['Find']);
        await viewFacade.setCustomConstraints({ 'processor:contain': 'person' });
        await viewFacade.selectView('project');
        expect(viewFacade.getCustomConstraints()).toEqual({});
        await viewFacade.selectView('t1');
        expect(viewFacade.getCustomConstraints()).toEqual({ 'processor:contain': 'person' });
        done();
    });


    it('ViewContext -- keep custom constraints on switching mode', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setExtendedSearchMode(true);
        await viewFacade.setFilterCategories(['Find']);
        await viewFacade.setCustomConstraints({ 'processor:contain': 'person' });
        viewFacade.setMode('list');
        expect(viewFacade.getCustomConstraints()).toEqual({ 'processor:contain': 'person' });
        viewFacade.setMode('map');
        expect(viewFacade.getCustomConstraints()).toEqual({ 'processor:contain': 'person' });
        done();
    });


    it('ViewContext -- use different view context when bypassing hierarchy', async done => {

        await viewFacade.selectView('t1');
        await viewFacade.setSearchString('abc');
        await viewFacade.setExtendedSearchMode(true);
        expect(viewFacade.getSearchString()).toEqual('');
        await viewFacade.setExtendedSearchMode(false);
        expect(viewFacade.getSearchString()).toEqual('abc');
        done();
    });


    it('ViewState -- restore mode when switching views', async done => {

        await viewFacade.selectView('t1');
        await tabManager.openTab('resources', 't1', 'trench1',
            'Trench');
        expect(viewFacade.getMode()).toEqual('map');
        viewFacade.setMode('list');

        await viewFacade.selectView('t2');
        await tabManager.openTab('resources', 't2', 'trench2',
            'Trench');
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
        await viewFacade.setExtendedSearchMode(true);
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
        await viewFacade.setExtendedSearchMode(true);

        await viewFacade.setFilterCategories(['Find']);
        expect(viewFacade.getDocuments().length).toBe(2);

        await viewFacade.setCustomConstraints({ 'processor:contain': 'person' });
        expect(viewFacade.getDocuments().length).toBe(1);
        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find1');

        await viewFacade.setCustomConstraints({ 'processor:contain': 'wrongPerson' });
        expect(viewFacade.getDocuments().length).toBe(0);

        done();
    });
});
