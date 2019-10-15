import {Document} from 'idai-components-2';

/**
 * @author Daniel de Oliveira
 */
export module DatastoreUtil {

    export function isConflicted(document: Document): boolean {

        return getConflicts(document) !== undefined;
    }


    export function isProjectDocument(document: Document): boolean {

        return document.resource.id === 'project';
    }


    /**
     * Design note: This is to abstract away how exactly a document is marked as conflicted.
     * PouchDb does it by setting _conflicts.
     */
    export function getConflicts(document: Document): Array<string>|undefined {

        return (document as any)['_conflicts'];
    }
}