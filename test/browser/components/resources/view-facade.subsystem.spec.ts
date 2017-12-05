import {Static} from '../../static';
import {CachedDatastore} from '../../../../app/core/datastore/core/cached-datastore';
import {ViewFacade} from '../../../../app/components/resources/view/view-facade';
import {Document} from 'idai-components-2/core';
import {ResourcesState} from "../../../../app/components/resources/view/resources-state";
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {IdaiFieldDocumentDatastore} from "../../../../app/core/datastore/idai-field-document-datastore";
import {IdaiFieldDocumentConverter} from "../../../../app/core/datastore/idai-field-document-converter";

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
                "mainTypeLabel": "Schnitt",
                "label": "Ausgrabung",
                "operationSubtype": "Trench",
                "name": "excavation"
            }
        ];

        let viewFacade: ViewFacade;
        let operationTypeDocument1: Document;
        let operationTypeDocument2: Document;
        let document1: Document;
        let document2: Document;
        let document3: Document;
        let datastore: CachedDatastore<IdaiFieldDocument>;


        beforeEach(
            done => {
                spyOn(console, 'debug'); // suppress console.debug

                const mockImageTypeUtility = jasmine.createSpyObj('mockImageTypeUtility',
                    ['isImageType', 'getNonImageTypeNames']);
                mockImageTypeUtility.isImageType.and.returnValue(false);
                mockImageTypeUtility.getNonImageTypeNames.and.returnValue(['Trench','Find']);

                const result = Static.createPouchdbDatastore('testdb');
                datastore = new IdaiFieldDocumentDatastore(
                    result.datastore, result.documentCache, new IdaiFieldDocumentConverter(mockImageTypeUtility));

                const projectDocument = Static.doc('testdb','testdb','Project','testdb');
                operationTypeDocument1 = Static.doc('trench1','trench1','Trench','t1');
                operationTypeDocument2 = Static.doc('trench2','trench2','Trench','t2');
                operationTypeDocument1.resource.relations['isRecordedIn'] = ['testdb'];
                operationTypeDocument2.resource.relations['isRecordedIn'] = ['testdb'];

                document1 = Static.doc('find1','find1','Find');
                document1.resource.relations['isRecordedIn'] = [operationTypeDocument1.resource.id];
                document2 = Static.doc('find2','find2','Find');
                document2.resource.relations['isRecordedIn'] = [operationTypeDocument1.resource.id];
                document3 = Static.doc('find3','find3','Find');
                document3.resource.relations['isRecordedIn'] = [operationTypeDocument2.resource.id];

                datastore.create(projectDocument)
                    .then(() => datastore.create(operationTypeDocument1))
                    .then(() => datastore.create(operationTypeDocument2))
                    .then(() => datastore.create(document1))
                    .then(() => datastore.create(document2))
                    .then(() => datastore.create(document3))
                    .then(() => {done();});
            }
        );


        beforeEach(() => {

            const settingsService =
                jasmine.createSpyObj('settingsService', ['getUsername', 'getSelectedProject']);
            settingsService.getUsername.and.returnValue('user');
            settingsService.getSelectedProject.and.returnValue('testdb');

            const stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
            stateSerializer.load.and.returnValue(Promise.resolve({}));
            stateSerializer.store.and.returnValue(Promise.resolve());

            viewFacade = new ViewFacade(
                datastore,
                settingsService,
                new ResourcesState(stateSerializer),
                viewsList
            );
        });


        afterEach((done) => new PouchDB('testdb').destroy().then(() => {done()}), 5000);



        it('populate document list in operations view',
            (done) => {
                viewFacade.setupView('excavation', undefined)
                    .then(() => {
                        expect(viewFacade.getDocuments().length).toBe(2);
                        const identifiers = viewFacade.getDocuments().map(document => document.resource.identifier);
                        expect(identifiers).toContain('find1');
                        expect(identifiers).toContain('find2');
                        done();
                    });
            }
        );


        it('operations overview: populate document list',
            (done) => {
                viewFacade.setupView('project', undefined)
                    .then(() => {
                        expect(viewFacade.getDocuments().length).toBe(2);
                        const identifiers = viewFacade.getDocuments().map(document => document.resource.identifier);
                        expect(identifiers).toContain('trench1');
                        expect(identifiers).toContain('trench2');
                        done();
                    });
            }
        );


        it('operations view: select operations type document',
            (done) => {
                viewFacade.setupView('excavation', undefined)
                    .then(() => viewFacade.selectMainTypeDocument(operationTypeDocument2))
                    .then(() => {
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find3');
                        done();
                    });
            }
        );


        it('operations view: search',
            (done) => {
                viewFacade.setupView('excavation', undefined)
                    .then(() => viewFacade.setQueryString('find2'))
                    .then(() => {
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find2');
                        done();
                    });
            }
        );


        it('operations overview: search',
            (done) => {
                viewFacade.setupView('project', undefined)
                    .then(() => viewFacade.setQueryString('trench2'))
                    .then(() => {
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('trench2');
                        done();
                    });
            }
        );


        it('operations view: set selected, query invalidated',
            (done) => {
                viewFacade.setupView('excavation', undefined)
                    .then(() => viewFacade.setQueryString('find1'))
                    .then(() => viewFacade.setSelectedDocument(document2))
                    .then(() => {
                        expect(viewFacade.getQueryString()).toEqual('');
                        expect(viewFacade.getDocuments().length).toBe(2);
                        done();
                    });
            }
        );


        it('operations view: set selected in operations view, query not invalidated',
            (done) => {
                viewFacade.setupView('excavation', undefined)
                    .then(() => viewFacade.setQueryString('find1'))
                    .then(() => viewFacade.setSelectedDocument(document1))
                    .then(() => {
                        expect(viewFacade.getQueryString()).toEqual('find1');
                        expect(viewFacade.getDocuments().length).toBe(1);
                        done();
                    });
            }
        );


        it('operations view: query matches selection',
            (done) => {
                viewFacade.setupView('excavation', undefined)
                    .then(() => viewFacade.setSelectedDocument(document1))
                    .then(() => viewFacade.setQueryString('find1'))
                    .then(match => {
                        expect(match).toEqual(true);
                        expect(viewFacade.getSelectedDocument()).toBe(document1);
                        done();
                    });
            }
        );


        it('operations view: query does not match selection, deselect',
            (done) => {
                viewFacade.setupView('excavation', undefined)
                    .then(() => viewFacade.setSelectedDocument(document1))
                    .then(() => viewFacade.setQueryString('find2'))
                    .then(match => {
                        expect(match).toEqual(false);
                        expect(viewFacade.getSelectedDocument()).toBe(undefined);
                        done();
                    });
            }
        );
    })
}
