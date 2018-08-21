import {Document} from 'idai-components-2';
import {Static} from '../../static';


/**
 * @author Thomas Kleinke
 */
let document1: Document;
let document2: Document;


describe('ModelUtil', () => {

    beforeEach(() => {

        document1 = Static.doc('Document 1', 'doc1', 'Feature', 'd1');
        document2 = Static.doc('Document 2', 'doc2', 'Feature', 'd2');
    });
});