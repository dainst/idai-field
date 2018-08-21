import {Injectable} from "@angular/core";
import {MD,Message} from "idai-components-2"

/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()
export class M extends MD { // = Messages Dictionary. For reasons of brevity of calls to it just "M".


    // Keys BEGIN /////////////////////

    // all packages

    public static ALL_FIND_ERROR = 'all/finderror';

    // App Package

    public static APP_NO_PROJECT_IDENTIFIER = 'app/noprojectidentifier';
    public static APP_GENERIC_SAVE_ERROR = 'app/genericsaveerror';
    public static APP_ERRORS_IN_CONFIG = 'app/errorsinconfig';

    // Settings Package

    public static SETTINGS_ACTIVATED = 'settings/activated';
    public static SETTINGS_MALFORMED_ADDRESS = 'settings/malformed_address';

    // Import Package

    public static IMPORT_START= 'importer/start';
    public static IMPORT_GENERIC_START_ERROR= 'importer/genericstarterror';
    public static IMPORT_SUCCESS_SINGLE= 'importer/success/single';
    public static IMPORT_SUCCESS_MULTIPLE= 'importer/success/multiple';
    public static IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER= 'importer/warning/geojsonduplicateidentifier';
    public static IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS= 'importer/warning/geojsonduplicateidentifiers';
    public static IMPORT_FAILURE_FILEUNREADABLE = 'importer/failure/fileunreadable';
    public static IMPORT_FAILURE_INVALIDJSON = 'importer/failure/invalidjson';
    public static IMPORT_FAILURE_INVALIDJSONL = 'importer/failure/invalidjsonl';
    public static IMPORT_FAILURE_INVALID_GEOJSON_IMPORT_STRUCT = 'importer/failure/invalidgeojsonimportstruct';
    public static IMPORT_FAILURE_MISSING_IDENTIFIER = 'importer/failure/missingidentifier';
    public static IMPORT_FAILURE_IDENTIFIER_FORMAT = 'importer/failure/identifierforma';
    public static IMPORT_FAILURE_INVALIDCSV = 'importer/failure/invalidcsv';
    public static IMPORT_FAILURE_GENERICCSVERROR = 'importer/failure/genericcsverror';
    public static IMPORT_FAILURE_MANDATORYCSVFIELDMISSING = 'importer/failure/mandatorycsvfieldmissing';
    public static IMPORT_FAILURE_GENERICDATASTOREERROR = 'importer/failure/genericdatastoreerrror';
    public static IMPORT_FAILURE_INVALIDGEOMETRY = 'importer/failure/invalidgeometry';
    public static IMPORT_FAILURE_ROLLBACKERROR = 'importer/failure/rollbackerror';
    public static IMPORT_FAILURE_MISSING_RESOURCE = 'importer/failure/missingresource';
    public static IMPORT_FAILURE_MISSING_RELATION_TARGET = 'importer/failure/missingrelationtarget';
    public static IMPORT_FAILURE_INVALID_MAIN_TYPE_DOCUMENT = 'importer/failure/invalidmaintypedocument';
    public static IMPORT_FAILURE_NO_OPERATION_ASSIGNABLE = 'importer/failure/nooperationassignable';
    public static IMPORT_FAILURE_NO_FEATURE_ASSIGNABLE = 'importer/failure/nofeatureassignable';

    // Backup Package
    public static BACKUP_DUMP_SUCCESS = 'backup/dumpsuccess';
    public static BACKUP_DUMP_ERROR = 'backup/dumperror';
    public static BACKUP_READ_DUMP_SUCCESS = 'backup/readdumpsuccess';
    public static BACKUP_READ_DUMP_ERROR = 'backup/readdumperror';
    public static BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST = 'backup/readdumperror/filenotexist';
    public static BACKUP_READ_DUMP_ERROR_NO_PROJECT_NAME = 'backup/readdumperror/noprojectname';
    public static BACKUP_READ_DUMP_ERROR_SAME_PROJECT_NAME = 'backup/readdumperror/sameprojectname';

