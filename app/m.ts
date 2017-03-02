import {Injectable} from "@angular/core";
import {MD,Message} from "idai-components-2/messages"

/**
 * @author Daniel de Oliveira
 * @author Jan G. Wieners
 */
@Injectable()
export class M extends MD { // = Messages Dictionary. For reasons of brevity of calls to it just "M".

    public static IMPORTER_START : string = 'importer/start';
    public static IMPORTER_GENERIC_START_ERROR: string = 'importer/genericstarterror';
    public static IMPORTER_SUCCESS_SINGLE : string = 'importer/success/single';
    public static IMPORTER_SUCCESS_MULTIPLE : string = 'importer/success/multiple';
    public static IMPORTER_INFO_NOMULTIPOLYGONSUPPORT: string = 'importer/info/nomultipolygonsupport';
    public static IMPORTER_FAILURE_FILEUNREADABLE : string = 'importer/failure/fileunreadable';
    public static IMPORTER_FAILURE_INVALIDJSON : string = 'importer/failure/invalidjson';
    public static IMPORTER_FAILURE_INVALIDCSV: string = 'importer/failure/invalidcsv';
    public static IMPORTER_FAILURE_GENERICCSVERROR: string = 'importer/failure/genericcsverror';
    public static IMPORTER_FAILURE_MANDATORYCSVFIELDMISSING: string = 'importer/failure/mandatorycsvfieldmissing';
    public static IMPORTER_FAILURE_IDMISSING: string = 'importer/failure/idmissing';
    public static IMPORTER_FAILURE_GENERICDATASTOREERROR: string = 'importer/failure/genericdatastoreerrror';
    public static IMPORTER_FAILURE_INVALIDTYPE: string = 'importer/failure/invalidtype';
    public static IMPORTER_FAILURE_INVALIDFIELD: string = 'importer/failure/invalidfield';
    public static IMPORTER_FAILURE_INVALIDFIELDS: string = 'importer/failure/invalidfields';
    public static IMPORTER_FAILURE_INVALIDGEOMETRY: string = 'importer/failure/invalidgeometry';

    public static OVERVIEW_SAVE_SUCCESS : string = 'overview/savesuccess';
    public static OVERVIEW_DELETE_SUCCESS : string = 'overview/deletesuccess';

    public static DATASTORE_GENERIC_SAVE_ERROR : string = 'datastore/genericsaveerror';
    public static DATASTORE_RESOURCE_ID_EXISTS : string = 'datastore/resourceidexists';
    public static DATASTORE_NOT_FOUND : string = 'datastore/notfound';

    public static IMAGES_SUCCESS_WORLDFILE_UPLOADED: string = 'images/success/worldfileuploaded';
    public static IMAGES_SUCCESS_GEOREFERENCE_DELETED: string = 'images/success/georeferencedeleted';
    public static IMAGES_ERROR_FILEREADER: string = 'images/error/filereader';
    public static IMAGES_ERROR_MEDIASTORE_READ: string = 'images/error/mediastore/read';
    public static IMAGES_ERROR_MEDIASTORE_WRITE: string = 'images/error/mediastore/write';
    public static IMAGES_ERROR_DELETE: string = 'images/error/delete';
    public static IMAGES_ERROR_INVALID_WORLDFILE: string = 'images/error/invalidworldfile';
    public static IMAGES_DROP_AREA_UNSUPPORTED_EXTS: string = 'images/error/unsupportedexts';

    public static VALIDATION_ERROR_IDEXISTS: string = 'validation/error/idexists';

    public msgs : { [id: string]: Message } = {};

