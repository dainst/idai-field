import {IdaiFieldDocument} from 'idai-components-2/field';


/**
 * It would also have made sense to name like follows:
 *
 *   NavigationPath -> ContextNavigationPath
 *   and FlatNavigationPath -> NavigationPath
 *
 * But since we use NavigationPath more we opted for the shorter name here.
 */
export interface NavigationPathBase<A> { // A -> NavigationPath | IdaiFieldDocument

    segments: Array<A>;

    /**
     * The selected segment is 'identified' by this id.
     * In case of FlatNavigationPath it corresponds with segment.resource.id,
     * in case of NavigationPath with segment.document.resource.id.
     */
    selectedSegmentId?: string;
}