    // Datastore Package

    public static DATASTORE_RESOURCE_ID_EXISTS = 'datastore/resourceidexists';
    public static DATASTORE_NOT_FOUND = 'datastore/notfound';
    public static DATASTORE_GENERIC_ERROR = 'datastore/genericerr';

    // Docedit Package

    public static DOCEDIT_SAVE_SUCCESS = 'docedit/savesuccess';
    public static DOCEDIT_DELETE_SUCCESS = 'docedit/deletesuccess';
    public static DOCEDIT_SAVE_ERROR = 'docedit/saveerror';
    public static DOCEDIT_DELETE_ERROR = 'docedit/deleteerror';
    public static DOCEDIT_SAVE_CONFLICT = 'docedit/saveconflict';
    public static DOCEDIT_TYPE_CHANGE_FIELDS_WARNING = 'docedit/typechangefieldswarning';
    public static DOCEDIT_TYPE_CHANGE_RELATIONS_WARNING = 'docedit/typechangerelationswarning';
    public static DOCEDIT_LIESWITHIN_RELATION_REMOVED_WARNING = 'docedit/lieswithinrelationremovedwarning';

    // Images Package

    public static IMAGES_SUCCESS_WORLDFILE_UPLOADED = 'images/success/worldfileuploaded';
    public static IMAGES_SUCCESS_GEOREFERENCE_DELETED = 'images/success/georeferencedeleted';
    public static IMAGES_ERROR_FILEREADER = 'images/error/filereader';
    public static IMAGES_ERROR_DUPLICATE_FILENAME = 'images/error/duplicatefilename';
    public static IMAGES_ERROR_DUPLICATE_FILENAMES = 'images/error/duplicatefilenames';
    public static IMAGES_ONE_NOT_FOUND = 'images/error/one_notfound';
    public static IMAGES_N_NOT_FOUND = 'images/error/notfound';

    // Imagestore Package

    public static IMAGESTORE_ERROR_INVALID_PATH = 'images/error/mediastore/invalidpath';
    public static IMAGESTORE_ERROR_INVALID_PATH_READ = 'images/error/mediastore/invalidpathread';
    public static IMAGESTORE_ERROR_INVALID_PATH_WRITE = 'images/error/mediastore/invalidpathwrite';
    public static IMAGESTORE_ERROR_INVALID_PATH_DELETE = 'images/error/mediastore/invalidpathdelete';
    public static IMAGESTORE_ERROR_READ = 'images/error/mediastore/read';
    public static IMAGESTORE_ERROR_WRITE = 'images/error/mediastore/write';
    public static IMAGESTORE_ERROR_DELETE = 'images/error/mediastore/delete';
    public static IMAGESTORE_ERROR_INVALID_WORLDFILE = 'images/error/mediastore/invalidworldfile';
    public static IMAGESTORE_DROP_AREA_UNSUPPORTED_EXTS = 'images/error/mediastore/unsupportedexts';

    // Model Package

    public static MODEL_VALIDATION_ERROR_IDEXISTS = 'validation/error/idexists';
    public static MODEL_VALIDATION_ERROR_MISSING_COORDINATES = 'validation/error/missingcoordinates';
    public static MODEL_VALIDATION_ERROR_INVALID_COORDINATES = 'validation/error/invalidcoordinates';
    public static MODEL_VALIDATION_ERROR_MISSING_GEOMETRYTYPE = 'validation/error/missinggeometrytype';
    public static MODEL_VALIDATION_ERROR_UNSUPPORTED_GEOMETRYTYPE = 'validation/error/unsupportedgeometrytype';

    // Resources Package