    constructor() {
        super();
        this.msgs[M.IMPORTER_START]={
            content: 'Starte Import...',
            level: 'info',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORTER_GENERIC_START_ERROR]={
            content: 'Import kann nicht gestartet werden.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORTER_SUCCESS_SINGLE]={
            content: 'Eine Ressource wurde erfolgreich importiert.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORTER_SUCCESS_MULTIPLE]={
            content: '{0} Ressourcen wurden erfolgreich importiert.',
            level: 'success',
            params: [ "Mehrere"],
            hidden: false
        };
        this.msgs[M.IMPORTER_INFO_NOMULTIPOLYGONSUPPORT]={
            content: 'Die Geometriedaten enthalten eine Geometrie vom Typ Multipolygon. Da Multipolygone von der ' +
                'Anwendung zurzeit nicht unterstützt werden, konnten diese Geometriedaten nicht importiert werden.',
            level: 'info',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_FILEUNREADABLE]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die Datei {0} konnte nicht gelesen werden.',
            level: 'danger',
            params: [ "" ],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDJSON]={
            content: 'Beim Import ist ein Fehler aufgetreten: Das JSON in Zeile {0} ist nicht valide.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDCSV]={
            content: 'Beim Import ist ein Fehler aufgetreten: Das CSV in Zeile {0} konnte nicht gelesen werden.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_GENERICCSVERROR]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die CSV-Daten konnten nicht gelesen werden.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_MANDATORYCSVFIELDMISSING]={
            content: 'Beim Import ist ein Fehler aufgetreten: In Zeile {0} fehlt das Pflichtfeld \"{1}\".',
            level: 'danger',
            params: [ "?", "?" ],
            hidden: false
        };
        this.msgs[M.VALIDATION_ERROR_IDEXISTS]={
            content: 'Beim Import ist ein Fehler aufgetreten: Ressourcen-Identifier {0} existiert bereits.',
            level: 'danger',
            params: [ "" ],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_GENERICDATASTOREERROR]={
            content: 'Beim Import ist ein Fehler aufgetreten: Die Ressource {0} konnte nicht ' +
                     'gespeichert werden.',
            level: 'danger',
            params: [ "?" ],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_IDMISSING]={
            content: 'Beim Import ist ein Fehler aufgetreten: Ein Ressourcen-Identifier fehlt.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDTYPE]={
            content: "Beim Import ist ein Fehler aufgetreten: Fehlende Typendefinition für den Typ {1} der " +
                     "Ressource {0}.",
            level: 'danger',
            params: ["", ""],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDFIELD]={
            content: "Beim Import ist ein Fehler aufgetreten: Fehlende Felddefinition für das Feld {1} der " +
                     "Ressource {0}.",
            level: 'danger',
            params: ["?", ""],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDFIELDS]={
            content: "Beim Import ist ein Fehler aufgetreten: Fehlende Felddefinitionen für die Felder {1} der " +
            "Ressource des Typs \"{0}\".",
            level: 'danger',
            params: ["?", ""],
            hidden: false
        };
        this.msgs[M.IMPORTER_FAILURE_INVALIDGEOMETRY] = {
            content: "Beim Import ist ein Fehler aufgetreten: Invalide Geometriedaten in Zeile {0}.",
            level: 'danger',
            params: ["?"],
            hidden: false
        };
        this.msgs[M.OVERVIEW_SAVE_SUCCESS]={
            content: 'Die Ressource wurde erfolgreich gespeichert.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.OVERVIEW_DELETE_SUCCESS]={
            content: 'Die Ressource wurde erfolgreich gelöscht.',
            level: 'success',
            params: [],
            hidden: false
        };
        this.msgs[M.DATASTORE_GENERIC_SAVE_ERROR]={
            content: 'Beim Speichern des Dokumentes ist ein Fehler aufgetreten.',
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.DATASTORE_RESOURCE_ID_EXISTS]={
            content: 'Die Resourcen-Id eines zu speichernden Dokumentes besteht bereit.',
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
        this.msgs[M.IMAGES_ERROR_MEDIASTORE_READ]={
            content: "Datei '{0}' konnte nicht aus dem MediaStore gelesen werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_MEDIASTORE_WRITE]={
            content: "Datei '{0}' konnte nicht im MediaStore gespeichert werden.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_DELETE]={
            content: "Fehler beim Löschen des Bilds '{0}'.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_ERROR_INVALID_WORLDFILE] = {
            content: "Datei '{0}' ist kein gültiges World-File.",
            level: 'danger',
            params: [],
            hidden: false
        };
        this.msgs[M.IMAGES_DROP_AREA_UNSUPPORTED_EXTS] = {
            content: "Diese Auswahl ein oder mehrerer Dateien enhält ungültige Dateiformate ({0}). Die entsprechenden Dateien werden ignoriert.",
            level: 'danger',
            params: [],
            hidden: false
        };
    }
}