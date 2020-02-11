import {to, on, is} from 'tsfun';
import {Query} from 'idai-components-2';
import {Index} from '../../../../../app/core/datastore/index';
import {Static} from '../../../static';
import {IndexerConfiguration} from '../../../../../app/indexer-configuration';
import {createMockProjectConfiguration} from './helpers';
import {TypeResourceIndexItem} from '../../../../../app/core/datastore/index/index-item';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
describe('IndexFacade', () => {

    let indexFacade: Index;


    beforeEach(() => {

        const {createdIndexFacade} =
            IndexerConfiguration.configureIndexers(createMockProjectConfiguration());
        indexFacade = createdIndexFacade;
    });


    it('should put a type and then a find', () => {

        const typeDoc = Static.doc('sd1', 'identifier1', 'Type', 'id1');
        const findDoc = Static.doc('sd2', 'identifier2', 'Find', 'id2');
        findDoc.resource.relations = { isInstanceOf: ['id1'] };

        indexFacade.put(typeDoc);
        indexFacade.put(findDoc);

        const item = indexFacade.find({}).find(on('id', is('id1'))) as TypeResourceIndexItem;
        expect(item.instances).toEqual({ id2: 'Find' });
    });


    it('should sort by last modified descending', async done => {

        const doc1 = Static.doc('bla1', 'blub1', 'type1','id1');
        const doc3 = Static.doc('bla3', 'blub3', 'type3','id3');
        doc3.resource.relations['isRecordedIn'] = ['id1'];

        setTimeout(() => {

            const doc2 = Static.doc('bla2', 'blub2', 'type2','id2');
            doc2.resource.relations['isRecordedIn'] = ['id1'];

            const q: Query = {
                q: 'blub',
                constraints: {
                    'isRecordedIn:contain': 'id1'
                }
            };

            indexFacade.put(doc1);
            indexFacade.put(doc2);
            indexFacade.put(doc3);

            const result = indexFacade.find(q).map(to('id'));
            expect(result.length).toBe(2);
            expect(result[0]).toBe('id2');
            expect(result[1]).toBe('id3');
            done();
        }, 100)
    });
});