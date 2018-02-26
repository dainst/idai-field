import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface Matrix {

    rows: Array<Array<IdaiFieldDocument|undefined>>;
}