import {Document} from 'idai-components-2/core';
import {ProjectConfiguration} from 'idai-components-2/configuration';
import {Static} from '../../static';
import {IdaiFieldDocumentDatastore} from '../../../../app/core/datastore/idai-field-document-datastore';
import {IdaiFieldDocumentConverter} from '../../../../app/core/datastore/idai-field-document-converter';

/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
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
                'name': 'isRecordedIn',
                'inverse': 'NO-INVERSE'
            }
        ]
    });


    describe('IdaiFieldDocumentDatastore/Subsystem', () => {

        let document1: Document;
        let document2: Document;
        let document3: Document;

        let datastore: IdaiFieldDocumentDatastore;


        beforeEach(
            () => {
                spyOn(console, 'debug'); // suppress console.debug

                const mockImageTypeUtility = jasmine.createSpyObj('mockImageTypeUtility', ['isImageType']);
                mockImageTypeUtility.isImageType.and.returnValue(false);

                const result = Static.createPouchdbDatastore('testdb');
                datastore = new IdaiFieldDocumentDatastore(result.datastore, result.documentCache,
                    new IdaiFieldDocumentConverter(mockImageTypeUtility));

                const mockConfigLoader = jasmine.createSpyObj('mockConfigLoader', ['getProjectConfiguration']);
                mockConfigLoader.getProjectConfiguration.and.callFake(() => Promise.resolve(projectConfiguration));
            }
        );


        afterEach(done => new PouchDB('testdb').destroy().then(() => {done()}), 5000);


        // TODO Maybe adjust or delete this test...
        it('delete resources and a relation',
            async done => {

                document1 = Static.doc('trench1','trench1','Trench','t1');
                document2 = Static.doc('find1','find1','Find','f1');
                document2.resource.relations['isRecordedIn'] = ['t1'];
                document2.resource.relations['BelongsTo'] = ['f2'];
                document3 = Static.doc('find2','find2','Find','f2');
                document3.resource.relations['Contains'] = ['f1'];

                await datastore.create(document1);
                await datastore.create(document2);
                await datastore.create(document3);

                await datastore.remove(document1);
                await datastore.remove(document2);

                delete document3.resource.relations['Contains'];
                await datastore.update(document3);

                const docs = await datastore.find({});
                expect(docs.length).toBe(1);

                expect(docs[0].resource.relations['Contains']).not.toBeDefined();

                done();
            }
        );
    });
}
