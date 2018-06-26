import {NavigationPathContext} from './navigation-path-context';

import {IdaiFieldDocument} from 'idai-components-2/field';

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export interface NavigationPathSegment extends NavigationPathContext {

    document: IdaiFieldDocument; // nav path document
}