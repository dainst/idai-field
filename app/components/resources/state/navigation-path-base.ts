import {IdaiFieldDocument} from 'idai-components-2/field';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPathOut extends NavigationPathBase<IdaiFieldDocument> {}


export interface NavigationPathBase<A> {

    elements: Array<A>;
    rootDocument?: IdaiFieldDocument;
}