import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration'
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Static} from '../../helper/static';
import {CachedDatastore} from '../../../../app/core/datastore/core/cached-datastore';
import {ViewFacade} from '../../../../app/components/resources/view/view-facade';
import {ResourcesState} from '../../../../app/components/resources/view/resources-state';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../../../app/core/datastore/idai-field-type-converter';
import {ImageTypeUtility} from '../../../../app/common/image-type-utility';

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
        let trenchDocument1: Document;
        let trenchDocument2: Document;
        let findDocument1: Document;
        let findDocument2: Document;
        let findDocument3: Document;
        let featureDocument1: Document;
        let featureDocument2: Document;
        let idaiFieldDocumentDatastore: CachedDatastore<IdaiFieldDocument>;


        beforeEach(async done => {

            spyOn(console, 'debug'); // suppress console.debug

            const {datastore, documentCache} = Static.createPouchdbDatastore('testdb');
            idaiFieldDocumentDatastore = new IdaiFieldDocumentDatastore(
                datastore, documentCache,
                new IdaiFieldTypeConverter(new ImageTypeUtility(new ProjectConfiguration(pc))));

            const projectDocument = Static.doc('testdb','testdb','Project','testdb');
            trenchDocument1 = Static.doc('trench1','trench1','Trench','t1');
            trenchDocument1.resource.relations['isRecordedIn'] = ['testdb'];
            trenchDocument2 = Static.doc('trench2','trench2','Trench','t2');
            trenchDocument2.resource.relations['isRecordedIn'] = ['testdb'];

            findDocument1 = Static.doc('Find 1','find1','Find', 'find1');
            findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument2 = Static.doc('Find 2','find2','Find', 'find2');
            findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            findDocument3 = Static.doc('Find 3','find3','Find', 'find3');
            findDocument3.resource.relations['isRecordedIn'] = [trenchDocument2.resource.id];

            featureDocument1 = Static.doc('Feature 1','feature1','Feature', 'feature1');
            featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
            featureDocument1.resource.relations['includes'] = [findDocument1.resource.id, findDocument2.resource.id];
            findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
            findDocument2.resource.relations['liesWithin'] = [featureDocument1.resource.id];

            featureDocument2 = Static.doc('Feature 2','feature2','Feature', 'feature2');
            featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];

            await idaiFieldDocumentDatastore.create(projectDocument);
            await idaiFieldDocumentDatastore.create(trenchDocument1);
            await idaiFieldDocumentDatastore.create(trenchDocument2);
            await idaiFieldDocumentDatastore.create(findDocument1);
            await idaiFieldDocumentDatastore.create(findDocument2);
            await idaiFieldDocumentDatastore.create(findDocument3);
            await idaiFieldDocumentDatastore.create(featureDocument1);
            await idaiFieldDocumentDatastore.create(featureDocument2);
            done();
        });


        beforeEach(() => {

            const settingsService =
                jasmine.createSpyObj('settingsService', ['getUsername', 'getSelectedProject']);
            settingsService.getUsername.and.returnValue('user');
            settingsService.getSelectedProject.and.returnValue('testdb');

            const stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
            stateSerializer.load.and.returnValue(Promise.resolve({}));
            stateSerializer.store.and.returnValue(Promise.resolve());

            const changesStream = jasmine.createSpyObj('changesStream', ['remoteChangesNotifications']);
            changesStream.remoteChangesNotifications.and.returnValue({
                subscribe: () => {}
            });

            viewFacade = new ViewFacade(
                idaiFieldDocumentDatastore,
                changesStream,
                settingsService,
                new ResourcesState(stateSerializer),
                viewsList
            );
        });


        afterEach((done) => new PouchDB('testdb').destroy().then(() => {done()}), 5000);


        it('operations overview: populate document list', async done => {

            await viewFacade.setupView('project', undefined);
            expect(viewFacade.getDocuments().length).toBe(2);
            const identifiers = viewFacade.getDocuments().map(document => document.resource.identifier);
            expect(identifiers).toContain('trench1');
            expect(identifiers).toContain('trench2');
            done();
        });


        it('operations overview: search', async done => {

            await viewFacade.setupView('project', undefined);
            await viewFacade.setQueryString('trench2');
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('trench2');
            done();
        });


        it('operations view: populate document list', async done => {

            await viewFacade.setupView('excavation', undefined);
            const documents: Array<Document> = viewFacade.getDocuments();
            expect(documents.length).toBe(2);
            expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
            expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);
            done();
        });


        it('operations view: select operations type document', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.selectMainTypeDocument(trenchDocument2);
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find3');
            done();
        });


        it('operations view: search', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setQueryString('feature2');
            expect(viewFacade.getDocuments().length).toBe(1);
            expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('feature2');
            done();
        });


        it('operations view: set selected, query invalidated', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setQueryString('feature1');
            await viewFacade.setSelectedDocument(featureDocument2);
            expect(viewFacade.getQueryString()).toEqual('');
            expect(viewFacade.getDocuments().length).toBe(2);
            done();
        });


        it('operations view: set selected in operations view, query not invalidated', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setQueryString('feature1');
            await viewFacade.setSelectedDocument(featureDocument1);
            expect(viewFacade.getQueryString()).toEqual('feature1');
            expect(viewFacade.getDocuments().length).toBe(1);
            done();
        });


        it('operations view: query matches selection', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setSelectedDocument(findDocument1);
            expect(await viewFacade.setQueryString('find1')).toEqual(true);
            expect(viewFacade.getSelectedDocument()).toBe(findDocument1);
            done();
        });


        it('operations view: query does not match selection, deselect', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setSelectedDocument(findDocument1);
            expect(await viewFacade.setQueryString('find2')).toEqual(false);
            expect(viewFacade.getSelectedDocument()).toBe(undefined);
            done();
        });


        it('operations view: show only documents with liesWithin relation to a specific resource', async done => {

            await viewFacade.setupView('excavation', undefined);
            await viewFacade.setQueryLiesWithinConstraint(featureDocument1.resource.id);
            let documents = await viewFacade.getDocuments();
            expect(documents.length).toBe(2);
            expect(documents[0].resource.id).toEqual(findDocument1.resource.id);
            expect(documents[1].resource.id).toEqual(findDocument2.resource.id);

            await viewFacade.setQueryLiesWithinConstraint(undefined);
            documents = await viewFacade.getDocuments();
            expect(documents.length).toBe(2);
            expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
            expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);

            done();
        });
    });
}
