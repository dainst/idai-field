import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';
import {ProjectConfiguration} from 'idai-components-2/core';
import {CachedDatastore} from '../../app/core/datastore/core/cached-datastore';
import {IdaiFieldDocumentDatastore} from '../../app/core/datastore/field/idai-field-document-datastore';
import {IdaiFieldTypeConverter} from '../../app/core/datastore/field/idai-field-type-converter';
import {PersistenceManager} from '../../app/core/persist/persistence-manager';
import {Static} from '../unit/static';
import {DAOsSpecHelper} from './daos-spec-helper';
import {TypeUtility} from '../../app/core/model/type-utility';

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
                'type': 'Operation',
                'fields': []
            },
            {
                'type': 'Trench',
                'fields': [],
                'parent': 'Operation'
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

                const typeUtility = new TypeUtility(projectConfiguration);

                const result = DAOsSpecHelper.createPouchdbDatastore('testdb');
                datastore = new IdaiFieldDocumentDatastore(
                    result.datastore, result.indexFacade, result.documentCache,
                    new IdaiFieldTypeConverter(typeUtility));

                persistenceManager = new PersistenceManager(
                    datastore,
                    projectConfiguration,
                    typeUtility
                );
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
                
                await datastore.create(document1, 'u');
                await datastore.create(document2, 'u');
                await datastore.create(document3, 'u');

                await persistenceManager.remove(document1,'user');

                const docs = (await datastore.find({})).documents;

                expect(docs.length).toBe(1);
                expect(docs[0].resource.relations['Contains']).not.toBeDefined();

                done();
            }
        );



        // it('hierarchie with more than 2 layers')


        // also to review: different handling of oldversions (deep copied vs. regular use)
        // also to review: find consistent way for error msgs, M is still in use
    })
}
