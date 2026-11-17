/**
 * @author Daniel de Oliveira
 */
export module DatastoreErrors {

    export const INVALID_DOCUMENT = 'datastore/invaliddocument';
    export const GENERIC_ERROR = 'datastore/genericerror';
    export const DOCUMENT_RESOURCE_ID_EXISTS = 'datastore/documentresourceidexists';
    export const DOCUMENT_NO_RESOURCE_ID = 'datastore/documentnoresourceid';
    export const DOCUMENT_NOT_FOUND = 'datastore/documentnotfound';
    export const SAVE_CONFLICT = 'datastore/saveconflict';
    export const REMOVE_REVISIONS_ERROR = 'datastore/removerevisionserror';
}
