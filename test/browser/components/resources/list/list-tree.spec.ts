import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Static} from "../../../helper/static";
import {ListTree} from '../../../../../app/components/resources/list/list-tree';


/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ListTree', () => {

        let mockDatastore;

        beforeEach(() => {
            mockDatastore = jasmine.createSpyObj('datastore', ['get']);
        });


        it('return two top level items', async done => {

            const doc1 = Static.doc('sd1', 'ident1', 'Find', 'id1');
            const doc2 = Static.doc('sd2', 'ident2', 'Find', 'id2');
            const documents = [doc1, doc2] as Array<IdaiFieldDocument>;

            const listTree = new ListTree(mockDatastore);
            const docRefTree = await listTree.buildTreeFrom(documents);

            expect(docRefTree.length).toBe(2);
            done();
        });


        it('nest two items', async done => {

            const doc1 = Static.doc('sd1', 'ident1', 'Find', 'id1');
            const doc2 = Static.doc('sd2', 'ident2', 'Find', 'id2');
            doc2.resource.relations['liesWithin'] = ['id1'];
            const documents = [doc1, doc2] as Array<IdaiFieldDocument>;

            const listTree = new ListTree(mockDatastore);
            const docRefTree = await listTree.buildTreeFrom(documents);

            expect(docRefTree.length).toBe(1);
            expect(docRefTree[0].children.length).toBe(1);
            expect(docRefTree[0].children[0].doc.resource.id).toEqual('id2');
            done();
        });


        it('fetch missing parent of one', async done => {

            mockDatastore.get.and.returnValue(Promise.resolve(Static.doc('sd1', 'ident1', 'Find', 'id1')));

            const doc2 = Static.doc('sd2', 'ident2', 'Find', 'id2');
            doc2.resource.relations['liesWithin'] = ['id1'];
            const documents = [doc2] as Array<IdaiFieldDocument>;

            const listTree = new ListTree(mockDatastore);
            const docRefTree = await listTree.buildTreeFrom(documents);

            expect(docRefTree.length).toBe(1);
            expect(docRefTree[0].children.length).toBe(1);
            expect(docRefTree[0].children[0].doc.resource.id).toEqual('id2');
            done();
        });
    })
}