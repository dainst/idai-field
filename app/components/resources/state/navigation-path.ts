import {IdaiFieldDocument} from 'idai-components-2/field';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export interface NavigationPath extends NavigationPathBase<IdaiFieldDocument> {}


export class NavigationPath {

    public static empty() {

        return {
            elements: [],
            displayHierarchy: true,
            qWithHierarchy: '',
            qWithoutHierarchy: '',
            typesWithHierarchy: [],
            typesWithoutHierarchy: []
        };
    }
}


export interface NavigationPathBase<A> {

    elements: Array<A>;
    rootDocument?: IdaiFieldDocument;
    displayHierarchy: boolean;
}