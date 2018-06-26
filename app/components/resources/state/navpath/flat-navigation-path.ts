import {IdaiFieldDocument} from 'idai-components-2/field';
import {NavigationPathBase} from './navigation-path-base';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface FlatNavigationPath extends NavigationPathBase<IdaiFieldDocument> {}


export module FlatNavigationPath {

    export function getSelectedSegmentDoc(flatNavigationPath: FlatNavigationPath) {

        return flatNavigationPath.segments
            .find(_ => _.resource.id === flatNavigationPath.selectedSegmentId);
    }
}