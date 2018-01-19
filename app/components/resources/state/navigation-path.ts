import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPath extends NavigationPathBase<IdaiFieldDocument> {}


export class NavigationPath {

    public static empty = () => { return { elements: [] }}
}


export interface NavigationPathBase<A> {

    elements: Array<A>;
    rootDocument?: IdaiFieldDocument; // TODO rename to selected
}