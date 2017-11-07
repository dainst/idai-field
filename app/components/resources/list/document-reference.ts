import {Document} from "idai-components-2/core";

/**
 * Helper interface that wraps Documents and is used to create a tree structure
 * without having to modify attributes of the Documents themselves.
 *
 * @author Sebastian Cuy
 */
export interface DocumentReference {

    doc: Document;
    parent?: DocumentReference;
    children: DocumentReference[];
}