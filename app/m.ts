import {Injectable} from "@angular/core";
import {MD,Message} from "idai-components-2/messages"

/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()
export class M extends MD { // = Messages Dictionary. For reasons of brevity of calls to it just "M".


    // Keys BEGIN /////////////////////

    // all packages

    public static ALL_FIND_ERROR: string = 'all/finderror';

    // App Package

    public static APP_NO_PROJECT_IDENTIFIER: string = 'app/noprojectidentifier';
    public static APP_GENERIC_SAVE_ERROR: string = 'app/genericsaveerror';

    // Settings Package

    public static SETTINGS_ACTIVATED: string = 'settings/activated';
    public static SETTINGS_MALFORMED_ADDRESS: string = 'settings/malformed_address';

    // Import Package

    public static IMPORT_START: string = 'importer/start';
    public static IMPORT_GENERIC_START_ERROR: string = 'importer/genericstarterror';
    public static IMPORT_SUCCESS_SINGLE: string = 'importer/success/single';
    public static IMPORT_SUCCESS_MULTIPLE: string = 'importer/success/multiple';
    public static IMPORT_FAILURE_FILEUNREADABLE: string = 'importer/failure/fileunreadable';
    public static IMPORT_FAILURE_INVALIDJSON: string = 'importer/failure/invalidjson';
    public static IMPORT_FAILURE_INVALIDJSONL: string = 'importer/failure/invalidjsonl';
    public static IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT: string = 'importer/failure/invalidgeojsonimportstruct';
    public static IMPORT_FAILURE_MISSING_IDENTIFIER: string = 'importer/failure/missingidentifier';
    public static IMPORT_FAILURE_IDENTIFIER_FORMAT: string = 'importer/failure/identifierforma';
    public static IMPORT_FAILURE_INVALIDCSV: string = 'importer/failure/invalidcsv';
    public static IMPORT_FAILURE_GENERICCSVERROR: string = 'importer/failure/genericcsverror';
    public static IMPORT_FAILURE_MANDATORYCSVFIELDMISSING: string = 'importer/failure/mandatorycsvfieldmissing';
    public static IMPORT_FAILURE_GENERICDATASTOREERROR: string = 'importer/failure/genericdatastoreerrror';
    public static IMPORT_FAILURE_INVALIDGEOMETRY: string = 'importer/failure/invalidgeometry';
    public static IMPORT_FAILURE_ROLLBACKERROR: string = 'importer/failure/rollbackerror';
    public static IMPORT_FAILURE_MISSING_RESOURCE: string = 'importer/failure/missingresource';
    public static IMPORT_FAILURE_MISSING_RELATION_TARGET: string = 'importer/failure/missingrelationtarget';
    public static IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT: string = 'importer/failure/invalidmaintypedocument';

    // Export Package
    public static EXPORT_START: string = 'exporter/start';
    public static EXPORT_SUCCESS: string = 'exporter/success';
    public static EXPORT_WRITE_ERROR: string = 'exporter/writeerror';

    // Datastore Package

    public static DATASTORE_RESOURCE_ID_EXISTS: string = 'datastore/resourceidexists';
    public static DATASTORE_NOT_FOUND: string = 'datastore/notfound';
    public static DATASTORE_GENERIC_ERROR: string = 'datastore/genericerr';

    // Docedit Package

    public static DOCEDIT_SAVE_SUCCESS: string = 'docedit/savesuccess';
    public static DOCEDIT_DELETE_SUCCESS: string = 'docedit/deletesuccess';
    public static DOCEDIT_SAVE_ERROR: string = 'docedit/saveerror';
    public static DOCEDIT_DELETE_ERROR: string = 'docedit/deleteerror';

    // Images Package

    public static IMAGES_SUCCESS_WORLDFILE_UPLOADED: string = 'images/success/worldfileuploaded';
    public static IMAGES_SUCCESS_GEOREFERENCE_DELETED: string = 'images/success/georeferencedeleted';
    public static IMAGES_ERROR_FILEREADER: string = 'images/error/filereader';
    public static IMAGES_ERROR_MEDIASTORE_WRITE: string = 'images/error/mediastore/write';

    // Imagestore Package