    public static RESOURCES_SUCCESS_IMAGE_UPLOADED = 'resources/success/imageimported';
    public static RESOURCES_SUCCESS_IMAGES_UPLOADED = 'resources/success/imagesimported';
    public static RESOURCES_SUCCESS_PROJECT_DELETED = 'resources/success/projectdeleted';
    public static RESOURCES_ERROR_TYPE_NOT_FOUND = 'resources/error/typenotfound';
    public static RESOURCES_ERROR_NO_PROJECT_NAME = 'resources/error/noprojectname';
    public static RESOURCES_ERROR_PROJECT_NAME_LENGTH = 'resources/error/projectnamelength';
    public static RESOURCES_ERROR_PROJECT_NAME_SYMBOLS = 'resources/error/projectnamesymbols';
    public static RESOURCES_ERROR_PROJECT_NAME_EXISTS = 'resources/error/projectnamexists';
    public static RESOURCES_ERROR_PROJECT_NAME_NOT_SAME = 'resources/error/projectnamenotsame';
    public static RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST = 'resources/error/oneprojectmustexist';
    public static RESOURCES_ERROR_PROJECT_DELETED = 'resources/error/projectdeleted';

    // Validation

    public static VALIDATION_ERROR_MISSINGPROPERTY = 'validation/error/missingproperty';
    public static VALIDATION_ERROR_MISSINGVIEWTYPE = 'validation/error/missingviewtype';
    public static VALIDATION_ERROR_NONOPERATIONVIEWTYPE = 'validation/error/nonoperationviewtype';
    public static VALIDATION_ERROR_TOPLEVELTYPEHASPARENT = 'validation/error/topleveltypehasparent';
    public static VALIDATION_ERROR_INCOMPLETERECORDEDIN = 'validation/error/incompleterecordedin';
    public static VALIDATION_ERROR_NOPROJECTRECORDEDIN = 'validation/error/noprojectrecordedin';
    public static VALIDATION_ERROR_NORECORDEDIN = 'validation/error/norecordedin';
    public static VALIDATION_ERROR_INVALIDINPUTTYPE = 'validation/error/invalidinputtype';
    public static VALIDATION_ERROR_INVALIDTYPE = 'validation/error/invalidtype';
    public static VALIDATION_ERROR_INVALIDFIELD = 'validation/error/invalidfield';
    public static VALIDATION_ERROR_INVALIDFIELDS = 'validation/error/invalidfields';
    public static VALIDATION_ERROR_INVALIDRELATIONFIELD = 'validation/error/invalidrelationfield';
    public static VALIDATION_ERROR_INVALIDRELATIONFIELDS = 'validation/error/invalidrelationfields';
    public static VALIDATION_ERROR_INVALID_NUMERIC_VALUE = 'validation/error/invalidnumericvalue';
    public static VALIDATION_ERROR_INVALID_NUMERIC_VALUES = 'validation/error/invalidnumericvalues';

