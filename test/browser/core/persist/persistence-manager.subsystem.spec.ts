import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Static} from '../../static';
import {CachedDatastore} from '../../../../app/core/datastore/core/cached-datastore';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldDocumentConverter} from '../../../../app/core/datastore/idai-field-document-converter';
import {PersistenceManager} from '../../../../app/core/persist/persistence-manager';

/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 *
 * @author Daniel de Oliveira
 */
export function main() {

    const projectConfiguration = new ProjectConfiguration({
        'types': [
            {
                'type': 'Trench',
                'fields': []
            },
            {
                'type': 'Find',
                'fields': []
            }
        ],
        'relations': [
            {
                'name': 'BelongsTo',
                'inverse': 'Contains'
            },
            {
                'name': 'Contains',
                'inverse': 'BelongsTo'
            },
            {
                'name': 'OneWay',
                'inverse': 'NO-INVERSE'
            },
            {
                'name': 'isRecordedIn',
                'inverse': 'NO-INVERSE'
            }
        ]
    });


    describe('PersistenceManager/Subsystem', () => {

        let document1: Document;
        let document2: Document;
        let document3: Document;

        let datastore: CachedDatastore<IdaiFieldDocument>;
        let persistenceManager: PersistenceManager;


        beforeEach(
            () => {
                spyOn(console, 'debug'); // suppress console.debug

                const mockImageTypeUtility = jasmine.createSpyObj('mockImageTypeUtility',
                    ['isImageType']);
                mockImageTypeUtility.isImageType.and.returnValue(false);

                const result = Static.createPouchdbDatastore('testdb');
                datastore = new IdaiFieldDocumentDatastore(
                    result.datastore, result.documentCache, new IdaiFieldDocumentConverter(mockImageTypeUtility));

                result.appState.setCurrentUser('anonymous');

                const mockConfigLoader = jasmine.createSpyObj('mockConfigLoader',
                    ['getProjectConfiguration']);
                mockConfigLoader.getProjectConfiguration.and.callFake(() => Promise.resolve(projectConfiguration));


                persistenceManager = new PersistenceManager(datastore, mockConfigLoader);

                // persistenceManager.setOldVersions([{ resource: {} }]);
            }
        );


        afterEach((done) => new PouchDB('testdb').destroy().then(() => {done()}), 5000);
        

        it('delete document with recordedInDoc which is connected to yet another doc',
            async (done) => {

                document1 = Static.doc('trench1','trench1','Trench','t1');
                document2 = Static.doc('find1','find1','Find','f1');
                document2.resource.relations['isRecordedIn'] = ['t1'];
                document2.resource.relations['BelongsTo'] = ['f2'];
                document3 = Static.doc('find2','find2','Find','f2');
                document3.resource.relations['Contains'] = ['f1'];
                
                await datastore.create(document1);
                await datastore.create(document2);
                await datastore.create(document3);

                await persistenceManager.remove(document1,'user',[document1]);

                const docs = (await datastore.find({})).documents;

                expect(docs.length).toBe(1);
                expect(docs[0].resource.relations['Contains']).not.toBeDefined();

                done();
            }
        );



        // it('hierarchie with more than 2 layers')



        // also to review: different handling of oldversions (deep copied vs. regular use)
        // also to review: what about oldVersions of nested/isRecordedIn docs
        // also to review: which type of datastore to use
        // also to review: find consistent way for error msgs, M is still in use
    })
}
