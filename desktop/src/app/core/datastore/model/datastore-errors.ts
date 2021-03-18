/**
 * @author Daniel de Oliveira
 */
export class DatastoreErrors {

    public static INVALID_DOCUMENT: string = 'datastore/invaliddocument';
    public static GENERIC_ERROR: string = 'datastore/genericerror';
    public static DOCUMENT_RESOURCE_ID_EXISTS: string = 'datastore/documentresourceidexists';
    public static DOCUMENT_NO_RESOURCE_ID: string = 'datastore/documentnoresourceid';
    public static DOCUMENT_NOT_FOUND: string = 'datastore/documentnotfound';
    public static SAVE_CONFLICT: string = 'datastore/saveconflict';
    public static REMOVE_REVISIONS_ERROR: string = 'datastore/removerevisionserror';
}
