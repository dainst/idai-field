import {Document} from "idai-components-2/core";

/**
 * Tree node
 *
 * @author Sebastian Cuy
 * @author Daniel de Oliveira
 */
export interface Node {

    doc: Document;
    parent?: Node;
    children: Node[];
}