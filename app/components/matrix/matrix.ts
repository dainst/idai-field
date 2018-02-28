import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface Matrix {

    rows: Array<Array<IdaiFieldDocument|undefined>>;
    nodes: Array<TreeNode>;
    rowCount: number;
    columnCount: number;
    loopDocuments: Array<IdaiFieldDocument>;
}


export interface TreeNode {

    document: IdaiFieldDocument;
    leftChildren: Array<TreeNode>;
    belowChild?: TreeNode;
    rightChildren: Array<TreeNode>;
    row?: number;
    column?: number;
}