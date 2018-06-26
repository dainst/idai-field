import {IdaiFieldDocument} from 'idai-components-2/field';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPathOut extends NavigationPathBase<IdaiFieldDocument> {}


export interface NavigationPathBase<A> {

    segments: Array<A>;

    /**
     * The selected segment is 'identified' by its document.
     * In case of NavigationPathOut each segment 'is' document.
     * In case of NavigationPath each segment 'has a' document.
     */
    selectedSegmentId?: string;
}