    // Matrix Package
    public static MATRIX_WARNING_LOOP_DOCUMENT = 'matrix/warning/loopdocument';



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
            level: 'danger',
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
        this.msgs[M.APP_ERRORS_IN_CONFIG]={
            content: 'Insgesamt {0} Fehler in Configuration.json:',
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
        this.msgs[M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIER]={
            content: 'In den GeoJSON-Daten ist der Ressourcen-Identifier {0} mehrfach eingetragen. ' +
            'Bitte beachten Sie, dass lediglich die zuletzt aufgeführten Geometriedaten importiert wurden.',
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORT_WARNING_GEOJSON_DUPLICATE_IDENTIFIERS]={
            content: 'In den GeoJSON-Daten sind folgende Ressourcen-Identifier mehrfach eingetragen: {0}. ' +
                'Bitte beachten Sie, dass lediglich die jeweils zuletzt aufgeführten Geometriedaten importiert wurden.',
            level: 'warning',
            params: [],
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
            content: 'Fehlerhafte GeoJSON-Importstruktur. Grund: {0}.',
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
        this.msgs[M.BACKUP_DUMP_SUCCESS]={
            content: 'Die Datenbank wurde erfolgreich gesichert.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_DUMP_ERROR]={
            content: 'Beim Sichern der Datenbank ist ein Fehler aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_DUMP_SUCCESS]={
            content: 'Das Backup wurde erfolgreich eingelesen.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_DUMP_ERROR]={
            content: 'Beim Einlesen der Backup-Datei ist ein Fehler aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_DUMP_ERROR_FILE_NOT_EXIST]={
            content: 'Die angegebene Datei existiert nicht.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_DUMP_ERROR_NO_PROJECT_NAME]={
            content: 'Geben Sie einen Projektnamen an, um fortzufahren.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.BACKUP_READ_DUMP_ERROR_SAME_PROJECT_NAME]={
            content: 'Bitte wählen Sie als Ziel ein anderes als das gerade ausgewählte Projekt.',
            level: 'danger',
            params: [],
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
        this.msgs[M.IMPORT_FAILURE_NO_OPERATION_ASSIGNABLE] = {
            content: "Beim Import ist ein Fehler aufgetreten: Ressource konnte keiner Maßnahme mit dem Bezeichner \"{0}\" zugeordnet werden.",
            level: 'danger',
            params: ["?"],
            hidden: false
        };
        this.msgs[M.IMPORT_FAILURE_NO_FEATURE_ASSIGNABLE] = {
            content: "Beim Import ist ein Fehler aufgetreten: Ressource konnte nicht einer Stratigraphischen Einheit zugeordnet werden. Ziel Identifier oder Fehler: \"{0}\"",
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
        this.msgs[M.DOCEDIT_SAVE_CONFLICT]={
            content: 'Beim Speichern der Ressource ist ein Konflikt aufgetreten.',
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.DOCEDIT_TYPE_CHANGE_FIELDS_WARNING]={
            content: 'Bitte beachten Sie, dass die Daten der folgenden Felder beim Speichern verloren gehen: {0}',
            level: 'warning',
            params: [''],
            hidden: false
        };
        this.msgs[M.DOCEDIT_TYPE_CHANGE_RELATIONS_WARNING]={
            content: 'Bitte beachten Sie, dass die Relationen der folgenden Relationstypen beim Speichern verloren ' +
                'gehen: {0}',
            level: 'warning',
            params: [''],
            hidden: false
        };
        this.msgs[M.DOCEDIT_LIESWITHIN_RELATION_REMOVED_WARNING]={
            content: 'Das Ziel einer \'Liegt in\'-Relation konnte nicht gefunden werden. Wählen Sie ' +
                'gegebenenfalls eine andere Zielressource aus und speichern Sie bitte erneut.',
            level: 'warning',
            params: [''],
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
        this.msgs[M.IMAGES_ERROR_DUPLICATE_FILENAME]={
            content: "Die Bilddatei '{0}' konnte nicht hinzugefügt werden. Ein Bild mit dem gleichen Dateinamen " +
                "existiert bereits.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_DUPLICATE_FILENAMES]={
            content: "Die folgenden Bilddateien konnten nicht hinzugefügt werden, da Bilder mit identischen " +
                " Dateinamen bereits existieren: {0}",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ONE_NOT_FOUND]={
            content: "Das Bild konnte nicht gefunden werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_N_NOT_FOUND]={
            content: "Einige Bilder konnten nicht gefunden werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH]={
            content: "Das Bilderverzeichnis konnte nicht gefunden werden. Der Verzeichnispfad '{0}' ist " +
                "ungültig.",
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_READ]={
            content: "Es können keine Dateien aus dem Bilderverzeichnis gelesen werden. Bitte geben Sie einen " +
                "gültigen Verzeichnispfad in den Einstellungen an.",
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_WRITE]={
            content: "Es können keine Dateien im Bilderverzeichnis gespeichert werden. Bitte geben Sie einen " +
            "gültigen Verzeichnispfad in den Einstellungen an.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_INVALID_PATH_DELETE]={
            content: "Es können keine Dateien aus dem Bilderverzeichnis gelöscht werden. Bitte geben Sie einen " +
            "gültigen Verzeichnispfad in den Einstellungen an.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_READ]={
            content: "Datei '{0}' konnte nicht aus dem Bilderverzeichnis gelesen werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGESTORE_ERROR_WRITE]={
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
        this.msgs[M.RESOURCES_ERROR_TYPE_NOT_FOUND] = {
            content: "Typdefinition für \'{0}\' fehlt in Configuration.json.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_NO_PROJECT_NAME] = {
            content: 'Bitte geben Sie einen Namen für das neue Projekt ein.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_NAME_EXISTS] = {
            content: 'Ein Projekt mit dem Namen \'{0}\' existiert bereits.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_NAME_LENGTH] = {
            content: 'Der angegebene Projektname ist um {0} Zeichen zu lang.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_NAME_SYMBOLS] = {
            content: "Erlaubte Zeichen sind Kleinbuchstaben und Ziffern sowie _ und -.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_NAME_NOT_SAME] = {
            content: 'Die Namen stimmen nicht übereinander. Das Projekt wird nicht gelöscht.',
            level: 'warning',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_ONE_PROJECT_MUST_EXIST] = {
            content: 'Kann Projekt nicht löschen. Es muss mindestens ein Projekt vorhanden sein.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_SUCCESS_PROJECT_DELETED] = {
            content: 'Das Projekt wurde gelöscht.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_SUCCESS_IMAGE_UPLOADED] = {
            content: 'Ein Bild wurde erfolgreich importiert und mit der Ressource {0} verknüpft.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_SUCCESS_IMAGES_UPLOADED] = {
            content: '{0} Bilder wurden erfolgreich importiert und mit der Ressource {1} verknüpft.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.RESOURCES_ERROR_PROJECT_DELETED] = {
            content: 'Beim Löschen des Projektes ist ein Fehler aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDTYPE]={
            content: 'Ungültige Typdefinition: \'{0}\'',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDFIELD]={
            content: 'Fehlende Felddefinition für das Feld \'{1}\' der Ressource vom Typ \'{0}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDFIELDS]={
            content: 'Fehlende Felddefinitionen für die Felder \'{1}\' der Ressource vom Typ \'{0}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDRELATIONFIELD]={
            content: 'Fehlende Definition für die Relation \'{1}\' der Ressource vom Typ \'{0}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDRELATIONFIELDS]={
            content: 'Fehlende Definitionen für die Relationen \'{1}\' der Ressource vom Typ \'{0}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALID_NUMERIC_VALUE]={
            content: 'Falsche Zahlenwerte für das Feld \'{1}\' der Ressource vom Typ \'{0}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALID_NUMERIC_VALUES]={
            content: 'Falsche Zahlenwerte für die Felder \'{1}\' der Ressource vom Typ \'{0}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_MISSINGPROPERTY]={
            content: 'Eigenschaft(en) der Ressource vom Typ \'{0}\' müssen vorhanden sein: \'{1}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_MISSINGVIEWTYPE]={
            content: 'Im View-Teil der Configuration.json wird auf den nicht definierten Typ \'{0}\' verwiesen.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_NONOPERATIONVIEWTYPE]={
            content: 'Im View-Teil der Configuration.json wird auf den Typ \'{0}\' verwiesen. Dieser ist als Nicht-Maßnahmen-Typ nicht unterstützt.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_TOPLEVELTYPEHASPARENT]={
            content: 'Top-Level-Type \'{0}\' darf kein parent besitzen.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INCOMPLETERECORDEDIN]={
            content: 'Fehlende oder unvollständige Definition von \'recordedIn\' für Top-Level-Type \'{0}\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_NOPROJECTRECORDEDIN]={
            content: 'Fehlende Definition von \'recordedIn\' für den Type \'project\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_NORECORDEDIN]={
            content: 'Fehlende Definition von \'Gehört zu\'.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_INVALIDINPUTTYPE]={
            content: 'Ungültiger Wert \'{1}\' für \'inputType\' in Felddefinition für \'{0}\'. Erlaubte Werte: {2}.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.MATRIX_WARNING_LOOP_DOCUMENT]={
            content: 'Widersprüchliche Relationen gefunden: Die Ressource \'{0}\' taucht in mehr als einer '
                + 'Ebene der Hierarchie auf.',
            level: 'warning',
            params: [],
            hidden: false
        };
    }
}