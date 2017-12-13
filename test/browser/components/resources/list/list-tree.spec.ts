import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Static} from "../../../helper/static";
import {ListTree} from '../../../../../app/components/resources/list/list-tree';


/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ListTree', () => {

        it('return two top level items', async done => {

            const doc1 = Static.doc('sd1', 'ident1', 'Find', 'id1');
            const doc2 = Static.doc('sd2', 'ident2', 'Find', 'id2');
            const documents = [doc1, doc2] as Array<IdaiFieldDocument>;

            const mockDatastore = jasmine.createSpyObj('datastore', ['find']);

            const listTree = new ListTree(mockDatastore);
            await listTree.buildTreeFrom(documents);

            expect(listTree.docRefTree.length).toBe(2);
            done();
        });
    })
}