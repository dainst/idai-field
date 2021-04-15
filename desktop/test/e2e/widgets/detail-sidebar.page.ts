import { click, doubleClick } from '../app';


/**
 * @author Daniel de Oliveira
 */
export class DetailSidebarPage {

    public static clickSolveConflicts() {

        return click('.detail-sidebar .solve-button');
    };


    public static doubleClickEditDocument(identifier) {

        return doubleClick('#resource-' + identifier);
    };
}
