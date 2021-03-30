import { doc } from 'idai-field-core';
import { Document } from 'idai-field-core';


/**
 * @author Thomas Kleinke
 */
let document1: Document;
let document2: Document;


describe('ModelUtil', () => {

    beforeEach(() => {

        document1 = doc('Document 1', 'doc1', 'Feature', 'd1');
        document2 = doc('Document 2', 'doc2', 'Feature', 'd2');
    });
});
