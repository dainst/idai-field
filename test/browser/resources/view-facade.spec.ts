import {Static} from '../static';
import {CachedPouchdbDatastore} from '../../../app/datastore/cached-pouchdb-datastore';
import {ViewFacade} from '../../../app/resources/view/view-facade';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {IdaiFieldDatastore} from '../../../app/datastore/idai-field-datastore';
import {Document} from 'idai-components-2/core';


/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ViewFacade', () => {

        const projectConfiguration = new ProjectConfiguration({
            "types" : [{
                "type" : "Trench",
                "label" : "Schnitt",
                "color": "blue"
            }],
            "views": [
                {
                    "label": "Übersicht",
                    "mainType": "Project",
                    "name": "project"
                },
                {
                    "label": "Ausgrabung",
                    "mainType": "Trench",
                    "name": "excavation"
                }
            ]
        });

        let viewFacade: ViewFacade;
        let operationTypeDocument1: Document;
        let document1: Document;
        let datastore: IdaiFieldDatastore;


        beforeEach(
            done => {
                spyOn(console, 'debug'); // suppress console.debug

                const result = Static.createPouchdbDatastore('testdb');
                datastore = new CachedPouchdbDatastore(result.datastore, result.documentCache);

                const projectDocument = Static.doc('testdb','testdb','Project','testdb');
                operationTypeDocument1 = Static.doc('trench1','trench1','Trench','t1');
                operationTypeDocument1.resource.relations['isRecordedIn'] = ['testdb'];
                document1 = Static.doc('find1','find1','Find');
                document1.resource.relations['isRecordedIn'] = [operationTypeDocument1.resource.id];

                datastore.create(projectDocument)
                    .then(() => datastore.create(operationTypeDocument1))
                    .then(() => datastore.create(document1))
                    .then(() => {done();});
            }
        );


        beforeEach(() => {

            const loading =
                jasmine.createSpyObj('loading', ['start', 'stop']);
            loading.start.and.returnValue(Promise.resolve());
            loading.stop.and.returnValue(Promise.resolve());

            const settingsService =
                jasmine.createSpyObj('settingsService', ['getUsername', 'getSelectedProject']);
            settingsService.getUsername.and.returnValue('user');
            settingsService.getSelectedProject.and.returnValue('testdb');

            const stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
            stateSerializer.load.and.returnValue(Promise.resolve({}));
            stateSerializer.store.and.returnValue(Promise.resolve());

            viewFacade = new ViewFacade(
                projectConfiguration,
                datastore,
                loading,
                settingsService,
                stateSerializer
            );
        });


        afterEach((done) => new PouchDB('testdb').destroy().then(() => {done()}), 5000);


        function setupView(name) {
            return viewFacade.setupView(name, undefined)
                .then(() => viewFacade.populateProjectDocument())
                .then(() => viewFacade.populateOperationTypeDocuments())
                .then(() => viewFacade.populateDocumentList());
        }


        it('populate document list in operations view',
            (done) => {
                setupView('excavation')
                    .then(() => {
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toBe('find1');
                        done();
                    });
            }
        );


        it('populate document list in operations overview',
            (done) => {
                setupView('project')
                    .then(() => {
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toBe('trench1');
                        done();
                    });
            }
        );
    })
}
