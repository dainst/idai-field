import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {TreeNode} from './matrix-builder';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface Matrix {

    rows: Array<Array<IdaiFieldDocument|undefined>>;
    nodes: Array<TreeNode>;
    rowCount: number;
    columnCount: number;
}