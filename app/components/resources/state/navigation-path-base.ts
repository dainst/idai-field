import {IdaiFieldDocument} from 'idai-components-2/field';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPathOut extends NavigationPathBase<IdaiFieldDocument> {}


export interface NavigationPathBase<A> {

    segments: Array<A>;

    /**
     * The selected segment is 'identified' by this id.
     * In case of NavigationPathOut it corresponds with segment.resource.id,
     * in case of NavigationPath with segment.document.resource.id.
     */
    selectedSegmentId?: string;
}