    public static IMAGESTORE_ERROR_MEDIASTORE_READ: string = 'images/error/mediastore/read';
    public static IMAGESTORE_ERROR_DELETE: string = 'images/error/delete';
    public static IMAGESTORE_ERROR_INVALID_WORLDFILE: string = 'images/error/invalidworldfile';
    public static IMAGESTORE_DROP_AREA_UNSUPPORTED_EXTS: string = 'images/error/unsupportedexts';

    // Model Package

    public static MODEL_VALIDATION_ERROR_IDEXISTS: string = 'validation/error/idexists';
    public static MODEL_VALIDATION_ERROR_MISSING_COORDINATES: string = 'validation/error/missingcoordinates';
    public static MODEL_VALIDATION_ERROR_INVALID_COORDINATES: string = 'validation/error/invalidcoordinates';
    public static MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE: string = 'validation/error/missinggeometrytype';
    public static MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE: string = 'validation/error/unsupportedgeometrytype';

    // Resources Package

    public static RESOURCES_TYPE_NOT_FOUND: string = 'resources/error/typenotfound';

    // Keys END /////////////////////////////////

    public msgs : { [id: string]: Message } = {};

    constructor() {
        super();
        this.msgs[M.ALL_FIND_ERROR]={
            content: 'Beim Laden von Ressourcen ist ein Fehler aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.SETTINGS_ACTIVATED]={
            content: 'Die Einstellungen wurden erfolgreich aktiviert.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.SETTINGS_MALFORMED_ADDRESS]={
            content: 'Die angegebene Serveradresse entspricht nicht dem angegebenen Format.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.APP_GENERIC_SAVE_ERROR]={
            content: 'Beim Speichern der Ressource ist ein Fehler aufgetreten.',
            level: 'error', // TODO this should be danger
            params: [],
            hidden: false
        };
        this.msgs[M.APP_NO_PROJECT_IDENTIFIER]={
            content: 'Server-Sync kann nicht aktiviert werden, wenn kein Projektidentifier in der Configuration.json ' +
                'hinterlegt ist.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_START]={
            content: 'Starte Import...',
            level: 'info',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_GENERIC_START_ERROR]={
            content: 'Import kann nicht gestartet werden.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_SUCCESS_SINGLE]={
            content: 'Eine Ressource wurde erfolgreich importiert.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_SUCCESS_MULTIPLE]={
            content: '{0} Ressourcen wurden erfolgreich importiert.',
            level: 'success',
            params: [ "Mehrere"],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_FILEUNREADABLE]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die Datei {0} konnte nicht gelesen werden.',
            level: 'danger',
            params: [ "" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_INVALIDJSON]={
            content: 'Beim Import ist ein Fehler aufgetreten: Das JSON ist nicht valide. Die ursprüngliche ' +
                'Fehlermeldung lautet: {0}.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_INVALIDJSONL]={
            content: 'Beim Import ist ein Fehler aufgetreten: Das JSON in Zeile {0} ist nicht valide.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT]={
            content: 'Fehlerhafte Geojson-Importstruktur. Grund: {0}.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_MISSING_IDENTIFIER]={
            content: 'Beim Import ist ein Fehler aufgetreten: Ein oder mehrere Features ohne properties.identifier ' +
                'wurden gefunden.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_IDENTIFIER_FORMAT]={
            content: 'Beim Import ist ein Fehler aufgetreten: properties.identifier muss eine Zeichenkette sein, ' +
                'keine Zahl.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_INVALIDCSV]={
            content: 'Beim Import ist ein Fehler aufgetreten: Das CSV in Zeile {0} konnte nicht gelesen werden.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_GENERICCSVERROR]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die CSV-Daten konnten nicht gelesen werden.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_MANDATORYCSVFIELDMISSING]={
            content: 'Beim Import ist ein Fehler aufgetreten: In Zeile {0} fehlt das Pflichtfeld \"{1}\".',
            level: 'danger',
            params: [ "?", "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT]={
            content: 'Beim Import ist ein Fehler aufgetreten: Ressourcen vom Typ {0} können der gewählten Maßnahme ' +
                'vom Typ {1} nicht zugeordnet werden.',
            level: 'danger',
            params: [ '?', '?' ],
            hidden: false
        };
        this.msgs[M.EXPORT_START]={
            content: 'Starte Export...',
            level: 'info',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_SUCCESS]={
            content: 'Die Ressourcen wurden erfolgreich exportiert.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.EXPORT_WRITE_ERROR]={
            content: 'Beim Export ist ein Fehler aufgetreten: Die Datei {0} konnte nicht geschrieben werden.',
            level: 'error',
            params: [ '' ],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_IDEXISTS]={
            content: 'Der Ressourcen-Identifier {0} existiert bereits.',
            level: 'danger',
            params: [ "" ],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_MISSING_COORDINATES]={
            content: 'Die Koordinaten einer Geometrie sind nicht definiert.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_INVALID_COORDINATES]={
            content: 'Die Koordinaten einer Geometrie vom Typ {0} sind nicht valide.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE]={
            content: 'Der Typ einer Geometrie ist nicht definiert.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE]={
            content: 'Der Geometrietyp {0} wird von der Anwendung nicht unterstützt.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_GENERICDATASTOREERROR]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die Ressource {0} konnte nicht ' +
                     'gespeichert werden.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_INVALIDGEOMETRY] = {
            content: "Beim Import ist ein Fehler aufgetreten: Invalide Geometriedaten in Zeile {0}.",
            level: 'danger',
            params: ["?"],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_ROLLBACKERROR] = {
            content: "Beim Versuch, die bereits importierten Daten zu löschen, ist ein Fehler aufgetreten.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_MISSING_RESOURCE] = {
                content: 'Die Zuordnung zu einer Ressource mit dem Identifier {0} ist fehlgeschlagen. Die Ressource ' +
                'wurde nicht gefunden.',
            level: 'danger',
            params: [ "?"],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_MISSING_RELATION_TARGET] = {
            content: "Beim Import ist ein Fehler aufgetreten: Die als Ziel einer Relation angegebene Ressource mit der "
            + "ID {0} konnte nicht gefunden werden.",
            level: 'danger',
            params: ["?"],
            hidden: false
        };
        this.msgs[M.DOCEDIT_SAVE_SUCCESS]={
            content: 'Die Ressource wurde erfolgreich gespeichert.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_DELETE_SUCCESS]={
            content: 'Die Ressource wurde erfolgreich gelöscht.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_SAVE_ERROR]={
            content: 'Beim Speichern der Ressource ist ein Fehler aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_DELETE_ERROR]={
            content: 'Beim Löschen der Ressource ist ein Fehler aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DATASTORE_RESOURCE_ID_EXISTS]={
            content: 'Die Ressourcen-Id eines zu speichernden Dokumentes besteht bereits.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DATASTORE_NOT_FOUND]={
            content: 'Die Ressource konnte nicht gefunden werden.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DATASTORE_GENERIC_ERROR]={
            content: 'Ein Fehler beim Zugriff auf die Datenbank ist aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_SUCCESS_WORLDFILE_UPLOADED] = {
            content: "Das Worldfile wurde erfolgreich geladen.",
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_SUCCESS_GEOREFERENCE_DELETED] = {
            content: "Die Georeferenzdaten wurden erfolgreich gelöscht.",
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_FILEREADER]={
            content: "Datei '{0}' konnte nicht vom lokalen Dateisystem gelesen werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_MEDIASTORE_READ]={
            content: "Datei '{0}' konnte nicht aus dem Bilderverzeichnis gelesen werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_MEDIASTORE_WRITE]={
            content: "Datei '{0}' konnte nicht im Bilderverzeichnis gespeichert werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_DELETE]={
            content: "Fehler beim Löschen des Bilds '{0}'.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_WORLDFILE] = {
            content: "Datei '{0}' ist kein gültiges World-File.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_DROP_AREA_UNSUPPORTED_EXTS] = {
            content: "Diese Auswahl ein oder mehrerer Dateien enhält ungültige Dateiformate ({0}). Die entsprechenden Dateien werden ignoriert.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_TYPE_NOT_FOUND] = {
            content: "Typdefinition für \'{0}\' fehlt in Configuration.json.",
            level: 'danger',
            params: [],
            hidden: false
        }
    }
}