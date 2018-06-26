import {IdaiFieldDocument} from 'idai-components-2/field';

/**
 * @author Daniel de Oliveira
 */
export interface NavigationPathContext {

    q: string;
    types: string[];
    selected?: IdaiFieldDocument;
}